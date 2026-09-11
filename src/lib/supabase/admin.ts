import "server-only";
import { createClient } from "@supabase/supabase-js";
import { leerConfig } from "./env";
import { clienteServidor, asesorActual } from "./server";

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
 * La fuente de verdad es asesores.es_super. ADMIN_EMAIL sigue funcionando
 * solo como arranque: sirve para marcarte a ti la primera vez, cuando
 * todavía no hay ningún superusuario en la tabla.
 */
export async function esSuperusuario(): Promise<boolean> {
  const actual = await asesorActual();
  if (!actual) return false;

  const arranque = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (arranque && actual.email?.trim().toLowerCase() === arranque) return true;

  try {
    const supabase = await clienteServidor();
    const { data } = await supabase
      .from("asesores")
      .select("es_super")
      .eq("id", actual.id)
      .maybeSingle();
    return data?.es_super === true;
  } catch {
    return false;
  }
}
