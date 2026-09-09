import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { FormularioContacto } from "./formulario";

export const dynamic = "force-dynamic";

export default async function NuevoContacto() {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const { data } = await supabase
    .from("contactos")
    .select("id, nombre, apellido_paterno")
    .eq("asesor_id", asesor.id)
    .order("nombre");

  const posibles = (data ?? []).map((c) => ({
    id: c.id,
    nombre: [c.nombre, c.apellido_paterno].filter(Boolean).join(" "),
  }));

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Nuevo prospecto</h1>
      <p className="mt-1.5 text-tinta-suave">
        Solo el nombre es obligatorio. Lo demás se puede llenar después.
      </p>
      <div className="mt-7">
        <FormularioContacto posiblesReferentes={posibles} />
      </div>
    </main>
  );
}
