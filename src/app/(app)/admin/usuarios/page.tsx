import { redirect } from "next/navigation";
import { asesorActual } from "@/lib/supabase/server";
import { esSuperusuario, adminConfigurado } from "@/lib/supabase/admin";
import { listarUsuarios } from "./acciones";
import { PanelUsuarios } from "./panel";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const actual = await asesorActual();
  if (!actual) redirect("/login");

  if (!adminConfigurado()) {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-4 max-w-prose text-tinta-suave">
          Falta una variable de servidor para poder administrar cuentas desde aquí.
        </p>
        <div className="mt-5 border-l-2 border-l-linea pl-4 text-sm">
          <p>
            En Vercel agrega <code className="cifras">SUPABASE_SECRET_KEY</code>, que sacas de
            Supabase → Settings → API Keys → Secret keys.
          </p>
          <p className="mt-2 text-tinta-suave">
            Bypasea RLS por completo: nunca con prefijo <code>NEXT_PUBLIC_</code>, nunca en el
            repositorio.
          </p>
        </div>
      </main>
    );
  }

  if (!(await esSuperusuario())) {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-4 max-w-prose text-tinta-suave">
          Esta pantalla es solo del superusuario. Si deberías serlo, corre en el SQL Editor de
          Supabase:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md border border-linea bg-white p-4 text-sm">
{`update asesores set es_super = true
 where id = '${actual.id}';`}
        </pre>
      </main>
    );
  }

  const usuarios = await listarUsuarios();

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
      <p className="mt-1.5 max-w-prose text-tinta-suave">
        Cada usuario es un asesor con su cartera aislada. Tú administras las cuentas; no ves
        sus contactos, sus pólizas ni sus comisiones.
      </p>
      <div className="mt-8">
        <PanelUsuarios usuarios={usuarios} />
      </div>
    </main>
  );
}
