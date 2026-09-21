"use client";

import { useState } from "react";
import { registrarSeguimiento } from "@/lib/db/mutaciones";
import { RESULTADOS } from "@/lib/resultados";
import { Formulario, Campo, Selector, AreaTexto } from "@/components/ui";

const TIPOS = [
  { valor: "llamada", texto: "Llamada" },
  { valor: "cita", texto: "Cita" },
  { valor: "whatsapp", texto: "WhatsApp" },
  { valor: "seguimiento", texto: "Seguimiento" },
  { valor: "entrega", texto: "Entrega de póliza" },
  { valor: "cobranza", texto: "Cobranza" },
];

function enDias(dias: number, hora = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(hora).padStart(2, "0")}:00`;
}

/**
 * Cerrar una gestión y encadenar la siguiente, en un solo paso.
 * La alternativa —marcar hecho y luego crear otra actividad— es donde se
 * pierden los prospectos: se cierra la llamada y nunca se agenda el paso
 * que se acordó en ella.
 */
export function Seguimiento({
  actividadId,
  oportunidadId,
  nombre,
}: {
  actividadId: string;
  oportunidadId?: string | null;
  nombre?: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [resultado, setResultado] = useState<string>("contactado");
  const [agendar, setAgendar] = useState(true);
  const [cuando, setCuando] = useState(enDias(1));

  const cierra = RESULTADOS.find((r) => r.valor === resultado)?.sigue === false;

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-md border border-linea bg-white px-3 py-1.5 text-sm font-medium hover:border-tinta"
      >
        Registrar qué pasó
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-linea bg-white p-4">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">
          ¿Qué pasó{nombre ? ` con ${nombre.split(" ")[0]}` : ""}?
        </h3>
        <button onClick={() => setAbierto(false)} className="text-sm text-tinta-suave">
          Cancelar
        </button>
      </div>

      <Formulario
        accion={registrarSeguimiento}
        boton={agendar && !cierra ? "Guardar y agendar" : "Cerrar gestión"}
        ocultos={{
          id: actividadId,
          oportunidad_id: oportunidadId ?? undefined,
          cerrar_oportunidad: cierra && !agendar ? "1" : undefined,
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-tinta-suave">Resultado</span>
          <select
            name="resultado"
            value={resultado}
            onChange={(e) => {
              const v = e.target.value;
              setResultado(v);
              const sigue = RESULTADOS.find((r) => r.valor === v)?.sigue;
              if (sigue === false) setAgendar(false);
              if (v === "no_contesto" || v === "reagendo") setAgendar(true);
            }}
            className="rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta"
          >
            {RESULTADOS.map((r) => (
              <option key={r.valor} value={r.valor}>{r.texto}</option>
            ))}
          </select>
        </label>

        <AreaTexto etiqueta="Nota" nombre="nota" />

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={agendar}
            onChange={(e) => setAgendar(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm">Agendar el siguiente paso</span>
        </label>

        {agendar ? (
          <>
            <Selector etiqueta="Qué sigue" nombre="tipo" opciones={TIPOS} />
            <Campo etiqueta="Título" nombre="titulo" valor="Seguimiento" requerido />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-tinta-suave">Cuándo</span>
              <div className="mb-1 flex flex-wrap gap-2">
                {[
                  { t: "Mañana", d: 1 },
                  { t: "En 3 días", d: 3 },
                  { t: "En una semana", d: 7 },
                  { t: "En un mes", d: 30 },
                ].map((o) => (
                  <button
                    key={o.d}
                    type="button"
                    onClick={() => setCuando(enDias(o.d))}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      cuando === enDias(o.d) ? "border-tinta bg-papel-hondo" : "border-linea"
                    }`}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
              <input
                name="inicia_en"
                type="datetime-local"
                value={cuando}
                onChange={(e) => setCuando(e.target.value)}
                required
                className="rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta"
              />
            </div>
          </>
        ) : (
          cierra &&
          oportunidadId && (
            <Campo
              etiqueta="Volver a buscarlo el"
              nombre="recontactar_en"
              tipo="date"
              ayuda="Opcional. Ese día reaparece en tu panel. Un 'no' de hoy suele ser un 'sí' del año que viene."
            />
          )
        )}
      </Formulario>
    </div>
  );
}
