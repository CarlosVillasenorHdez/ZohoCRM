import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { FormularioTasas } from "./formulario";

export const dynamic = "force-dynamic";

export default async function Comisiones() {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const { data } = await supabase
    .from("tasas_comision")
    .select("ramo, pct_primer_anio, pct_subsecuente")
    .eq("asesor_id", asesor.id)
    .is("subtipo", null);

  const tasas = Object.fromEntries(
    (data ?? []).map((t) => [t.ramo, { primer: Number(t.pct_primer_anio), subs: Number(t.pct_subsecuente) }]),
  );

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Comisiones</h1>
      <p className="mt-1.5 max-w-prose text-tinta-suave">
        Estos porcentajes no los fija la ley: salen de tu contrato de agente con cada
        aseguradora. Pídeselos a tu promotoría y cárgalos aquí una sola vez.
      </p>
      <p className="mt-3 max-w-prose text-sm text-tinta-suave">
        En vida y ahorro la comisión de primer año suele ser mucho más alta que la de años
        subsecuentes; en autos y gastos médicos suele ser pareja. Mientras estén en cero, la
        columna de comisión de tu cartera va a salir vacía.
      </p>
      <div className="mt-8 max-w-lg">
        <FormularioTasas tasas={tasas} />
      </div>
    </main>
  );
}
