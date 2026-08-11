import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchFipeReference,
  officialFetchBrands,
  officialFetchModels,
  officialFetchPrice,
} from "../official";

const FAST = { retries: 0, baseDelayMs: 0, maxDelayMs: 0 };
const REF = { codigo: 336, mes: "agosto/2026" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("provider oficial (veiculos.fipe.org.br)", () => {
  it("referência vigente: primeiro item, mês com trim", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        { Codigo: 336, Mes: "agosto/2026 " },
        { Codigo: 335, Mes: "julho/2026 " },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchFipeReference(FAST)).resolves.toEqual(REF);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/ConsultarTabelaDeReferencia");
    expect((init as RequestInit).method).toBe("POST");
  });

  it("marcas: Label/Value viram nome/codigo string", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ Label: "Fiat", Value: "21" }]),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(officialFetchBrands("carros", REF, FAST)).resolves.toEqual([
      { codigo: "21", nome: "Fiat" },
    ]);
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toEqual({ codigoTabelaReferencia: 336, codigoTipoVeiculo: 1 });
  });

  it("modelos: extrai Modelos e normaliza Value numérico", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        Modelos: [{ Label: "ARGO DRIVE 1.0 6V Flex", Value: 7965 }],
        Anos: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      officialFetchModels("carros", REF, "21", FAST),
    ).resolves.toEqual([{ codigo: "7965", nome: "ARGO DRIVE 1.0 6V Flex" }]);
  });

  it("preço: decompõe yearCode, envia params e faz trim do payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        Valor: "R$ 59.750,00",
        Marca: "Fiat",
        Modelo: "ARGO DRIVE 1.0 6V Flex",
        AnoModelo: 2022,
        Combustivel: "Flex",
        CodigoFipe: "001494-0",
        MesReferencia: "agosto de 2026 ",
        SiglaCombustivel: "F",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const price = await officialFetchPrice(
      "carros",
      REF,
      "21",
      "7965",
      "2022-5",
      FAST,
    );
    expect(price.MesReferencia).toBe("agosto de 2026");
    expect(price.CodigoFipe).toBe("001494-0");
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toMatchObject({
      codigoTabelaReferencia: 336,
      codigoMarca: 21,
      codigoModelo: 7965,
      anoModelo: 2022,
      codigoTipoCombustivel: 5,
      tipoConsulta: "tradicional",
    });
  });

  it("caminhões usam codigoTipoVeiculo 3", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    await officialFetchBrands("caminhoes", REF, FAST);
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.codigoTipoVeiculo).toBe(3);
  });

  it("HTTP 200 com {erro} vira exceção clara", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ codigo: "0", erro: "nadaencontrado" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      officialFetchPrice("carros", REF, "21", "9999", "2010-1", FAST),
    ).rejects.toThrow(/nadaencontrado/);
  });
});
