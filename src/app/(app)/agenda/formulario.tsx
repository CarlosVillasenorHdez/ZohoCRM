"use client";

import { crearActividad } from "@/lib/db/mutaciones";
import { Formulario, Campo, Selector, AreaTexto } from "@/components/ui";

export function FormularioRapido({
  contactos,
  diaSugerido,
}: {
  contactos: { id: string; nombre: string }[];
  diaSugerido?: string;
}) {
  return (
    <Formulario accion={crearActividad} boton="Agendar">
      <Campo etiqueta="Qué vas a hacer" nombre="titulo" requerido />
      <Campo
        etiqueta="Cuándo"
        nombre="inicia_en"
        tipo="datetime-local"
        requerido
        valor={diaSugerido ? `${diaSugerido}T09:00` : undefined}
      />
      <Selector
        etiqueta="Tipo"
        nombre="tipo"
        opciones={[
          { valor: "seguimiento", texto: "Seguimiento" },
          { valor: "cita", texto: "Cita" },
          { valor: "llamada", texto: "Llamada" },
          { valor: "entrega", texto: "Entrega de póliza" },
          { valor: "cobranza", texto: "Cobranza" },
          { valor: "personal", texto: "Personal" },
        ]}
      />
      {contactos.length > 0 && (
        <Selector
          etiqueta="Con quién"
          nombre="contacto_id"
          opciones={[
            { valor: "", texto: "— nadie en particular —" },
            ...contactos.map((c) => ({ valor: c.id, texto: c.nombre })),
          ]}
        />
      )}
      <Campo etiqueta="Dónde" nombre="lugar" />
      <AreaTexto etiqueta="Detalle" nombre="descripcion" />
    </Formulario>
  );
}
