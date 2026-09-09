"use client";

import { crearContacto } from "@/lib/db/mutaciones";
import { Formulario, Campo, Selector, AreaTexto } from "@/components/ui";

export function FormularioContacto({
  posiblesReferentes,
}: {
  posiblesReferentes: { id: string; nombre: string }[];
}) {
  return (
    <Formulario accion={crearContacto} boton="Guardar prospecto">
      <Campo etiqueta="Nombre" nombre="nombre" requerido />
      <Campo etiqueta="Apellido paterno" nombre="apellido_paterno" />
      <Campo etiqueta="Celular" nombre="telefono_movil" tipo="tel" ayuda="Con este número se arma el enlace de WhatsApp." />
      <Campo etiqueta="Correo" nombre="email" tipo="email" />
      <Campo etiqueta="Fecha de nacimiento" nombre="fecha_nacimiento" tipo="date" ayuda="Sirve para la alarma de cumpleaños y para tarificar." />
      <Campo etiqueta="Ocupación" nombre="ocupacion" />

      <Selector
        etiqueta="Cómo llegó"
        nombre="origen"
        opciones={[
          { valor: "referido", texto: "Referido" },
          { valor: "contacto_personal", texto: "Contacto personal" },
          { valor: "evento", texto: "Evento social" },
          { valor: "red_social", texto: "Redes sociales" },
          { valor: "otro", texto: "Otro" },
        ]}
      />

      {posiblesReferentes.length > 0 && (
        <Selector
          etiqueta="Quién lo refirió"
          nombre="referido_por_contacto_id"
          opciones={[
            { valor: "", texto: "— nadie —" },
            ...posiblesReferentes.map((c) => ({ valor: c.id, texto: c.nombre })),
          ]}
        />
      )}

      <AreaTexto etiqueta="Notas" nombre="notas" />
    </Formulario>
  );
}
