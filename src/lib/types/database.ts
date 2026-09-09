/**
 * Tipos del esquema. Se corresponden 1:1 con supabase/migrations/0001_esquema_inicial.sql
 * Cuando cambie el esquema, este archivo se regenera con:
 *   npx supabase gen types typescript --project-id vlqswygrqmcbmcpchfwq
 */

export type Ramo = "ahorro" | "gmm" | "autos" | "vida" | "danos";
export type Moneda = "MXN" | "USD" | "UDI";
export type FormaPago = "anual" | "semestral" | "trimestral" | "mensual";

export const ETAPAS = [
  "primer_contacto",
  "cita_agendada",
  "analisis_necesidades",
  "cotizacion_presentada",
  "firma",
  "entrega",
] as const;
export type Etapa = (typeof ETAPAS)[number];

export const ETIQUETA_ETAPA: Record<Etapa, string> = {
  primer_contacto: "Primer contacto",
  cita_agendada: "Cita agendada",
  analisis_necesidades: "Análisis de necesidades",
  cotizacion_presentada: "Cotización presentada",
  firma: "Firma",
  entrega: "Entrega de póliza",
};

export const ETIQUETA_RAMO: Record<Ramo, string> = {
  ahorro: "Ahorro",
  gmm: "Gastos médicos",
  autos: "Autos",
  vida: "Vida",
  danos: "Daños",
};

export type MotivoPerdida =
  | "no_responde"
  | "precio"
  | "ya_tiene_seguro"
  | "no_le_interesa"
  | "no_califica"
  | "renueva_despues"
  | "otro";

export interface Contacto {
  id: string;
  asesor_id: string;
  tipo_persona: "fisica" | "moral";
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  genero: "m" | "f" | "otro" | null;
  email: string | null;
  telefono_movil: string | null;
  telefono_alterno: string | null;
  rfc: string | null;
  curp: string | null;
  ocupacion: string | null;
  origen: "referido" | "red_social" | "contacto_personal" | "evento" | "otro";
  referido_por_contacto_id: string | null;
  origen_detalle: string | null;
  notas: string | null;
  archivado: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Oportunidad {
  id: string;
  asesor_id: string;
  contacto_id: string;
  ramo: Ramo;
  subtipo: string | null;
  aseguradora_id: string | null;
  etapa: Etapa;
  etapa_cambiada_en: string;
  prima_estimada: number | null;
  moneda: Moneda;
  resultado: "ganada" | "perdida" | null;
  cerrada_en: string | null;
  motivo_perdida: MotivoPerdida | null;
  motivo_detalle: string | null;
  recontactar_en: string | null;
  poliza_id: string | null;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Poliza {
  id: string;
  asesor_id: string;
  contacto_id: string;
  aseguradora_id: string;
  oportunidad_id: string | null;
  numero_poliza: string;
  ramo: Ramo;
  subtipo: string | null;
  producto: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado: "vigente" | "vencida" | "cancelada" | "renovada" | "saldada";
  prima_total: number | null;
  moneda: Moneda;
  forma_pago: FormaPago;
  tipo_renovacion: "continua" | "nueva_poliza";
  poliza_anterior_id: string | null;
  comision_pct: number | null;
  comision_monto: number | null;
  datos: Record<string, unknown>;
  archivo_caratula: string | null;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Recibo {
  id: string;
  asesor_id: string;
  poliza_id: string;
  numero: number;
  fecha_vencimiento: string;
  monto: number | null;
  moneda: Moneda;
  estado: "pendiente" | "pagado" | "vencido" | "en_pausa" | "cancelado";
  fecha_pago: string | null;
  notas: string | null;
}

export type TipoActividad =
  | "cita" | "llamada" | "whatsapp" | "email" | "seguimiento"
  | "entrega" | "renovacion" | "cobranza" | "cumpleanos" | "nota" | "personal";

export interface Actividad {
  id: string;
  asesor_id: string;
  contacto_id: string | null;
  oportunidad_id: string | null;
  poliza_id: string | null;
  recibo_id: string | null;
  tipo: TipoActividad;
  titulo: string;
  descripcion: string | null;
  lugar: string | null;
  inicia_en: string;
  termina_en: string | null;
  todo_el_dia: boolean;
  estado: "pendiente" | "completada" | "cancelada" | "reagendada";
  completada_en: string | null;
  origen: "manual" | "automatica";
  clave_idempotencia: string | null;
}

/** Fila de la vista v_panel_dia */
export interface AlertaPanel {
  asesor_id: string;
  tipo_alerta: "actividad" | "recibo" | "renovacion" | "recontacto";
  referencia_id: string;
  contacto_id: string | null;
  titulo: string;
  detalle: string | null;
  fecha: string;
  urgencia: "vencida" | "hoy" | "proxima";
}
