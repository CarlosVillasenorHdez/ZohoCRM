"use server";

import { revalidatePath } from "next/cache";
import { clienteAdmin, esSuperusuario } from "@/lib/supabase/admin";
import { aCorreoDeAcceso, usuarioValido } from "@/lib/auth";
import type { Estado } from "@/lib/db/mutaciones";

async function exigirSuper(): Promise<Estado | null> {
  if (!(await esSuperusuario())) {
    return { ok: false, mensaje: "Solo el superusuario puede administrar cuentas." };
  }
  return null;
}

export async function crearUsuario(_p: Estado, d: FormData): Promise<Estado> {
  const negado = await exigirSuper();
  if (negado) return negado;

  const usuario = String(d.get("usuario") ?? "").trim().toLowerCase();
  const nombre = String(d.get("nombre") ?? "").trim();
  const password = String(d.get("password") ?? "");
  const email_contacto = String(d.get("email_contacto") ?? "").trim() || null;

  if (!nombre) return { ok: false, mensaje: "Falta el nombre." };
  if (!usuarioValido(usuario)) {
    return {
      ok: false,
      mensaje:
        "El usuario debe tener entre 3 y 24 caracteres: letras sin acentos, números, punto, guion o guion bajo.",
    };
  }
  if (password.length < 10) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 10 caracteres." };
  }

  try {
    const admin = clienteAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email: aCorreoDeAcceso(usuario),
      password,
      email_confirm: true, // sin esto, la cuenta se crea pero no puede entrar
      user_metadata: { nombre },
    });

    if (error) {
      console.error("[admin] crearUsuario:", error.message);
      return {
        ok: false,
        mensaje: /already|exists|registered/i.test(error.message)
          ? `El usuario "${usuario}" ya existe.`
          : `No se pudo crear: ${error.message}`,
      };
    }

    // El trigger ya creó el perfil; aquí se completan los datos propios.
    if (data.user) {
      const { error: errPerfil } = await admin
        .from("asesores")
        .update({ usuario, nombre, email_contacto, email: aCorreoDeAcceso(usuario) })
        .eq("id", data.user.id);
      if (errPerfil) console.error("[admin] perfil:", errPerfil.message);
    }
  } catch (causa) {
    return { ok: false, mensaje: causa instanceof Error ? causa.message : "Falló la operación." };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true, mensaje: `Listo. ${nombre} entra con el usuario "${usuario}".` };
}

export async function cambiarPassword(_p: Estado, d: FormData): Promise<Estado> {
  const negado = await exigirSuper();
  if (negado) return negado;

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

  revalidatePath("/admin/usuarios");
  return { ok: true, mensaje: "Contraseña actualizada. Cópiala ahora." };
}

/** Acción directa de formulario: sin estado de retorno. */
export async function cambiarActivo(d: FormData): Promise<void> {
  if (!(await esSuperusuario())) return;

  const id = String(d.get("id") ?? "");
  const activar = String(d.get("activar") ?? "") === "1";
  if (!id) return;

  try {
    const admin = clienteAdmin();
    // ban_duration bloquea el acceso sin borrar nada de la cartera.
    const { error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: activar ? "none" : "876000h",
    });
    if (error) {
      console.error("[admin] cambiarActivo:", error.message);
      return;
    }
    await admin.from("asesores").update({ activo: activar }).eq("id", id);
  } catch (causa) {
    console.error("[admin] cambiarActivo:", causa instanceof Error ? causa.message : causa);
    return;
  }

  revalidatePath("/admin/usuarios");
}

export async function listarUsuarios(): Promise<
  { id: string; usuario: string; nombre: string; activo: boolean; email_contacto: string | null }[]
> {
  if (!(await esSuperusuario())) return [];
  const admin = clienteAdmin();
  const { data, error } = await admin
    .from("asesores")
    .select("id, usuario, nombre, activo, email_contacto, email")
    .order("nombre");

  if (error) {
    console.error("[admin] listarUsuarios:", error.message);
    return [];
  }

  return (data ?? []).map((a) => ({
    id: a.id,
    usuario: a.usuario ?? String(a.email ?? "").split("@")[0] ?? "",
    nombre: a.nombre,
    activo: a.activo ?? true,
    email_contacto: a.email_contacto,
  }));
}

