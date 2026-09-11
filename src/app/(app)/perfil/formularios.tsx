"use client";

import { cambiarMiPassword, cambiarMiUsuario } from "./acciones";
import { Formulario, Campo } from "@/components/ui";

export function FormulariosPerfil({ usuarioActual }: { usuarioActual: string }) {
  return (
    <div className="flex flex-col gap-11">
      <section>
        <h2 className="mb-1 font-semibold">Mi usuario de acceso</h2>
        <p className="mb-5 text-sm text-tinta-suave">
          Una sola palabra, sin acentos ni espacios. Es lo que vas a teclear para entrar.
        </p>
        <Formulario accion={cambiarMiUsuario} boton="Guardar usuario">
          <Campo etiqueta="Usuario" nombre="usuario" valor={usuarioActual} requerido />
        </Formulario>
      </section>

      <section className="border-t border-linea pt-9">
        <h2 className="mb-1 font-semibold">Mi contraseña</h2>
        <p className="mb-5 text-sm text-tinta-suave">
          Ponte una tuya. La que traes se creó desde el panel de Supabase.
        </p>
        <Formulario accion={cambiarMiPassword} boton="Guardar contraseña">
          <Campo etiqueta="Nueva contraseña" nombre="password" tipo="password" requerido />
          <Campo etiqueta="Repítela" nombre="confirma" tipo="password" requerido />
        </Formulario>
      </section>
    </div>
  );
}
