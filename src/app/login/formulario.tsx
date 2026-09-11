"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./actions";

const inicial: EstadoLogin = { mensaje: null };

export function FormularioLogin({ ultimoUsuario }: { ultimoUsuario: string }) {
  const [estado, accion, enviando] = useActionState(entrar, inicial);

  return (
    <form action={accion} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-tinta-suave">Usuario</span>
        <input
          name="usuario"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          defaultValue={ultimoUsuario}
          autoFocus={!ultimoUsuario}
          required
          className="rounded-md border border-linea bg-white px-3 py-3 text-base outline-none focus:border-tinta"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-tinta-suave">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus={Boolean(ultimoUsuario)}
          required
          className="rounded-md border border-linea bg-white px-3 py-3 text-base outline-none focus:border-tinta"
        />
      </label>

      {estado.mensaje && (
        <p role="alert" className="border-l-2 border-l-atrasado py-2 pl-3 text-sm text-atrasado">
          {estado.mensaje}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-1 rounded-md bg-tinta px-4 py-3 font-medium text-papel disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
