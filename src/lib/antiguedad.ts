/**
 * Semáforo por tiempo parado en la misma etapa.
 * Los cortes no son arbitrarios: en seguros, una cotización que lleva más de
 * dos semanas sin moverse casi nunca se cierra sola.
 */
export type Tono = "fresco" | "tibio" | "frio" | "helado";

export function tonoPorDias(diasParado: number): Tono {
  const d = Math.abs(diasParado);
  if (d <= 3) return "fresco";
  if (d <= 7) return "tibio";
  if (d <= 14) return "frio";
  return "helado";
}

export const COLOR_TONO: Record<Tono, string> = {
  fresco: "#2e6b54",
  tibio: "#6d8a3f",
  frio: "#b07a16",
  helado: "#b4341f",
};

export const TEXTO_TONO: Record<Tono, string> = {
  fresco: "Reciente",
  tibio: "Va bien",
  frio: "Se está enfriando",
  helado: "Abandonada",
};
