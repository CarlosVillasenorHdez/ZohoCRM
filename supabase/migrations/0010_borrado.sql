-- =====================================================================
-- Migración 0010: poder borrar lo que se capturó mal
--
-- Bloque único. Correr completo en el SQL Editor. No borra nada existente.
--
-- Hasta ahora no había forma de eliminar NADA desde la aplicación: un
-- contacto duplicado, una póliza con el número mal tecleado o una cita
-- creada por error se quedaban para siempre. El asesor terminaba
-- conviviendo con basura o, peor, dejaba de confiar en lo que ve.
--
-- Se usa borrado lógico, no DELETE. Las razones:
--
--  1. Una póliza arrastra recibos, y una oportunidad arrastra actividades.
--     Un DELETE en cascada se lleva historial que a veces es lo único que
--     explica por qué un cliente está donde está.
--  2. Un borrado por error con el sistema en uso es irrecuperable. Así, se
--     deshace con un UPDATE.
--  3. Las comisiones y los KPIs se calculan sobre esto: borrar de verdad
--     cambiaría números de meses pasados sin dejar rastro.
--
-- Para la asesora el efecto es el mismo: desaparece de todas las pantallas.
-- =====================================================================

alter table public.contactos     add column if not exists eliminado_en timestamptz;
alter table public.oportunidades add column if not exists eliminado_en timestamptz;
alter table public.polizas       add column if not exists eliminado_en timestamptz;
alter table public.actividades   add column if not exists eliminado_en timestamptz;

-- Los índices filtran por lo vivo, que es el 99% de las consultas.
create index if not exists idx_contactos_vivos
  on public.contactos(asesor_id) where eliminado_en is null;
create index if not exists idx_oportunidades_vivas
  on public.oportunidades(asesor_id) where eliminado_en is null;
create index if not exists idx_polizas_vivas
  on public.polizas(asesor_id) where eliminado_en is null;
create index if not exists idx_actividades_vivas
  on public.actividades(asesor_id) where eliminado_en is null;

-- El número de póliza solo puede repetirse si la anterior está eliminada:
-- así se puede recapturar una que se tecleó mal sin chocar con ella.
alter table public.polizas drop constraint if exists uq_poliza_por_asesor;
drop index if exists uq_poliza_por_asesor;
create unique index if not exists uq_poliza_por_asesor
  on public.polizas (asesor_id, numero_poliza) where eliminado_en is null;

-- Lo mismo para el usuario de acceso, por consistencia.
-- (asesores no se borra desde la app; se suspende.)

-- ---------------------------------------------------------------------
-- Las vistas dejan de ver lo eliminado
-- ---------------------------------------------------------------------

create or replace view public.v_panel_dia as
  with base as (
    select
      a.asesor_id, 'actividad'::text as tipo_alerta, a.id as referencia_id,
      a.contacto_id, a.titulo, a.tipo as detalle, a.inicia_en::date as fecha,
      case when a.inicia_en::date < current_date then 'vencida' else 'hoy' end as urgencia
    from public.actividades a
    where a.estado = 'pendiente'
      and a.eliminado_en is null
      and a.inicia_en::date <= current_date

    union all

    select
      r.asesor_id, 'recibo', r.id, p.contacto_id,
      'Recibo ' || r.numero || ' — póliza ' || p.numero_poliza,
      r.estado, r.fecha_vencimiento,
      case when r.fecha_vencimiento < current_date then 'vencida' else 'proxima' end
    from public.recibos r
    join public.polizas p on p.id = r.poliza_id
    where r.estado in ('pendiente','vencido')
      and p.eliminado_en is null
      and r.fecha_vencimiento <= current_date + 15

    union all

    select
      p.asesor_id, 'renovacion', p.id, p.contacto_id,
      'Renovación — póliza ' || p.numero_poliza,
      p.ramo, p.fecha_fin,
      case when p.fecha_fin < current_date then 'vencida' else 'proxima' end
    from public.polizas p
    where p.estado = 'vigente'
      and p.eliminado_en is null
      and p.fecha_fin <= current_date + 90

    union all

    select
      o.asesor_id, 'recontacto', o.id, o.contacto_id,
      'Recontactar — ' || o.ramo,
      coalesce(o.motivo_perdida, 'seguimiento'), o.recontactar_en,
      case when o.recontactar_en < current_date then 'vencida' else 'hoy' end
    from public.oportunidades o
    where o.recontactar_en is not null
      and o.eliminado_en is null
      and o.recontactar_en <= current_date
  )
  select
    b.*,
    trim(both ' ' from coalesce(c.nombre, '') || ' ' || coalesce(c.apellido_paterno, '')) as nombre,
    c.telefono_movil as telefono
  from base b
  left join public.contactos c on c.id = b.contacto_id and c.eliminado_en is null;

alter view public.v_panel_dia set (security_invoker = on);

create or replace view public.v_embudo_kpi as
  select
    o.asesor_id, o.etapa,
    count(*) as abiertas,
    coalesce(sum(o.prima_estimada), 0) as prima,
    round(avg(extract(epoch from (now() - o.etapa_cambiada_en)) / 86400))::int as dias_promedio,
    count(*) filter (where o.etapa_cambiada_en < now() - interval '14 days') as estancadas
  from public.oportunidades o
  where o.resultado is null and o.eliminado_en is null
  group by o.asesor_id, o.etapa;

alter view public.v_embudo_kpi set (security_invoker = on);

create or replace view public.v_embudo_resumen as
  select
    asesor_id,
    count(*) filter (where resultado is null) as abiertas,
    count(*) filter (where resultado = 'ganada' and cerrada_en > now() - interval '90 days') as ganadas_90d,
    count(*) filter (where resultado = 'perdida' and cerrada_en > now() - interval '90 days') as perdidas_90d,
    coalesce(sum(prima_estimada) filter (where resultado is null), 0) as prima_en_calle,
    round(avg(extract(epoch from (cerrada_en - creado_en)) / 86400)
          filter (where resultado = 'ganada'))::int as dias_para_cerrar
  from public.oportunidades
  where eliminado_en is null
  group by asesor_id;

alter view public.v_embudo_resumen set (security_invoker = on);

create or replace view public.v_comisiones as
  select
    p.asesor_id, p.id as poliza_id, p.contacto_id, p.numero_poliza, p.ramo,
    p.fecha_fin, p.prima_total, p.moneda, p.anio_vigencia,
    (p.anio_vigencia > 1) as es_renovacion,
    coalesce(
      p.comision_pct,
      case when p.anio_vigencia = 1 then t.pct_primer_anio else t.pct_subsecuente end,
      0
    ) as pct_aplicado,
    round(
      coalesce(p.prima_total, 0) * coalesce(
        p.comision_pct,
        case when p.anio_vigencia = 1 then t.pct_primer_anio else t.pct_subsecuente end,
        0
      ) / 100.0, 2
    ) as comision_estimada
  from public.polizas p
  left join public.tasas_comision t
    on t.asesor_id = p.asesor_id and t.ramo = p.ramo and t.subtipo is null
  where p.estado = 'vigente' and p.eliminado_en is null;

alter view public.v_comisiones set (security_invoker = on);

-- ---------------------------------------------------------------------
-- Borrar un contacto se lleva lo suyo, en una sola transacción
-- ---------------------------------------------------------------------

create or replace function public.eliminar_contacto(p_contacto_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asesor uuid;
  v_vivas  int;
begin
  select asesor_id into v_asesor from public.contactos where id = p_contacto_id;
  if v_asesor is null then
    raise exception 'El contacto no existe';
  end if;

  -- SECURITY DEFINER salta RLS: la pertenencia se valida a mano.
  if v_asesor is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  select count(*) into v_vivas
    from public.polizas
   where contacto_id = p_contacto_id
     and eliminado_en is null
     and estado = 'vigente';

  if v_vivas > 0 then
    raise exception 'Tiene % póliza(s) vigente(s). Elimínalas primero o deja el contacto.', v_vivas;
  end if;

  update public.actividades   set eliminado_en = now() where contacto_id = p_contacto_id and eliminado_en is null;
  update public.oportunidades set eliminado_en = now() where contacto_id = p_contacto_id and eliminado_en is null;
  update public.polizas       set eliminado_en = now() where contacto_id = p_contacto_id and eliminado_en is null;
  update public.contactos     set eliminado_en = now() where id = p_contacto_id;

  return 1;
end;
$$;

revoke all on function public.eliminar_contacto(uuid) from public;
grant execute on function public.eliminar_contacto(uuid) to authenticated;
