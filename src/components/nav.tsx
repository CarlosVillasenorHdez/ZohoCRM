"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Destino = { href: string; texto: string; icono: React.ReactNode };

function activo(ruta: string, href: string) {
  return ruta === href || ruta.startsWith(`${href}/`);
}

/** Barra lateral, solo en laptop. */
export function Lateral({ destinos, pie }: { destinos: Destino[]; pie: React.ReactNode }) {
  const ruta = usePathname();
  return (
    <nav className="hidden lg:flex lg:h-dvh lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-linea lg:px-5 lg:py-7">
      <Link href="/panel" className="mb-9 text-lg font-semibold tracking-tight">
        Cartera
      </Link>
      <ul className="flex flex-col gap-0.5">
        {destinos.map((d) => (
          <li key={d.href}>
            <Link
              href={d.href}
              aria-current={activo(ruta, d.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                activo(ruta, d.href)
                  ? "bg-papel-hondo font-medium text-tinta"
                  : "text-tinta-suave hover:text-tinta"
              }`}
            >
              <span className="text-tinta-suave">{d.icono}</span>
              {d.texto}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">{pie}</div>
    </nav>
  );
}

/** Barra de pestañas abajo, solo en celular: queda al alcance del pulgar. */
export function Pestanas({ destinos }: { destinos: Destino[] }) {
  const ruta = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-linea bg-papel/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-lg">
        {destinos.map((d) => (
          <li key={d.href} className="flex-1">
            <Link
              href={d.href}
              aria-current={activo(ruta, d.href) ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                activo(ruta, d.href) ? "text-tinta" : "text-tinta-suave"
              }`}
            >
              {d.icono}
              {d.texto}
            </Link>
          </li>
        ))}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
