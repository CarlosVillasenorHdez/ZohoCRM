import { cache } from "react";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieNueva = { name: string; value: string; options: CookieOptions };
import { cookies } from "next/headers";
import { urlSupabase, llavePublicable } from "./env";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 * El JWT del usuario viaja en cada request, así que RLS con auth.uid()
 * funciona correctamente aunque haya connection pooling detrás.
 */
export async function clienteServidor() {
  const almacen = await cookies();

  return createServerClient(urlSupabase(), llavePublicable(), {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(cookiesNuevas: CookieNueva[]) {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacen.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies.
          // El middleware ya refresca la sesión, así que es seguro ignorarlo.
        }
      },
    },
  });
}

/**
 * Devuelve el asesor autenticado, o null.
 *
 * Nunca lanza. Un fallo de configuración o de red aquí debe mandar al login,
 * no tumbar la página con un 500 que no le dice nada a nadie. El motivo real
 * queda en los logs del servidor.
 */
export const asesorActual = cache(async function asesorActual() {
  try {
    const supabase = await clienteServidor();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch (causa) {
    console.error(
      "[auth] no se pudo verificar la sesión:",
      causa instanceof Error ? causa.message : causa,
    );
    return null;
  }
});

/**
 * Perfil del asesor: nombre y si es superusuario, en UNA consulta.
 *
 * cache() de React deduplica dentro de la misma petición: el layout y la
 * página pueden pedirlo sin que se consulte dos veces. Antes el layout hacía
 * getUser, luego esSuperusuario hacía getUser otra vez más una consulta, y
 * la página un tercer getUser. Cada viaje a Supabase cuesta entre 0.2 y 0.6
 * segundos desde Vercel, así que eso solo eran más de un segundo de espera.
 */
export const perfilActual = cache(async function perfilActual() {
  const usuario = await asesorActual();
  if (!usuario) return null;

  try {
    const supabase = await clienteServidor();
    const { data } = await supabase
      .from("asesores")
      .select("nombre, usuario, es_super")
      .eq("id", usuario.id)
      .maybeSingle();

    return {
      id: usuario.id,
      email: usuario.email ?? "",
      nombre: data?.nombre ?? usuario.email ?? "",
      usuario: data?.usuario ?? "",
      esSuper: data?.es_super === true,
    };
  } catch {
    return { id: usuario.id, email: usuario.email ?? "", nombre: "", usuario: "", esSuper: false };
  }
})
