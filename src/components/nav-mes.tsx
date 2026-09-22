"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { mesVecino } from "@/lib/fechas";

/**
 * Navegación entre meses sin perder el calendario de vista.
 *
 * Con enlaces normales, cambiar de mes reemplazaba la pantalla por el
 * esqueleto de carga y se sentía como abrir otra página. Con una transición,
 * el calendario se queda puesto y solo se atenúa mientras llegan los datos
 * del mes nuevo, que es como se comporta un calendario de escritorio.
 */
export function NavMes({ mes }: { mes: string }) {
  const router = useRouter();
  const [cargando, empezar] = useTransition();

  const ir = (destino: string) => {
    empezar(() => router.push(destino, { scroll: false }));
  };

  const boton = "rounded border border-linea px-2.5 py-1 text-sm text-tinta-suave transition-colors hover:text-tinta disabled:opacity-40";

  return (
    <div className="flex items-center gap-1" aria-busy={cargando}>
      {cargando && (
        <span aria-hidden className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-tinta-suave" />
      )}
      <button type="button" aria-label="Mes anterior" disabled={cargando}
        onClick={() => ir(`/agenda?mes=${mesVecino(mes, -1)}`)} className={boton}>‹</button>
      <button type="button" disabled={cargando}
        onClick={() => ir("/agenda")} className={boton}>Hoy</button>
      <button type="button" aria-label="Mes siguiente" disabled={cargando}
        onClick={() => ir(`/agenda?mes=${mesVecino(mes, 1)}`)} className={boton}>›</button>
    </div>
  );
}
