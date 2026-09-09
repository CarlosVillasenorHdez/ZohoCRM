import { NextResponse } from "next/server";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";

/**
 * Diagnóstico con sesión: recorre exactamente lo que hace /panel y reporta
 * en qué paso falla, en vez de reventar con un 500 sin mensaje.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const pasos: Record<string, string> = {};

  try {
    const asesor = await asesorActual();
    pasos.sesion = asesor ? `ok (${asesor.email})` : "sin sesion";
    if (!asesor) return NextResponse.json({ pasos }, { status: 200 });

    const supabase = await clienteServidor();

    const perfil = await supabase.from("asesores").select("nombre").eq("id", asesor.id);
    pasos.perfil_asesor = perfil.error
      ? `FALLA: ${perfil.error.message}`
      : `ok (${perfil.data?.length ?? 0} filas)`;

    const panel = await supabase.from("v_panel_dia").select("*").eq("asesor_id", asesor.id);
    pasos.vista_panel = panel.error
      ? `FALLA: ${panel.error.message}`
      : `ok (${panel.data?.length ?? 0} alertas)`;

    const contactos = await supabase.from("contactos").select("id").limit(1);
    pasos.contactos = contactos.error ? `FALLA: ${contactos.error.message}` : "ok";

    const reglas = await supabase.from("reglas_recordatorio").select("id");
    pasos.reglas = reglas.error
      ? `FALLA: ${reglas.error.message}`
      : `ok (${reglas.data?.length ?? 0} reglas)`;

    return NextResponse.json({ pasos }, { status: 200 });
  } catch (causa) {
    pasos.excepcion = causa instanceof Error ? causa.message : String(causa);
    return NextResponse.json({ pasos }, { status: 500 });
  }
}
