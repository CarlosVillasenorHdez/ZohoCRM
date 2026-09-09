import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  escribir,
  escribirUna,
  intentar,
  ErrorDeEscritura,
  type ResultadoSupabase,
} from "./write";

/** Simula lo que devuelve el cliente de Supabase. */
function respuesta<T>(r: ResultadoSupabase<T>): PromiseLike<ResultadoSupabase<T>> {
  return Promise.resolve(r);
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("escribir", () => {
  it("devuelve los datos cuando la escritura funciona", async () => {
    const datos = await escribir("crear contacto", respuesta({ data: [{ id: "abc" }], error: null }));
    expect(datos).toEqual([{ id: "abc" }]);
  });

  it("truena cuando Supabase devuelve error", async () => {
    await expect(
      escribir("crear contacto", respuesta({ data: null, error: { message: "boom", code: "23505" } })),
    ).rejects.toBeInstanceOf(ErrorDeEscritura);
  });

  it("incluye la operación en el mensaje para poder rastrearla", async () => {
    await expect(
      escribir("crear póliza", respuesta({ data: null, error: { message: "boom" } })),
    ).rejects.toThrow(/\[crear póliza\]/);
  });

  // ---- El caso que motivó todo este archivo ----

  it("truena cuando la operación reporta éxito pero afectó 0 filas (RLS)", async () => {
    // Un update bloqueado por RLS responde exactamente así: sin error, arreglo vacío.
    const promesa = escribir("actualizar etapa", respuesta({ data: [], error: null }));
    await expect(promesa).rejects.toBeInstanceOf(ErrorDeEscritura);
    await expect(promesa).rejects.toThrow(/0 filas/);
  });

  it("marca sinFilas para distinguirlo de un error del servidor", async () => {
    try {
      await escribir("actualizar etapa", respuesta({ data: [], error: null }));
      expect.unreachable("debió tronar");
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorDeEscritura);
      expect((e as ErrorDeEscritura).sinFilas).toBe(true);
    }
  });

  it("truena cuando falta .select() encadenado (data en null sin error)", async () => {
    await expect(
      escribir("actualizar etapa", respuesta({ data: null, error: null })),
    ).rejects.toThrow(/select\(\)/);
  });

  it("captura fallos de red y no los deja pasar como éxito", async () => {
    await expect(
      escribir("crear contacto", Promise.reject(new Error("fetch failed"))),
    ).rejects.toBeInstanceOf(ErrorDeEscritura);
  });
});

describe("escribirUna", () => {
  it("desenvuelve el primer elemento del arreglo", async () => {
    const fila = await escribirUna("crear recibo", respuesta({ data: [{ id: 1 }], error: null }));
    expect(fila).toEqual({ id: 1 });
  });

  it("acepta un objeto directo (caso .single())", async () => {
    const fila = await escribirUna("crear recibo", respuesta({ data: { id: 1 }, error: null }));
    expect(fila).toEqual({ id: 1 });
  });
});

describe("intentar", () => {
  it("devuelve ok true con los datos", async () => {
    const r = await intentar("crear contacto", respuesta({ data: [{ id: "x" }], error: null }));
    expect(r.ok).toBe(true);
  });

  it("devuelve ok false y un mensaje legible en vez de tronar", async () => {
    const r = await intentar("crear contacto", respuesta({ data: [], error: null }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensaje).toMatch(/No se guardó nada/);
  });

  it("traduce el código de duplicado a lenguaje del usuario", async () => {
    const r = await intentar(
      "crear póliza",
      respuesta({ data: null, error: { message: "duplicate key", code: "23505" } }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensaje).toMatch(/Ya existe/);
  });

  it("deja rastro en consola para poder depurar", async () => {
    await intentar("crear póliza", respuesta({ data: null, error: { message: "x", code: "42501" } }));
    expect(console.error).toHaveBeenCalled();
  });
});
