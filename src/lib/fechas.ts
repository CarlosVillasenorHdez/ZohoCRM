export const ZONA = "America/Mexico_City";

/** 'YYYY-MM-DD' del día actual EN MÉXICO, sin importar la zona del servidor. */
export function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Formatea una fecha civil ('YYYY-MM-DD') sin volver a convertir zonas.
 *
 * El bug que esto evita: construir un Date y luego formatearlo con
 * timeZone: 'America/Mexico_City' aplica el desfase DOS veces cuando el
 * servidor corre en UTC, y muestra el día anterior. En Vercel eso pasaba
 * siempre, y el panel decía "martes 8" un miércoles 9.
 */
export function fechaLarga(iso: string = hoyISO()): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const utc = new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(utc);
}

export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const utc = new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  }).format(utc);
}

/** Hora de un timestamp completo, sí en zona de México. */
export function hora(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Días de diferencia contra hoy en México. Negativo = ya pasó. */
export function diasDesdeHoy(iso: string): number {
  const dia = (s: string) => {
    const [a, m, d] = s.slice(0, 10).split("-").map(Number);
    return Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((dia(iso) - dia(hoyISO())) / 86_400_000);
}

export function retraso(dias: number): string {
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  if (dias < 0) return `hace ${Math.abs(dias)} días`;
  return `en ${dias} días`;
}

/** Valor por defecto para <input type="datetime-local"> */
export function ahoraLocalInput(): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

// ---------------------------------------------------------------- calendario

export function mesActualISO(): string {
  return hoyISO().slice(0, 7);
}

export function nombreMes(mesISO: string): string {
  const [a, m] = mesISO.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, 1)));
}

export function mesVecino(mesISO: string, delta: number): string {
  const [a, m] = mesISO.split("-").map(Number);
  const d = new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Rejilla de 6 semanas que empieza en lunes, con los días de relleno del mes
 * anterior y siguiente. Devuelve fechas 'YYYY-MM-DD'.
 */
export function rejillaMes(mesISO: string): { iso: string; delMes: boolean }[] {
  const [a, m] = mesISO.split("-").map(Number);
  const anio = a ?? 1970;
  const mes = (m ?? 1) - 1;

  const primero = new Date(Date.UTC(anio, mes, 1));
  // getUTCDay: 0 = domingo. Queremos lunes como primer día.
  const corrimiento = (primero.getUTCDay() + 6) % 7;

  const celdas: { iso: string; delMes: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(Date.UTC(anio, mes, 1 - corrimiento + i));
    celdas.push({
      iso: d.toISOString().slice(0, 10),
      delMes: d.getUTCMonth() === mes,
    });
  }
  return celdas;
}

export function diaDelMes(iso: string): number {
  return Number(iso.slice(8, 10));
}
