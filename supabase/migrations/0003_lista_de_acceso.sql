-- =====================================================================
-- Migración 0003: lista de usuarios para la pantalla de acceso
-- Bloque único. Se puede re-correr sin problema.
-- =====================================================================

-- Vista mínima para el selector del login.
--
-- Expone SOLO usuario y nombre de las cuentas activas. Nunca el correo,
-- nunca el id, nunca nada de la cartera.
--
-- security_invoker = off a propósito: corre con los permisos de su dueño
-- para poder leerse sin sesión. Es la única superficie que ve alguien no
-- autenticado, y por eso tiene dos columnas.
--
-- Solo se listan las cuentas cuya identidad usa el dominio interno. Una
-- cuenta creada con correo real (pongamos ana@yahoo.com) tiene usuario
-- 'ana', pero su credencial sigue siendo el correo: si apareciera en la
-- lista, al elegirla se intentaría entrar como ana@cartera.app, que no
-- existe, y el acceso fallaría sin explicación. Esas cuentas entran por
-- "Entrar con otra cuenta" hasta que su dueño se fije un usuario corto
-- desde Mi cuenta.
--
-- Para apagar la lista por completo: LOGIN_MOSTRAR_USUARIOS=0 en Vercel.

drop view if exists public.v_usuarios_acceso;

create view public.v_usuarios_acceso
with (security_invoker = off) as
  select
    lower(usuario) as usuario,
    nombre
  from public.asesores
  where activo = true
    and usuario is not null
    and usuario <> ''
    and email like '%@cartera.app';

revoke all on public.v_usuarios_acceso from public;
grant select on public.v_usuarios_acceso to anon, authenticated;
