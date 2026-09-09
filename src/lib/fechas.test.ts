import { describe, it, expect } from "vitest";
import { retraso, fechaCorta } from "./fechas";

describe("retraso", () => {
  it("nombra hoy, ayer y mañana en vez de usar números", () => {
    expect(retraso(0)).toBe("hoy");
    expect(retraso(1)).toBe("mañana");
    expect(retraso(-1)).toBe("ayer");
  });

  it("expresa el pasado como tiempo transcurrido", () => {
    expect(retraso(-9)).toBe("hace 9 días");
  });

  it("expresa el futuro como tiempo faltante", () => {
    expect(retraso(12)).toBe("en 12 días");
  });
});

describe("fechaCorta", () => {
  it("no se corre de día por zona horaria", () => {
    // Un bug clásico: '2026-01-01' interpretado como UTC se muestra como 31 dic.
    expect(fechaCorta("2026-01-01")).toMatch(/01/);
  });
});
