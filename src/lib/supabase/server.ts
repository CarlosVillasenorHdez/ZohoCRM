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

/** Devuelve el asesor autenticado, o null. */
export async function asesorActual() {
  const supabase = await clienteServidor();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
