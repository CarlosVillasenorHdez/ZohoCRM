import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { ETIQUETA_ETAPA, type Etapa } from "@/lib/types/database";
import { ramoDef, etiquetaProducto, describirDatos } from "@/lib/catalogo";
import { fechaCorta, diasDesdeHoy, retraso } from "@/lib/fechas";
import { FormularioCotizacion } from "./formulario";

export const dynamic = "force-dynamic";

const DINERO = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default async function FichaCotizacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const { data: o } = await supabase
    .from("oportunidades")
    .select("*, contactos(nombre, apellido_paterno, telefono_movil)")
    .eq("id", id)
    .eq("asesor_id", asesor.id)
    .is("eliminado_en", null)
    .maybeSingle();

  if (!o) notFound();

  const c = (o as unknown as { contactos: { nombre: string; apellido_paterno: string | null } | null }).contactos;
  const nombre = c ? [c.nombre, c.apellido_paterno].filter(Boolean).join(" ") : "Sin nombre";
  const detalle = describirDatos(o.ramo, o.subtipo, o.datos as Record<string, unknown>);
  const dias = diasDesdeHoy(o.etapa_cambiada_en);

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">
        {ramoDef(o.ramo)?.etiqueta}
        {o.subtipo ? ` · ${etiquetaProducto(o.ramo, o.subtipo)}` : ""}
      </h1>
      <p className="mt-1 text-tinta-suave">
        <Link href={`/contactos/${o.contacto_id}`} className="underline underline-offset-4">{nombre}</Link>
        {" · "}
        {o.resultado
          ? o.resultado === "ganada" ? "Ganada" : `Perdida · ${o.motivo_perdida}`
          : `${ETIQUETA_ETAPA[o.etapa as Etapa]} · aquí desde ${retraso(dias)}`}
      </p>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
        <div>
          <h2 className="mb-4 text-sm font-semibold text-tinta-suave">Editar</h2>
          <FormularioCotizacion
            id={id}
            ramo={o.ramo}
            subtipo={o.subtipo}
            etapa={o.etapa}
            datos={(o.datos ?? {}) as Record<string, unknown>}
            primaEstimada={o.prima_estimada}
            primaCotizada={o.prima_cotizada}
            fechaCotizacion={o.fecha_cotizacion}
            formaPago={o.forma_pago}
            vigenciaInicio={o.vigencia_inicio}
            notas={o.notas}
          />
        </div>

        <aside className="mt-10 border-t border-linea pt-7 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="mb-3 text-sm font-semibold text-tinta-suave">Lo capturado</h2>
          {detalle.length === 0 ? (
            <p className="text-sm text-tinta-suave">Sin datos del riesgo todavía.</p>
          ) : (
            <dl className="divide-y divide-linea">
              {detalle.map((d) => (
                <div key={d.etiqueta} className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-sm text-tinta-suave">{d.etiqueta}</dt>
                  <dd className="cifras text-right text-sm">{d.valor}</dd>
                </div>
              ))}
            </dl>
          )}

          <h2 className="mb-2 mt-7 text-sm font-semibold text-tinta-suave">Emisión</h2>
          {o.resultado === "ganada" ? (
            o.poliza_id ? (
              <Link href={`/polizas/${o.poliza_id}`} className="text-sm underline underline-offset-4">
                Ver la póliza emitida
              </Link>
            ) : (
              <>
                <p className="mb-3 text-sm text-tinta-suave">
                  Ganada, pero sin póliza capturada. Hasta que la captures no entra a tu cartera
                  ni genera alarmas de renovación.
                </p>
                <Link
                  href={`/polizas/nueva?oportunidad=${id}`}
                  className="inline-block rounded-md bg-tinta px-4 py-2.5 font-medium text-papel"
                >
                  Capturar la póliza
                </Link>
              </>
            )
          ) : o.resultado === "perdida" ? (
            <p className="text-sm text-tinta-suave">
              No se emitió.
              {o.recontactar_en ? ` Volver a buscarlo el ${fechaCorta(o.recontactar_en)}.` : ""}
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-tinta-suave">
                En trámite. {o.prima_cotizada ? `Cotizada en ${DINERO.format(Number(o.prima_cotizada))}.` : "Sin cotización en firme."}
              </p>
              <Link href={`/embudo/${id}/cerrar`} className="text-sm underline underline-offset-4">
                Cerrar como ganada o perdida
              </Link>
            </>
          )}
        </aside>
      </div>

      <Link href="/embudo" className="mt-10 inline-block text-sm text-tinta-suave underline underline-offset-4">
        Volver al embudo
      </Link>
    </main>
  );
}
