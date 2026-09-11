import { describe, it, expect } from "vitest";
import { aCorreoDeAcceso, aUsuario, usuarioValido } from "./auth";

describe("aCorreoDeAcceso", () => {
  it("convierte el usuario corto en la cuenta interna", () => {
    expect(aCorreoDeAcceso("carlos")).toBe("carlos@cartera.app");
  });
  it("no toca un correo real", () => {
    expect(aCorreoDeAcceso("carlos@gmail.com")).toBe("carlos@gmail.com");
  });
  it("ignora mayúsculas y espacios, que es como la gente teclea", () => {
    expect(aCorreoDeAcceso("  Carlos  ")).toBe("carlos@cartera.app");
  });
});

describe("aUsuario", () => {
  it("quita el dominio interno para mostrarlo", () => {
    expect(aUsuario("carlos@cartera.app")).toBe("carlos");
  });
  it("deja intacto un correo externo", () => {
    expect(aUsuario("carlos@gmail.com")).toBe("carlos@gmail.com");
  });
  it("tolera que no haya sesión", () => {
    expect(aUsuario(undefined)).toBe("");
  });
});

describe("usuarioValido", () => {
  it("acepta lo razonable", () => {
    expect(usuarioValido("carlos")).toBe(true);
    expect(usuarioValido("ana.lopez")).toBe(true);
  });
  it("rechaza lo que rompería la cuenta", () => {
    expect(usuarioValido("ab")).toBe(false);          // muy corto
    expect(usuarioValido("con espacio")).toBe(false);
    expect(usuarioValido("con@arroba")).toBe(false);
    expect(usuarioValido("acentuadó")).toBe(false);
  });
});
