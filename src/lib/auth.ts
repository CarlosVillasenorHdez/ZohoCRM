/**
 * Identidad por usuario corto.
 *
 * El usuario ES la cuenta: "carlos" se guarda en Supabase Auth como
 * carlos@cartera.app. Así la pantalla de acceso pide una sola palabra y no
 * hace falta ningún endpoint que traduzca usuario a correo — endpoint que,
 * por definición, revelaría qué usuarios existen y con qué correo.
 *
 * El correo real del asesor vive en asesores.email_contacto, como dato de
 * contacto, no como credencial.
 */
export const DOMINIO_INTERNO = "cartera.app";

/** Normaliza lo que se escribe en la pantalla de acceso. */
export function aCorreoDeAcceso(entrada: string): string {
  const limpio = entrada.trim().toLowerCase();
  if (limpio.includes("@")) return limpio; // cuentas con correo real
  return `${limpio}@${DOMINIO_INTERNO}`;
}

/** De vuelta: carlos@cartera.app -> carlos */
export function aUsuario(correo: string | undefined): string {
  if (!correo) return "";
  const [nombre, dominio] = correo.split("@");
  return dominio === DOMINIO_INTERNO ? (nombre ?? correo) : correo;
}

const VALIDO = /^[a-z0-9._-]{3,24}$/;

export function usuarioValido(u: string): boolean {
  return VALIDO.test(u.trim().toLowerCase());
}
