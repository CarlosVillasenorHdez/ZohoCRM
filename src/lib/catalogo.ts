/**
 * Catálogo de ramos, productos y los campos que pide cada uno.
 *
 * Fuente única: la usan el alta de cotización, el alta de póliza y las
 * fichas. Si viviera en cada pantalla, en dos semanas una cotización de
 * moto pediría placas y la póliza de la misma moto no.
 *
 * Decisión de producto: estos campos están FIJOS en el código. No hay un
 * armador de campos configurable, y no debe haberlo: que daños pida datos
 * del vehículo y gastos médicos pida deducible y coaseguro es conocimiento
 * del negocio metido en la herramienta. Un armador convierte esto en Zoho.
 *
 * Decisión de modelo: los campos se cuelgan del PRODUCTO, no del ramo. Así
 * "moto" pide placas y cobertura sin importar si se clasifica bajo daños o
 * bajo autos, que es una decisión del asesor y no del sistema.
 */

export type TipoCampo = "texto" | "numero" | "fecha" | "opcion" | "area";

export interface CampoRamo {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  opciones?: { valor: string; texto: string }[];
  ayuda?: string;
}

export type GrupoCampos = "vehiculo" | "inmueble" | "gmm" | "vida" | "ahorro" | "ninguno";

const COBERTURA = [
  { valor: "amplia", texto: "Amplia" },
  { valor: "limitada", texto: "Limitada" },
  { valor: "rc", texto: "Responsabilidad civil" },
];

export const CAMPOS: Record<GrupoCampos, CampoRamo[]> = {
  vehiculo: [
    { nombre: "marca", etiqueta: "Marca", tipo: "texto" },
    { nombre: "modelo", etiqueta: "Submarca o modelo", tipo: "texto" },
    { nombre: "anio", etiqueta: "Año", tipo: "numero" },
    { nombre: "placas", etiqueta: "Placas", tipo: "texto" },
    { nombre: "serie", etiqueta: "Número de serie (VIN)", tipo: "texto" },
    {
      nombre: "uso",
      etiqueta: "Uso",
      tipo: "opcion",
      opciones: [
        { valor: "particular", texto: "Particular" },
        { valor: "comercial", texto: "Comercial" },
        { valor: "carga", texto: "Carga" },
      ],
    },
    { nombre: "cobertura", etiqueta: "Cobertura", tipo: "opcion", opciones: COBERTURA },
    { nombre: "suma_asegurada", etiqueta: "Suma asegurada", tipo: "numero" },
    { nombre: "deducible_dm", etiqueta: "Deducible daños materiales %", tipo: "numero" },
  ],

  inmueble: [
    { nombre: "ubicacion", etiqueta: "Ubicación del riesgo", tipo: "texto" },
    {
      nombre: "tipo_inmueble",
      etiqueta: "Tipo",
      tipo: "opcion",
      opciones: [
        { valor: "casa", texto: "Casa habitación" },
        { valor: "departamento", texto: "Departamento" },
        { valor: "local", texto: "Local comercial" },
        { valor: "bodega", texto: "Bodega" },
        { valor: "oficina", texto: "Oficina" },
      ],
    },
    { nombre: "suma_edificio", etiqueta: "Suma asegurada del inmueble", tipo: "numero" },
    { nombre: "suma_contenidos", etiqueta: "Suma asegurada de contenidos", tipo: "numero" },
    { nombre: "coberturas", etiqueta: "Coberturas incluidas", tipo: "area" },
  ],

  gmm: [
    { nombre: "suma_asegurada", etiqueta: "Suma asegurada", tipo: "numero" },
    { nombre: "deducible", etiqueta: "Deducible", tipo: "numero" },
    { nombre: "coaseguro", etiqueta: "Coaseguro %", tipo: "numero" },
    { nombre: "tope_coaseguro", etiqueta: "Tope de coaseguro", tipo: "numero" },
    { nombre: "hospital", etiqueta: "Hospital o red", tipo: "texto" },
    { nombre: "num_asegurados", etiqueta: "Personas aseguradas", tipo: "numero" },
    {
      nombre: "edades",
      etiqueta: "Edades",
      tipo: "texto",
      ayuda: "La prima depende de ellas. Ej: 38, 35, 7, 4",
    },
    { nombre: "preexistencias", etiqueta: "Preexistencias declaradas", tipo: "area" },
  ],

  vida: [
    { nombre: "suma_asegurada", etiqueta: "Suma asegurada", tipo: "numero" },
    { nombre: "plazo_anios", etiqueta: "Plazo en años", tipo: "numero" },
    {
      nombre: "fumador",
      etiqueta: "Fumador",
      tipo: "opcion",
      opciones: [
        { valor: "no", texto: "No" },
        { valor: "si", texto: "Sí" },
      ],
    },
    { nombre: "beneficiario", etiqueta: "Beneficiarios", tipo: "area" },
  ],

  ahorro: [
    { nombre: "plazo_anios", etiqueta: "Plazo en años", tipo: "numero" },
    { nombre: "aportacion", etiqueta: "Aportación por recibo", tipo: "numero" },
    { nombre: "meta", etiqueta: "Para qué es", tipo: "texto", ayuda: "Retiro, universidad, patrimonio…" },
    { nombre: "beneficiario", etiqueta: "Beneficiarios", tipo: "area" },
  ],

  ninguno: [],
};

export interface Producto {
  valor: string;
  texto: string;
  grupo: GrupoCampos;
}

export interface RamoDef {
  valor: string;
  etiqueta: string;
  productos: Producto[];
}

export const RAMOS: RamoDef[] = [
  {
    valor: "danos",
    etiqueta: "Daños",
    productos: [
      { valor: "moto", texto: "Moto", grupo: "vehiculo" },
      { valor: "auto", texto: "Automóvil", grupo: "vehiculo" },
      { valor: "pickup", texto: "Pick-up o camioneta", grupo: "vehiculo" },
      { valor: "carga", texto: "Camión de carga", grupo: "vehiculo" },
      { valor: "casa", texto: "Casa habitación", grupo: "inmueble" },
      { valor: "negocio", texto: "Negocio o comercio", grupo: "inmueble" },
      { valor: "rc", texto: "Responsabilidad civil", grupo: "ninguno" },
      { valor: "transporte", texto: "Transporte de mercancías", grupo: "ninguno" },
      { valor: "otro_danos", texto: "Otro", grupo: "ninguno" },
    ],
  },
  {
    valor: "autos",
    etiqueta: "Autos",
    productos: [
      { valor: "auto", texto: "Automóvil", grupo: "vehiculo" },
      { valor: "moto", texto: "Moto", grupo: "vehiculo" },
      { valor: "pickup", texto: "Pick-up o camioneta", grupo: "vehiculo" },
      { valor: "flotilla", texto: "Flotilla", grupo: "vehiculo" },
    ],
  },
  {
    valor: "gmm",
    etiqueta: "Gastos médicos",
    productos: [
      { valor: "individual", texto: "Individual", grupo: "gmm" },
      { valor: "familiar", texto: "Familiar", grupo: "gmm" },
      { valor: "colectivo", texto: "Colectivo o empresarial", grupo: "gmm" },
    ],
  },
  {
    valor: "vida",
    etiqueta: "Vida",
    productos: [
      { valor: "temporal", texto: "Temporal", grupo: "vida" },
      { valor: "vitalicio", texto: "Vitalicio", grupo: "vida" },
      { valor: "vida_inversion", texto: "Vida con inversión", grupo: "vida" },
      { valor: "accidentes", texto: "Accidentes personales", grupo: "vida" },
    ],
  },
  {
    valor: "ahorro",
    etiqueta: "Ahorro",
    productos: [
      { valor: "retiro", texto: "Ahorro para el retiro", grupo: "ahorro" },
      { valor: "segubeca", texto: "SeguBeca (educativo)", grupo: "ahorro" },
      { valor: "ahorro_puro", texto: "Ahorro puro", grupo: "ahorro" },
      { valor: "dotal", texto: "Dotal", grupo: "ahorro" },
    ],
  },
];

export function ramoDef(ramo: string): RamoDef | undefined {
  return RAMOS.find((r) => r.valor === ramo);
}

export function productosDe(ramo: string): Producto[] {
  return ramoDef(ramo)?.productos ?? [];
}

/** Campos que corresponden a un ramo y producto concretos. */
export function camposDe(ramo: string, producto: string | null | undefined): CampoRamo[] {
  const p = productosDe(ramo).find((x) => x.valor === producto);
  return CAMPOS[p?.grupo ?? "ninguno"];
}

export function etiquetaProducto(ramo: string, producto: string | null | undefined): string {
  if (!producto) return "";
  return productosDe(ramo).find((p) => p.valor === producto)?.texto ?? producto;
}

/** Lee del FormData solo los campos que aplican, para guardarlos en `datos`. */
export function leerDatos(
  ramo: string,
  producto: string | null | undefined,
  leer: (nombre: string) => string | null,
): Record<string, unknown> {
  const salida: Record<string, unknown> = {};
  for (const campo of camposDe(ramo, producto)) {
    const bruto = leer(campo.nombre);
    if (bruto === null || bruto === "") continue;
    if (campo.tipo === "numero") {
      const n = Number(bruto.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(n)) salida[campo.nombre] = n;
    } else {
      salida[campo.nombre] = bruto;
    }
  }
  return salida;
}

/** Para mostrar `datos` en una ficha, con etiquetas legibles y en orden. */
export function describirDatos(
  ramo: string,
  producto: string | null | undefined,
  datos: Record<string, unknown> | null | undefined,
): { etiqueta: string; valor: string }[] {
  if (!datos) return [];
  const salida: { etiqueta: string; valor: string }[] = [];

  for (const campo of camposDe(ramo, producto)) {
    const v = datos[campo.nombre];
    if (v === null || v === undefined || v === "") continue;
    const texto =
      campo.tipo === "opcion"
        ? (campo.opciones?.find((o) => o.valor === String(v))?.texto ?? String(v))
        : String(v);
    salida.push({ etiqueta: campo.etiqueta, valor: texto });
  }

  // Cualquier dato viejo que ya no esté en el catálogo se sigue mostrando,
  // para no esconder lo que se capturó antes de un cambio de campos.
  const conocidos = new Set(camposDe(ramo, producto).map((c) => c.nombre));
  for (const [k, v] of Object.entries(datos)) {
    if (conocidos.has(k) || v === null || v === "" || v === undefined) continue;
    salida.push({ etiqueta: k.replace(/_/g, " "), valor: String(v) });
  }

  return salida;
}
