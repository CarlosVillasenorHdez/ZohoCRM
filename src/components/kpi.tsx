export function Kpi({
  etiqueta, valor, nota, tono = "neutro",
}: {
  etiqueta: string;
  valor: string;
  nota?: string;
  tono?: "neutro" | "bueno" | "aviso" | "malo";
}) {
  const color = {
    neutro: "text-tinta",
    bueno: "text-corriente",
    aviso: "text-proximo",
    malo: "text-atrasado",
  }[tono];

  return (
    <div className="rounded-lg border border-linea bg-white px-4 py-3">
      <p className="text-xs text-tinta-suave">{etiqueta}</p>
      <p className={`cifras mt-1 text-2xl font-semibold leading-none tracking-tight ${color}`}>
        {valor}
      </p>
      {nota && <p className="mt-1.5 text-xs text-tinta-suave">{nota}</p>}
    </div>
  );
}

/** Barra de distribución: cuánto pesa cada etapa sobre el total. */
export function BarraEtapas({
  partes,
}: {
  partes: { etiqueta: string; valor: number; tono: string }[];
}) {
  const total = partes.reduce((s, p) => s + p.valor, 0);
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-papel-hondo">
        {partes.map((p) =>
          p.valor === 0 ? null : (
            <div
              key={p.etiqueta}
              style={{ width: `${(p.valor / total) * 100}%`, background: p.tono }}
              title={`${p.etiqueta}: ${p.valor}`}
            />
          ),
        )}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {partes.map((p) =>
          p.valor === 0 ? null : (
            <li key={p.etiqueta} className="flex items-center gap-1.5 text-xs text-tinta-suave">
              <span className="h-2 w-2 rounded-full" style={{ background: p.tono }} />
              {p.etiqueta}
              <span className="cifras">{p.valor}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
