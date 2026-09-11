"use client";

import { guardarTasas } from "@/lib/db/mutaciones";
import { Formulario } from "@/components/ui";
import { ETIQUETA_RAMO, type Ramo } from "@/lib/types/database";

const RAMOS: Ramo[] = ["ahorro", "vida", "gmm", "autos", "danos"];

type Tasa = { primer: number; subs: number };

export function FormularioTasas({ tasas }: { tasas: Record<string, Tasa | undefined> }) {
  return (
    <Formulario accion={guardarTasas} boton="Guardar tasas">
      <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-baseline gap-x-3 gap-y-2">
        <span />
        <span className="text-xs text-tinta-suave">1er año %</span>
        <span className="text-xs text-tinta-suave">Después %</span>

        {RAMOS.map((r) => (
          <div key={r} className="contents">
            <label htmlFor={`${r}_primer`} className="text-sm">
              {ETIQUETA_RAMO[r]}
            </label>
            <input
              id={`${r}_primer`}
              name={`${r}_primer`}
              inputMode="decimal"
              defaultValue={tasas[r]?.primer ?? 0}
              className="cifras rounded-md border border-linea bg-white px-2.5 py-2 text-base outline-none focus:border-tinta"
            />
            <input
              name={`${r}_subsecuente`}
              inputMode="decimal"
              defaultValue={tasas[r]?.subs ?? 0}
              className="cifras rounded-md border border-linea bg-white px-2.5 py-2 text-base outline-none focus:border-tinta"
            />
          </div>
        ))}
      </div>
    </Formulario>
  );
}
