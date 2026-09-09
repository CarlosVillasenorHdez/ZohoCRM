import Link from "next/link";
import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { completarActividad } from "@/lib/db/mutaciones";
import { fechaLarga, hora, diasDesdeHoy } from "@/lib/fechas";
import { FormularioRapido } from "./formulario";

export const dynamic = "force-dynamic";

export default async function Agenda() {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const [{ data: acts }, { data: cs }] = await Promise.all([
    supabase
      .from("actividades")
      .select("id, titulo, tipo, inicia_en, lugar, contacto_id")
      .eq("asesor_id", asesor.id)
      .eq("estado", "pendiente")
      .order("inicia_en", { ascending: true })
      .limit(60),
    supabase.from("contactos").select("id, nombre, apellido_paterno").eq("asesor_id", asesor.id).order("nombre"),
  ]);

  const actividades = acts ?? [];
  const contactos = (cs ?? []).map((c) => ({
    id: c.id,
    nombre: [c.nombre, c.apellido_paterno].filter(Boolean).join(" "),
  }));

  const porDia = new Map<string, typeof actividades>();
  for (const a of actividades) {
    const dia = a.inicia_en.slice(0, 10);
    porDia.set(dia, [...(porDia.get(dia) ?? []), a]);
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
      <p className="mt-1.5 text-tinta-suave">
        {actividades.length === 0 ? "Nada agendado." : `${actividades.length} pendientes.`}
      </p>

      {[...porDia.entries()].map(([dia, filas]) => {
        const d = diasDesdeHoy(dia);
        return (
          <section key={dia} className="mt-9">
            <h2 className="mb-1 text-sm font-semibold text-tinta-suave first-letter:uppercase">
              {fechaLarga(dia)}
              {d < 0 ? " · atrasado" : ""}
            </h2>
            <ul className="divide-y divide-linea">
              {filas.map((a) => (
                <li key={a.id} className={`border-l-2 py-3 pl-4 ${d < 0 ? "border-l-atrasado" : "border-l-tinta"}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{a.titulo}</span>
                    <span className="cifras shrink-0 text-sm text-tinta-suave">{hora(a.inicia_en)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-tinta-suave">
                    {a.tipo}
                    {a.lugar ? ` · ${a.lugar}` : ""}
                  </p>
                  <div className="mt-2 flex gap-4">
                    <form action={completarActividad}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="text-sm font-medium text-corriente underline underline-offset-4">
                        Marcar hecho
                      </button>
                    </form>
                    {a.contacto_id && (
                      <Link href={`/contactos/${a.contacto_id}`} className="text-sm text-tinta-suave underline underline-offset-4">
                        Ver contacto
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <div className="mt-11 border-t border-linea pt-7">
        <h2 className="mb-5 font-semibold">Agendar algo</h2>
        <FormularioRapido contactos={contactos} />
      </div>
    </main>
  );
}
