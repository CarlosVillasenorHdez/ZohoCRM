-- =====================================================================
-- Migración 0009: el panel del día en una sola consulta
--
-- Bloque único. Correr completo en el SQL Editor. No borra ni cambia datos.
--
-- Antes: v_panel_dia devolvía alertas con contacto_id, y la aplicación hacía
-- una SEGUNDA consulta para traer nombres y teléfonos. Dos viajes de red
-- encadenados, y el segundo no puede empezar hasta que termina el primero.
-- Medido desde Vercel, cada viaje a Supabase cuesta entre 0.2 y 0.6 s.
--
-- Ahora la vista ya trae el nombre y el teléfono. Un viaje en lugar de dos,
-- en la pantalla que se abre todos los días.
-- =====================================================================

create or replace view public.v_panel_dia as
  with base as (
    select
      a.asesor_id,
      'actividad'::text  as tipo_alerta,
      a.id               as referencia_id,
      a.contacto_id,
      a.titulo,
      a.tipo             as detalle,
      a.inicia_en::date  as fecha,
      case when a.inicia_en::date < current_date then 'vencida' else 'hoy' end as urgencia
    from public.actividades a
    where a.estado = 'pendiente'
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
      and r.fecha_vencimiento <= current_date + 15

    union all

    select
      p.asesor_id, 'renovacion', p.id, p.contacto_id,
      'Renovación — póliza ' || p.numero_poliza,
      p.ramo, p.fecha_fin,
      case when p.fecha_fin < current_date then 'vencida' else 'proxima' end
    from public.polizas p
    where p.estado = 'vigente'
      and p.fecha_fin <= current_date + 90

    union all

    select
      o.asesor_id, 'recontacto', o.id, o.contacto_id,
      'Recontactar — ' || o.ramo,
      coalesce(o.motivo_perdida, 'seguimiento'), o.recontactar_en,
      case when o.recontactar_en < current_date then 'vencida' else 'hoy' end
    from public.oportunidades o
    where o.recontactar_en is not null
      and o.recontactar_en <= current_date
  )
  select
    b.*,
    trim(both ' ' from coalesce(c.nombre, '') || ' ' || coalesce(c.apellido_paterno, '')) as nombre,
    c.telefono_movil                                                                      as telefono
  from base b
  left join public.contactos c on c.id = b.contacto_id;

alter view public.v_panel_dia set (security_invoker = on);
