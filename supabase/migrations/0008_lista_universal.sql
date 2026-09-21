-- =====================================================================
-- Migración 0008: la lista de acceso funciona con cualquier cuenta
--
-- Bloque único. Correr completo en el SQL Editor.
--
-- POR QUÉ CAMBIA
-- La 0006 solo listaba cuentas cuyo correo en Auth fuera usuario@cartera.app.
-- Era correcto en el papel —garantizaba que al elegir a alguien se pudiera
-- entrar— pero convertía una función básica en algo que exigía migrar
-- cuentas primero. Una cuenta creada con correo real quedaba fuera sin
-- remedio práctico.
--
-- Ahora se lista a cualquier cuenta activa con usuario, y la traducción de
-- usuario a credencial la hace la base con una función.
--
-- INTERCAMBIO, EXPLÍCITO
-- correo_de_acceso() devuelve el correo real de una cuenta activa a quien
-- pregunte por su usuario. Como la lista ya publica los usuarios, esto hace
-- descubribles también sus correos. Es el costo de que el selector funcione
-- sin condiciones. Para no pagarlo: LOGIN_MOSTRAR_USUARIOS=0 en Vercel
-- apaga la lista, y entonces esta función deja de usarse.
--
-- No devuelve nada más: ni id, ni contraseña, ni datos de la cartera. Y las
-- cuentas suspendidas no resuelven, así que suspender sigue cerrando la
-- puerta de verdad.
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
    and a.usuario <> '';

revoke all on public.v_usuarios_acceso from public;
grant select on public.v_usuarios_acceso to anon, authenticated;

-- Traduce el usuario corto a la credencial real de Supabase Auth.
create or replace function public.correo_de_acceso(p_usuario text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select u.email
    from public.asesores a
    join auth.users u on u.id = a.id
   where a.activo = true
     and lower(a.usuario) = lower(trim(p_usuario))
   limit 1;
$$;

revoke all on function public.correo_de_acceso(text) from public;
grant execute on function public.correo_de_acceso(text) to anon, authenticated;

-- Que ninguna cuenta se quede sin usuario, que es la otra forma de no salir
-- en la lista.
do $$
declare r record; v_base text; v_try text;
begin
  for r in select a.id, u.email from public.asesores a join auth.users u on u.id = a.id
            where a.usuario is null or a.usuario = ''
            order by a.creado_en
  loop
    v_base := lower(split_part(r.email, '@', 1));
    v_try := v_base;
    if exists (select 1 from public.asesores where lower(usuario) = v_try) then
      v_try := v_base || '-' || substr(r.id::text, 1, 4);
    end if;
    update public.asesores set usuario = v_try where id = r.id;
  end loop;
end $$;
