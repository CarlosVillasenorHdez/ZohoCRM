"use client";

import { crearPoliza } from "@/lib/db/mutaciones";
import { Formulario, Campo, Selector, AreaTexto } from "@/components/ui";
import { CamposRamo } from "@/components/campos-ramo";

export type Origen = {
  oportunidadId: string;
  ramo: string;
  subtipo: string | null;
  datos: Record<string, unknown>;
  prima: number | null;
  formaPago: string | null;
  vigenciaInicio: string | null;
};

export function FormularioPoliza({
  contactos,
  aseguradoras,
  contactoPreseleccionado,
  origen,
}: {
  contactos: { id: string; nombre: string }[];
  aseguradoras: { id: string; nombre: string }[];
  contactoPreseleccionado: string | null;
  origen?: Origen | null;
}) {
  return (
    <Formulario
      accion={crearPoliza}
      boton="Guardar póliza"
      alGuardar={origen ? "conservar" : "limpiar"}
      limpiable={!origen}
      ocultos={origen ? { oportunidad_id: origen.oportunidadId } : undefined}
    >
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

      <CamposRamo
        ramoInicial={origen?.ramo ?? "danos"}
        productoInicial={origen?.subtipo ?? null}
        datos={origen?.datos ?? {}}
      />

      <Campo etiqueta="Número de póliza" nombre="numero_poliza" requerido />
      <Campo etiqueta="Producto" nombre="producto" ayuda="Nombre comercial, como viene en la carátula." />
      <Campo etiqueta="Inicio de vigencia" nombre="fecha_inicio" tipo="date" valor={origen?.vigenciaInicio ?? undefined} requerido />
      <Campo etiqueta="Fin de vigencia" nombre="fecha_fin" tipo="date" requerido />
      <Campo etiqueta="Prima total anual" nombre="prima_total" valor={origen?.prima === null || origen?.prima === undefined ? undefined : String(origen.prima)} />

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
        valor={origen?.formaPago ?? undefined}
        opciones={[
          { valor: "anual", texto: "Anual (1 recibo)" },
          { valor: "semestral", texto: "Semestral (2 recibos)" },
          { valor: "trimestral", texto: "Trimestral (4 recibos)" },
          { valor: "mensual", texto: "Mensual (12 recibos)" },
        ]}
      />

      <Campo
        etiqueta="Comisión %"
        nombre="comision_pct"
        ayuda="Opcional. Si lo dejas vacío se usa tu tasa del ramo según el año de vigencia."
      />
      <AreaTexto etiqueta="Notas" nombre="notas" />
    </Formulario>
  );
}
