import { clienteServidor } from "@/lib/supabase/server";
import type { AlertaPanel } from "@/lib/types/database";

export type Grupo = "atrasado" | "hoy" | "proximo";

export interface AlertaConNombre extends AlertaPanel {
  nombre: string | null;
  telefono: string | null;
  grupo: Grupo;
}

function agrupar(a: AlertaPanel): Grupo {
  if (a.urgencia === "vencida") return "atrasado";
  if (a.urgencia === "hoy") return "hoy";
  return "proximo";
}

/**
 * Lectura del panel del día. RLS ya filtra por asesor, pero además
 * filtramos en la app: cinturón y tirantes.
 */
export async function alertasDelDia(asesorId: string): Promise<{
  alertas: AlertaConNombre[];
  error: string | null;
}> {
  const supabase = await clienteServidor();

  // Una sola consulta: v_panel_dia ya trae nombre y teléfono desde la
  // migración 0009. Antes eran dos viajes encadenados a Supabase.
  const { data, error } = await supabase
    .from("v_panel_dia")
    .select("*")
    .eq("asesor_id", asesorId)
    .order("fecha", { ascending: true });

  if (error) {
    console.error("[panel] no se pudieron leer las alertas:", error.message);
    return { alertas: [], error: "No se pudieron cargar tus pendientes." };
  }

  const alertas = ((data ?? []) as (AlertaPanel & { nombre: string | null; telefono: string | null })[])
    .map((f) => ({
      ...f,
      nombre: f.nombre && f.nombre.trim() !== "" ? f.nombre : null,
      grupo: agrupar(f),
    }));

  return { alertas, error: null };
}

/** Enlace wa.me con el mensaje ya redactado. Se abre en el WhatsApp del asesor. */
export function enlaceWhatsApp(telefono: string | null, mensaje: string): string | null {
  if (!telefono) return null;
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const conLada = digitos.length === 10 ? `52${digitos}` : digitos;
  return `https://wa.me/${conLada}?text=${encodeURIComponent(mensaje)}`;
}
