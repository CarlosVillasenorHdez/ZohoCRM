import type { NextRequest } from "next/server";
import { verificarSesion } from "./lib/supabase/proxy";

// Next 16 renombró middleware.ts -> proxy.ts y la función a `proxy`.
export async function proxy(request: NextRequest) {
  return verificarSesion(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
