"use client";

import { useActionState } from "react";
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
  accion, boton, children, ocultos,
}: {
  accion: (p: Estado, d: FormData) => Promise<Estado>;
  boton: string;
  children: React.ReactNode;
  ocultos?: Record<string, string | null | undefined>;
}) {
  const [estado, ejecutar, enviando] = useActionState(accion, INICIAL);

  return (
    <form action={ejecutar} className="flex flex-col gap-4">
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

      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-md bg-tinta px-4 py-2.5 font-medium text-papel disabled:opacity-60"
      >
        {enviando ? "Guardando…" : boton}
      </button>
    </form>
  );
}
