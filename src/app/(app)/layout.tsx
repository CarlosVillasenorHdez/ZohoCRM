import Link from "next/link";
import { salir } from "@/app/login/actions";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-6 sm:px-8">
      <header className="mb-8 flex items-baseline justify-between border-b border-linea pb-4">
        <Link href="/panel" className="text-lg font-semibold tracking-tight">
          Cartera
        </Link>
        <form action={salir}>
          <button type="submit" className="text-sm text-tinta-suave hover:text-tinta">
            Salir
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
