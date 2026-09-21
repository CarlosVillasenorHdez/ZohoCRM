import { describe, it, expect } from "vitest";
import { tonoPorDias, TEXTO_TONO } from "./antiguedad";

describe("tonoPorDias", () => {
  it("clasifica por cortes del negocio, no arbitrarios", () => {
    expect(tonoPorDias(0)).toBe("fresco");
    expect(tonoPorDias(-3)).toBe("fresco");
    expect(tonoPorDias(-5)).toBe("tibio");
    expect(tonoPorDias(-10)).toBe("frio");
    expect(tonoPorDias(-30)).toBe("helado");
  });

  it("no depende del signo: los días parados son magnitud", () => {
    expect(tonoPorDias(-20)).toBe(tonoPorDias(20));
  });

  it("cada tono tiene texto legible", () => {
    expect(TEXTO_TONO[tonoPorDias(-30)]).toMatch(/Abandonada/);
  });
});
