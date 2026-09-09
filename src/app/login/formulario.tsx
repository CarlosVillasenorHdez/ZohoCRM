"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./actions";

const inicial: EstadoLogin = { mensaje: null };

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(entrar, inicial);

  return (
    <form action={accion} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-tinta-suave">Correo</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-tinta-suave">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta"
        />
      </label>

      {estado.mensaje && (
        <p role="alert" className="text-sm text-atrasado">
          {estado.mensaje}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-2 rounded-md bg-tinta px-4 py-2.5 font-medium text-papel disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
