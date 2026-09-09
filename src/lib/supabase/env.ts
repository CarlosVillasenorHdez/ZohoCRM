/**
 * Lectura de variables de entorno con falla ruidosa.
 * Si falta una, la app no arranca — en vez de fallar en runtime con
 * un "Invalid API key" críptico a mitad de un guardado.
 */
function requerida(nombre: string, valor: string | undefined): string {
  if (!valor || valor.trim() === "") {
    throw new Error(
      `Falta la variable de entorno ${nombre}. ` +
        `Cópiala de .env.example a .env.local (local) o agrégala en Vercel (producción).`,
    );
  }
  return valor;
}

export function urlSupabase(): string {
  return requerida("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function llavePublicable(): string {
  return requerida(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
