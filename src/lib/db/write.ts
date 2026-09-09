/**
 * ÚNICA fuente de verdad para escrituras a la base de datos.
 *
 * Regla del proyecto: ningún componente, ruta ni acción llama a
 * `.insert()`, `.update()`, `.delete()` o `.rpc()` directamente.
 * Todo pasa por aquí.
 *
 * El motivo es el "guardado silencioso". Hay dos formas de perder datos
 * sin enterarte, y las dos se cierran en este archivo:
 *
 *   1. `error` viene lleno y nadie lo revisa. La UI dice "guardado".
 *   2. Peor: `error` viene en null, la operación "tuvo éxito" y afectó
 *      CERO filas. Pasa siempre que RLS bloquea la fila, o cuando el id
 *      no existe. PostgREST responde 200 con un arreglo vacío. Para el
 *      código parece un guardado correcto.
 *
 * Por eso todas las funciones de aquí exigen que la consulta traiga
 * `.select()` encadenado y verifican que haya vuelto al menos una fila.
 */

export type ResultadoSupabase<T> = {
  data: T | null;
  error: { message: string; code?: string; details?: string; hint?: string } | null;
};

/** Algo con `.then()`: sirve tanto para un PostgrestBuilder como para una promesa. */
export type ConsultaEscritura<T> = PromiseLike<ResultadoSupabase<T>>;

export class ErrorDeEscritura extends Error {
  readonly operacion: string;
  readonly codigo: string | null;
  readonly detalle: string | null;
  readonly sinFilas: boolean;

  constructor(args: {
    operacion: string;
    mensaje: string;
    codigo?: string | null;
    detalle?: string | null;
    sinFilas?: boolean;
  }) {
    super(`[${args.operacion}] ${args.mensaje}`);
    this.name = "ErrorDeEscritura";
    this.operacion = args.operacion;
    this.codigo = args.codigo ?? null;
    this.detalle = args.detalle ?? null;
    this.sinFilas = args.sinFilas ?? false;
  }

  /** Mensaje apto para mostrarle al usuario, sin jerga de Postgres. */
  paraUsuario(): string {
    if (this.sinFilas) {
      return "No se guardó nada. El registro no existe o no tienes permiso sobre él.";
    }
    switch (this.codigo) {
      case "23505":
        return "Ya existe un registro con ese dato. Revisa si lo capturaste antes.";
      case "23503":
        return "Falta un dato relacionado o el registro está ligado a otro.";
      case "23514":
        return "Alguno de los datos no es válido para este tipo de registro.";
      case "42501":
        return "No tienes permiso para hacer este cambio.";
      default:
        return "No se pudo guardar. Vuelve a intentarlo; si sigue fallando, avísale a soporte.";
    }
  }
}

function revisar<T>(operacion: string, resultado: ResultadoSupabase<T>): T {
  const { data, error } = resultado;

  if (error) {
    throw new ErrorDeEscritura({
      operacion,
      mensaje: error.message,
      codigo: error.code ?? null,
      detalle: error.details ?? error.hint ?? null,
    });
  }

  if (data === null || data === undefined) {
    throw new ErrorDeEscritura({
      operacion,
      mensaje:
        "La consulta no devolvió filas. ¿Le falta .select() encadenado? " +
        "Sin .select() no hay forma de saber si la escritura realmente ocurrió.",
      sinFilas: true,
    });
  }

  if (Array.isArray(data) && data.length === 0) {
    throw new ErrorDeEscritura({
      operacion,
      mensaje:
        "La operación afectó 0 filas. Causas típicas: RLS bloqueó la fila, " +
        "o el id del filtro no existe.",
      sinFilas: true,
    });
  }

  return data;
}

/** Ejecuta una escritura y truena si falló o si no tocó ninguna fila. */
export async function escribir<T>(
  operacion: string,
  consulta: ConsultaEscritura<T>,
): Promise<T> {
  let resultado: ResultadoSupabase<T>;
  try {
    resultado = await consulta;
  } catch (causa) {
    throw new ErrorDeEscritura({
      operacion,
      mensaje: causa instanceof Error ? causa.message : "Fallo de red o del cliente",
      detalle: causa instanceof Error ? (causa.stack ?? null) : null,
    });
  }
  return revisar(operacion, resultado);
}

/**
 * Igual que `escribir`, pero para consultas con `.select().single()`,
 * que devuelven un objeto en vez de un arreglo.
 */
export async function escribirUna<T>(
  operacion: string,
  consulta: ConsultaEscritura<T>,
): Promise<T> {
  const filas = await escribir(operacion, consulta);
  if (Array.isArray(filas)) {
    const primera = filas[0];
    if (primera === undefined) {
      throw new ErrorDeEscritura({
        operacion,
        mensaje: "Se esperaba una fila y no llegó ninguna.",
        sinFilas: true,
      });
    }
    return primera as T;
  }
  return filas;
}

/**
 * Envuelve una escritura para usarla desde la UI sin try/catch en cada
 * llamada. Nunca se traga el error: lo devuelve como valor tipado para
 * que quien llama esté obligado a decidir qué mostrar.
 */
export type Resultado<T> =
  | { ok: true; datos: T }
  | { ok: false; mensaje: string; error: ErrorDeEscritura };

export async function intentar<T>(
  operacion: string,
  consulta: ConsultaEscritura<T>,
): Promise<Resultado<T>> {
  try {
    return { ok: true, datos: await escribir(operacion, consulta) };
  } catch (causa) {
    const error =
      causa instanceof ErrorDeEscritura
        ? causa
        : new ErrorDeEscritura({
            operacion,
            mensaje: causa instanceof Error ? causa.message : String(causa),
          });
    console.error(error.message, { codigo: error.codigo, detalle: error.detalle });
    return { ok: false, mensaje: error.paraUsuario(), error };
  }
}
