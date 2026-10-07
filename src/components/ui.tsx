"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Estado } from "@/lib/db/mutaciones";

export const INICIAL: Estado = { mensaje: null, ok: false };

export function Campo({
  etiqueta, nombre, tipo = "text", valor, requerido, ayuda,
}: {
  etiqueta: string; nombre: string; tipo?: string; valor?: string | null;
  requerido?: boolean; ayuda?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-tinta-suave">{etiqueta}</span>
      <input
        name={nombre}
        type={tipo}
        defaultValue={valor ?? undefined}
        required={requerido}
        className="rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta"
      />
      {ayuda && <span className="text-xs text-tinta-suave">{ayuda}</span>}
    </label>
  );
}

export function Selector({
  etiqueta, nombre, opciones, valor,
}: {
  etiqueta: string; nombre: string; valor?: string | null;
  opciones: { valor: string; texto: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-tinta-suave">{etiqueta}</span>
      <select
        name={nombre}
        defaultValue={valor ?? undefined}
        className="rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.texto}</option>
        ))}
      </select>
    </label>
  );
}

export function AreaTexto({ etiqueta, nombre, valor }: { etiqueta: string; nombre: string; valor?: string | null }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-tinta-suave">{etiqueta}</span>
      <textarea
        name={nombre}
        rows={3}
        defaultValue={valor ?? undefined}
        className="rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta"
      />
    </label>
  );
}

export function Formulario({
  accion, boton, children, ocultos, alGuardar = "conservar", limpiable = false,
}: {
  accion: (p: Estado, d: FormData) => Promise<Estado>;
  boton: string;
  children: React.ReactNode;
  ocultos?: Record<string, string | null | undefined>;
  /**
   * Qué pasa con los campos al guardar bien.
   *
   * "limpiar" en los formularios de alta. Antes se quedaban llenos, así que
   * al capturar la segunda póliza aparecían los datos de la primera y no
   * había manera de vaciarlos: parecía que el sistema no dejaba capturar de
   * nuevo. "conservar" en los de edición, donde vaciar sería perder lo que
   * se está viendo.
   */
  alGuardar?: "limpiar" | "conservar";
  /** Botón para vaciar los campos en cualquier momento. */
  limpiable?: boolean;
}) {
  const [estado, ejecutar, enviando] = useActionState(accion, INICIAL);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok && alGuardar === "limpiar") form.current?.reset();
  }, [estado, alGuardar]);

  return (
    <form ref={form} action={ejecutar} className="flex flex-col gap-4">
      {ocultos &&
        Object.entries(ocultos).map(([k, v]) =>
          v ? <input key={k} type="hidden" name={k} value={v} /> : null,
        )}
      {children}

      {estado.mensaje && (
        <p
          role="status"
          className={`border-l-2 py-2 pl-3 text-sm ${estado.ok ? "border-l-corriente text-corriente" : "border-l-atrasado text-atrasado"}`}
        >
          {estado.mensaje}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-tinta px-4 py-2.5 font-medium text-papel disabled:opacity-60"
        >
          {enviando ? "Guardando…" : boton}
        </button>

        {limpiable && (
          <button
            type="button"
            onClick={() => form.current?.reset()}
            disabled={enviando}
            className="rounded-md border border-linea px-4 py-2.5 font-medium text-tinta-suave hover:text-tinta disabled:opacity-60"
          >
            Limpiar
          </button>
        )}
      </div>
    </form>
  );
}
