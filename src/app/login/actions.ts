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

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[login] fallo de autenticación:", error.message);
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
