"use client";

import { cerrarOportunidad } from "@/lib/db/mutaciones";
import { Formulario, Campo, Selector, AreaTexto } from "@/components/ui";

export function FormularioCierre({ oportunidadId }: { oportunidadId: string }) {
  return (
    <Formulario accion={cerrarOportunidad} boton="Cerrar" ocultos={{ id: oportunidadId }}>
      <Selector
        etiqueta="Resultado"
        nombre="resultado"
        opciones={[
          { valor: "ganada", texto: "Ganada" },
          { valor: "perdida", texto: "Perdida" },
        ]}
      />
      <Selector
        etiqueta="Si se perdió, por qué"
        nombre="motivo_perdida"
        opciones={[
          { valor: "", texto: "— no aplica —" },
          { valor: "renueva_despues", texto: "Interesado, pero renueva más adelante" },
          { valor: "no_responde", texto: "Dejó de responder" },
          { valor: "precio", texto: "Precio" },
          { valor: "ya_tiene_seguro", texto: "Ya tiene seguro" },
          { valor: "no_le_interesa", texto: "No le interesa" },
          { valor: "no_califica", texto: "No califica" },
          { valor: "otro", texto: "Otro" },
        ]}
      />
      <Campo
        etiqueta="Recontactar el"
        nombre="recontactar_en"
        tipo="date"
        ayuda="Ese día aparece solo en tu panel. Es la diferencia entre perder un cliente y ganarlo el año que viene."
      />
      <AreaTexto etiqueta="Detalle" nombre="motivo_detalle" />
    </Formulario>
  );
}
