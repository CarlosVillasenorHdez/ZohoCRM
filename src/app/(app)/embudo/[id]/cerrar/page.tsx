import { redirect } from "next/navigation";
import { asesorActual } from "@/lib/supabase/server";
import { FormularioCierre } from "./formulario";
import { Eliminar } from "@/components/eliminar";
import { eliminarOportunidad } from "@/lib/db/mutaciones";

export const dynamic = "force-dynamic";

export default async function Cerrar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Cerrar oportunidad</h1>
      <p className="mt-1.5 text-tinta-suave">
        Si se perdió, el motivo importa: es lo que decide si vuelve a tu panel algún día.
      </p>
      <div className="mt-7 max-w-md">
        <FormularioCierre oportunidadId={id} />
      </div>

      <div className="mt-10 max-w-md border-t border-linea pt-6">
        <p className="mb-3 text-sm text-tinta-suave">
          ¿La capturaste por error? Cerrarla la deja en tus números como perdida; eliminarla la
          borra del todo.
        </p>
        <Eliminar accion={eliminarOportunidad} id={id} que="esta cotización" />
      </div>
    </main>
  );
}
