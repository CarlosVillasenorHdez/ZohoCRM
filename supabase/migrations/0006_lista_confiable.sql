-- =====================================================================
-- Migración 0006: que la lista de acceso no pueda mentir
--
-- Bloque único. Correr completo en el SQL Editor.
--
-- EL PROBLEMA
-- La vista decidía quién aparece mirando asesores.email, que es una COPIA
-- del correo de Supabase Auth. Las dos se desincronizan con un update
-- cualquiera: la tabla decía carlos@cartera.app mientras Auth seguía con
-- vicky_a_acosta@yahoo.com. Resultado: la pantalla listaba a "carlos" y al
-- elegirlo era imposible entrar, porque esa identidad no existe.
--
-- LA SOLUCIÓN
-- La vista se une a auth.users y solo lista a quien CUMPLE la promesa que
-- la lista hace: que escribir <usuario> más el dominio interno llega a una
-- cuenta real. Si no coinciden, no aparece. Ya no hay forma de listar a
-- alguien que no pueda entrar, porque la condición se verifica contra la
-- fuente de verdad en cada consulta.
-- =====================================================================

drop view if exists public.v_usuarios_acceso;

create view public.v_usuarios_acceso
with (security_invoker = off) as
  select
    lower(a.usuario) as usuario,
    a.nombre
  from public.asesores a
  join auth.users u on u.id = a.id
  where a.activo = true
    and a.usuario is not null
    and a.usuario <> ''
    and lower(u.email) = lower(a.usuario) || '@cartera.app';

revoke all on public.v_usuarios_acceso from public;
grant select on public.v_usuarios_acceso to anon, authenticated;

-- Vista de apoyo para la pantalla de Usuarios: deja ver al superusuario con
-- qué identidad entra realmente cada cuenta, para que una desincronización
-- como esta se note de inmediato en vez de esconderse.
drop view if exists public.v_usuarios_admin;

create view public.v_usuarios_admin
with (security_invoker = off) as
  select
    a.id,
    a.usuario,
    a.nombre,
    a.activo,
    a.es_super,
    a.email_contacto,
    u.email                                                   as correo_de_acceso,
    (lower(u.email) = lower(a.usuario) || '@cartera.app')     as usa_usuario_corto,
    (u.email_confirmed_at is not null)                        as confirmado,
    u.last_sign_in_at
  from public.asesores a
  join auth.users u on u.id = a.id;

revoke all on public.v_usuarios_admin from public;
-- Nadie la consulta con la llave pública: la pantalla de Usuarios la lee con
-- la llave secreta, que ya exige ser superusuario del lado de la aplicación.
grant select on public.v_usuarios_admin to service_role;
