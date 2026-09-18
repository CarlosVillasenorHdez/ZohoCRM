-- =====================================================================
-- Migración 0004: cerrar la escalación de privilegios en asesores
--
-- Bloque único y corto. Correr completo en el SQL Editor.
--
-- EL PROBLEMA
-- La política de asesores decía `for all using (id = auth.uid())`. Eso deja
-- que cada quien edite SU PROPIA fila, que es lo correcto para el nombre o
-- el teléfono... y también para es_super y activo, que no lo es.
--
-- RLS controla QUÉ FILAS se tocan, no QUÉ COLUMNAS. Así que un asesor con
-- su token podía hacer, contra la API y sin pasar por la aplicación:
--     update asesores set es_super = true where id = auth.uid();
-- y quedar como superusuario. Un usuario suspendido podía reactivarse igual.
--
-- LA SOLUCIÓN
-- Los permisos por columna sí existen en Postgres y actúan ANTES que RLS.
-- Se revoca el update general y se concede solo sobre las columnas que el
-- dueño de la fila puede cambiar legítimamente. es_super y activo quedan
-- fuera: los mueve el superusuario con la llave secreta, que no pasa por
-- estos permisos.
-- =====================================================================

revoke update on public.asesores from authenticated;

grant update (
  nombre,
  telefono,
  clave_agente,
  zona_horaria,
  email_contacto,
  usuario
) on public.asesores to authenticated;

-- Insertar y borrar asesores tampoco es cosa del asesor: el alta la hace el
-- trigger de Auth y la baja el superusuario.
revoke insert, delete on public.asesores from authenticated;

-- Lectura intacta: cada quien sigue viendo su propia fila por RLS.
grant select on public.asesores to authenticated;
