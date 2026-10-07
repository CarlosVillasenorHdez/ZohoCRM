"use client";

import { useState } from "react";
import { crearOportunidad, crearActividad } from "@/lib/db/mutaciones";
import { Formulario, Campo, Selector, AreaTexto } from "@/components/ui";
import { ETAPAS, ETIQUETA_ETAPA } from "@/lib/types/database";
import { CamposRamo } from "@/components/campos-ramo";

export function PanelAcciones({ contactoId, nombre }: { contactoId: string; nombre: string }) {
  const [abierto, setAbierto] = useState<"nada" | "oportunidad" | "cita">("nada");

  if (abierto === "nada") {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setAbierto("oportunidad")}
          className="rounded-md bg-tinta px-4 py-2.5 font-medium text-papel"
        >
          Cotizar algo
        </button>
        <button
          onClick={() => setAbierto("cita")}
          className="rounded-md border border-linea px-4 py-2.5 font-medium"
        >
          Agendar seguimiento
        </button>
        <a
          href={`/polizas/nueva?contacto=${contactoId}`}
          className="rounded-md border border-linea px-4 py-2.5 font-medium"
        >
          Capturar póliza
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-semibold">
          {abierto === "oportunidad" ? `Nueva cotización para ${nombre}` : `Agendar con ${nombre}`}
        </h2>
        <button onClick={() => setAbierto("nada")} className="text-sm text-tinta-suave">
          Cancelar
        </button>
      </div>

      {abierto === "oportunidad" ? (
        <Formulario accion={crearOportunidad} boton="Crear cotización" alGuardar="limpiar" ocultos={{ contacto_id: contactoId }}>
          <CamposRamo />
          <Selector
            etiqueta="Etapa"
            nombre="etapa"
            opciones={ETAPAS.map((e) => ({ valor: e, texto: ETIQUETA_ETAPA[e] }))}
          />
          <Campo etiqueta="Prima estimada anual" nombre="prima_estimada" ayuda="Lo que calculas de entrada." />
          <Campo etiqueta="Cotización en firme" nombre="prima_cotizada" ayuda="La que devuelve la aseguradora. Se puede llenar después." />
          <Campo etiqueta="Fecha de la cotización" nombre="fecha_cotizacion" tipo="date" />
          <Selector
            etiqueta="Forma de pago propuesta"
            nombre="forma_pago"
            opciones={[
              { valor: "", texto: "— sin definir —" },
              { valor: "anual", texto: "Anual" },
              { valor: "semestral", texto: "Semestral" },
              { valor: "trimestral", texto: "Trimestral" },
              { valor: "mensual", texto: "Mensual" },
            ]}
          />
          <Campo etiqueta="Inicio de vigencia propuesto" nombre="vigencia_inicio" tipo="date" />
          <AreaTexto etiqueta="Notas" nombre="notas" />
        </Formulario>
      ) : (
        <Formulario accion={crearActividad} boton="Agendar" alGuardar="limpiar" ocultos={{ contacto_id: contactoId }}>
          <Campo etiqueta="Qué vas a hacer" nombre="titulo" requerido />
          <Selector
            etiqueta="Tipo"
            nombre="tipo"
            opciones={[
              { valor: "seguimiento", texto: "Seguimiento" },
              { valor: "cita", texto: "Cita" },
              { valor: "llamada", texto: "Llamada" },
              { valor: "entrega", texto: "Entrega de póliza" },
              { valor: "cobranza", texto: "Cobranza" },
            ]}
          />
          <Campo etiqueta="Cuándo" nombre="inicia_en" tipo="datetime-local" requerido />
          <Campo etiqueta="Dónde" nombre="lugar" />
          <AreaTexto etiqueta="Detalle" nombre="descripcion" />
        </Formulario>
      )}
    </div>
  );
}
