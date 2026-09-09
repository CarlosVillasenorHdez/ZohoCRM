import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { leerConfig } from "./env";

type CookieNueva = { name: string; value: string; options: CookieOptions };

const RUTAS_PUBLICAS = ["/login", "/auth", "/estado"];

/**
 * Refresca la sesión y protege las rutas privadas.
 *
 * Esta capa falla ABIERTA a propósito: si algo revienta aquí (configuración
 * incompleta, Supabase caído), dejamos pasar la petición en vez de tumbar el
 * sitio entero con un 500 sin mensaje. No abre un hueco de seguridad porque
 * cada página privada verifica la sesión otra vez del lado del servidor, y
 * RLS filtra en la base. Este proxy es conveniencia, no la cerradura.
 *
 * REGLA: toda página bajo (app) empieza con
 *   const asesor = await asesorActual(); if (!asesor) redirect("/login");
 */
export async function verificarSesion(request: NextRequest) {
  const { url, llave } = leerConfig();

  if (!url || !llave) {
    console.error(
      "[proxy] Faltan variables de entorno. " +
        `url=${url ? "ok" : "AUSENTE"}, llave=${llave ? "ok" : "AUSENTE"}. ` +
        "Define SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en Vercel.",
    );
    return NextResponse.next({ request });
  }

  let respuesta = NextResponse.next({ request });

  try {
    const supabase = createServerClient(url, llave, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesNuevas: CookieNueva[]) {
          for (const { name, value } of cookiesNuevas) {
            request.cookies.set(name, value);
          }
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of cookiesNuevas) {
            respuesta.cookies.set(name, value, options);
          }
        },
      },
    });

    // No quitar: refresca el token y evita que la sesión se cierre sola.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ruta = request.nextUrl.pathname;
    const esPublica = RUTAS_PUBLICAS.some((p) => ruta.startsWith(p));

    if (!user && !esPublica) {
      const destino = request.nextUrl.clone();
      destino.pathname = "/login";
      return NextResponse.redirect(destino);
    }

    if (user && ruta === "/login") {
      const destino = request.nextUrl.clone();
      destino.pathname = "/panel";
      return NextResponse.redirect(destino);
    }

    return respuesta;
  } catch (causa) {
    console.error(
      "[proxy] Falló la verificación de sesión, dejo pasar la petición:",
      causa instanceof Error ? causa.message : causa,
    );
    return NextResponse.next({ request });
  }
}
