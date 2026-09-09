"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";

export type EstadoLogin = { mensaje: string | null };

export async function entrar(
  _previo: EstadoLogin,
  datos: FormData,
): Promise<EstadoLogin> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");

  if (!email || !password) {
    return { mensaje: "Escribe tu correo y tu contraseña." };
  }

  // Este es el primer punto del flujo que exige la configuración de Supabase:
  // /login renderiza sin ella y el proxy falla abierta. Si truena aquí sin
  // atrapar, el usuario ve un 500 anónimo justo al intentar entrar.
  let error;
  try {
    const supabase = await clienteServidor();
    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  } catch (causa) {
    console.error(
      "[login] no se pudo construir el cliente de Supabase:",
      causa instanceof Error ? causa.message : causa,
    );
    return {
      mensaje:
        "El servidor no tiene la configuración de Supabase. Abre /estado para ver qué falta.",
    };
  }

  if (error) {
    console.error("[login] fallo de autenticación:", error.message, error.code);
    if (error.code === "email_not_confirmed") {
      return {
        mensaje:
          "Ese usuario no está confirmado. En Supabase, edítalo y marca Auto Confirm User.",
      };
    }
    return { mensaje: "Ese correo y esa contraseña no coinciden." };
  }

  revalidatePath("/", "layout");
  redirect("/panel");
}

export async function salir() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
