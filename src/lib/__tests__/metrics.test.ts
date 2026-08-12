import { describe, expect, it } from "vitest";
import {
  buildLeadsSeries,
  buildRevenueSeries,
  buildStockValueSeries,
  dayKey,
  fipeReferenceKey,
  lastDayKeys,
  lastMonthKeys,
  monthKey,
  type FipeHistRow,
  type VehicleRow,
} from "../metrics";

// 11/08/2026 12:00 em São Paulo (15:00 UTC)
const NOW = new Date("2026-08-11T15:00:00Z");

function vehicle(overrides: Partial<VehicleRow>): VehicleRow {
  return {
    id: crypto.randomUUID(),
    price: 50_000,
    status: "available",
    created_at: "2026-05-10T12:00:00Z",
    sold_at: null,
    updated_at: "2026-05-10T12:00:00Z",
    fipe_code: null,
    fipe_year_id: null,
    fipe_price: null,
    fipe_reference: null,
    ...overrides,
  };
}

describe("chaves de período (fuso America/Sao_Paulo)", () => {
  it("bucketa madrugada UTC no dia anterior local", () => {
    // 02:59 UTC = 23:59 do dia anterior em SP
    expect(dayKey("2026-08-01T02:59:00Z")).toBe("2026-07-31");
    expect(monthKey("2026-08-01T02:59:00Z")).toBe("2026-07");
    expect(dayKey("2026-08-01T03:00:00Z")).toBe("2026-08-01");
  });

  it("lastMonthKeys cobre 12 meses cruzando a virada do ano", () => {
    const keys = lastMonthKeys(NOW, 12);
    expect(keys).toHaveLength(12);
    expect(keys[0]).toBe("2025-09");
    expect(keys[11]).toBe("2026-08");
    expect(keys).toContain("2026-01");
  });

  it("lastDayKeys gera 30 dias consecutivos terminando hoje", () => {
    const keys = lastDayKeys(NOW, 30);
    expect(keys).toHaveLength(30);
    expect(keys[29]).toBe("2026-08-11");
    expect(keys[0]).toBe("2026-07-13");
    expect(new Set(keys).size).toBe(30);
  });
});

describe("fipeReferenceKey", () => {
  it("aceita os dois formatos de referência", () => {
    expect(fipeReferenceKey("junho de 2026")).toBe("2026-06");
    expect(fipeReferenceKey("março de 2026")).toBe("2026-03");
    expect(fipeReferenceKey("julho/2026")).toBe("2026-07");
  });

  it("normaliza caixa e espaços", () => {
    expect(fipeReferenceKey("  Agosto de 2026 ")).toBe("2026-08");
  });

  it("rejeita lixo", () => {
    expect(fipeReferenceKey("2026")).toBeNull();
    expect(fipeReferenceKey("mês de 2026")).toBeNull();
    expect(fipeReferenceKey("")).toBeNull();
  });
});

describe("buildRevenueSeries", () => {
  const months = lastMonthKeys(NOW, 12);

  it("soma vendas por mês de sold_at", () => {
    const series = buildRevenueSeries(
      [
        vehicle({ status: "sold", sold_at: "2026-07-05T12:00:00Z", price: 40_000 }),
        vehicle({ status: "sold", sold_at: "2026-07-20T12:00:00Z", price: 35_000 }),
        vehicle({ status: "sold", sold_at: "2026-08-02T12:00:00Z", price: 90_000 }),
      ],
      months,
    );
    const jul = series.find((p) => p.month === "2026-07")!;
    const ago = series.find((p) => p.month === "2026-08")!;
    expect(jul).toMatchObject({ total: 75_000, count: 2 });
    expect(ago).toMatchObject({ total: 90_000, count: 1 });
  });

  it("usa updated_at quando sold_at é nulo (criado já vendido)", () => {
    const series = buildRevenueSeries(
      [
        vehicle({
          status: "sold",
          sold_at: null,
          updated_at: "2026-06-10T12:00:00Z",
          price: 20_000,
        }),
      ],
      months,
    );
    expect(series.find((p) => p.month === "2026-06")).toMatchObject({
      total: 20_000,
      count: 1,
    });
  });

  it("arquivado com sold_at continua contando (arquivar não apaga venda)", () => {
    const series = buildRevenueSeries(
      [
        vehicle({
          status: "archived",
          sold_at: "2026-06-10T12:00:00Z",
          // updated_at = momento do arquivamento; NÃO pode mover a venda
          updated_at: "2026-08-01T12:00:00Z",
          price: 45_000,
        }),
      ],
      months,
    );
    expect(series.find((p) => p.month === "2026-06")).toMatchObject({
      total: 45_000,
      count: 1,
    });
    // arquivado que nunca vendeu não vira receita
    const none = buildRevenueSeries([vehicle({ status: "archived" })], months);
    expect(none.every((p) => p.count === 0)).toBe(true);
  });

  it("ignora não vendidos e vendas fora da janela", () => {
    const series = buildRevenueSeries(
      [
        vehicle({ status: "available" }),
        vehicle({ status: "sold", sold_at: "2024-01-10T12:00:00Z" }),
      ],
      months,
    );
    expect(series.every((p) => p.total === 0 && p.count === 0)).toBe(true);
  });
});

describe("buildStockValueSeries", () => {
  const months = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
  const histA: FipeHistRow[] = [
    { fipe_code: "001", year_id: "2022-1", price: 48_000, reference: "maio de 2026" },
    { fipe_code: "001", year_id: "2022-1", price: 49_000, reference: "julho de 2026" },
  ];

  it("reconstrói o estoque mês a mês com carry-forward da FIPE", () => {
    const v1 = vehicle({
      created_at: "2026-05-10T12:00:00Z",
      price: 50_000,
      fipe_code: "001",
      fipe_year_id: "2022-1",
    });
    const series = buildStockValueSeries([v1], histA, months);
    // abril (sem estoque) é cortado
    expect(series.map((p) => p.month)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(series[0]).toMatchObject({ listed: 50_000, fipe: 48_000, vehicles: 1 });
    // junho sem referência própria → vale a de maio
    expect(series[1]).toMatchObject({ fipe: 48_000 });
    expect(series[2]).toMatchObject({ fipe: 49_000 });
    expect(series[3]).toMatchObject({ fipe: 49_000 });
  });

  it("vendido sai do snapshot a partir do mês da venda (estoque zerado = 0)", () => {
    const v = vehicle({
      created_at: "2026-05-10T12:00:00Z",
      status: "sold",
      sold_at: "2026-07-02T12:00:00Z",
      fipe_code: "001",
      fipe_year_id: "2022-1",
    });
    const series = buildStockValueSeries([v], histA, months);
    expect(series.map((p) => p.month)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(series[1]).toMatchObject({ listed: 50_000, vehicles: 1 });
    // depois da venda o estoque é zero de verdade, não lacuna
    expect(series[2]).toMatchObject({ listed: 0, fipe: 0, stocked: 0 });
  });

  it("estoque sem nenhuma FIPE resolvível no mês é lacuna (null), não zero", () => {
    // histórico só começa em julho — maio/junho têm estoque mas sem FIPE
    const v = vehicle({
      created_at: "2026-05-10T12:00:00Z",
      fipe_code: "003",
      fipe_year_id: "2023-1",
    });
    const hist: FipeHistRow[] = [
      { fipe_code: "003", year_id: "2023-1", price: 47_000, reference: "julho de 2026" },
    ];
    const series = buildStockValueSeries([v], hist, months);
    expect(series[0]).toMatchObject({ month: "2026-05", listed: null, fipe: null, stocked: 1 });
    expect(series[2]).toMatchObject({ month: "2026-07", listed: 50_000, fipe: 47_000 });
  });

  it("usa o snapshot do veículo quando não há histórico global", () => {
    const v = vehicle({
      created_at: "2026-06-15T12:00:00Z",
      price: 30_000,
      fipe_code: "002",
      fipe_year_id: "2020-3",
      fipe_price: 29_000,
      fipe_reference: "junho de 2026",
    });
    const series = buildStockValueSeries([v], [], months);
    expect(series[0]).toMatchObject({
      month: "2026-06",
      listed: 30_000,
      fipe: 29_000,
    });
  });

  it("exclui das DUAS somas o veículo sem FIPE resolvível no mês", () => {
    const comFipe = vehicle({
      created_at: "2026-05-10T12:00:00Z",
      price: 50_000,
      fipe_code: "001",
      fipe_year_id: "2022-1",
    });
    // histórico deste par só começa em julho
    const tardio = vehicle({
      created_at: "2026-05-10T12:00:00Z",
      price: 80_000,
      fipe_code: "003",
      fipe_year_id: "2023-1",
    });
    const hist = [
      ...histA,
      { fipe_code: "003", year_id: "2023-1", price: 78_000, reference: "julho de 2026" },
    ];
    const series = buildStockValueSeries([comFipe, tardio], hist, months);
    const mai = series.find((p) => p.month === "2026-05")!;
    const jul = series.find((p) => p.month === "2026-07")!;
    expect(mai).toMatchObject({ listed: 50_000, vehicles: 1 });
    expect(jul).toMatchObject({ listed: 130_000, fipe: 127_000, vehicles: 2 });
  });

  it("arquivado: com sold_at sai no mês da venda; sem sold_at fica fora", () => {
    const arquivadoVendido = vehicle({
      created_at: "2026-05-10T12:00:00Z",
      status: "archived",
      sold_at: "2026-07-02T12:00:00Z",
      fipe_code: "001",
      fipe_year_id: "2022-1",
    });
    const s1 = buildStockValueSeries([arquivadoVendido], histA, months);
    expect(s1.map((p) => p.month)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(s1[0]).toMatchObject({ vehicles: 1 });
    expect(s1[2]).toMatchObject({ stocked: 0 });

    // sem sold_at não dá para saber quando saiu do estoque
    const arquivadoSemVenda = vehicle({
      created_at: "2026-05-10T12:00:00Z",
      status: "archived",
      fipe_code: "001",
      fipe_year_id: "2022-1",
    });
    expect(buildStockValueSeries([arquivadoSemVenda], histA, months)).toEqual([]);
  });

  it("só veículos sem FIPE → meses viram lacuna; sem estoque nenhum → série vazia", () => {
    const semFipe = vehicle({ created_at: "2026-05-10T12:00:00Z" });
    const serie = buildStockValueSeries([semFipe], [], months);
    expect(serie.map((p) => p.month)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(serie.every((p) => p.listed === null && p.stocked === 1)).toBe(true);
    expect(buildStockValueSeries([], [], months)).toEqual([]);
  });
});

describe("buildLeadsSeries", () => {
  const days = lastDayKeys(NOW, 30);

  it("bucketa por tipo no dia local", () => {
    const series = buildLeadsSeries(
      [
        // 02:30 UTC de 10/08 = 23:30 de 09/08 em SP
        { created_at: "2026-08-10T02:30:00Z", type: "whatsapp" },
        { created_at: "2026-08-10T12:00:00Z", type: "whatsapp" },
        { created_at: "2026-08-10T13:00:00Z", type: "proposal" },
        { created_at: "2026-08-10T14:00:00Z", type: "phone" },
        { created_at: "2026-01-01T12:00:00Z", type: "phone" }, // fora da janela
      ],
      days,
    );
    const d09 = series.find((p) => p.day === "2026-08-09")!;
    const d10 = series.find((p) => p.day === "2026-08-10")!;
    expect(d09).toMatchObject({ whatsapp: 1, proposal: 0, phone: 0 });
    expect(d10).toMatchObject({ whatsapp: 1, proposal: 1, phone: 1 });
    const total = series.reduce((s, p) => s + p.proposal + p.whatsapp + p.phone, 0);
    expect(total).toBe(4);
  });
});
