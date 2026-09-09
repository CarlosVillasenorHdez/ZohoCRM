import "server-only";
import { createClient } from "@supabase/supabase-js";
import { leerConfig } from "./env";

/**
 * Cliente administrativo. Usa la llave secreta y BYPASEA RLS por completo.
 *
 * Reglas de este archivo:
 *  - "server-only" arriba: si alguien lo importa desde un componente de
 *    cliente, el build falla en vez de filtrar la llave al navegador.
 *  - Nunca se usa para leer datos del asesor. Solo para operaciones de
 *    administración de usuarios, que no se pueden hacer con la llave pública.
 *  - Todo llamado valida antes que quien lo pide sea el administrador.
 */
export function clienteAdmin() {
  const { url } = leerConfig();
  const secreta = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secreta) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY (o la URL). Agrégala en Vercel como variable " +
        "de servidor, sin prefijo NEXT_PUBLIC_. Es la llave que bypasea RLS.",
    );
  }

  return createClient(url, secreta, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** ¿Este correo es el del administrador? */
export function esAdministrador(email: string | undefined): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin) return false;
  return email?.trim().toLowerCase() === admin;
}

export function adminConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY && process.env.ADMIN_EMAIL);
}
