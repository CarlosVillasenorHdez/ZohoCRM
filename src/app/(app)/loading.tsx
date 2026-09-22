/**
 * Esqueleto de carga.
 *
 * Sin esto, al tocar un enlace el navegador se queda en la pantalla anterior
 * hasta que el servidor responde entero, y la navegación se siente congelada
 * aunque tarde lo mismo. Con esto Next pinta la estructura de inmediato y
 * además puede precargar la ruta al pasar el cursor.
 */
export default function Cargando() {
  return (
    <main aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="h-8 w-56 animate-pulse rounded bg-papel-hondo" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-papel-hondo" />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-linea bg-papel-hondo/50" />
        ))}
      </div>

      <div className="mt-9 flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 border-b border-linea pb-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-papel-hondo" />
            <div className="h-3 w-16 animate-pulse rounded bg-papel-hondo" />
          </div>
        ))}
      </div>
    </main>
  );
}
