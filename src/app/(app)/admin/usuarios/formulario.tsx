"use client";

import { crearUsuario } from "./acciones";
import { Formulario, Campo } from "@/components/ui";

export function FormularioUsuario() {
  return (
    <Formulario accion={crearUsuario} boton="Crear usuario">
      <Campo etiqueta="Nombre" nombre="nombre" requerido />
      <Campo etiqueta="Correo" nombre="email" tipo="email" requerido />
      <Campo
        etiqueta="Contraseña"
        nombre="password"
        tipo="text"
        requerido
        ayuda="Mínimo 10 caracteres. Se muestra en claro a propósito: cópiala ahora, no se vuelve a ver."
      />
    </Formulario>
  );
}
