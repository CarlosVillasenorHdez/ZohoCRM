const ZONA = "America/Mexico_City";

export function hoyEnMexico(): Date {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
  return new Date(`${partes}T00:00:00`);
}

export function fechaLarga(d: Date = hoyEnMexico()): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export function fechaCorta(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(d);
}

export function hora(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Días de diferencia contra hoy. Negativo = ya pasó. */
export function diasDesdeHoy(iso: string): number {
  const objetivo = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const ms = objetivo.getTime() - hoyEnMexico().getTime();
  return Math.round(ms / 86_400_000);
}

export function retraso(dias: number): string {
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  if (dias < 0) return `hace ${Math.abs(dias)} días`;
  return `en ${dias} días`;
}
