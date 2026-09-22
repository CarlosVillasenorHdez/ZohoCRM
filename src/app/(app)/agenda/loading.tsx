export default function Cargando() {
  return (
    <main aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando la agenda…</span>
      <div className="h-8 w-40 animate-pulse rounded bg-papel-hondo" />
      <div className="mt-7 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        <div>
          <div className="mb-3 h-5 w-44 animate-pulse rounded bg-papel-hondo" />
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-linea bg-linea">
            {Array.from({ length: 49 }, (_, i) => (
              <div key={i} className={`bg-papel ${i < 7 ? "h-7" : "min-h-[3.4rem] lg:min-h-[6.25rem]"}`} />
            ))}
          </div>
        </div>
        <div className="mt-11 hidden lg:mt-0 lg:block">
          <div className="h-5 w-32 animate-pulse rounded bg-papel-hondo" />
        </div>
      </div>
    </main>
  );
}
