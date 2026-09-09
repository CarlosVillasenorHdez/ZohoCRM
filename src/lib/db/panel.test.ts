import { describe, it, expect } from "vitest";
import { enlaceWhatsApp } from "./panel";

describe("enlaceWhatsApp", () => {
  it("agrega la lada de México a un celular de 10 dígitos", () => {
    expect(enlaceWhatsApp("55 1234 5678", "Hola")).toContain("wa.me/525512345678");
  });

  it("respeta un número que ya trae lada", () => {
    expect(enlaceWhatsApp("+52 55 1234 5678", "Hola")).toContain("wa.me/525512345678");
  });

  it("codifica el mensaje", () => {
    expect(enlaceWhatsApp("5512345678", "Hola Juan, ¿cómo estás?")).toContain("Hola%20Juan");
  });

  it("devuelve null si no hay teléfono utilizable", () => {
    expect(enlaceWhatsApp(null, "Hola")).toBeNull();
    expect(enlaceWhatsApp("123", "Hola")).toBeNull();
  });
});
