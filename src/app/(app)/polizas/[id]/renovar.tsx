"use client";

import { useState } from "react";
import { renovarPoliza } from "@/lib/db/mutaciones";
import { Formulario, Campo } from "@/components/ui";

function masUnAnio(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const f = new Date(Date.UTC((a ?? 1970) + 1, (m ?? 1) - 1, d ?? 1));
  return f.toISOString().slice(0, 10);
}

export function CajaRenovar({
  polizaId, numeroActual, continua, finActual, primaActual,
}: {
  polizaId: string;
  numeroActual: string;
  continua: boolean;
  finActual: string;
  primaActual: number | null;
}) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full rounded-md bg-tinta px-4 py-2.5 font-medium text-papel"
      >
        Renovar
      </button>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-semibold">Renovar</h2>
        <button onClick={() => setAbierto(false)} className="text-sm text-tinta-suave">Cancelar</button>
      </div>

      <p className="mb-4 text-sm text-tinta-suave">
        {continua
          ? "Esta póliza continúa: corre su vigencia y avanza de año, así que la comisión pasa a la tasa de años subsecuentes."
          : "Se emite una póliza nueva encadenada a esta, y la actual queda marcada como renovada."}
      </p>

      <Formulario accion={renovarPoliza} boton="Confirmar renovación" ocultos={{ id: polizaId }}>
        {!continua && (
          <Campo
            etiqueta="Número de la nueva póliza"
            nombre="numero_nuevo"
            valor={numeroActual}
            requerido
            ayuda="La aseguradora emite un número distinto."
          />
        )}
        <Campo etiqueta="Nuevo inicio" nombre="fecha_inicio" tipo="date" valor={finActual} requerido />
        <Campo etiqueta="Nuevo fin" nombre="fecha_fin" tipo="date" valor={masUnAnio(finActual)} requerido />
        <Campo
          etiqueta="Prima del nuevo periodo"
          nombre="prima_total"
          valor={primaActual === null ? "" : String(primaActual)}
        />
      </Formulario>
    </div>
  );
}
