import { describe, expect, it } from "vitest";
import { barPath, monthShort, niceRangeTicks, niceTicks } from "../core";

describe("niceTicks", () => {
  it("o último tick sempre cobre o máximo", () => {
    // regressão: max=240 → passo 100 parava em 200 e a barra estourava o plot
    for (const max of [240, 199, 342_800, 1, 3, 7, 999_999]) {
      const ticks = niceTicks(max);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
      expect(ticks[0]).toBe(0);
      expect(ticks.length).toBeGreaterThanOrEqual(2);
      expect(ticks.length).toBeLessThanOrEqual(6);
    }
  });

  it("modo inteiro: cobre o máximo SEM ticks fracionários", () => {
    // regressão: max=7 → passo 2,5 gerava [0, 2.5, 5, 7.5]; filtrar os
    // fracionários depois deixava o teto em 5 e a pilha estourava o plot
    for (const max of [1, 2, 3, 6, 7, 8, 23, 240]) {
      const ticks = niceTicks(max, 3, true);
      expect(ticks.every(Number.isInteger)).toBe(true);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });
});

describe("niceRangeTicks", () => {
  it("cobre [min, max] dos dois lados", () => {
    // regressão: 1,195mi–1,648mi parava em 1,6mi e cortava a linha no topo
    for (const [min, max] of [
      [1_195_000, 1_648_000],
      [72_900, 129_900],
      [10, 10],
    ]) {
      const ticks = niceRangeTicks(min, max);
      expect(ticks[0]).toBeLessThanOrEqual(min);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });
});

describe("barPath", () => {
  it("vazio para alturas nulas; raio limitado pela marca", () => {
    expect(barPath(0, 0, 12, 0)).toBe("");
    // altura menor que o raio não pode gerar arco maior que a barra
    expect(barPath(0, 10, 12, 2)).toContain("Q");
  });
});

describe("monthShort", () => {
  it("abrevia em pt-BR com ano opcional", () => {
    expect(monthShort("2026-08")).toBe("ago");
    expect(monthShort("2026-01", true)).toBe("jan/26");
  });
});
