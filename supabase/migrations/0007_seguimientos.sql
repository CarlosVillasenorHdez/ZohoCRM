-- =====================================================================
-- Migración 0007: cadena de seguimientos
--
-- Bloque único. Correr completo en el SQL Editor.
--
-- Una gestión no es una lista de actividades sueltas: es una cadena.
-- Llamo el lunes, quedamos en vernos el jueves, de la cita sale una
-- cotización, y así hasta que se cierra. Antes había que cerrar una
-- actividad y crear otra a mano, sin relación entre ellas, y se perdía la
-- historia de cómo llegó cada prospecto a donde está.
-- =====================================================================

alter table public.actividades
  add column if not exists resultado text
    check (resultado in (
      'contactado','no_contesto','reagendo','acepto_cita',
      'pidio_cotizacion','lo_pensara','no_interesado','ilocalizable','otro'
    )),
  add column if not exists nota_resultado      text,
  add column if not exists origen_actividad_id uuid references public.actividades(id) on delete set null;

create index if not exists idx_actividades_cadena
  on public.actividades(origen_actividad_id);

-- ---------------------------------------------------------------------
-- Cerrar una actividad y encadenar la siguiente, en una sola transacción.
-- Si no se manda fecha nueva, solo se cierra la actual.
-- ---------------------------------------------------------------------

create or replace function public.registrar_seguimiento(
  p_actividad_id  uuid,
  p_resultado     text,
  p_nota          text,
  p_nuevo_titulo  text,
  p_nuevo_tipo    text,
  p_nuevo_inicia  timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_act   public.actividades%rowtype;
  v_nueva uuid;
begin
  select * into v_act from public.actividades where id = p_actividad_id;
  if not found then
    raise exception 'La actividad no existe';
  end if;

  -- SECURITY DEFINER salta RLS: la pertenencia se valida a mano.
  if v_act.asesor_id is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  update public.actividades
     set estado         = 'completada',
         completada_en  = now(),
         resultado      = p_resultado,
         nota_resultado = p_nota
   where id = p_actividad_id;

  if p_nuevo_inicia is null then
    return null;   -- se cierra la gestión aquí
  end if;

  insert into public.actividades (
    asesor_id, contacto_id, oportunidad_id, poliza_id,
    tipo, titulo, inicia_en, origen_actividad_id, origen
  )
  values (
    v_act.asesor_id, v_act.contacto_id, v_act.oportunidad_id, v_act.poliza_id,
    coalesce(p_nuevo_tipo, 'seguimiento'),
    coalesce(nullif(trim(p_nuevo_titulo), ''), 'Seguimiento'),
    p_nuevo_inicia,
    p_actividad_id,
    'manual'
  )
  returning id into v_nueva;

  return v_nueva;
end;
$$;

revoke all on function public.registrar_seguimiento(uuid, text, text, text, text, timestamptz) from public;
grant execute on function public.registrar_seguimiento(uuid, text, text, text, text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------
-- Indicadores del embudo, calculados en la base.
-- ---------------------------------------------------------------------

create or replace view public.v_embudo_kpi as
  select
    o.asesor_id,
    o.etapa,
    count(*)                                                        as abiertas,
    coalesce(sum(o.prima_estimada), 0)                              as prima,
    round(avg(extract(epoch from (now() - o.etapa_cambiada_en)) / 86400))::int as dias_promedio,
    count(*) filter (where o.etapa_cambiada_en < now() - interval '14 days')   as estancadas
  from public.oportunidades o
  where o.resultado is null
  group by o.asesor_id, o.etapa;

alter view public.v_embudo_kpi set (security_invoker = on);

create or replace view public.v_embudo_resumen as
  select
    asesor_id,
    count(*) filter (where resultado is null)                                      as abiertas,
    count(*) filter (where resultado = 'ganada' and cerrada_en > now() - interval '90 days')  as ganadas_90d,
    count(*) filter (where resultado = 'perdida' and cerrada_en > now() - interval '90 days') as perdidas_90d,
    coalesce(sum(prima_estimada) filter (where resultado is null), 0)              as prima_en_calle,
    round(avg(extract(epoch from (cerrada_en - creado_en)) / 86400)
          filter (where resultado = 'ganada'))::int                                as dias_para_cerrar
  from public.oportunidades
  group by asesor_id;

alter view public.v_embudo_resumen set (security_invoker = on);
