import Link from "next/link";
import { salir } from "@/app/login/actions";
import { asesorActual } from "@/lib/supabase/server";
import { esSuperusuario } from "@/lib/supabase/admin";
import { Lateral, Pestanas, type Destino } from "@/components/nav";
import {
  IconoHoy, IconoEmbudo, IconoContactos, IconoAgenda, IconoUsuarios, IconoPolizas,
} from "@/components/iconos";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const actual = await asesorActual();
  const admin = await esSuperusuario();

  const destinos: Destino[] = [
    { href: "/panel", texto: "Hoy", icono: <IconoHoy /> },
    { href: "/embudo", texto: "Embudo", icono: <IconoEmbudo /> },
    { href: "/polizas", texto: "Cartera", icono: <IconoPolizas /> },
    { href: "/contactos", texto: "Contactos", icono: <IconoContactos /> },
    { href: "/agenda", texto: "Agenda", icono: <IconoAgenda /> },
    ...(admin ? [{ href: "/admin/usuarios", texto: "Usuarios", icono: <IconoUsuarios /> }] : []),
  ];

  const pie = (
    <div>
      <Link href="/perfil" className="block truncate text-sm text-tinta-suave hover:text-tinta">
        Mi cuenta
      </Link>
      <form action={salir}>
        <button type="submit" className="mt-1.5 text-sm text-tinta-suave hover:text-tinta">
          Salir
        </button>
      </form>
    </div>
  );

  return (
    <div className="lg:flex">
      <Lateral destinos={destinos} pie={pie} />

      <header className="flex items-baseline justify-between border-b border-linea px-5 py-4 lg:hidden">
        <span className="text-lg font-semibold tracking-tight">Cartera</span>
        <div className="flex gap-5">
          <Link href="/perfil" className="text-sm text-tinta-suave">Mi cuenta</Link>
          <form action={salir}>
            <button type="submit" className="text-sm text-tinta-suave">Salir</button>
          </form>
        </div>
      </header>

      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 pb-28 pt-6 sm:px-8 lg:py-10">
          {children}
        </div>
      </div>

      <Pestanas destinos={destinos} />
    </div>
  );
}
