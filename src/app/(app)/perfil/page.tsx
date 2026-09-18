import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { esSuperusuario } from "@/lib/supabase/admin";
import { aUsuario, DOMINIO_INTERNO } from "@/lib/auth";
import { FormulariosPerfil } from "./formularios";

export const dynamic = "force-dynamic";

export default async function Perfil() {
  const actual = await asesorActual();
  if (!actual) redirect("/login");

  const supabase = await clienteServidor();
  const { data: perfil } = await supabase
    .from("asesores")
    .select("nombre, usuario, email")
    .eq("id", actual.id)
    .maybeSingle();

  const usuario = aUsuario(actual.email);
  const conCorreoReal = !actual.email?.endsWith(`@${DOMINIO_INTERNO}`);
  const superusuario = await esSuperusuario();

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
      <p className="mt-1.5 text-tinta-suave">
        {perfil?.nombre ?? "Sin nombre"}
        {superusuario ? " · superusuario" : ""}
      </p>

      {conCorreoReal && (
        <div className="mt-7 border-l-2 border-l-proximo py-3 pl-4">
          <p className="max-w-prose text-sm">
            Hoy entras escribiendo <span className="cifras">{actual.email}</span>, porque tu cuenta
            se creó desde el panel de Supabase. Cámbiala abajo por un usuario corto y a partir de
            ahí entras con una sola palabra — y aparecerás en la lista de la pantalla de acceso.
          </p>
          <p className="mt-2 max-w-prose text-sm text-tinta-suave">
            Tu identificador interno no cambia, así que conservas todos tus contactos, pólizas y
            citas.
          </p>
        </div>
      )}

      <div className="mt-8 max-w-md">
        <FormulariosPerfil usuarioActual={usuario} nombreActual={perfil?.nombre ?? ""} />
      </div>
    </main>
  );
}
