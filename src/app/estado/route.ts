import { NextResponse } from "next/server";

/**
 * Diagnóstico de despliegue. Dice si la configuración llegó al bundle,
 * sin exponer ningún valor. Ruta pública a propósito: si el proxy está
 * roto, necesitas poder consultarla justamente sin sesión.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const listo = Boolean(url && llave);

  return NextResponse.json(
    {
      listo,
      supabase_url: url ? "configurada" : "AUSENTE",
      llave_publicable: llave ? "configurada" : "AUSENTE",
      pista: listo
        ? "Configuración completa."
        : "Agrega las variables en Vercel y vuelve a desplegar SIN caché de build.",
    },
    { status: listo ? 200 : 503 },
  );
}
