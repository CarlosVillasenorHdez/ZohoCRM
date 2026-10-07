"use client";

import { actualizarOportunidad } from "@/lib/db/mutaciones";
import { Formulario, Campo, Selector, AreaTexto } from "@/components/ui";
import { CamposRamo } from "@/components/campos-ramo";
import { ETAPAS, ETIQUETA_ETAPA } from "@/lib/types/database";

export function FormularioCotizacion({
  id, ramo, subtipo, etapa, datos,
  primaEstimada, primaCotizada, fechaCotizacion, formaPago, vigenciaInicio, notas,
}: {
  id: string;
  ramo: string;
  subtipo: string | null;
  etapa: string;
  datos: Record<string, unknown>;
  primaEstimada: number | null;
  primaCotizada: number | null;
  fechaCotizacion: string | null;
  formaPago: string | null;
  vigenciaInicio: string | null;
  notas: string | null;
}) {
  return (
    <Formulario accion={actualizarOportunidad} boton="Guardar cambios" ocultos={{ id }}>
      {/* key fuerza a rearmar los campos si cambia el ramo guardado */}
      <CamposRamo key={`${ramo}-${subtipo}`} ramoInicial={ramo} productoInicial={subtipo} datos={datos} />

      <Selector
        etiqueta="Etapa"
        nombre="etapa"
        valor={etapa}
        opciones={ETAPAS.map((e) => ({ valor: e, texto: ETIQUETA_ETAPA[e] }))}
      />
      <Campo etiqueta="Prima estimada anual" nombre="prima_estimada" valor={primaEstimada === null ? "" : String(primaEstimada)} />
      <Campo
        etiqueta="Cotización en firme"
        nombre="prima_cotizada"
        valor={primaCotizada === null ? "" : String(primaCotizada)}
        ayuda="La que devolvió la aseguradora."
      />
      <Campo etiqueta="Fecha de la cotización" nombre="fecha_cotizacion" tipo="date" valor={fechaCotizacion} />
      <Selector
        etiqueta="Forma de pago propuesta"
        nombre="forma_pago"
        valor={formaPago ?? ""}
        opciones={[
          { valor: "", texto: "— sin definir —" },
          { valor: "anual", texto: "Anual" },
          { valor: "semestral", texto: "Semestral" },
          { valor: "trimestral", texto: "Trimestral" },
          { valor: "mensual", texto: "Mensual" },
        ]}
      />
      <Campo etiqueta="Inicio de vigencia propuesto" nombre="vigencia_inicio" tipo="date" valor={vigenciaInicio} />
      <AreaTexto etiqueta="Notas" nombre="notas" valor={notas} />
    </Formulario>
  );
}
