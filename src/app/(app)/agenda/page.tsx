import Link from "next/link";
import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { completarActividad } from "@/lib/db/mutaciones";
import { Calendario } from "@/components/calendario";
import { FormularioRapido } from "./formulario";
import { Seguimiento } from "@/components/seguimiento";
import { fechaLarga, hora, hoyISO, mesActualISO, diasDesdeHoy } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string }>;
}) {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const sp = await searchParams;
  const mes = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes! : mesActualISO();
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(sp.dia ?? "")
    ? sp.dia!
    : mes === mesActualISO()
      ? hoyISO()
      : `${mes}-01`;

  const [{ data: acts }, { data: cs }] = await Promise.all([
    supabase
      .from("actividades")
      .select("id, titulo, tipo, inicia_en, lugar, contacto_id, estado")
      .eq("asesor_id", asesor.id)
      .eq("estado", "pendiente")
      .gte("inicia_en", `${mes}-01T00:00:00`)
      .lt("inicia_en", `${mes}-31T23:59:59.999`)
      .order("inicia_en", { ascending: true }),
    supabase.from("contactos").select("id, nombre, apellido_paterno").eq("asesor_id", asesor.id).order("nombre"),
  ]);

  const actividades = acts ?? [];
  const contactos = (cs ?? []).map((c) => ({
    id: c.id,
    nombre: [c.nombre, c.apellido_paterno].filter(Boolean).join(" "),
  }));

  const porDia = new Map<string, number>();
  for (const a of actividades) {
    const d = a.inicia_en.slice(0, 10);
    porDia.set(d, (porDia.get(d) ?? 0) + 1);
  }

  const delDia = actividades.filter((a) => a.inicia_en.slice(0, 10) === dia);
  const atrasado = diasDesdeHoy(dia) < 0;

  return (
    <main>
      <h1 className="mb-7 text-2xl font-semibold tracking-tight">Agenda</h1>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        <div>
          <Calendario mes={mes} porDia={porDia} diaActivo={dia} />

          <section className="mt-8">
            <h2 className="mb-1 text-sm font-semibold text-tinta-suave first-letter:uppercase">
              {fechaLarga(dia)}
              {atrasado && delDia.length > 0 ? " · atrasado" : ""}
            </h2>

            {delDia.length === 0 ? (
              <p className="py-3 text-tinta-suave">Nada agendado este día.</p>
            ) : (
              <ul className="divide-y divide-linea">
                {delDia.map((a) => (
                  <li
                    key={a.id}
                    className={`border-l-2 py-3 pl-4 ${atrasado ? "border-l-atrasado" : "border-l-tinta"}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{a.titulo}</span>
                      <span className="cifras shrink-0 text-sm text-tinta-suave">{hora(a.inicia_en)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-tinta-suave">
                      {a.tipo}
                      {a.lugar ? ` · ${a.lugar}` : ""}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3">
                      <Seguimiento actividadId={a.id} nombre={null} />
                      <form action={completarActividad}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="text-sm text-tinta-suave underline underline-offset-4">
                          Solo marcar hecho
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
            )}
          </section>
        </div>

        <aside className="mt-11 border-t border-linea pt-7 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="mb-5 font-semibold">Agendar algo</h2>
          <FormularioRapido contactos={contactos} diaSugerido={dia} />
        </aside>
      </div>
    </main>
  );
}
