import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FipeHttpError,
  fetchFipeModels,
  fetchFipePrice,
  fipeGet,
  parseFipeValor,
} from "../client";

// retry instantâneo nos testes
const FAST = { retries: 3, baseDelayMs: 0, maxDelayMs: 0 };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.FIPE_API_TOKEN;
});

describe("parseFipeValor", () => {
  it("converte moeda BRL", () => {
    expect(parseFipeValor("R$ 30.000,00")).toBe(30000);
    expect(parseFipeValor("R$ 1.234.567,89")).toBe(1234567.89);
    expect(parseFipeValor("R$ 950,50")).toBe(950.5);
  });

  it("rejeita valor sem dígitos", () => {
    expect(() => parseFipeValor("R$ --")).toThrow(/inválido/);
  });
});

describe("fipeGet (retry)", () => {
  it("devolve o JSON no sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fipeGet("cars/brands", FAST)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://fipe.parallelum.com.br/api/v2/cars/brands",
    );
  });

  it("envia X-Subscription-Token quando FIPE_API_TOKEN está no env", async () => {
    process.env.FIPE_API_TOKEN = "tok-teste";
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    await fipeGet("cars/brands", FAST);
    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["X-Subscription-Token"]).toBe("tok-teste");
  });

  it("não envia token quando o env está vazio", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    await fipeGet("cars/brands", FAST);
    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["X-Subscription-Token"]).toBeUndefined();
  });

  it("re-tenta 429 e 5xx até obter sucesso", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({}, 502))
      .mockResolvedValueOnce(jsonResponse([{ code: "1", name: "Acura" }]));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fipeGet("cars/brands", FAST)).resolves.toEqual([
      { code: "1", name: "Acura" },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("re-tenta falha de rede", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ ok: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fipeGet("x", FAST)).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("NÃO re-tenta 4xx (exceto 429) — falha na hora", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 404));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fipeGet("cars/nada", FAST)).rejects.toBeInstanceOf(
      FipeHttpError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("esgota as tentativas e propaga o último erro", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 429));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fipeGet("cars/brands", FAST)).rejects.toMatchObject({
      status: 429,
    });
    // 1 tentativa + 3 retries
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});

describe("normalização v2 → shapes internos", () => {
  it("modelos: {code,name} vira {codigo,nome} com codigo string", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ code: "4828", name: "Onix 1.0" }]),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchFipeModels("carros", "23", FAST)).resolves.toEqual([
      { codigo: "4828", nome: "Onix 1.0" },
    ]);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/cars/brands/23/models",
    );
  });

  it("preço: campos em inglês viram o shape ParallelumPrice", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        vehicleType: 1,
        price: "R$ 119.329,00",
        brand: "Honda",
        model: "Civic Sedan EXL",
        modelYear: 2020,
        fuel: "Flex",
        codeFipe: "014090-2",
        referenceMonth: "julho de 2026",
        fuelAcronym: "F",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      fetchFipePrice("carros", "25", "1234", "2020-5", FAST),
    ).resolves.toEqual({
      Valor: "R$ 119.329,00",
      Marca: "Honda",
      Modelo: "Civic Sedan EXL",
      AnoModelo: 2020,
      Combustivel: "Flex",
      CodigoFipe: "014090-2",
      MesReferencia: "julho de 2026",
      SiglaCombustivel: "F",
    });
  });

  it("motos e caminhões mapeiam para motorcycles/trucks", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(jsonResponse([])),
    );
    vi.stubGlobal("fetch", fetchMock);
    await fetchFipeModels("motos", "80", FAST);
    await fetchFipeModels("caminhoes", "102", FAST);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/motorcycles/");
    expect(String(fetchMock.mock.calls[1][0])).toContain("/trucks/");
  });
});
