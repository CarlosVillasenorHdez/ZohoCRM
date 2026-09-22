import type { TipoActividad } from "@/lib/types/database";

/**
 * Color y etiqueta de cada tipo de actividad.
 *
 * Una sola fuente para el calendario, la lista del día y la leyenda: si los
 * colores vivieran en cada pantalla, en dos semanas una llamada sería azul
 * en un lado y verde en otro.
 *
 * Los tonos son apagados a propósito. El calendario muestra muchos puntos a
 * la vez y con colores saturados se vuelve ilegible; además el rojo está
 * reservado para lo atrasado, que es la única urgencia real.
 */
export const TIPO: Record<TipoActividad, { color: string; etiqueta: string }> = {
  cita:        { color: "#1f4e79", etiqueta: "Cita" },
  llamada:     { color: "#2e6b54", etiqueta: "Llamada" },
  whatsapp:    { color: "#4a8a5c", etiqueta: "WhatsApp" },
  email:       { color: "#5a6b78", etiqueta: "Correo" },
  seguimiento: { color: "#7a6aa8", etiqueta: "Seguimiento" },
  entrega:     { color: "#b07a16", etiqueta: "Entrega" },
  renovacion:  { color: "#8a6d1f", etiqueta: "Renovación" },
  cobranza:    { color: "#a8553a", etiqueta: "Cobranza" },
  cumpleanos:  { color: "#a8477e", etiqueta: "Cumpleaños" },
  nota:        { color: "#8a8f93", etiqueta: "Nota" },
  personal:    { color: "#6b7a45", etiqueta: "Personal" },
};

export function colorTipo(tipo: string): string {
  return TIPO[tipo as TipoActividad]?.color ?? "#5a6b78";
}

export function etiquetaTipo(tipo: string): string {
  return TIPO[tipo as TipoActividad]?.etiqueta ?? tipo;
}
