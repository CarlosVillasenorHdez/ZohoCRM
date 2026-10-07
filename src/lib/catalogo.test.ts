import { describe, it, expect } from "vitest";
import {
  RAMOS, productosDe, camposDe, leerDatos, describirDatos, etiquetaProducto, CAMPOS,
} from "./catalogo";

describe("catálogo de ramos y productos", () => {
  it("cubre los cinco ramos que acepta la base", () => {
    expect(RAMOS.map((r) => r.valor).sort()).toEqual(
      ["ahorro", "autos", "danos", "gmm", "vida"].sort(),
    );
  });

  it("todo producto apunta a un grupo de campos que existe", () => {
    for (const r of RAMOS) {
      for (const p of r.productos) {
        expect(CAMPOS[p.grupo], `${r.valor}/${p.valor}`).toBeDefined();
      }
    }
  });

  it("no repite el mismo producto dentro de un ramo", () => {
    for (const r of RAMOS) {
      const v = r.productos.map((p) => p.valor);
      expect(new Set(v).size, r.valor).toBe(v.length);
    }
  });
});

describe("campos por producto, no por ramo", () => {
  it("una moto pide datos del vehículo aunque esté bajo daños", () => {
    const campos = camposDe("danos", "moto").map((c) => c.nombre);
    expect(campos).toContain("placas");
    expect(campos).toContain("cobertura");
  });

  it("la misma moto bajo autos pide exactamente lo mismo", () => {
    expect(camposDe("danos", "moto")).toEqual(camposDe("autos", "moto"));
  });

  it("una casa habitación pide ubicación y sumas, no placas", () => {
    const campos = camposDe("danos", "casa").map((c) => c.nombre);
    expect(campos).toContain("ubicacion");
    expect(campos).toContain("suma_contenidos");
    expect(campos).not.toContain("placas");
  });

  it("gastos médicos pide deducible y coaseguro", () => {
    const campos = camposDe("gmm", "familiar").map((c) => c.nombre);
    expect(campos).toEqual(expect.arrayContaining(["deducible", "coaseguro", "edades"]));
  });

  it("un producto sin campos propios no truena", () => {
    expect(camposDe("danos", "rc")).toEqual([]);
    expect(camposDe("inventado", "nada")).toEqual([]);
  });
});

describe("leerDatos", () => {
  const form: Record<string, string> = {
    marca: "Italika", modelo: "FT150", anio: "2022", placas: "ABC123",
    cobertura: "amplia", suma_asegurada: "$ 45,000", intruso: "no debe guardarse",
  };
  const leer = (n: string) => form[n] ?? null;

  it("solo guarda los campos del producto, nunca lo que sobra", () => {
    const d = leerDatos("danos", "moto", leer);
    expect(d.marca).toBe("Italika");
    expect(d).not.toHaveProperty("intruso");
  });

  it("convierte los numéricos limpiando moneda y comas", () => {
    expect(leerDatos("danos", "moto", leer).suma_asegurada).toBe(45000);
    expect(leerDatos("danos", "moto", leer).anio).toBe(2022);
  });

  it("omite los vacíos en vez de guardar cadenas en blanco", () => {
    const d = leerDatos("danos", "moto", (n) => (n === "marca" ? "Honda" : ""));
    expect(d).toEqual({ marca: "Honda" });
  });

  it("cambiar de producto no arrastra los campos del anterior", () => {
    // Capturó una moto y luego cambió a casa: las placas no deben colarse.
    expect(leerDatos("danos", "casa", leer)).not.toHaveProperty("placas");
  });
});

describe("describirDatos", () => {
  it("traduce las opciones a su texto legible", () => {
    const d = describirDatos("danos", "moto", { cobertura: "rc" });
    expect(d[0]?.valor).toBe("Responsabilidad civil");
  });

  it("sigue mostrando datos viejos que ya no están en el catálogo", () => {
    // Si algún día se quita un campo, lo capturado no debe desaparecer.
    const d = describirDatos("danos", "moto", { campo_retirado: "algo" });
    expect(d.map((x) => x.valor)).toContain("algo");
  });

  it("tolera datos nulos", () => {
    expect(describirDatos("danos", "moto", null)).toEqual([]);
  });
});

describe("etiquetaProducto", () => {
  it("devuelve el nombre comercial", () => {
    expect(etiquetaProducto("ahorro", "segubeca")).toMatch(/SeguBeca/);
  });
  it("degrada al valor crudo si no lo conoce", () => {
    expect(etiquetaProducto("ahorro", "viejo")).toBe("viejo");
  });
});
