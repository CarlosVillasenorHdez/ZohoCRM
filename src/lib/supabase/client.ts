"use client";

import { createBrowserClient } from "@supabase/ssr";
import { urlSupabase, llavePublicable } from "./env";

export function clienteNavegador() {
  return createBrowserClient(urlSupabase(), llavePublicable());
}
