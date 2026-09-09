import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { ETIQUETA_RAMO, ETIQUETA_ETAPA, type Ramo, type Etapa } from "@/lib/types/database";
import { enlaceWhatsApp } from "@/lib/db/panel";
import { fechaCorta, hora } from "@/lib/fechas";
import { PanelAcciones } from "./acciones";

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
    .maybeSingle();

  if (!contacto) notFound();

  const [{ data: oportunidades }, { data: actividades }] = await Promise.all([
    supabase.from("oportunidades").select("*").eq("contacto_id", id).order("creado_en", { ascending: false }),
    supabase.from("actividades").select("*").eq("contacto_id", id).order("inicia_en", { ascending: false }).limit(10),
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
                  <span className="font-medium">{ETIQUETA_RAMO[o.ramo as Ramo]}{o.subtipo ? ` · ${o.subtipo}` : ""}</span>
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

      <Link href="/contactos" className="mt-10 inline-block text-sm text-tinta-suave underline underline-offset-4">
        Volver a contactos
      </Link>
    </main>
  );
}
