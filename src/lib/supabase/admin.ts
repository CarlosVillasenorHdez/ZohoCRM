import "server-only";
import { createClient } from "@supabase/supabase-js";
import { leerConfig } from "./env";
import { perfilActual } from "./server";

/**
 * Cliente administrativo: usa la llave secreta y BYPASEA RLS.
 *
 *  - "server-only" arriba: si alguien lo importa desde un componente de
 *    cliente, el build falla en vez de filtrar la llave al navegador.
 *  - Nunca se usa para leer la cartera de nadie. Solo administración de
 *    cuentas, que no se puede hacer con la llave pública.
 *  - Todo llamado valida antes que quien lo pide sea superusuario.
 */
export function clienteAdmin() {
  const { url } = leerConfig();
  const secreta = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secreta) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY. Agrégala en Vercel como variable de servidor, " +
        "sin prefijo NEXT_PUBLIC_.",
    );
  }

  return createClient(url, secreta, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function adminConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}

/**
 * ¿El usuario de la sesión es superusuario?
 *
 * ÚNICA fuente de verdad: asesores.es_super, columna que el propio asesor no
 * puede escribir (migración 0004, permisos por columna).
 *
 * Antes existía un atajo por ADMIN_EMAIL: si el correo de la sesión coincidía
 * con esa variable de entorno, se otorgaba superusuario. Estaba mal por dos
 * razones. Concede privilegios desde un lugar invisible en la base de datos,
 * así que auditar quién es administrador consultando `select es_super` daba
 * una respuesta falsa. Y quien pueda editar variables de entorno se vuelve
 * administrador sin dejar rastro. Se eliminó.
 */
export async function esSuperusuario(): Promise<boolean> {
  const perfil = await perfilActual();
  return perfil?.esSuper === true;
}

