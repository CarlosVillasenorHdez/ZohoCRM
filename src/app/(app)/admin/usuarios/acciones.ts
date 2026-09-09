"use server";

import { revalidatePath } from "next/cache";
import { asesorActual } from "@/lib/supabase/server";
import { clienteAdmin, esAdministrador } from "@/lib/supabase/admin";
import type { Estado } from "@/lib/db/mutaciones";

export async function crearUsuario(_p: Estado, d: FormData): Promise<Estado> {
  const actual = await asesorActual();
  if (!esAdministrador(actual?.email)) {
    return { ok: false, mensaje: "Solo el administrador puede dar de alta usuarios." };
  }

  const email = String(d.get("email") ?? "").trim();
  const password = String(d.get("password") ?? "");
  const nombre = String(d.get("nombre") ?? "").trim();

  if (!email || !nombre) return { ok: false, mensaje: "Faltan el correo y el nombre." };
  if (password.length < 10) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 10 caracteres." };
  }

  try {
    const admin = clienteAdmin();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // sin esto el usuario no puede entrar
      user_metadata: { nombre },
    });

    if (error) {
      console.error("[admin] no se pudo crear el usuario:", error.message);
      return {
        ok: false,
        mensaje: error.message.includes("already")
          ? "Ya existe un usuario con ese correo."
          : `No se pudo crear: ${error.message}`,
      };
    }
  } catch (causa) {
    return { ok: false, mensaje: causa instanceof Error ? causa.message : "Falló la operación." };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true, mensaje: `${nombre} ya puede entrar con ${email}.` };
}

export async function cambiarPassword(_p: Estado, d: FormData): Promise<Estado> {
  const actual = await asesorActual();
  if (!esAdministrador(actual?.email)) {
    return { ok: false, mensaje: "Solo el administrador puede cambiar contraseñas." };
  }

  const userId = String(d.get("user_id") ?? "");
  const password = String(d.get("password") ?? "");
  if (!userId) return { ok: false, mensaje: "Falta el usuario." };
  if (password.length < 10) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 10 caracteres." };
  }

  try {
    const admin = clienteAdmin();
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return { ok: false, mensaje: `No se pudo cambiar: ${error.message}` };
  } catch (causa) {
    return { ok: false, mensaje: causa instanceof Error ? causa.message : "Falló la operación." };
  }

  return { ok: true, mensaje: "Contraseña actualizada." };
}
