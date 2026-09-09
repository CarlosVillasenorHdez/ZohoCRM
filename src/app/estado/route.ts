import { NextResponse } from "next/server";
import { leerConfig } from "@/lib/supabase/env";

/**
 * Diagnóstico de despliegue. Dice si la configuración llegó, y por cuál vía,
 * sin exponer ningún valor. Ruta pública a propósito: si no puedes iniciar
 * sesión, necesitas poder consultarla justamente sin sesión.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const { url, llave, fuente } = leerConfig();
  const listo = Boolean(url && llave);

  return NextResponse.json(
    {
      listo,
      supabase_url: url ? "configurada" : "AUSENTE",
      llave_publicable: llave ? "configurada" : "AUSENTE",
      fuente,
      pista: listo
        ? "Configuración completa."
        : "Define SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en Vercel (sin prefijo NEXT_PUBLIC_: se leen en cada petición y no requieren rebuild).",
    },
    { status: listo ? 200 : 503 },
  );
}
