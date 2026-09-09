/**
 * Configuración de Supabase.
 *
 * Se leen PRIMERO las variables sin prefijo, que el servidor resuelve en cada
 * petición. Las NEXT_PUBLIC_ quedan solo como respaldo.
 *
 * El motivo: Next incrusta las NEXT_PUBLIC_ en el bundle AL COMPILAR. Si no
 * estaban presentes en ese momento, quedan como undefined para siempre en ese
 * despliegue, y agregarlas después no sirve de nada sin un rebuild sin caché.
 * Sin el prefijo, cambiar el valor surte efecto en la siguiente petición.
 *
 * Esta app solo habla con Supabase desde el servidor, así que el prefijo nunca
 * hizo falta.
 */

export type Config = { url: string; llave: string };

export function leerConfig(): Partial<Config> & { fuente: string } {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const fuente = process.env.SUPABASE_URL
    ? "runtime (SUPABASE_URL)"
    : process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "build (NEXT_PUBLIC_SUPABASE_URL)"
      : "ninguna";

  return { url, llave, fuente };
}

export function config(): Config {
  const { url, llave } = leerConfig();
  if (!url || !llave) {
    throw new Error(
      "Falta la configuración de Supabase. Define SUPABASE_URL y " +
        "SUPABASE_PUBLISHABLE_KEY (recomendado, se leen en cada petición) o " +
        "sus equivalentes NEXT_PUBLIC_, que exigen recompilar. Revisa /estado.",
    );
  }
  return { url, llave };
}

// Compatibilidad con los llamados existentes.
export function urlSupabase(): string {
  return config().url;
}
export function llavePublicable(): string {
  return config().llave;
}
