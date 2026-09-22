import Link from "next/link";
import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { ETIQUETA_RAMO, type Ramo } from "@/lib/types/database";
import { fechaCorta, diasDesdeHoy, retraso } from "@/lib/fechas";

export const dynamic = "force-dynamic";

const DINERO = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 0,
});

export default async function Polizas() {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const [{ data: pols, error }, { data: coms }] = await Promise.all([
    supabase
      .from("polizas")
      .select("id, numero_poliza, ramo, contacto_id, fecha_fin, prima_total, estado, anio_vigencia, contactos(nombre, apellido_paterno)")
      .eq("asesor_id", asesor.id)
      .eq("estado", "vigente")
      .order("fecha_fin", { ascending: true }),
    supabase.from("v_comisiones").select("poliza_id, comision_estimada, pct_aplicado").eq("asesor_id", asesor.id),
  ]);

  const polizas = pols ?? [];
  const comision = new Map((coms ?? []).map((c) => [c.poliza_id, Number(c.comision_estimada ?? 0)]));
  const totalComision = [...comision.values()].reduce((s, v) => s + v, 0);
  const totalPrima = polizas.reduce((s, p) => s + Number(p.prima_total ?? 0), 0);

  // Nombre por join en la misma consulta, no en una segunda vuelta.
  const nombres = new Map<string, string>();
  for (const p of polizas) {
    const c = (p as unknown as { contactos: { nombre: string; apellido_paterno: string | null } | null }).contactos;
    if (c) nombres.set(p.contacto_id, [c.nombre, c.apellido_paterno].filter(Boolean).join(" "));
  }

  const porVencer = polizas.filter((p) => diasDesdeHoy(p.fecha_fin) <= 90);

  return (
    <main>
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cartera</h1>
          <p className="mt-1 text-tinta-suave">
            {polizas.length === 0
              ? "Sin pólizas vigentes."
              : `${polizas.length} vigentes · ${DINERO.format(totalPrima)} en prima` +
                (totalComision > 0 ? ` · ${DINERO.format(totalComision)} de comisión anual` : "")}
          </p>
        </div>
        <div className="flex gap-5">
          <Link href="/polizas/comisiones" className="text-sm text-tinta-suave underline underline-offset-4">
            Comisiones
          </Link>
          <Link href="/polizas/nueva" className="text-sm font-medium underline underline-offset-4">
            Nueva póliza
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className="border-l-2 border-l-atrasado py-2 pl-4 text-atrasado">
          {error.message}
        </p>
      )}

      {totalComision === 0 && polizas.length > 0 && (
        <p className="mb-7 border-l-2 border-l-proximo py-2 pl-4 text-sm">
          Tus tasas de comisión están en cero, así que no se puede calcular cuánto vas a cobrar.{" "}
          <Link href="/polizas/comisiones" className="underline underline-offset-4">Cárgalas aquí</Link>.
        </p>
      )}

      {polizas.length === 0 && !error && (
        <div className="border-t border-linea pt-7">
          <p className="max-w-prose text-tinta-suave">
            Aquí vive tu cartera. Cada póliza genera sola sus recibos según la forma de pago, y
            aparece en tu panel cuando se acerca la renovación o se vence un recibo.
          </p>
          <Link href="/polizas/nueva" className="mt-5 inline-block rounded-md bg-tinta px-4 py-2.5 font-medium text-papel">
            Capturar una póliza
          </Link>
        </div>
      )}

      {porVencer.length > 0 && (
        <section className="mb-9">
          <h2 className="mb-1 text-sm font-semibold text-tinta-suave">Renuevan pronto</h2>
          <ul className="divide-y divide-linea">
            {porVencer.map((p) => {
              const dias = diasDesdeHoy(p.fecha_fin);
              return (
                <li key={p.id} className={`border-l-2 py-3 pl-4 ${dias < 0 ? "border-l-atrasado" : "border-l-proximo"}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/polizas/${p.id}`} className="font-medium underline-offset-4 hover:underline">
                      {nombres.get(p.contacto_id) ?? "Sin nombre"}
                    </Link>
                    <span className="cifras shrink-0 text-sm text-tinta-suave">{fechaCorta(p.fecha_fin)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-tinta-suave">
                    {ETIQUETA_RAMO[p.ramo as Ramo]} · {p.numero_poliza} · vence {retraso(dias)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {polizas.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-tinta-suave">Todas las vigentes</h2>
          <ul className="divide-y divide-linea lg:grid lg:grid-cols-2 lg:gap-x-10 lg:divide-y-0">
            {polizas.map((p) => (
              <li key={p.id} className="border-b border-linea py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={`/polizas/${p.id}`} className="font-medium underline-offset-4 hover:underline">
                    {nombres.get(p.contacto_id) ?? "Sin nombre"}
                  </Link>
                  <span className="cifras shrink-0 text-sm text-tinta-suave">
                    {p.prima_total ? DINERO.format(Number(p.prima_total)) : "—"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-tinta-suave">
                  {ETIQUETA_RAMO[p.ramo as Ramo]} · {p.numero_poliza} · año {p.anio_vigencia}
                  {comision.get(p.id) ? ` · comisión ${DINERO.format(comision.get(p.id) ?? 0)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
