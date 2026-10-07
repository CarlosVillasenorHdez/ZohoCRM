"use client";

import { useActionState } from "react";
import type { Estado } from "@/lib/db/mutaciones";
import { useState } from "react";

const INICIAL: Estado = { ok: false, mensaje: null };

/**
 * Borrar en dos toques: el primero pide confirmación en el mismo lugar.
 *
 * Nada de window.confirm: en el celular aparece como una alerta del
 * navegador, se ve ajena a la app y es fácil aceptarla sin leer.
 */
export function Eliminar({
  accion, id, que, advertencia,
}: {
  accion: (p: Estado, d: FormData) => Promise<Estado>;
  id: string;
  que: string;
  advertencia?: string;
}) {
  const [estado, ejecutar, enviando] = useActionState(accion, INICIAL);
  const [confirmando, setConfirmando] = useState(false);

  if (estado.ok) {
    return <p role="status" className="text-sm text-corriente">{estado.mensaje}</p>;
  }

  if (!confirmando) {
    return (
      <div>
        <button
          onClick={() => setConfirmando(true)}
          className="text-sm text-tinta-suave underline underline-offset-4 hover:text-atrasado"
        >
          Eliminar {que}
        </button>
        {estado.mensaje && (
          <p role="alert" className="mt-2 border-l-2 border-l-atrasado py-1.5 pl-3 text-sm text-atrasado">
            {estado.mensaje}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={ejecutar} className="rounded-md border border-atrasado/40 bg-white p-3">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm font-medium">¿Eliminar {que}?</p>
      <p className="mt-1 text-sm text-tinta-suave">
        {advertencia ?? "Desaparece de todas las pantallas."} Se puede recuperar pidiéndolo a soporte.
      </p>
      <div className="mt-3 flex gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-atrasado px-3 py-1.5 text-sm font-medium text-papel disabled:opacity-60"
        >
          {enviando ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="rounded-md border border-linea px-3 py-1.5 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
