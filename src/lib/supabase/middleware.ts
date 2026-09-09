import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieNueva = { name: string; value: string; options: CookieOptions };
import { NextResponse, type NextRequest } from "next/server";
import { urlSupabase, llavePublicable } from "./env";

const RUTAS_PUBLICAS = ["/login", "/auth"];

export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(urlSupabase(), llavePublicable(), {
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

  // No quitar: refresca el token y evita cerrar sesión sola.
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
}
