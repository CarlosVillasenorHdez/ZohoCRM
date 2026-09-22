"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLinkStatus } from "next/link";

export type Destino = { href: string; texto: string; icono: React.ReactNode };

function activo(ruta: string, href: string) {
  return ruta === href || ruta.startsWith(`${href}/`);
}

/** Punto que aparece mientras la ruta se está cargando. */
function Pendiente() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-tinta-suave"
    />
  );
}

export function Lateral({ destinos, pie }: { destinos: Destino[]; pie: React.ReactNode }) {
  const ruta = usePathname();
  return (
    <nav className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-linea lg:px-5 lg:py-7">
      <Link href="/panel" className="mb-9 text-lg font-semibold tracking-tight">Cartera</Link>
      <ul className="flex flex-col gap-0.5">
        {destinos.map((d) => (
          <li key={d.href}>
            <Link
              href={d.href}
              prefetch
              aria-current={activo(ruta, d.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                activo(ruta, d.href)
                  ? "bg-papel-hondo font-medium text-tinta"
                  : "text-tinta-suave hover:bg-papel-hondo/60 hover:text-tinta"
              }`}
            >
              <span className="text-tinta-suave">{d.icono}</span>
              {d.texto}
              <Pendiente />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">{pie}</div>
    </nav>
  );
}

export function Pestanas({ destinos }: { destinos: Destino[] }) {
  const ruta = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-linea bg-papel/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-lg">
        {destinos.map((d) => (
          <li key={d.href} className="flex-1">
            <Link
              href={d.href}
              prefetch
              aria-current={activo(ruta, d.href) ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                activo(ruta, d.href) ? "text-tinta" : "text-tinta-suave"
              }`}
            >
              {d.icono}
              {d.texto}
              <span className="absolute right-3 top-2"><Pendiente /></span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
