"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { moverOportunidad } from "@/lib/db/mutaciones";
import { ETAPAS, ETIQUETA_ETAPA, ETIQUETA_RAMO, type Etapa, type Ramo } from "@/lib/types/database";
import { retraso } from "@/lib/fechas";
import { tonoPorDias, COLOR_TONO, TEXTO_TONO } from "@/lib/antiguedad";

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
  style: "currency", currency: "MXN", maximumFractionDigits: 0,
});

export function Kanban({ tarjetas }: { tarjetas: Tarjeta[] }) {
  const [local, setLocal] = useState(tarjetas);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [encima, setEncima] = useState<Etapa | null>(null);
  const [, empezar] = useTransition();

  function mover(id: string, etapa: Etapa) {
    const actual = local.find((t) => t.id === id);
    if (!actual || actual.etapa === etapa) return;

    const previo = local;
    setLocal((t) => t.map((x) => (x.id === id ? { ...x, etapa, diasEnEtapa: 0 } : x)));
    empezar(async () => {
      try {
        await moverOportunidad(id, etapa);
      } catch {
        setLocal(previo);
      }
    });
  }

  return (
    <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
      {ETAPAS.map((etapa, i) => {
        const filas = local.filter((t) => t.etapa === etapa);
        const suma = filas.reduce((s, t) => s + (t.prima ?? 0), 0);
        const frias = filas.filter((t) => tonoPorDias(t.diasEnEtapa) === "helado").length;

        return (
          <section
            key={etapa}
            onDragOver={(e) => { e.preventDefault(); setEncima(etapa); }}
            onDragLeave={() => setEncima((v) => (v === etapa ? null : v))}
            onDrop={() => { const id = arrastrando; setArrastrando(null); setEncima(null); if (id) mover(id, etapa); }}
            className={`w-[15.5rem] shrink-0 snap-start rounded-lg border transition-colors ${
              encima === etapa ? "border-tinta bg-papel-hondo" : "border-linea bg-papel-hondo/40"
            }`}
          >
            <header className="border-b border-linea px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold leading-tight">
                  <span className="cifras mr-1.5 text-tinta-suave">{i + 1}</span>
                  {ETIQUETA_ETAPA[etapa]}
                </h2>
                <span className="cifras shrink-0 rounded-full bg-papel px-2 py-0.5 text-xs">
                  {filas.length}
                </span>
              </div>
              <p className="cifras mt-1 text-xs text-tinta-suave">
                {suma > 0 ? DINERO.format(suma) : "—"}
                {frias > 0 && <span className="text-atrasado"> · {frias} sin mover</span>}
              </p>
            </header>

            <ul className="flex flex-col gap-2 p-2.5">
              {filas.map((t) => {
                const tono = tonoPorDias(t.diasEnEtapa);
                return (
                  <li
                    key={t.id}
                    draggable
                    onDragStart={() => setArrastrando(t.id)}
                    onDragEnd={() => setArrastrando(null)}
                    className={`cursor-grab rounded-md bg-white p-3 shadow-[0_1px_2px_rgba(22,32,42,.07)] active:cursor-grabbing ${
                      arrastrando === t.id ? "opacity-40" : ""
                    }`}
                    style={{ borderLeft: `3px solid ${COLOR_TONO[tono]}` }}
                  >
                    <Link href={`/contactos/${t.contacto_id}`} className="font-medium leading-snug underline-offset-4 hover:underline">
                      {t.nombre}
                    </Link>
                    <p className="mt-1 text-xs text-tinta-suave">
                      {ETIQUETA_RAMO[t.ramo]}{t.subtipo ? ` · ${t.subtipo}` : ""}
                    </p>

                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: COLOR_TONO[tono] }} />
                      <span className="text-xs" style={{ color: COLOR_TONO[tono] }}>
                        {Math.abs(t.diasEnEtapa)} d aquí
                      </span>
                      <span className="text-xs text-tinta-suave">· {TEXTO_TONO[tono]}</span>
                    </div>

                    <p className="cifras mt-1.5 text-xs text-tinta-suave">
                      {t.prima ? DINERO.format(t.prima) : "sin prima"}
                    </p>

                    <label className="mt-2.5 block lg:hidden">
                      <span className="sr-only">Mover de etapa</span>
                      <select
                        value={t.etapa}
                        onChange={(e) => mover(t.id, e.target.value as Etapa)}
                        className="w-full rounded border border-linea bg-papel px-2 py-1.5 text-xs"
                      >
                        {ETAPAS.map((e) => (
                          <option key={e} value={e}>{ETIQUETA_ETAPA[e]}</option>
                        ))}
                      </select>
                    </label>

                    <Link
                      href={`/embudo/${t.id}/cerrar`}
                      className="mt-2 inline-block text-xs text-tinta-suave underline underline-offset-4"
                    >
                      Cerrar
                    </Link>
                  </li>
                );
              })}

              {filas.length === 0 && (
                <li className="rounded-md border border-dashed border-linea py-7 text-center text-xs text-tinta-suave">
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
