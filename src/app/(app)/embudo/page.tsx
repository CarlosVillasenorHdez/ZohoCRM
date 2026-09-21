import Link from "next/link";
import { redirect } from "next/navigation";
import { asesorActual, clienteServidor } from "@/lib/supabase/server";
import { Kanban, type Tarjeta } from "@/components/kanban";
import { Kpi, BarraEtapas } from "@/components/kpi";
import { diasDesdeHoy } from "@/lib/fechas";
import { tonoPorDias, COLOR_TONO } from "@/lib/antiguedad";
import { ETAPAS, ETIQUETA_ETAPA, type Ramo, type Etapa } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const DINERO = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 0,
});
const CORTO = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", notation: "compact", maximumFractionDigits: 1,
});

export default async function Embudo() {
  const asesor = await asesorActual();
  if (!asesor) redirect("/login");
  const supabase = await clienteServidor();

  const [{ data, error }, { data: resumen }] = await Promise.all([
    supabase
      .from("oportunidades")
      .select("id, contacto_id, ramo, subtipo, etapa, etapa_cambiada_en, prima_estimada")
      .eq("asesor_id", asesor.id)
      .is("resultado", null)
      .order("etapa_cambiada_en", { ascending: true }),
    supabase.from("v_embudo_resumen").select("*").eq("asesor_id", asesor.id).maybeSingle(),
  ]);

  const filas = data ?? [];
  const ids = [...new Set(filas.map((o) => o.contacto_id))];
  const nombres = new Map<string, string>();
  if (ids.length > 0) {
    const { data: cs } = await supabase.from("contactos").select("id, nombre, apellido_paterno").in("id", ids);
    for (const c of cs ?? []) nombres.set(c.id, [c.nombre, c.apellido_paterno].filter(Boolean).join(" "));
  }

  const tarjetas: Tarjeta[] = filas.map((o) => ({
    id: o.id,
    contacto_id: o.contacto_id,
    nombre: nombres.get(o.contacto_id) ?? "Sin nombre",
    ramo: o.ramo as Ramo,
    subtipo: o.subtipo,
    etapa: o.etapa as Etapa,
    prima: o.prima_estimada === null ? null : Number(o.prima_estimada),
    diasEnEtapa: diasDesdeHoy(o.etapa_cambiada_en),
  }));

  const total = tarjetas.reduce((s, t) => s + (t.prima ?? 0), 0);
  const heladas = tarjetas.filter((t) => tonoPorDias(t.diasEnEtapa) === "helado");
  const ganadas = Number(resumen?.ganadas_90d ?? 0);
  const perdidas = Number(resumen?.perdidas_90d ?? 0);
  const cerradas = ganadas + perdidas;
  const conversion = cerradas > 0 ? Math.round((ganadas / cerradas) * 100) : null;
  const diasCierre = resumen?.dias_para_cerrar ?? null;

  const partes = ETAPAS.map((e, i) => ({
    etiqueta: ETIQUETA_ETAPA[e],
    valor: tarjetas.filter((t) => t.etapa === e).length,
    tono: `hsl(200 ${18 + i * 9}% ${58 - i * 6}%)`,
  }));

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Embudo</h1>
        <Link href="/contactos" className="text-sm font-medium underline underline-offset-4">
          Nueva cotización
        </Link>
      </div>

      {error && (
        <p role="alert" className="border-l-2 border-l-atrasado py-2 pl-4 text-atrasado">
          {error.message}
        </p>
      )}

      {tarjetas.length === 0 && !error ? (
        <div className="border-t border-linea pt-7">
          <p className="max-w-prose text-tinta-suave">
            Las cotizaciones se crean desde la ficha de un contacto, con el botón
            &ldquo;Cotizar algo&rdquo;. Una persona puede tener varias abiertas a la vez: su auto
            y el gastos médicos de la familia son dos oportunidades distintas.
          </p>
          <Link href="/contactos" className="mt-5 inline-block rounded-md bg-tinta px-4 py-2.5 font-medium text-papel">
            Ir a contactos
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi etiqueta="En la calle" valor={CORTO.format(total)} nota={`${tarjetas.length} cotizaciones abiertas`} />
            <Kpi
              etiqueta="Sin moverse"
              valor={String(heladas.length)}
              nota={heladas.length > 0 ? "más de 2 semanas paradas" : "todo en movimiento"}
              tono={heladas.length > 0 ? "malo" : "bueno"}
            />
            <Kpi
              etiqueta="Cierre"
              valor={conversion === null ? "—" : `${conversion}%`}
              nota={cerradas > 0 ? `${ganadas} de ${cerradas} en 90 días` : "sin cierres todavía"}
              tono={conversion === null ? "neutro" : conversion >= 30 ? "bueno" : "aviso"}
            />
            <Kpi
              etiqueta="Tarda en cerrar"
              valor={diasCierre === null ? "—" : `${diasCierre} d`}
              nota="promedio de las ganadas"
            />
          </div>

          <div className="mb-7">
            <BarraEtapas partes={partes} />
          </div>

          {heladas.length > 0 && (
            <div className="mb-7 rounded-lg border border-linea bg-white p-4">
              <h2 className="text-sm font-semibold">
                <span style={{ color: COLOR_TONO.helado }}>●</span> Lo que se te está enfriando
              </h2>
              <p className="mt-1 text-sm text-tinta-suave">
                Llevan más de dos semanas en la misma etapa. En seguros, una cotización parada
                rara vez se cierra sola.
              </p>
              <ul className="mt-3 divide-y divide-linea">
                {heladas.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-baseline justify-between gap-3 py-2">
                    <Link href={`/contactos/${t.contacto_id}`} className="text-sm font-medium underline-offset-4 hover:underline">
                      {t.nombre}
                    </Link>
                    <span className="cifras shrink-0 text-sm text-atrasado">
                      {Math.abs(t.diasEnEtapa)} d en {ETIQUETA_ETAPA[t.etapa].toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
              {heladas.length > 5 && (
                <p className="mt-2 text-xs text-tinta-suave">y {heladas.length - 5} más abajo.</p>
              )}
            </div>
          )}

          <Kanban tarjetas={tarjetas} />

          <p className="mt-4 text-xs text-tinta-suave">
            El color de cada tarjeta dice cuánto lleva parada: verde hasta 3 días, oliva hasta una
            semana, ámbar hasta dos, rojo más allá. Arrástralas entre columnas, o usa el selector
            desde el celular. {DINERO.format(total)} en prima estimada abierta.
          </p>
        </>
      )}
    </main>
  );
}
