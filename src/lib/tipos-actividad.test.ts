import { describe, it, expect } from "vitest";
import { TIPO, colorTipo, etiquetaTipo } from "./tipos-actividad";

describe("colores por tipo", () => {
  it("cubre todos los tipos que acepta la base", () => {
    const enLaBase = [
      "cita", "llamada", "whatsapp", "email", "seguimiento",
      "entrega", "renovacion", "cobranza", "cumpleanos", "nota", "personal",
    ];
    expect(Object.keys(TIPO).sort()).toEqual(enLaBase.sort());
  });

  it("no repite colores: dos tipos del mismo color serían indistinguibles", () => {
    const colores = Object.values(TIPO).map((t) => t.color);
    expect(new Set(colores).size).toBe(colores.length);
  });

  it("no usa el rojo de atrasado, reservado para la urgencia", () => {
    expect(Object.values(TIPO).map((t) => t.color)).not.toContain("#b4341f");
  });

  it("degrada sin romperse ante un tipo desconocido", () => {
    expect(colorTipo("inventado")).toMatch(/^#/);
    expect(etiquetaTipo("inventado")).toBe("inventado");
  });
});
