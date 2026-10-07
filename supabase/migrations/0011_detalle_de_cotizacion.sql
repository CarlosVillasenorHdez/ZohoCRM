-- =====================================================================
-- Migración 0011: el detalle del riesgo vive en la cotización, no en notas
--
-- Bloque único. Correr completo en el SQL Editor. No borra ni cambia datos.
--
-- La asesora venía capturando en el campo de notas los datos de la moto, la
-- cobertura, la forma de pago y la vigencia propuesta. Una nota es donde los
-- datos van a morir: no se puede filtrar por cobertura, ni alertar por una
-- vigencia que se acerca, ni saber cuántas cotizaciones de moto se perdieron
-- por precio. Todo eso pasa a ser campo.
--
-- `datos` es JSONB por la misma razón que en polizas: cinco ramos con
-- necesidades muy distintas no caben en columnas sin inventar quince tablas.
-- Los campos que admite cada ramo están fijos en el código (src/lib/catalogo),
-- no son configurables por el usuario: eso sería volverse Zoho.
-- =====================================================================

alter table public.oportunidades
  -- Datos del riesgo: moto, inmueble, asegurados, etc. según ramo y producto.
  add column if not exists datos jsonb not null default '{}'::jsonb,

  -- La cotización en firme que devuelve la aseguradora, distinta de la
  -- estimación con la que arranca la conversación.
  add column if not exists prima_cotizada   numeric(12,2),
  add column if not exists fecha_cotizacion date,

  -- Condiciones propuestas al cliente.
  add column if not exists forma_pago text
    check (forma_pago is null or forma_pago in ('anual','semestral','trimestral','mensual')),
  add column if not exists vigencia_inicio date;

-- Para responder "¿qué cotizaciones de moto traigo abiertas?" sin leer notas.
create index if not exists idx_oportunidades_producto
  on public.oportunidades(asesor_id, ramo, subtipo) where eliminado_en is null;

-- ---------------------------------------------------------------------
-- Nota sobre "emisión o no de póliza"
--
-- No se agrega como campo a propósito. Ya está modelado y agregarlo crearía
-- dos fuentes de verdad que se contradirían a la primera distracción:
--
--   emitida  = oportunidades.resultado = 'ganada' y existe su póliza
--   no emitida = resultado = 'perdida', con su motivo
--   en trámite = resultado nulo, con su etapa
--
-- La aplicación ahora ofrece capturar la póliza desde la cotización ganada,
-- arrastrando estos datos para no teclearlos dos veces.
-- ---------------------------------------------------------------------
