import { createServerClient } from "@supabase/ssr";
import { leerConfig } from "@/lib/supabase/env";

export type UsuarioAcceso = { usuario: string; nombre: string };

/** ¿Se muestra el selector de usuarios, o se escribe el usuario? */
export function listaHabilitada(): boolean {
  return process.env.LOGIN_MOSTRAR_USUARIOS !== "0";
}

/**
 * Lista de cuentas activas para la pantalla de acceso.
 *
 * Se consulta sin sesión, contra una vista que solo expone usuario y nombre.
 * Si algo falla se devuelve lista vacía: la pantalla cae al modo de escribir
 * el usuario a mano, en vez de dejar a nadie fuera.
 */
export async function usuariosParaAcceso(): Promise<UsuarioAcceso[]> {
  if (!listaHabilitada()) return [];

  try {
    const { url, llave } = leerConfig();
    if (!url || !llave) return [];

    const supabase = createServerClient(url, llave, {
      cookies: { getAll: () => [], setAll: () => {} },
    });

    const { data, error } = await supabase
      .from("v_usuarios_acceso")
      .select("usuario, nombre")
      .order("nombre");

    if (error) {
      console.error("[acceso] no se pudo leer la lista:", error.message);
      return [];
    }
    return (data ?? []) as UsuarioAcceso[];
  } catch (causa) {
    console.error("[acceso]", causa instanceof Error ? causa.message : causa);
    return [];
  }
}
