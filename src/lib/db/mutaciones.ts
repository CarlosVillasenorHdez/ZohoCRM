"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor, asesorActual } from "@/lib/supabase/server";
import { escribir, intentar } from "@/lib/db/write";
import type { Etapa, Ramo } from "@/lib/types/database";

// Los archivos "use server" solo pueden exportar funciones async. El tipo se
// borra al compilar, así que sí puede vivir aquí; el valor inicial no, y por
// eso está en components/ui.tsx.
export type Estado = { mensaje: string | null; ok: boolean };

function texto(d: FormData, k: string): string | null {
  const v = String(d.get(k) ?? "").trim();
  return v === "" ? null : v;
}
function numero(d: FormData, k: string): number | null {
  const v = texto(d, k);
  if (v === null) return null;
  const n = Number(v.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function sesion() {
  const asesor = await asesorActual();
  if (!asesor) throw new Error("Sin sesión");
  return { asesor, supabase: await clienteServidor() };
}

// ------------------------------------------------------------------ contactos

export async function crearContacto(_p: Estado, d: FormData): Promise<Estado> {
  const nombre = texto(d, "nombre");
  if (!nombre) return { ok: false, mensaje: "El nombre es obligatorio." };

  const { asesor, supabase } = await sesion();

  const r = await intentar(
    "crear contacto",
    supabase
      .from("contactos")
      .insert({
        asesor_id: asesor.id,
        nombre,
        apellido_paterno: texto(d, "apellido_paterno"),
        apellido_materno: texto(d, "apellido_materno"),
        telefono_movil: texto(d, "telefono_movil"),
        email: texto(d, "email"),
        fecha_nacimiento: texto(d, "fecha_nacimiento"),
        ocupacion: texto(d, "ocupacion"),
        origen: texto(d, "origen") ?? "otro",
        referido_por_contacto_id: texto(d, "referido_por_contacto_id"),
        origen_detalle: texto(d, "origen_detalle"),
        notas: texto(d, "notas"),
      })
      .select("id"),
  );

  if (!r.ok) return { ok: false, mensaje: r.mensaje };

  revalidatePath("/contactos");
  revalidatePath("/panel");
  return { ok: true, mensaje: `${nombre} quedó guardado.` };
}

export async function actualizarContacto(_p: Estado, d: FormData): Promise<Estado> {
  const id = texto(d, "id");
  if (!id) return { ok: false, mensaje: "Falta el identificador." };
  const { asesor, supabase } = await sesion();

  const r = await intentar(
    "actualizar contacto",
    supabase
      .from("contactos")
      .update({
        nombre: texto(d, "nombre"),
        apellido_paterno: texto(d, "apellido_paterno"),
        telefono_movil: texto(d, "telefono_movil"),
        email: texto(d, "email"),
        fecha_nacimiento: texto(d, "fecha_nacimiento"),
        ocupacion: texto(d, "ocupacion"),
        notas: texto(d, "notas"),
      })
      .eq("id", id)
      .eq("asesor_id", asesor.id)
      .select("id"),
  );

  if (!r.ok) return { ok: false, mensaje: r.mensaje };
  revalidatePath(`/contactos/${id}`);
  return { ok: true, mensaje: "Cambios guardados." };
}

// -------------------------------------------------------------- oportunidades

export async function crearOportunidad(_p: Estado, d: FormData): Promise<Estado> {
  const contacto_id = texto(d, "contacto_id");
  const ramo = texto(d, "ramo") as Ramo | null;
  if (!contacto_id || !ramo) return { ok: false, mensaje: "Falta el contacto o el ramo." };

  const { asesor, supabase } = await sesion();

  const r = await intentar(
    "crear oportunidad",
    supabase
      .from("oportunidades")
      .insert({
        asesor_id: asesor.id,
        contacto_id,
        ramo,
        subtipo: texto(d, "subtipo"),
        etapa: texto(d, "etapa") ?? "primer_contacto",
        prima_estimada: numero(d, "prima_estimada"),
        moneda: texto(d, "moneda") ?? "MXN",
        notas: texto(d, "notas"),
      })
      .select("id"),
  );

  if (!r.ok) return { ok: false, mensaje: r.mensaje };
  revalidatePath("/embudo");
  revalidatePath(`/contactos/${contacto_id}`);
  return { ok: true, mensaje: "Oportunidad creada." };
}

/** Para arrastrar y soltar: recibe valores directos, no FormData. */
export async function moverOportunidad(id: string, etapa: Etapa): Promise<void> {
  const { asesor, supabase } = await sesion();
  await escribir(
    "mover oportunidad",
    supabase
      .from("oportunidades")
      .update({ etapa })
      .eq("id", id)
      .eq("asesor_id", asesor.id)
      .select("id"),
  );
  revalidatePath("/embudo");
}

export async function moverEtapa(d: FormData): Promise<void> {
  const id = String(d.get("id"));
  const etapa = String(d.get("etapa")) as Etapa;
  const { asesor, supabase } = await sesion();

  await escribir(
    "mover etapa",
    supabase
      .from("oportunidades")
      .update({ etapa })
      .eq("id", id)
      .eq("asesor_id", asesor.id)
      .select("id"),
  );

  revalidatePath("/embudo");
}

export async function cerrarOportunidad(_p: Estado, d: FormData): Promise<Estado> {
  const id = texto(d, "id");
  const resultado = texto(d, "resultado");
  if (!id || !resultado) return { ok: false, mensaje: "Falta el resultado." };

  const motivo = texto(d, "motivo_perdida");
  if (resultado === "perdida" && !motivo) {
    return { ok: false, mensaje: "Di por qué se perdió: eso es lo que te deja recuperarla." };
  }

  const { asesor, supabase } = await sesion();

  const r = await intentar(
    "cerrar oportunidad",
    supabase
      .from("oportunidades")
      .update({
        resultado,
        motivo_perdida: resultado === "perdida" ? motivo : null,
        motivo_detalle: texto(d, "motivo_detalle"),
        recontactar_en: texto(d, "recontactar_en"),
      })
      .eq("id", id)
      .eq("asesor_id", asesor.id)
      .select("id"),
  );

  if (!r.ok) return { ok: false, mensaje: r.mensaje };
  revalidatePath("/embudo");
  revalidatePath("/panel");
  return {
    ok: true,
    mensaje:
      resultado === "ganada"
        ? "Marcada como ganada. Captura la póliza cuando la tengas."
        : "Cerrada. Si pusiste fecha de recontacto, te va a aparecer en el panel ese día.",
  };
}

// -------------------------------------------------------------- actividades

export async function crearActividad(_p: Estado, d: FormData): Promise<Estado> {
  const titulo = texto(d, "titulo");
  const inicia = texto(d, "inicia_en");
  if (!titulo || !inicia) return { ok: false, mensaje: "Falta el título o la fecha." };

  const { asesor, supabase } = await sesion();

  const r = await intentar(
    "crear actividad",
    supabase
      .from("actividades")
      .insert({
        asesor_id: asesor.id,
        contacto_id: texto(d, "contacto_id"),
        oportunidad_id: texto(d, "oportunidad_id"),
        tipo: texto(d, "tipo") ?? "seguimiento",
        titulo,
        descripcion: texto(d, "descripcion"),
        lugar: texto(d, "lugar"),
        inicia_en: new Date(inicia).toISOString(),
      })
      .select("id"),
  );

  if (!r.ok) return { ok: false, mensaje: r.mensaje };
  revalidatePath("/agenda");
  revalidatePath("/panel");
  return { ok: true, mensaje: "Agendado." };
}

export async function completarActividad(d: FormData): Promise<void> {
  const id = String(d.get("id"));
  const { asesor, supabase } = await sesion();

  await escribir(
    "completar actividad",
    supabase
      .from("actividades")
      .update({ estado: "completada", completada_en: new Date().toISOString() })
      .eq("id", id)
      .eq("asesor_id", asesor.id)
      .select("id"),
  );

  revalidatePath("/panel");
  revalidatePath("/agenda");
}

// -------------------------------------------------------------------- recibos

export async function marcarReciboPagado(d: FormData): Promise<void> {
  const id = String(d.get("id"));
  const { asesor, supabase } = await sesion();

  await escribir(
    "marcar recibo pagado",
    supabase
      .from("recibos")
      .update({ estado: "pagado", fecha_pago: new Date().toISOString().slice(0, 10) })
      .eq("id", id)
      .eq("asesor_id", asesor.id)
      .select("id"),
  );

  revalidatePath("/panel");
}
