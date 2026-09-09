import { salir } from "@/app/login/actions";
import { asesorActual } from "@/lib/supabase/server";
import { esAdministrador, adminConfigurado } from "@/lib/supabase/admin";
import { Lateral, Pestanas, type Destino } from "@/components/nav";
import {
  IconoHoy, IconoEmbudo, IconoContactos, IconoAgenda, IconoUsuarios,
} from "@/components/iconos";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const actual = await asesorActual();
  const admin = adminConfigurado() && esAdministrador(actual?.email);

  const destinos: Destino[] = [
    { href: "/panel", texto: "Hoy", icono: <IconoHoy /> },
    { href: "/embudo", texto: "Embudo", icono: <IconoEmbudo /> },
    { href: "/contactos", texto: "Contactos", icono: <IconoContactos /> },
    { href: "/agenda", texto: "Agenda", icono: <IconoAgenda /> },
    ...(admin ? [{ href: "/admin/usuarios", texto: "Usuarios", icono: <IconoUsuarios /> }] : []),
  ];

  const pie = (
    <form action={salir}>
      <p className="truncate text-xs text-tinta-suave">{actual?.email}</p>
      <button type="submit" className="mt-1.5 text-sm text-tinta-suave hover:text-tinta">
        Salir
      </button>
    </form>
  );

  return (
    <div className="lg:flex">
      <Lateral destinos={destinos} pie={pie} />

      <header className="flex items-baseline justify-between border-b border-linea px-5 py-4 lg:hidden">
        <span className="text-lg font-semibold tracking-tight">Cartera</span>
        <form action={salir}>
          <button type="submit" className="text-sm text-tinta-suave">Salir</button>
        </form>
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
