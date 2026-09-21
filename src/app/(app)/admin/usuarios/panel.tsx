"use client";

import { useState } from "react";
import { crearUsuario, cambiarPassword, cambiarActivo } from "./acciones";
import { Formulario, Campo } from "@/components/ui";

import type { FilaUsuario as Usuario } from "./acciones";

function sugerirPassword(): string {
  const abc = "abcdefghijkmnopqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789";
  const n = new Uint32Array(14);
  crypto.getRandomValues(n);
  return Array.from(n, (v) => abc[v % abc.length]).join("");
}

export function PanelUsuarios({ usuarios }: { usuarios: Usuario[] }) {
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [sugerida, setSugerida] = useState("");

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
      <section>
        <h2 className="mb-1 text-sm font-semibold text-tinta-suave">
          {usuarios.length} cuenta{usuarios.length === 1 ? "" : "s"}
        </h2>
        <ul className="divide-y divide-linea">
          {usuarios.map((u) => (
            <li key={u.id} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{u.nombre}</span>
                <span className="cifras shrink-0 text-sm text-tinta-suave">{u.usuario}</span>
              </div>
              <p className="cifras mt-0.5 text-sm text-tinta-suave">
                entra con {u.usa_usuario_corto ? u.usuario : u.correo_de_acceso}
              </p>
              <p className="mt-0.5 text-sm text-tinta-suave">
                {u.activo ? "Activo" : "Suspendido"}
                {u.es_super ? " · superusuario" : ""}
                {!u.confirmado ? " · sin confirmar" : ""}
              </p>

              {!u.usa_usuario_corto && (
                <p className="mt-2 border-l-2 border-l-proximo py-1.5 pl-3 text-sm">
                  Esta cuenta entra con su correo completo, así que no aparece en la lista de la
                  pantalla de acceso. Para que aparezca, su dueño se fija un usuario desde Mi
                  cuenta, o tú se lo cambias en Supabase → Authentication → Users → Update user,
                  poniendo <span className="cifras">{u.usuario}@cartera.app</span>.
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    setEditando(editando === u.id ? null : u.id);
                    setSugerida(sugerirPassword());
                  }}
                  className="text-sm underline underline-offset-4"
                >
                  Cambiar contraseña
                </button>
                <form action={cambiarActivo}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="activar" value={u.activo ? "0" : "1"} />
                  <button className="text-sm text-tinta-suave underline underline-offset-4">
                    {u.activo ? "Suspender acceso" : "Reactivar"}
                  </button>
                </form>
              </div>

              {editando === u.id && (
                <div className="mt-4 border-l-2 border-l-linea pl-4">
                  <Formulario accion={cambiarPassword} boton="Guardar contraseña" ocultos={{ user_id: u.id }}>
                    <Campo
                      etiqueta="Nueva contraseña"
                      nombre="password"
                      valor={sugerida}
                      requerido
                      ayuda="Se muestra en claro a propósito: cópiala ahora, no se vuelve a ver."
                    />
                  </Formulario>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <aside className="mt-10 border-t border-linea pt-7 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        {abierto ? (
          <>
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-semibold">Nueva cuenta</h2>
              <button onClick={() => setAbierto(false)} className="text-sm text-tinta-suave">
                Cancelar
              </button>
            </div>
            <Formulario accion={crearUsuario} boton="Crear cuenta">
              <Campo etiqueta="Nombre del asesor" nombre="nombre" requerido />
              <Campo
                etiqueta="Usuario"
                nombre="usuario"
                requerido
                ayuda="Con esto entra. Una sola palabra, sin acentos ni espacios."
              />
              <Campo etiqueta="Contraseña" nombre="password" valor={sugerida} requerido />
              <Campo
                etiqueta="Correo de contacto"
                nombre="email_contacto"
                tipo="email"
                ayuda="Opcional. Es dato de contacto, no sirve para entrar."
              />
            </Formulario>
          </>
        ) : (
          <button
            onClick={() => {
              setAbierto(true);
              setSugerida(sugerirPassword());
            }}
            className="w-full rounded-md bg-tinta px-4 py-2.5 font-medium text-papel"
          >
            Crear cuenta
          </button>
        )}
      </aside>
    </div>
  );
}
