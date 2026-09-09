import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { esAdministrador, adminConfigurado } from "@/lib/supabase/admin";
import { FormularioUsuario } from "./formulario";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const actual = await asesorActual();
  if (!actual) redirect("/login");

  if (!adminConfigurado()) {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-4 text-tinta-suave">
          Falta configurar esta pantalla. En Vercel agrega dos variables de servidor:
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="border-l-2 border-l-linea pl-4">
            <code>SUPABASE_SECRET_KEY</code> — de Supabase, Settings → API Keys → Secret keys.
            Bypasea RLS: nunca con prefijo <code>NEXT_PUBLIC_</code>.
          </li>
          <li className="border-l-2 border-l-linea pl-4">
            <code>ADMIN_EMAIL</code> — tu correo. Solo esa cuenta ve esta pantalla.
          </li>
        </ul>
      </main>
    );
  }

  if (!esAdministrador(actual.email)) {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-4 text-tinta-suave">Esta pantalla es solo del administrador.</p>
      </main>
    );
  }

  const supabase = await clienteServidor();
  const { data: yo } = await supabase.from("asesores").select("nombre, email").eq("id", actual.id).maybeSingle();

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
      <p className="mt-1.5 text-tinta-suave">
        Entraste como {yo?.nombre ?? actual.email}. Cada usuario nuevo es un asesor con su
        cartera aislada: no ve nada de los demás.
      </p>
      <div className="mt-8">
        <FormularioUsuario />
      </div>
    </main>
  );
}
