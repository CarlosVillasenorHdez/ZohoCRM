import Link from "next/link";
import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Contactos() {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from("contactos")
    .select("id, nombre, apellido_paterno, telefono_movil, origen")
    .eq("asesor_id", asesor.id)
    .eq("archivado", false)
    .order("creado_en", { ascending: false });

  const contactos = data ?? [];

  return (
    <main>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Contactos</h1>
        <Link href="/contactos/nuevo" className="text-sm font-medium underline underline-offset-4">
          Nuevo
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-6 border-l-2 border-l-atrasado py-2 pl-4 text-atrasado">
          No se pudieron cargar: {error.message}
        </p>
      )}

      {!error && contactos.length === 0 && (
        <p className="mt-8 border-t border-linea pt-6 text-tinta-suave">
          Todavía no hay nadie. <Link href="/contactos/nuevo" className="underline underline-offset-4">Captura tu primer prospecto</Link> — toma menos de un minuto.
        </p>
      )}

      <ul className="mt-6 divide-y divide-linea lg:grid lg:grid-cols-2 lg:gap-x-10 lg:divide-y-0">
        {contactos.map((c) => (
          <li key={c.id}>
            <Link href={`/contactos/${c.id}`} className="flex items-baseline justify-between border-b border-linea py-3">
              <span className="font-medium">
                {[c.nombre, c.apellido_paterno].filter(Boolean).join(" ")}
              </span>
              <span className="cifras text-sm text-tinta-suave">{c.telefono_movil ?? "—"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
