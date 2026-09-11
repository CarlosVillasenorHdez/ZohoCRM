"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { entrar, type EstadoLogin } from "./actions";
import type { UsuarioAcceso } from "@/lib/db/acceso";

const inicial: EstadoLogin = { mensaje: null };

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function FormularioLogin({
  ultimoUsuario,
  usuarios,
}: {
  ultimoUsuario: string;
  usuarios: UsuarioAcceso[];
}) {
  const [estado, accion, enviando] = useActionState(entrar, inicial);

  // Si hay lista, se arranca con el último que entró en este dispositivo.
  const inicialSel = usuarios.find((u) => u.usuario === ultimoUsuario)?.usuario ?? null;
  const [elegido, setElegido] = useState<string | null>(inicialSel);
  const [escribiendo, setEscribiendo] = useState(usuarios.length === 0);
  const campoPass = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (elegido) campoPass.current?.focus();
  }, [elegido]);

  const usuarioActivo = escribiendo ? undefined : (elegido ?? undefined);

  return (
    <form action={accion} className="flex flex-col gap-5">
      {!escribiendo && usuarios.length > 0 && (
        <>
          <input type="hidden" name="usuario" value={elegido ?? ""} />
          <div>
            <p className="mb-2.5 text-sm text-tinta-suave">¿Quién eres?</p>
            <ul className="flex flex-col gap-2">
              {usuarios.map((u) => {
                const activo = elegido === u.usuario;
                return (
                  <li key={u.usuario}>
                    <button
                      type="button"
                      onClick={() => setElegido(u.usuario)}
                      aria-pressed={activo}
                      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                        activo ? "border-tinta bg-papel-hondo" : "border-linea bg-white hover:border-tinta-suave"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                          activo ? "bg-tinta text-papel" : "bg-papel-hondo text-tinta-suave"
                        }`}
                      >
                        {iniciales(u.nombre)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium leading-tight">{u.nombre}</span>
                        <span className="cifras block truncate text-xs text-tinta-suave">{u.usuario}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {escribiendo && (
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
      )}

      {(escribiendo || elegido) && (
        <label className="flex flex-col gap-2">
          <span className="text-sm text-tinta-suave">Contraseña</span>
          <input
            ref={campoPass}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-md border border-linea bg-white px-3 py-3 text-base outline-none focus:border-tinta"
          />
        </label>
      )}

      {estado.mensaje && (
        <p role="alert" className="border-l-2 border-l-atrasado py-2 pl-3 text-sm text-atrasado">
          {estado.mensaje}
        </p>
      )}

      {(escribiendo || elegido) && (
        <button
          type="submit"
          disabled={enviando}
          className="mt-1 rounded-md bg-tinta px-4 py-3 font-medium text-papel disabled:opacity-60"
        >
          {enviando ? "Entrando…" : usuarioActivo ? `Entrar como ${usuarioActivo}` : "Entrar"}
        </button>
      )}

      {usuarios.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setEscribiendo((v) => !v);
            setElegido(null);
          }}
          className="self-start text-sm text-tinta-suave underline underline-offset-4"
        >
          {escribiendo ? "Elegir de la lista" : "Entrar con otra cuenta"}
        </button>
      )}
    </form>
  );
}
