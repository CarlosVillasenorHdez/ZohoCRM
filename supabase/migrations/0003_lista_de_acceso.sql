-- =====================================================================
-- Migración 0003: lista de usuarios para la pantalla de acceso
--
-- Bloque único y corto. Correr completo en el SQL Editor.
-- =====================================================================

-- Vista mínima para el selector del login.
--
-- Expone SOLO el usuario y el nombre de las cuentas activas. Nunca el
-- correo, nunca el id, nunca nada de la cartera.
--
-- security_invoker = off a propósito: la vista corre con los permisos de su
-- dueño, así que puede leer asesores sin que RLS la bloquee. Es la única
-- puerta del sistema que ve alguien sin sesión, y por eso su superficie es
-- de dos columnas.
--
-- Consecuencia aceptada: quien abra la URL ve quién tiene acceso. Si no lo
-- quieres, pon LOGIN_MOSTRAR_USUARIOS=0 en Vercel y la app pide el usuario
-- escrito, sin tocar esta vista.

drop view if exists public.v_usuarios_acceso;

create view public.v_usuarios_acceso
with (security_invoker = off) as
  select
    lower(usuario) as usuario,
    nombre
  from public.asesores
  where activo = true
    and usuario is not null
    and usuario <> '';

revoke all on public.v_usuarios_acceso from public;
grant select on public.v_usuarios_acceso to anon, authenticated;
