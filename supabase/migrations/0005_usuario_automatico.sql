-- =====================================================================
-- Migración 0005: que toda cuenta nueva nazca lista para la lista de acceso
--
-- Bloque único. Correr completo en el SQL Editor.
--
-- Hasta ahora, una cuenta creada desde el panel de Supabase quedaba con
-- asesores.usuario en null, y por eso no aparecía en la pantalla de acceso
-- sin un update a mano. El trigger ahora lo deriva del correo.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario text;
  v_nombre  text;
begin
  -- carlos@cartera.app -> carlos ; ana.lopez@gmail.com -> ana.lopez
  v_usuario := lower(split_part(new.email, '@', 1));

  -- Si ese usuario ya existe, se le agrega un sufijo en vez de fallar el alta.
  if exists (select 1 from public.asesores where lower(usuario) = v_usuario) then
    v_usuario := v_usuario || '-' || substr(new.id::text, 1, 4);
  end if;

  v_nombre := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
    initcap(replace(replace(v_usuario, '.', ' '), '_', ' '))
  );

  insert into public.asesores (id, nombre, email, usuario)
  values (new.id, v_nombre, new.email, v_usuario)
  on conflict (id) do nothing;

  insert into public.reglas_recordatorio (asesor_id, ramo, evento, dias_antes)
  values
    (new.id, 'ahorro', 'renovacion', 90),
    (new.id, 'ahorro', 'renovacion', 5),
    (new.id, 'gmm',    'renovacion', 90),
    (new.id, 'gmm',    'renovacion', 30),
    (new.id, 'gmm',    'renovacion', 5),
    (new.id, 'autos',  'renovacion', 30),
    (new.id, 'autos',  'renovacion', 5),
    (new.id, null,     'recibo',     5),
    (new.id, null,     'recibo',     0),
    (new.id, null,     'cumpleanos', 0)
  on conflict do nothing;

  insert into public.tasas_comision (asesor_id, ramo)
  values (new.id,'ahorro'),(new.id,'gmm'),(new.id,'autos'),(new.id,'vida'),(new.id,'danos')
  on conflict (asesor_id, ramo, subtipo) do nothing;

  return new;
end;
$$;

-- Rellenar lo que ya existe, resolviendo colisiones en vez de tronar.
-- (Dos cuentas como alfonso@gmail.com y alfonso@cartera.app derivarían el
--  mismo usuario y romperían el índice único.)
do $$
declare
  r        record;
  v_base   text;
  v_intento text;
begin
  for r in
    select id, email from public.asesores
     where usuario is null or usuario = ''
     order by creado_en
  loop
    v_base := lower(split_part(r.email, '@', 1));
    v_intento := v_base;
    if exists (select 1 from public.asesores where lower(usuario) = v_intento) then
      v_intento := v_base || '-' || substr(r.id::text, 1, 4);
    end if;
    update public.asesores set usuario = v_intento where id = r.id;
  end loop;
end $$;
