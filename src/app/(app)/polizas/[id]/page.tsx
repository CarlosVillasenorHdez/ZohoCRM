import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { marcarReciboPagado } from "@/lib/db/mutaciones";
import { ETIQUETA_RAMO, type Ramo } from "@/lib/types/database";
import { fechaCorta, fechaLarga, diasDesdeHoy, retraso } from "@/lib/fechas";
import { CajaRenovar } from "./renovar";

export const dynamic = "force-dynamic";

const DINERO = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const ESTADO_RECIBO = {
  pendiente: { texto: "Pendiente", clase: "border-l-linea" },
  vencido: { texto: "Vencido", clase: "border-l-atrasado" },
  pagado: { texto: "Pagado", clase: "border-l-corriente" },
  en_pausa: { texto: "En pausa", clase: "border-l-proximo" },
  cancelado: { texto: "Cancelado", clase: "border-l-linea" },
} as const;

export default async function DetallePoliza({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const { data: p } = await supabase
    .from("polizas")
    .select("*")
    .eq("id", id)
    .eq("asesor_id", asesor.id)
    .maybeSingle();

  if (!p) notFound();

  const [{ data: recibos }, { data: contacto }, { data: com }] = await Promise.all([
    supabase.from("recibos").select("*").eq("poliza_id", id).order("numero"),
    supabase.from("contactos").select("id, nombre, apellido_paterno").eq("id", p.contacto_id).maybeSingle(),
    supabase.from("v_comisiones").select("comision_estimada, pct_aplicado").eq("poliza_id", id).maybeSingle(),
  ]);

  const nombre = contacto ? [contacto.nombre, contacto.apellido_paterno].filter(Boolean).join(" ") : "Sin nombre";
  const dias = diasDesdeHoy(p.fecha_fin);
  const datos = (p.datos ?? {}) as Record<string, unknown>;
  const campos = Object.entries(datos).filter(([, v]) => v !== null && v !== "" && v !== undefined);

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">{p.numero_poliza}</h1>
      <p className="mt-1 text-tinta-suave">
        <Link href={`/contactos/${p.contacto_id}`} className="underline underline-offset-4">{nombre}</Link>
        {" · "}{ETIQUETA_RAMO[p.ramo as Ramo]}
        {p.producto ? ` · ${p.producto}` : ""}
        {` · año ${p.anio_vigencia}`}
      </p>

      <div className="mt-7 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-10">
        <div>
          <section>
            <h2 className="mb-1 text-sm font-semibold text-tinta-suave">Vigencia</h2>
            <p className="cifras py-2">
              {fechaCorta(p.fecha_inicio)} → {fechaCorta(p.fecha_fin)}
              <span className={dias <= 90 ? (dias < 0 ? " text-atrasado" : " text-proximo") : " text-tinta-suave"}>
                {"  "}renueva {retraso(dias)}
              </span>
            </p>
          </section>

          <section className="mt-7">
            <h2 className="mb-1 text-sm font-semibold text-tinta-suave">
              Recibos ({p.forma_pago})
            </h2>
            {(recibos ?? []).length === 0 ? (
              <p className="py-3 text-tinta-suave">Sin recibos generados.</p>
            ) : (
              <ul className="divide-y divide-linea">
                {(recibos ?? []).map((r) => {
                  const e = ESTADO_RECIBO[r.estado as keyof typeof ESTADO_RECIBO] ?? ESTADO_RECIBO.pendiente;
                  return (
                    <li key={r.id} className={`border-l-2 ${e.clase} py-2.5 pl-4`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="cifras">
                          #{r.numero} · {fechaCorta(r.fecha_vencimiento)}
                        </span>
                        <span className="cifras shrink-0 text-sm text-tinta-suave">
                          {r.monto ? DINERO.format(Number(r.monto)) : "—"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline gap-4">
                        <span className="text-sm text-tinta-suave">{e.texto}</span>
                        {r.estado !== "pagado" && (
                          <form action={marcarReciboPagado}>
                            <input type="hidden" name="id" value={r.id} />
                            <button className="text-sm font-medium text-corriente underline underline-offset-4">
                              Marcar pagado
                            </button>
                          </form>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {campos.length > 0 && (
            <section className="mt-7">
              <h2 className="mb-1 text-sm font-semibold text-tinta-suave">Datos del {ETIQUETA_RAMO[p.ramo as Ramo].toLowerCase()}</h2>
              <dl className="divide-y divide-linea">
                {campos.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 py-2">
                    <dt className="text-sm text-tinta-suave">{k.replace(/_/g, " ")}</dt>
                    <dd className="cifras text-sm">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <aside className="mt-10 border-t border-linea pt-7 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="mb-3 text-sm font-semibold text-tinta-suave">Dinero</h2>
          <dl className="mb-8 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-suave">Prima anual</dt>
              <dd className="cifras">{p.prima_total ? DINERO.format(Number(p.prima_total)) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-suave">Comisión</dt>
              <dd className="cifras">
                {com?.comision_estimada ? DINERO.format(Number(com.comision_estimada)) : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-suave">Tasa aplicada</dt>
              <dd className="cifras">{com?.pct_aplicado ? `${com.pct_aplicado}%` : "—"}</dd>
            </div>
          </dl>

          <CajaRenovar
            polizaId={p.id}
            numeroActual={p.numero_poliza}
            continua={p.tipo_renovacion === "continua"}
            finActual={p.fecha_fin}
            primaActual={p.prima_total === null ? null : Number(p.prima_total)}
          />
        </aside>
      </div>

      <p className="mt-10 text-sm text-tinta-suave">
        Capturada para el periodo que inicia el {fechaLarga(p.fecha_inicio)}.
      </p>
    </main>
  );
}
