"use client";

export default function ErrorLogin({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">No se pudo entrar</h1>
      <p className="mt-2 text-tinta-suave">
        El servidor falló al procesar el acceso. Revisa <code>/estado</code>: casi
        siempre es una variable de entorno que no llegó al despliegue.
      </p>
      <p className="cifras mt-6 break-all text-sm text-tinta-suave">
        {error.digest ?? error.message}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-tinta px-4 py-2.5 font-medium text-papel"
      >
        Reintentar
      </button>
    </main>
  );
}
