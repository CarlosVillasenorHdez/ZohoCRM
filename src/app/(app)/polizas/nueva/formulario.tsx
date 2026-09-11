"use client";

import { useState } from "react";
import { crearPoliza } from "@/lib/db/mutaciones";
import { Formulario, Campo, Selector, AreaTexto } from "@/components/ui";
import { ETIQUETA_RAMO, type Ramo } from "@/lib/types/database";

const RAMOS: Ramo[] = ["ahorro", "gmm", "autos", "vida", "danos"];

export function FormularioPoliza({
  contactos,
  aseguradoras,
  contactoPreseleccionado,
}: {
  contactos: { id: string; nombre: string }[];
  aseguradoras: { id: string; nombre: string }[];
  contactoPreseleccionado: string | null;
}) {
  const [ramo, setRamo] = useState<Ramo>("ahorro");
  const continua = ramo === "ahorro" || ramo === "vida";

  return (
    <Formulario accion={crearPoliza} boton="Guardar póliza">
      <Selector
        etiqueta="Cliente"
        nombre="contacto_id"
        valor={contactoPreseleccionado}
        opciones={contactos.map((c) => ({ valor: c.id, texto: c.nombre }))}
      />
      <Selector
        etiqueta="Aseguradora"
        nombre="aseguradora_id"
        opciones={aseguradoras.map((a) => ({ valor: a.id, texto: a.nombre }))}
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-tinta-suave">Ramo</span>
        <select
          name="ramo"
          value={ramo}
          onChange={(e) => setRamo(e.target.value as Ramo)}
          className="rounded-md border border-linea bg-white px-3 py-2.5 text-base outline-none focus:border-tinta"
        >
          {RAMOS.map((r) => (
            <option key={r} value={r}>{ETIQUETA_RAMO[r]}</option>
          ))}
        </select>
        <span className="text-xs text-tinta-suave">
          {continua
            ? "Al renovar, esta misma póliza corre su vigencia y avanza de año."
            : "Al renovar se emite una póliza nueva, encadenada a esta."}
        </span>
      </label>

      <Campo etiqueta="Número de póliza" nombre="numero_poliza" requerido />
      <Campo etiqueta="Producto" nombre="producto" ayuda="Nombre comercial, como viene en la carátula." />
      <Campo etiqueta="Inicio de vigencia" nombre="fecha_inicio" tipo="date" requerido />
      <Campo etiqueta="Fin de vigencia" nombre="fecha_fin" tipo="date" requerido />
      <Campo etiqueta="Prima total anual" nombre="prima_total" />

      <Selector
        etiqueta="Moneda"
        nombre="moneda"
        opciones={[
          { valor: "MXN", texto: "Pesos" },
          { valor: "USD", texto: "Dólares" },
          { valor: "UDI", texto: "UDIS" },
        ]}
      />
      <Selector
        etiqueta="Forma de pago"
        nombre="forma_pago"
        opciones={[
          { valor: "anual", texto: "Anual (1 recibo)" },
          { valor: "semestral", texto: "Semestral (2 recibos)" },
          { valor: "trimestral", texto: "Trimestral (4 recibos)" },
          { valor: "mensual", texto: "Mensual (12 recibos)" },
        ]}
      />

      {ramo === "autos" && (
        <>
          <Campo etiqueta="Placas" nombre="placas" />
          <Campo etiqueta="Marca" nombre="marca" />
          <Campo etiqueta="Modelo" nombre="modelo" />
          <Campo etiqueta="Año" nombre="anio" />
          <Selector
            etiqueta="Cobertura"
            nombre="cobertura"
            opciones={[
              { valor: "amplia", texto: "Amplia" },
              { valor: "limitada", texto: "Limitada" },
              { valor: "rc", texto: "Responsabilidad civil" },
            ]}
          />
        </>
      )}

      {ramo === "gmm" && (
        <>
          <Campo etiqueta="Suma asegurada" nombre="suma_asegurada" />
          <Campo etiqueta="Deducible" nombre="deducible" />
          <Campo etiqueta="Coaseguro %" nombre="coaseguro" />
          <Campo etiqueta="Hospital / red" nombre="hospital" />
        </>
      )}

      {(ramo === "ahorro" || ramo === "vida") && (
        <>
          <Campo etiqueta="Plazo en años" nombre="plazo_anios" />
          <Campo etiqueta="Aportación por recibo" nombre="aportacion" />
          <Campo etiqueta="Beneficiario" nombre="beneficiario" />
        </>
      )}

      <Campo
        etiqueta="Comisión %"
        nombre="comision_pct"
        ayuda="Opcional. Si lo dejas vacío se usa tu tasa del ramo según el año de vigencia."
      />
      <AreaTexto etiqueta="Notas" nombre="notas" />
    </Formulario>
  );
}
