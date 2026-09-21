"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { clienteServidor } from "@/lib/supabase/server";
import { aCorreoDeAcceso } from "@/lib/auth";

export type EstadoLogin = { mensaje: string | null };

const COOKIE_ULTIMO = "cartera_ultimo_usuario";

export async function ultimoUsuario(): Promise<string> {
  const c = await cookies();
  return c.get(COOKIE_ULTIMO)?.value ?? "";
}

export async function entrar(_previo: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const usuario = String(datos.get("usuario") ?? "").trim();
  const password = String(datos.get("password") ?? "");

  if (!usuario || !password) return { mensaje: "Escribe tu usuario y tu contraseña." };

  let error;
  try {
    const supabase = await clienteServidor();

    // El usuario corto se traduce a la credencial real preguntándole a la
    // base. Así funciona igual para una cuenta creada como carlos@cartera.app
    // que para una creada con correo real: la pantalla de acceso no tiene que
    // saber cómo nació cada cuenta.
    let correo = usuario;
    if (!usuario.includes("@")) {
      const { data, error: errRpc } = await supabase.rpc("correo_de_acceso", {
        p_usuario: usuario,
      });
      if (errRpc) console.error("[login] correo_de_acceso:", errRpc.message);
      // Si la función no existe todavía, se asume el dominio interno.
      correo = typeof data === "string" && data ? data : aCorreoDeAcceso(usuario);
    }

    ({ error } = await supabase.auth.signInWithPassword({ email: correo, password }));
  } catch (causa) {
    console.error("[login] configuración:", causa instanceof Error ? causa.message : causa);
    return { mensaje: "El servidor no tiene la configuración de Supabase. Revisa /estado." };
  }

  if (error) {
    console.error("[login] fallo:", error.message, error.code);
    if (error.code === "email_not_confirmed") {
      return { mensaje: "Esa cuenta no está confirmada. Pídele al administrador que la active." };
    }
    return { mensaje: "Ese usuario y esa contraseña no coinciden." };
  }

  // Se recuerda el usuario, nunca la contraseña, para no volver a teclearlo.
  const c = await cookies();
  c.set(COOKIE_ULTIMO, usuario.toLowerCase(), {
    httpOnly: false,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  revalidatePath("/", "layout");
  redirect("/panel");
}

export async function salir() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
