import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { FormularioPoliza } from "./formulario";

export const dynamic = "force-dynamic";

export default async function NuevaPoliza({
  searchParams,
}: {
  searchParams: Promise<{ contacto?: string }>;
}) {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();
  const sp = await searchParams;

  const [{ data: cs }, { data: asegs }] = await Promise.all([
    supabase.from("contactos").select("id, nombre, apellido_paterno").eq("asesor_id", asesor.id).order("nombre"),
    supabase.from("aseguradoras").select("id, nombre").eq("activa", true).order("orden"),
  ]);

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
        Los recibos se generan solos según la forma de pago que elijas.
      </p>
      <div className="mt-7 max-w-xl">
        <FormularioPoliza
          contactos={contactos}
          aseguradoras={asegs ?? []}
          contactoPreseleccionado={sp.contacto ?? null}
        />
      </div>
    </main>
  );
}
