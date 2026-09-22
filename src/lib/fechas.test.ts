import { describe, it, expect, vi, afterEach } from "vitest";
import { retraso, fechaCorta, fechaLarga, diasDesdeHoy, hoyISO } from "./fechas";

afterEach(() => vi.useRealTimers());

describe("fechaLarga", () => {
  it("no se recorre un día cuando el servidor corre en UTC", () => {
    // El bug real: Vercel corre en UTC. A las 00:30 UTC del miércoles 9 son
    // las 18:30 del martes 8 en México; a las 20:00 UTC del 9 siguen siendo
    // el 9 en México. Formatear mal restaba 6h dos veces.
    expect(fechaLarga("2026-09-09")).toContain("9");
    expect(fechaLarga("2026-09-09")).toMatch(/mi[ée]rcoles/i);
  });

  it("respeta el primer día del mes", () => {
    expect(fechaLarga("2026-01-01")).toContain("1");
    expect(fechaLarga("2026-01-01")).toMatch(/enero/i);
  });
});

describe("hoyISO", () => {
  it("da el día de México, no el del servidor", () => {
    // 03:00 UTC del 9 de septiembre = 21:00 del 8 en México.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T03:00:00Z"));
    expect(hoyISO()).toBe("2026-09-08");
  });

  it("y no se queda atrás durante el día", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T20:00:00Z"));
    expect(hoyISO()).toBe("2026-09-09");
  });
});

describe("diasDesdeHoy", () => {
  it("cuenta días civiles, no periodos de 24 horas", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T20:00:00Z")); // 9 en México
    expect(diasDesdeHoy("2026-09-09")).toBe(0);
    expect(diasDesdeHoy("2026-09-12")).toBe(3);
    expect(diasDesdeHoy("2026-09-04")).toBe(-5);
  });
});

describe("retraso", () => {
  it("nombra hoy, ayer y mañana en vez de usar números", () => {
    expect(retraso(0)).toBe("hoy");
    expect(retraso(1)).toBe("mañana");
    expect(retraso(-1)).toBe("ayer");
  });
  it("expresa el pasado y el futuro en palabras", () => {
    expect(retraso(-9)).toBe("hace 9 días");
    expect(retraso(12)).toBe("en 12 días");
  });
});

describe("fechaCorta", () => {
  it("no se corre de día por zona horaria", () => {
    expect(fechaCorta("2026-01-01")).toMatch(/01/);
  });
});

describe("rejillaMes", () => {
  it("siempre devuelve 42 celdas", async () => {
    const { rejillaMes } = await import("./fechas");
    expect(rejillaMes("2026-09")).toHaveLength(42);
    expect(rejillaMes("2026-02")).toHaveLength(42);
  });

  it("empieza en lunes", async () => {
    const { rejillaMes } = await import("./fechas");
    // 1 de septiembre de 2026 es martes, así que la rejilla abre el lunes 31 de agosto.
    expect(rejillaMes("2026-09")[0]?.iso).toBe("2026-08-31");
  });

  it("marca cuáles celdas son del mes pedido", async () => {
    const { rejillaMes } = await import("./fechas");
    const c = rejillaMes("2026-09");
    expect(c[0]?.delMes).toBe(false);
    expect(c.filter((x) => x.delMes)).toHaveLength(30);
  });
});

describe("mesVecino", () => {
  it("cruza el fin de año en ambos sentidos", async () => {
    const { mesVecino } = await import("./fechas");
    expect(mesVecino("2026-12", 1)).toBe("2027-01");
    expect(mesVecino("2026-01", -1)).toBe("2025-12");
  });
});

describe("límites de mes para consultas", () => {
  it("el mes siguiente sirve como tope superior en meses de 30 días y en febrero", async () => {
    const { mesVecino } = await import("./fechas");
    // El bug: construir `${mes}-31` produce fechas inexistentes como
    // 2026-09-31 o 2026-02-31, y Postgres rechaza la consulta entera.
    expect(mesVecino("2026-09", 1)).toBe("2026-10");
    expect(mesVecino("2026-02", 1)).toBe("2026-03");
    expect(mesVecino("2024-02", 1)).toBe("2024-03"); // bisiesto
  });
});
