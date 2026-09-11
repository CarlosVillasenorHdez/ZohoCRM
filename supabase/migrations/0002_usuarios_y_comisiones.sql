-- =====================================================================
-- Migración 0002: usuario corto, superusuario y tasas de comisión
-- Correr en: Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Identidad: usuario corto y bandera de superusuario
-- ---------------------------------------------------------------------

alter table public.asesores
  add column if not exists usuario        text,
  add column if not exists es_super       boolean not null default false,
  add column if not exists email_contacto text,
  add column if not exists activo         boolean not null default true;

-- El usuario se deriva del correo interno: carlos@cartera.app -> carlos
update public.asesores
   set usuario = split_part(email, '@', 1)
 where usuario is null;

create unique index if not exists uq_asesores_usuario
  on public.asesores (lower(usuario));

-- ---------------------------------------------------------------------
-- 1.b Año de vigencia de la póliza
--
--     No se puede deducir de poliza_anterior_id. En ahorro y vida la
--     renovación conserva la MISMA póliza, así que esa columna se queda en
--     null para siempre y la póliza parecería estar en su primer año
--     eternamente: se le aplicaría la comisión de primer año (alta) año tras
--     año, inflando los ingresos varias veces. Se cuenta explícitamente.
-- ---------------------------------------------------------------------

alter table public.polizas
  add column if not exists anio_vigencia int not null default 1
    check (anio_vigencia >= 1);

-- Las pólizas que ya vienen encadenadas arrancan en año 2.
update public.polizas set anio_vigencia = 2
 where poliza_anterior_id is not null and anio_vigencia = 1;

-- ---------------------------------------------------------------------
-- 2. Tasas de comisión por ramo
--    Los porcentajes NO los fija la ley: salen del contrato de agente con
--    cada aseguradora. Por eso son datos del asesor, editables, y no una
--    constante del sistema.
-- ---------------------------------------------------------------------

create table if not exists public.tasas_comision (
  id                uuid primary key default gen_random_uuid(),
  asesor_id         uuid not null references public.asesores(id) on delete cascade,
  ramo              text not null check (ramo in ('ahorro','gmm','autos','vida','danos')),
  subtipo           text,
  pct_primer_anio   numeric(5,2) not null default 0 check (pct_primer_anio >= 0 and pct_primer_anio <= 100),
  pct_subsecuente   numeric(5,2) not null default 0 check (pct_subsecuente >= 0 and pct_subsecuente <= 100),
  nota              text,
  actualizado_en    timestamptz not null default now(),

  constraint uq_tasa unique (asesor_id, ramo, subtipo)
);

create index if not exists idx_tasas_asesor on public.tasas_comision(asesor_id);

create trigger trg_tasas_actualizado
  before update on public.tasas_comision
  for each row execute function public.set_actualizado_en();

alter table public.tasas_comision enable row level security;

drop policy if exists tasas_comision_por_asesor on public.tasas_comision;
create policy tasas_comision_por_asesor on public.tasas_comision
  for all to authenticated
  using (asesor_id = auth.uid())
  with check (asesor_id = auth.uid());

-- Filas en cero para cada asesor: se ven en la pantalla de configuración
-- esperando su número real, en vez de esconder que el dato falta.
insert into public.tasas_comision (asesor_id, ramo)
select a.id, r.ramo
  from public.asesores a
  cross join (values ('ahorro'),('gmm'),('autos'),('vida'),('danos')) as r(ramo)
on conflict (asesor_id, ramo, subtipo) do nothing;

-- ---------------------------------------------------------------------
-- 3. La renovación de una póliza, como operación atómica
--    Cierra la vigente y abre la siguiente encadenada, en una transacción.
-- ---------------------------------------------------------------------

create or replace function public.renovar_poliza(
  p_poliza_id     uuid,
  p_numero_nuevo  text,
  p_fecha_inicio  date,
  p_fecha_fin     date,
  p_prima         numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vieja  public.polizas%rowtype;
  v_nueva  uuid;
begin
  select * into v_vieja from public.polizas where id = p_poliza_id;
  if not found then
    raise exception 'Póliza % no existe', p_poliza_id;
  end if;

  -- SECURITY DEFINER salta RLS: la pertenencia se valida a mano.
  if v_vieja.asesor_id is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  if v_vieja.tipo_renovacion = 'continua' then
    -- Ahorro y vida: la misma póliza sigue viva, solo corre la vigencia.
    update public.polizas
       set fecha_inicio  = p_fecha_inicio,
           fecha_fin     = p_fecha_fin,
           prima_total   = coalesce(p_prima, prima_total),
           estado        = 'vigente',
           anio_vigencia = anio_vigencia + 1
     where id = p_poliza_id;
    return p_poliza_id;
  end if;

  -- GMM y autos: se emite una póliza nueva, encadenada a la anterior.
  insert into public.polizas (
    asesor_id, contacto_id, aseguradora_id, oportunidad_id, numero_poliza,
    ramo, subtipo, producto, fecha_inicio, fecha_fin, estado, prima_total,
    moneda, forma_pago, tipo_renovacion, poliza_anterior_id, comision_pct, datos,
    anio_vigencia
  )
  values (
    v_vieja.asesor_id, v_vieja.contacto_id, v_vieja.aseguradora_id, v_vieja.oportunidad_id,
    p_numero_nuevo, v_vieja.ramo, v_vieja.subtipo, v_vieja.producto,
    p_fecha_inicio, p_fecha_fin, 'vigente', coalesce(p_prima, v_vieja.prima_total),
    v_vieja.moneda, v_vieja.forma_pago, v_vieja.tipo_renovacion, v_vieja.id,
    v_vieja.comision_pct, v_vieja.datos, v_vieja.anio_vigencia + 1
  )
  returning id into v_nueva;

  update public.polizas set estado = 'renovada' where id = p_poliza_id;

  return v_nueva;
end;
$$;

revoke all on function public.renovar_poliza(uuid, text, date, date, numeric) from public;
grant execute on function public.renovar_poliza(uuid, text, date, date, numeric) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Comisión estimada de una póliza
-- ---------------------------------------------------------------------

create or replace view public.v_comisiones as
  select
    p.asesor_id,
    p.id                as poliza_id,
    p.contacto_id,
    p.numero_poliza,
    p.ramo,
    p.fecha_fin,
    p.prima_total,
    p.moneda,
    p.anio_vigencia,
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
      ) / 100.0,
      2
    ) as comision_estimada
  from public.polizas p
  left join public.tasas_comision t
    on t.asesor_id = p.asesor_id and t.ramo = p.ramo and t.subtipo is null
  where p.estado = 'vigente';

alter view public.v_comisiones set (security_invoker = on);
