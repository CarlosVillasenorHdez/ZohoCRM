import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function archivos(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) archivos(p, acc);
    else if (/\.tsx?$/.test(e)) acc.push(p);
  }
  return acc;
}

describe('archivos "use server"', () => {
  it("solo exportan funciones async, nunca constantes", () => {
    // Next falla el BUILD si un módulo "use server" exporta un valor, y el
    // error aparece lejos del archivo culpable. Esta prueba lo atrapa antes,
    // señalando exactamente cuál es.
    const malos: string[] = [];

    for (const f of archivos("src")) {
      const src = readFileSync(f, "utf8");
      if (!/^\s*["']use server["']/m.test(src)) continue;

      for (const linea of src.split("\n")) {
        const exporta = /^export\s+(const|let|var|class)\s+(\w+)/.exec(linea);
        if (exporta) malos.push(`${f}: export ${exporta[1]} ${exporta[2]}`);
        if (/^export\s*\{/.test(linea)) malos.push(`${f}: ${linea.trim()}`);
      }
    }

    expect(malos).toEqual([]);
  });
});
