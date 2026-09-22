import Link from "next/link";
import { rejillaMes, diaDelMes, hoyISO, nombreMes } from "@/lib/fechas";
import { NavMes } from "@/components/nav-mes";
import { colorTipo, etiquetaTipo } from "@/lib/tipos-actividad";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

export type EventoCal = {
  id: string;
  dia: string;      // 'YYYY-MM-DD'
  tipo: string;
  titulo: string;
  hora: string;     // 'HH:MM'
  pendiente: boolean;
};

export function Calendario({
  mes, eventos, diaActivo,
}: {
  mes: string;
  eventos: EventoCal[];
  diaActivo: string;
}) {
  const celdas = rejillaMes(mes);
  const hoy = hoyISO();

  const porDia = new Map<string, EventoCal[]>();
  for (const e of eventos) porDia.set(e.dia, [...(porDia.get(e.dia) ?? []), e]);

  // Leyenda solo con los tipos que de verdad aparecen este mes.
  const tiposDelMes = [...new Set(eventos.map((e) => e.tipo))];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold first-letter:uppercase">{nombreMes(mes)}</h2>
        <NavMes mes={mes} />
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-linea bg-linea">
        {DIAS.map((d, i) => (
          <div key={i} className="bg-papel py-1.5 text-center text-xs font-medium text-tinta-suave">{d}</div>
        ))}

        {celdas.map(({ iso, delMes }) => {
          const delDia = (porDia.get(iso) ?? []).sort((a, b) => a.hora.localeCompare(b.hora));
          const pendientes = delDia.filter((e) => e.pendiente);
          const atrasado = iso < hoy && pendientes.length > 0;
          const esHoy = iso === hoy;
          const activo = iso === diaActivo;

          // En el móvil no cabe texto: un punto por tipo distinto.
          const tiposUnicos = [...new Set(delDia.map((e) => e.tipo))].slice(0, 4);

          return (
            <Link
              key={iso}
              href={`/agenda?mes=${mes}&dia=${iso}`}
              aria-current={activo ? "date" : undefined}
              aria-label={`${diaDelMes(iso)}${delDia.length ? `, ${delDia.length} actividades` : ", sin actividades"}`}
              className={`flex min-h-[3.4rem] flex-col bg-papel px-1 py-1 lg:min-h-[6.25rem] lg:px-1.5 ${
                delMes ? "" : "opacity-40"
              } ${activo ? "bg-papel-hondo ring-1 ring-inset ring-tinta" : "hover:bg-papel-hondo"}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`cifras text-sm ${
                    esHoy
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-tinta text-papel"
                      : atrasado
                        ? "font-semibold text-atrasado"
                        : ""
                  }`}
                >
                  {diaDelMes(iso)}
                </span>
                {delDia.length > 0 && (
                  <span className="cifras hidden text-[10px] text-tinta-suave lg:inline">
                    {delDia.length}
                  </span>
                )}
              </div>

              {/* Móvil: puntos por tipo */}
              <div className="mt-1 flex flex-wrap gap-0.5 lg:hidden">
                {tiposUnicos.map((t) => (
                  <span key={t} className="h-1.5 w-1.5 rounded-full" style={{ background: colorTipo(t) }} />
                ))}
              </div>

              {/* Escritorio: hasta dos eventos con hora y título */}
              <ul className="mt-1 hidden flex-col gap-0.5 lg:flex">
                {delDia.slice(0, 2).map((e) => (
                  <li
                    key={e.id}
                    className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                      e.pendiente ? "" : "line-through opacity-50"
                    }`}
                    style={{ background: `${colorTipo(e.tipo)}14`, color: colorTipo(e.tipo) }}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: colorTipo(e.tipo) }} />
                    <span className="cifras shrink-0">{e.hora}</span>
                    <span className="truncate">{e.titulo}</span>
                  </li>
                ))}
                {delDia.length > 2 && (
                  <li className="px-1 text-[10px] text-tinta-suave">+{delDia.length - 2} más</li>
                )}
              </ul>
            </Link>
          );
        })}
      </div>

      {tiposDelMes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {tiposDelMes.map((t) => (
            <li key={t} className="flex items-center gap-1.5 text-xs text-tinta-suave">
              <span className="h-2 w-2 rounded-full" style={{ background: colorTipo(t) }} />
              {etiquetaTipo(t)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
