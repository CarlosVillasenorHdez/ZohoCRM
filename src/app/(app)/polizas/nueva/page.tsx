import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { FormularioPoliza, type Origen } from "./formulario";

export const dynamic = "force-dynamic";

export default async function NuevaPoliza({
  searchParams,
}: {
  searchParams: Promise<{ contacto?: string; oportunidad?: string }>;
}) {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();
  const sp = await searchParams;

  const [{ data: cs }, { data: asegs }] = await Promise.all([
    supabase.from("contactos").select("id, nombre, apellido_paterno").eq("asesor_id", asesor.id).is("eliminado_en", null).order("nombre"),
    supabase.from("aseguradoras").select("id, nombre").eq("activa", true).order("orden"),
  ]);

  // Si viene de una cotización ganada, se arrastran sus datos para no
  // teclear dos veces lo que ya se capturó al cotizar.
  let origen: Origen | null = null;
  let contactoDeOrigen: string | null = null;
  if (sp.oportunidad) {
    const { data: o } = await supabase
      .from("oportunidades")
      .select("id, contacto_id, ramo, subtipo, datos, prima_cotizada, prima_estimada, forma_pago, vigencia_inicio")
      .eq("id", sp.oportunidad)
      .eq("asesor_id", asesor.id)
      .is("eliminado_en", null)
      .maybeSingle();

    if (o) {
      contactoDeOrigen = o.contacto_id;
      origen = {
        oportunidadId: o.id,
        ramo: o.ramo,
        subtipo: o.subtipo,
        datos: (o.datos ?? {}) as Record<string, unknown>,
        prima: o.prima_cotizada === null ? (o.prima_estimada === null ? null : Number(o.prima_estimada)) : Number(o.prima_cotizada),
        formaPago: o.forma_pago,
        vigenciaInicio: o.vigencia_inicio,
      };
    }
  }

  const contactos = (cs ?? []).map((c) => ({
    id: c.id,
    nombre: [c.nombre, c.apellido_paterno].filter(Boolean).join(" "),
  }));

  if (contactos.length === 0) {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva póliza</h1>
        <p className="mt-4 max-w-prose text-tinta-suave">
          Toda póliza pertenece a una persona, y todavía no hay ninguna capturada.
          Empieza por el contacto.
        </p>
        <a href="/contactos/nuevo" className="mt-5 inline-block rounded-md bg-tinta px-4 py-2.5 font-medium text-papel">
          Capturar un contacto
        </a>
      </main>
    );
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Nueva póliza</h1>
      <p className="mt-1.5 max-w-prose text-tinta-suave">
        {origen
          ? "Viene de una cotización ganada: los datos del riesgo ya están puestos, solo confirma el número de póliza y la vigencia."
          : "Los recibos se generan solos según la forma de pago que elijas."}
      </p>
      <div className="mt-7 max-w-xl">
        <FormularioPoliza
          contactos={contactos}
          aseguradoras={asegs ?? []}
          contactoPreseleccionado={contactoDeOrigen ?? sp.contacto ?? null}
          origen={origen}
        />
      </div>
    </main>
  );
}
