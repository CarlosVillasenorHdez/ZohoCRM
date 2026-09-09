"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { moverOportunidad } from "@/lib/db/mutaciones";
import { ETAPAS, ETIQUETA_ETAPA, ETIQUETA_RAMO, type Etapa, type Ramo } from "@/lib/types/database";
import { retraso } from "@/lib/fechas";

export type Tarjeta = {
  id: string;
  contacto_id: string;
  nombre: string;
  ramo: Ramo;
  subtipo: string | null;
  etapa: Etapa;
  prima: number | null;
  diasEnEtapa: number;
};

const DINERO = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function Kanban({ tarjetas }: { tarjetas: Tarjeta[] }) {
  const [local, setLocal] = useState(tarjetas);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [encima, setEncima] = useState<Etapa | null>(null);
  const [, empezar] = useTransition();

  function soltar(etapa: Etapa) {
    const id = arrastrando;
    setArrastrando(null);
    setEncima(null);
    if (!id) return;

    const actual = local.find((t) => t.id === id);
    if (!actual || actual.etapa === etapa) return;

    const previo = local;
    // Movimiento optimista: la tarjeta salta de columna al instante.
    setLocal((t) => t.map((x) => (x.id === id ? { ...x, etapa, diasEnEtapa: 0 } : x)));

    empezar(async () => {
      try {
        await moverOportunidad(id, etapa);
      } catch {
        setLocal(previo); // si falló, regresa a donde estaba
      }
    });
  }

  return (
    <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
      {ETAPAS.map((etapa) => {
        const filas = local.filter((t) => t.etapa === etapa);
        const suma = filas.reduce((s, t) => s + (t.prima ?? 0), 0);

        return (
          <section
            key={etapa}
            onDragOver={(e) => {
              e.preventDefault();
              setEncima(etapa);
            }}
            onDragLeave={() => setEncima((v) => (v === etapa ? null : v))}
            onDrop={() => soltar(etapa)}
            className={`w-[15.5rem] shrink-0 snap-start rounded-lg border p-3 transition-colors ${
              encima === etapa ? "border-tinta bg-papel-hondo" : "border-linea bg-white/40"
            }`}
          >
            <header className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold leading-tight">{ETIQUETA_ETAPA[etapa]}</h2>
              <span className="cifras shrink-0 text-xs text-tinta-suave">{filas.length}</span>
            </header>
            {suma > 0 && (
              <p className="cifras -mt-2 mb-3 text-xs text-tinta-suave">{DINERO.format(suma)}</p>
            )}

            <ul className="flex flex-col gap-2">
              {filas.map((t) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={() => setArrastrando(t.id)}
                  onDragEnd={() => setArrastrando(null)}
                  className={`cursor-grab rounded-md border-l-2 bg-white p-3 shadow-[0_1px_2px_rgba(22,32,42,.06)] active:cursor-grabbing ${
                    t.diasEnEtapa <= -14 ? "border-l-proximo" : "border-l-linea"
                  } ${arrastrando === t.id ? "opacity-40" : ""}`}
                >
                  <Link href={`/contactos/${t.contacto_id}`} className="font-medium leading-snug underline-offset-4 hover:underline">
                    {t.nombre}
                  </Link>
                  <p className="mt-1 text-xs text-tinta-suave">
                    {ETIQUETA_RAMO[t.ramo]}
                    {t.subtipo ? ` · ${t.subtipo}` : ""}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="cifras text-xs text-tinta-suave">
                      {t.prima ? DINERO.format(t.prima) : "sin prima"}
                    </span>
                    <span className={`text-xs ${t.diasEnEtapa <= -14 ? "text-proximo" : "text-tinta-suave"}`}>
                      {retraso(t.diasEnEtapa)}
                    </span>
                  </div>

                  <SelectorEtapa
                    etapaActual={t.etapa}
                    onCambio={(e) => {
                      const previo = local;
                      setLocal((v) => v.map((x) => (x.id === t.id ? { ...x, etapa: e, diasEnEtapa: 0 } : x)));
                      empezar(async () => {
                        try {
                          await moverOportunidad(t.id, e);
                        } catch {
                          setLocal(previo);
                        }
                      });
                    }}
                  />

                  <Link
                    href={`/embudo/${t.id}/cerrar`}
                    className="mt-2 inline-block text-xs text-tinta-suave underline underline-offset-4"
                  >
                    Cerrar
                  </Link>
                </li>
              ))}

              {filas.length === 0 && (
                <li className="rounded-md border border-dashed border-linea py-6 text-center text-xs text-tinta-suave">
                  Arrastra aquí
                </li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** En celular no se puede arrastrar cómodamente: el selector hace el mismo trabajo. */
function SelectorEtapa({
  etapaActual,
  onCambio,
}: {
  etapaActual: Etapa;
  onCambio: (e: Etapa) => void;
}) {
  return (
    <label className="mt-2 block lg:hidden">
      <span className="sr-only">Mover a otra etapa</span>
      <select
        value={etapaActual}
        onChange={(e) => onCambio(e.target.value as Etapa)}
        className="w-full rounded border border-linea bg-papel px-2 py-1.5 text-xs"
      >
        {ETAPAS.map((e) => (
          <option key={e} value={e}>
            {ETIQUETA_ETAPA[e]}
          </option>
        ))}
      </select>
    </label>
  );
}
