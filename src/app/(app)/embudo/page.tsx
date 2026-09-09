import Link from "next/link";
import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { ETAPAS, ETIQUETA_ETAPA, ETIQUETA_RAMO, type Ramo, type Etapa } from "@/lib/types/database";
import { moverEtapa } from "@/lib/db/mutaciones";
import { diasDesdeHoy, retraso } from "@/lib/fechas";

export const dynamic = "force-dynamic";

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

  const oportunidades = data ?? [];
  const ids = [...new Set(oportunidades.map((o) => o.contacto_id))];

  const nombres = new Map<string, string>();
  if (ids.length > 0) {
    const { data: cs } = await supabase.from("contactos").select("id, nombre, apellido_paterno").in("id", ids);
    for (const c of cs ?? []) {
      nombres.set(c.id, [c.nombre, c.apellido_paterno].filter(Boolean).join(" "));
    }
  }

  const total = oportunidades.reduce((s, o) => s + Number(o.prima_estimada ?? 0), 0);

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Embudo</h1>
      <p className="mt-1.5 text-tinta-suave">
        {oportunidades.length === 0
          ? "Sin cotizaciones abiertas."
          : `${oportunidades.length} abiertas · $${total.toLocaleString("es-MX")} en prima estimada.`}
      </p>

      {error && (
        <p role="alert" className="mt-6 border-l-2 border-l-atrasado py-2 pl-4 text-atrasado">
          {error.message}
        </p>
      )}

      {oportunidades.length === 0 && !error && (
        <p className="mt-8 border-t border-linea pt-6 text-tinta-suave">
          Las cotizaciones se crean desde la ficha de un contacto, con el botón
          &ldquo;Cotizar algo&rdquo;. <Link href="/contactos" className="underline underline-offset-4">Ir a contactos</Link>.
        </p>
      )}

      {ETAPAS.map((etapa) => {
        const filas = oportunidades.filter((o) => o.etapa === etapa);
        if (filas.length === 0) return null;
        const siguiente = ETAPAS[ETAPAS.indexOf(etapa) + 1];

        return (
          <section key={etapa} className="mt-9">
            <h2 className="mb-1 text-sm font-semibold text-tinta-suave">
              {ETIQUETA_ETAPA[etapa]} <span className="cifras font-normal">({filas.length})</span>
            </h2>
            <ul className="divide-y divide-linea">
              {filas.map((o) => {
                const dias = diasDesdeHoy(o.etapa_cambiada_en);
                const estancada = dias <= -14;
                return (
                  <li key={o.id} className={`border-l-2 py-3 pl-4 ${estancada ? "border-l-proximo" : "border-l-transparent"}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/contactos/${o.contacto_id}`} className="font-medium underline-offset-4 hover:underline">
                        {nombres.get(o.contacto_id) ?? "Sin nombre"}
                      </Link>
                      <span className="cifras shrink-0 text-sm text-tinta-suave">
                        {o.prima_estimada ? `$${Number(o.prima_estimada).toLocaleString("es-MX")}` : ""}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-tinta-suave">
                      {ETIQUETA_RAMO[o.ramo as Ramo]}
                      {o.subtipo ? ` · ${o.subtipo}` : ""}
                      {` · aquí desde ${retraso(dias)}`}
                    </p>

                    <div className="mt-2 flex gap-3">
                      {siguiente && (
                        <form action={moverEtapa}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="etapa" value={siguiente} />
                          <button className="text-sm font-medium underline underline-offset-4">
                            Pasar a {ETIQUETA_ETAPA[siguiente as Etapa].toLowerCase()}
                          </button>
                        </form>
                      )}
                      <Link href={`/embudo/${o.id}/cerrar`} className="text-sm text-tinta-suave underline underline-offset-4">
                        Cerrar
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
