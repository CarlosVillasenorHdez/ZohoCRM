/**
 * Resultados posibles de una gestión.
 *
 * Vive fuera de mutaciones.ts porque ese archivo lleva "use server" y esos
 * módulos SOLO pueden exportar funciones async: exportar un valor rompe el
 * build. Es el tercer tropiezo con la misma regla, así que hay una prueba
 * que revisa que ningún archivo "use server" exporte constantes.
 */
export const RESULTADOS = [
  { valor: "contactado", texto: "Hablamos bien", sigue: true },
  { valor: "acepto_cita", texto: "Aceptó cita", sigue: true },
  { valor: "pidio_cotizacion", texto: "Pidió cotización", sigue: true },
  { valor: "lo_pensara", texto: "Lo va a pensar", sigue: true },
  { valor: "no_contesto", texto: "No contestó", sigue: true },
  { valor: "reagendo", texto: "Reagendó", sigue: true },
  { valor: "no_interesado", texto: "No le interesa", sigue: false },
  { valor: "ilocalizable", texto: "Ya no responde", sigue: false },
  { valor: "otro", texto: "Otro", sigue: true },
] as const;

export type Resultado = (typeof RESULTADOS)[number]["valor"];
