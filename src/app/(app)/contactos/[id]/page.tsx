import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { ETIQUETA_RAMO, ETIQUETA_ETAPA, type Ramo, type Etapa } from "@/lib/types/database";
import { etiquetaProducto } from "@/lib/catalogo";
import { enlaceWhatsApp } from "@/lib/db/panel";
import { fechaCorta, hora } from "@/lib/fechas";
import { PanelAcciones } from "./acciones";
import { Eliminar } from "@/components/eliminar";
import { eliminarContacto } from "@/lib/db/mutaciones";

export const dynamic = "force-dynamic";

export default async function DetalleContacto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const { data: contacto } = await supabase
    .from("contactos")
    .select("*")
    .eq("id", id)
    .eq("asesor_id", asesor.id)
    .is("eliminado_en", null)
    .maybeSingle();

  if (!contacto) notFound();

  const [{ data: oportunidades }, { data: actividades }] = await Promise.all([
    supabase.from("oportunidades").select("*").eq("contacto_id", id).is("eliminado_en", null).order("creado_en", { ascending: false }),
    supabase.from("actividades").select("*").eq("contacto_id", id).is("eliminado_en", null).order("inicia_en", { ascending: false }).limit(10),
  ]);

  const nombre = [contacto.nombre, contacto.apellido_paterno].filter(Boolean).join(" ");
  const wa = enlaceWhatsApp(contacto.telefono_movil, `Hola ${contacto.nombre},`);

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">{nombre}</h1>
      <p className="cifras mt-1 text-tinta-suave">
        {[contacto.telefono_movil, contacto.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
      </p>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium text-corriente underline underline-offset-4">
          Escribirle por WhatsApp
        </a>
      )}

      <section className="mt-9">
        <h2 className="mb-1 text-sm font-semibold text-tinta-suave">Oportunidades</h2>
        {(oportunidades ?? []).length === 0 ? (
          <p className="py-3 text-tinta-suave">Ninguna todavía.</p>
        ) : (
          <ul className="divide-y divide-linea">
            {(oportunidades ?? []).map((o) => (
              <li key={o.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={`/embudo/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                    {ETIQUETA_RAMO[o.ramo as Ramo]}
                    {o.subtipo ? ` · ${etiquetaProducto(o.ramo, o.subtipo)}` : ""}
                  </Link>
                  <span className="cifras shrink-0 text-sm text-tinta-suave">
                    {o.prima_estimada ? `$${Number(o.prima_estimada).toLocaleString("es-MX")}` : ""}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-tinta-suave">
                  {o.resultado ? (o.resultado === "ganada" ? "Ganada" : `Perdida · ${o.motivo_perdida}`) : ETIQUETA_ETAPA[o.etapa as Etapa]}
                  {o.recontactar_en ? ` · recontactar ${fechaCorta(o.recontactar_en)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-9">
        <h2 className="mb-1 text-sm font-semibold text-tinta-suave">Actividad</h2>
        {(actividades ?? []).length === 0 ? (
          <p className="py-3 text-tinta-suave">Sin registros.</p>
        ) : (
          <ul className="divide-y divide-linea">
            {(actividades ?? []).map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-3 py-3">
                <span>{a.titulo}</span>
                <span className="cifras shrink-0 text-sm text-tinta-suave">
                  {fechaCorta(a.inicia_en)} {hora(a.inicia_en)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 border-t border-linea pt-7">
        <PanelAcciones contactoId={id} nombre={contacto.nombre} />
      </div>

      <div className="mt-10 border-t border-linea pt-6">
        <Eliminar
          accion={eliminarContacto}
          id={id}
          que={`a ${nombre}`}
          advertencia="Se va con sus cotizaciones, su agenda y su historial. No se puede si tiene pólizas vigentes."
        />
      </div>

      <Link href="/contactos" className="mt-8 inline-block text-sm text-tinta-suave underline underline-offset-4">
        Volver a contactos
      </Link>
    </main>
  );
}
