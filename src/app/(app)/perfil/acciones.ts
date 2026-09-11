"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor, asesorActual } from "@/lib/supabase/server";
import { clienteAdmin, adminConfigurado } from "@/lib/supabase/admin";
import { escribir } from "@/lib/db/write";
import { aCorreoDeAcceso, usuarioValido } from "@/lib/auth";
import type { Estado } from "@/lib/db/mutaciones";

/**
 * Cambiar la propia contraseña.
 * No necesita la llave secreta: Supabase permite que el dueño de la sesión
 * actualice su contraseña. Por eso funciona aunque falte SUPABASE_SECRET_KEY.
 */
export async function cambiarMiPassword(_p: Estado, d: FormData): Promise<Estado> {
  const nueva = String(d.get("password") ?? "");
  const confirma = String(d.get("confirma") ?? "");

  if (nueva.length < 10) return { ok: false, mensaje: "Mínimo 10 caracteres." };
  if (nueva !== confirma) return { ok: false, mensaje: "Las dos contraseñas no son iguales." };

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.updateUser({ password: nueva });

  if (error) {
    console.error("[perfil] password:", error.message);
    return { ok: false, mensaje: `No se pudo cambiar: ${error.message}` };
  }
  return { ok: true, mensaje: "Contraseña actualizada. Ya es tuya." };
}

/**
 * Cambiar el propio usuario de acceso.
 *
 * Esto reescribe la identidad en Supabase Auth (de correo real a
 * usuario@cartera.app), así que tiene que pasar por la API de administración:
 * es la única que actualiza también la tabla de identidades. Hacerlo a mano
 * con SQL sobre auth.users deja esa tabla inconsistente y rompe el acceso.
 *
 * El id del usuario NO cambia, así que toda la cartera se conserva.
 */
export async function cambiarMiUsuario(_p: Estado, d: FormData): Promise<Estado> {
  const actual = await asesorActual();
  if (!actual) return { ok: false, mensaje: "Sin sesión." };

  if (!adminConfigurado()) {
    return {
      ok: false,
      mensaje: "Falta SUPABASE_SECRET_KEY en Vercel. Sin ella no se puede reescribir la identidad.",
    };
  }

  const usuario = String(d.get("usuario") ?? "").trim().toLowerCase();
  if (!usuarioValido(usuario)) {
    return {
      ok: false,
      mensaje: "Entre 3 y 24 caracteres: letras sin acentos, números, punto, guion o guion bajo.",
    };
  }

  try {
    const admin = clienteAdmin();

    const { data: ocupado } = await admin
      .from("asesores")
      .select("id")
      .ilike("usuario", usuario)
      .neq("id", actual.id)
      .maybeSingle();
    if (ocupado) return { ok: false, mensaje: `El usuario "${usuario}" ya está ocupado.` };

    const { error } = await admin.auth.admin.updateUserById(actual.id, {
      email: aCorreoDeAcceso(usuario),
      email_confirm: true,
    });
    if (error) {
      console.error("[perfil] usuario:", error.message);
      return { ok: false, mensaje: `No se pudo cambiar: ${error.message}` };
    }

    const supabase = await clienteServidor();
    await escribir(
      "actualizar mi usuario",
      supabase.from("asesores").update({ usuario }).eq("id", actual.id).select("id"),
    );
  } catch (causa) {
    return { ok: false, mensaje: causa instanceof Error ? causa.message : "Falló la operación." };
  }

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return {
    ok: true,
    mensaje: `Listo. A partir de ahora entras escribiendo "${usuario}". Tu cartera no se movió.`,
  };
}
