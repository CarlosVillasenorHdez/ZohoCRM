"use client";

import { useState } from "react";
import { RAMOS, productosDe, camposDe, type CampoRamo } from "@/lib/catalogo";

function Campo({ campo, valor }: { campo: CampoRamo; valor?: unknown }) {
  const comun =
    "rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta";
  const def = valor === null || valor === undefined ? undefined : String(valor);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-tinta-suave">{campo.etiqueta}</span>

      {campo.tipo === "opcion" ? (
        <select name={campo.nombre} defaultValue={def} className={comun}>
          <option value="">— sin especificar —</option>
          {campo.opciones?.map((o) => (
            <option key={o.valor} value={o.valor}>{o.texto}</option>
          ))}
        </select>
      ) : campo.tipo === "area" ? (
        <textarea name={campo.nombre} rows={2} defaultValue={def} className={comun} />
      ) : (
        <input
          name={campo.nombre}
          type={campo.tipo === "fecha" ? "date" : "text"}
          inputMode={campo.tipo === "numero" ? "decimal" : undefined}
          defaultValue={def}
          className={comun}
        />
      )}

      {campo.ayuda && <span className="text-xs text-tinta-suave">{campo.ayuda}</span>}
    </label>
  );
}

/**
 * Selector de ramo y producto, con los campos que ese producto exige.
 *
 * Los campos cambian al vuelo: elegir "moto" pide placas y cobertura; elegir
 * "casa habitación" pide ubicación y sumas aseguradas. Eso es lo que antes
 * terminaba escrito a mano en el campo de notas.
 */
export function CamposRamo({
  ramoInicial = "danos",
  productoInicial = null,
  datos = {},
}: {
  ramoInicial?: string;
  productoInicial?: string | null;
  datos?: Record<string, unknown>;
}) {
  const [ramo, setRamo] = useState(ramoInicial);
  const [producto, setProducto] = useState<string>(
    productoInicial ?? productosDe(ramoInicial)[0]?.valor ?? "",
  );

  const productos = productosDe(ramo);
  const campos = camposDe(ramo, producto);
  const comun =
    "rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta";

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-tinta-suave">Ramo</span>
        <select
          name="ramo"
          value={ramo}
          onChange={(e) => {
            const nuevo = e.target.value;
            setRamo(nuevo);
            setProducto(productosDe(nuevo)[0]?.valor ?? "");
          }}
          className={comun}
        >
          {RAMOS.map((r) => (
            <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-tinta-suave">Producto</span>
        <select
          name="subtipo"
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          className={comun}
        >
          {productos.map((p) => (
            <option key={p.valor} value={p.valor}>{p.texto}</option>
          ))}
        </select>
      </label>

      {campos.length > 0 && (
        <fieldset className="rounded-lg border border-linea bg-papel-hondo/30 p-4">
          <legend className="px-1.5 text-sm font-medium">
            Datos {ramo === "gmm" ? "del plan" : productos.find((p) => p.valor === producto)?.grupo === "vehiculo" ? "del vehículo" : "del riesgo"}
          </legend>
          <div className="mt-2 flex flex-col gap-4">
            {campos.map((c) => (
              <Campo key={c.nombre} campo={c} valor={datos[c.nombre]} />
            ))}
          </div>
        </fieldset>
      )}
    </>
  );
}
