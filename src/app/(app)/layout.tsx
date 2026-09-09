import Link from "next/link";
import { salir } from "@/app/login/actions";
import { asesorActual } from "@/lib/supabase/server";
import { esAdministrador, adminConfigurado } from "@/lib/supabase/admin";

const NAV = [
  { href: "/panel", texto: "Hoy" },
  { href: "/embudo", texto: "Embudo" },
  { href: "/contactos", texto: "Contactos" },
  { href: "/agenda", texto: "Agenda" },
];

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const actual = await asesorActual();
  const mostrarAdmin = adminConfigurado() && esAdministrador(actual?.email);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-6 sm:px-8">
      <header className="mb-7 border-b border-linea pb-3">
        <div className="flex items-baseline justify-between">
          <Link href="/panel" className="text-lg font-semibold tracking-tight">
            Cartera
          </Link>
          <form action={salir}>
            <button type="submit" className="text-sm text-tinta-suave hover:text-tinta">
              Salir
            </button>
          </form>
        </div>
        <nav className="mt-3 flex gap-5">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-tinta-suave hover:text-tinta">
              {n.texto}
            </Link>
          ))}
          {mostrarAdmin && (
            <Link href="/admin/usuarios" className="text-sm text-tinta-suave hover:text-tinta">
              Usuarios
            </Link>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
