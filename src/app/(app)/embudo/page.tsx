import Link from "next/link";
import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { Kanban, type Tarjeta } from "@/components/kanban";
import { diasDesdeHoy } from "@/lib/fechas";
import type { Ramo, Etapa } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const DINERO = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 0,
});

export default async function Embudo() {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from("oportunidades")
    .select("id, contacto_id, ramo, subtipo, etapa, etapa_cambiada_en, prima_estimada")
    .eq("asesor_id", asesor.id)
    .is("resultado", null)
    .order("etapa_cambiada_en", { ascending: true });

  const filas = data ?? [];
  const ids = [...new Set(filas.map((o) => o.contacto_id))];

  const nombres = new Map<string, string>();
  if (ids.length > 0) {
    const { data: cs } = await supabase.from("contactos").select("id, nombre, apellido_paterno").in("id", ids);
    for (const c of cs ?? []) {
      nombres.set(c.id, [c.nombre, c.apellido_paterno].filter(Boolean).join(" "));
    }
  }

  const tarjetas: Tarjeta[] = filas.map((o) => ({
    id: o.id,
    contacto_id: o.contacto_id,
    nombre: nombres.get(o.contacto_id) ?? "Sin nombre",
    ramo: o.ramo as Ramo,
    subtipo: o.subtipo,
    etapa: o.etapa as Etapa,
    prima: o.prima_estimada === null ? null : Number(o.prima_estimada),
    diasEnEtapa: diasDesdeHoy(o.etapa_cambiada_en),
  }));

  const total = tarjetas.reduce((s, t) => s + (t.prima ?? 0), 0);
  const estancadas = tarjetas.filter((t) => t.diasEnEtapa <= -14).length;

  return (
    <main>
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Embudo</h1>
          <p className="mt-1 text-tinta-suave">
            {tarjetas.length === 0
              ? "Sin cotizaciones abiertas."
              : `${tarjetas.length} abiertas · ${DINERO.format(total)} en la calle` +
                (estancadas > 0 ? ` · ${estancadas} sin moverse en dos semanas` : "")}
          </p>
        </div>
        <Link href="/contactos" className="text-sm font-medium underline underline-offset-4">
          Nueva cotización
        </Link>
      </div>

      {error && (
        <p role="alert" className="border-l-2 border-l-atrasado py-2 pl-4 text-atrasado">
          {error.message}
        </p>
      )}

      {tarjetas.length === 0 && !error ? (
        <div className="border-t border-linea pt-7">
          <p className="max-w-prose text-tinta-suave">
            Las cotizaciones se crean desde la ficha de un contacto, con el botón
            &ldquo;Cotizar algo&rdquo;. Una persona puede tener varias abiertas al
            mismo tiempo: su auto y el gastos médicos de la familia son dos
            oportunidades distintas.
          </p>
          <Link
            href="/contactos"
            className="mt-5 inline-block rounded-md bg-tinta px-4 py-2.5 font-medium text-papel"
          >
            Ir a contactos
          </Link>
        </div>
      ) : (
        <Kanban tarjetas={tarjetas} />
      )}
    </main>
  );
}
