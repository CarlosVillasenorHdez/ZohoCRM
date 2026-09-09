"use client";

import { useEffect } from "react";

/**
 * Frontera de error de las pantallas privadas.
 * Sin esto, cualquier excepción al renderizar sale como un 500 anónimo del
 * navegador y no hay forma de saber qué pasó. Aquí al menos queda el digest,
 * que es la llave para encontrar el stack real en los logs de Vercel.
 */
export default function ErrorPantalla({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[pantalla]", error.message, error.digest);
  }, [error]);

  return (
    <main className="py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Esta pantalla no cargó</h1>
      <p className="mt-2 text-tinta-suave">
        Algo falló del lado del servidor. Tus datos no se tocaron.
      </p>

      <div className="mt-6 border-l-2 border-l-atrasado py-2 pl-4">
        <p className="text-sm text-tinta-suave">Detalle para soporte</p>
        <p className="cifras mt-1 break-all text-sm">
          {error.digest ?? error.message ?? "sin identificador"}
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-tinta px-4 py-2.5 font-medium text-papel"
        >
          Reintentar
        </button>
        <a
          href="/login"
          className="rounded-md border border-linea px-4 py-2.5 font-medium"
        >
          Volver a entrar
        </a>
      </div>
    </main>
  );
}
