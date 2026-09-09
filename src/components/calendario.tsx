import Link from "next/link";
import { rejillaMes, diaDelMes, hoyISO, nombreMes, mesVecino } from "@/lib/fechas";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

export function Calendario({
  mes,
  porDia,
  diaActivo,
}: {
  mes: string;
  porDia: Map<string, number>;
  diaActivo: string;
}) {
  const celdas = rejillaMes(mes);
  const hoy = hoyISO();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold first-letter:uppercase">{nombreMes(mes)}</h2>
        <div className="flex gap-1">
          <Link
            href={`/agenda?mes=${mesVecino(mes, -1)}`}
            aria-label="Mes anterior"
            className="rounded border border-linea px-2.5 py-1 text-sm text-tinta-suave hover:text-tinta"
          >
            ‹
          </Link>
          <Link
            href="/agenda"
            className="rounded border border-linea px-2.5 py-1 text-sm text-tinta-suave hover:text-tinta"
          >
            Hoy
          </Link>
          <Link
            href={`/agenda?mes=${mesVecino(mes, 1)}`}
            aria-label="Mes siguiente"
            className="rounded border border-linea px-2.5 py-1 text-sm text-tinta-suave hover:text-tinta"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px border border-linea bg-linea">
        {DIAS.map((d, i) => (
          <div key={i} className="bg-papel py-1.5 text-center text-xs text-tinta-suave">
            {d}
          </div>
        ))}

        {celdas.map(({ iso, delMes }) => {
          const n = porDia.get(iso) ?? 0;
          const esHoy = iso === hoy;
          const activo = iso === diaActivo;
          return (
            <Link
              key={iso}
              href={`/agenda?mes=${mes}&dia=${iso}`}
              aria-current={activo ? "date" : undefined}
              className={`relative flex min-h-[3.25rem] flex-col items-center justify-center bg-papel py-1 lg:min-h-[4.5rem] ${
                delMes ? "" : "opacity-35"
              } ${activo ? "bg-papel-hondo ring-1 ring-inset ring-tinta" : "hover:bg-papel-hondo"}`}
            >
              <span
                className={`cifras text-sm ${esHoy ? "flex h-6 w-6 items-center justify-center rounded-full bg-tinta text-papel" : ""}`}
              >
                {diaDelMes(iso)}
              </span>
              {n > 0 && (
                <span
                  aria-label={`${n} pendientes`}
                  className="mt-1 h-1.5 w-1.5 rounded-full bg-corriente"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
