import Link from "next/link";
import { redirect } from "next/navigation";
import { asesorActual } from "@/lib/supabase/server";
import { alertasDelDia, enlaceWhatsApp, type AlertaConNombre } from "@/lib/db/panel";
import { completarActividad, marcarReciboPagado } from "@/lib/db/mutaciones";
import { fechaLarga, fechaCorta, hora, diasDesdeHoy, retraso, hoyISO } from "@/lib/fechas";

export const dynamic = "force-dynamic";

const TITULO_GRUPO = { atrasado: "Atrasado", hoy: "Hoy", proximo: "Esta semana" } as const;
const REGLA = { atrasado: "border-l-atrasado", hoy: "border-l-tinta", proximo: "border-l-proximo" } as const;
const QUE_ES = {
  actividad: "Cita",
  recibo: "Recibo por cobrar",
  renovacion: "Renovación",
  recontacto: "Recontactar",
} as const;

function mensajeSugerido(a: AlertaConNombre): string {
  const nombre = a.nombre?.split(" ")[0] ?? "";
  switch (a.tipo_alerta) {
    case "recibo":
      return `Hola ${nombre}, te escribo por el recibo de tu póliza. ¿Te ayudo con el pago?`;
    case "renovacion":
      return `Hola ${nombre}, tu póliza está por renovar. ¿Lo revisamos esta semana?`;
    case "recontacto":
      return `Hola ${nombre}, quedamos en buscarte por estas fechas. ¿Tienes unos minutos?`;
    default:
      return `Hola ${nombre}, te confirmo nuestra cita.`;
  }
}

function Renglon({ a }: { a: AlertaConNombre }) {
  const dias = diasDesdeHoy(a.fecha);
  const wa = enlaceWhatsApp(a.telefono, mensajeSugerido(a));
  const esCita = a.tipo_alerta === "actividad";

  return (
    <li className={`border-l-2 ${REGLA[a.grupo]} py-3 pl-4`}>
      <div className="flex items-baseline justify-between gap-3">
        {a.contacto_id ? (
          <Link href={`/contactos/${a.contacto_id}`} className="font-medium leading-snug underline-offset-4 hover:underline">
            {a.nombre ?? a.titulo}
          </Link>
        ) : (
          <p className="font-medium leading-snug">{a.titulo}</p>
        )}
        <span className="cifras shrink-0 text-sm text-tinta-suave">
          {esCita ? hora(a.fecha) : fechaCorta(a.fecha)}
        </span>
      </div>

      <p className="mt-0.5 text-sm text-tinta-suave">
        {QUE_ES[a.tipo_alerta]}
        {a.nombre ? ` · ${a.titulo}` : ""}
        {a.grupo === "atrasado" ? ` · ${retraso(dias)}` : ""}
      </p>

      <div className="mt-2 flex flex-wrap gap-4">
        {a.tipo_alerta === "actividad" && (
          <form action={completarActividad}>
            <input type="hidden" name="id" value={a.referencia_id} />
            <button className="text-sm font-medium text-corriente underline underline-offset-4">
              Marcar hecho
            </button>
          </form>
        )}
        {a.tipo_alerta === "recibo" && (
          <form action={marcarReciboPagado}>
            <input type="hidden" name="id" value={a.referencia_id} />
            <button className="text-sm font-medium text-corriente underline underline-offset-4">
              Marcar pagado
            </button>
          </form>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="text-sm text-tinta-suave underline underline-offset-4">
            WhatsApp
          </a>
        )}
      </div>
    </li>
  );
}

export default async function Panel() {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");

  const { alertas, error } = await alertasDelDia(asesor.id);

  const grupos = (["atrasado", "hoy", "proximo"] as const)
    .map((g) => ({ grupo: g, filas: alertas.filter((a) => a.grupo === g) }))
    .filter((s) => s.filas.length > 0);

  const atrasados = alertas.filter((a) => a.grupo === "atrasado").length;
  const deHoy = alertas.filter((a) => a.grupo === "hoy").length;

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight first-letter:uppercase">
        {fechaLarga(hoyISO())}
      </h1>
      <p className="mt-1.5 text-tinta-suave">
        {alertas.length === 0
          ? "Nada pendiente por ahora."
          : `${deHoy} para hoy${atrasados > 0 ? ` y ${atrasados} atrasado${atrasados > 1 ? "s" : ""}` : ""}.`}
      </p>

      {error && (
        <p role="alert" className="mt-6 border-l-2 border-l-atrasado py-2 pl-4 text-atrasado">
          {error}
        </p>
      )}

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
        <div>
          {!error && alertas.length === 0 && (
            <div className="border-t border-linea pt-7">
              <p className="max-w-prose text-tinta-suave">
                Aquí van a caer tus citas del día, los recibos por cobrar, las pólizas
                que estén por renovar y los prospectos que quedaste en volver a buscar.
                Empieza capturando a alguien.
              </p>
              <Link
                href="/contactos/nuevo"
                className="mt-5 inline-block rounded-md bg-tinta px-4 py-2.5 font-medium text-papel"
              >
                Capturar un prospecto
              </Link>
            </div>
          )}

          {grupos.map(({ grupo, filas }) => (
            <section key={grupo} className="mb-9">
              <h2 className="mb-1 text-sm font-semibold text-tinta-suave">{TITULO_GRUPO[grupo]}</h2>
              <ul className="divide-y divide-linea">
                {filas.map((a) => (
                  <Renglon key={`${a.tipo_alerta}-${a.referencia_id}`} a={a} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="mt-10 border-t border-linea pt-7 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="mb-4 text-sm font-semibold text-tinta-suave">Atajos</h2>
          <ul className="flex flex-col gap-2.5">
            <li>
              <Link href="/contactos/nuevo" className="text-sm underline underline-offset-4">
                Capturar prospecto
              </Link>
            </li>
            <li>
              <Link href="/agenda" className="text-sm underline underline-offset-4">
                Agendar seguimiento
              </Link>
            </li>
            <li>
              <Link href="/embudo" className="text-sm underline underline-offset-4">
                Ver el embudo
              </Link>
            </li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
