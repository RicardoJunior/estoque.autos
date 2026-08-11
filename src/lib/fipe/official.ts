// ============================================================
// FIPE — provider OFICIAL (veiculos.fipe.org.br), a fonte que o
// parallelum (e o Webmotors) proxiam. Gratuito, sem token, sem cota
// paga — é o backend da importação em MASSA (scripts): estrutura,
// anos e a tabela de preços inteira.
//
// É a API do próprio site da FIPE (POST + JSON, exige Referer).
// Convenções:
//  • tudo gira em torno do codigoTabelaReferencia — o id do mês
//    vigente vem de ConsultarTabelaDeReferencia (primeiro item)
//  • códigos de marca/modelo/ano são OS MESMOS do parallelum
//    (que só repassa) — o banco não muda
//  • payload de preço tem os mesmos campos da v1 (Valor, Marca,
//    CodigoFipe, MesReferencia…), com espaços sobrando → trim
//  • combos inválidos voltam HTTP 200 com {"erro":"nadaencontrado"}
//
// Ritmo fica em quem chama (import: fila + delay). Retry/backoff
// reutiliza o motor do client (fipeRequest).
// ============================================================

import { fipeRequest, type ParallelumPrice, type RetryOptions } from "./client";
import type { FipeVehicleType } from "./types";

const BASE_URL = "https://veiculos.fipe.org.br/api/veiculos";

const TYPE_CODE: Record<FipeVehicleType, number> = {
  carros: 1,
  motos: 2,
  caminhoes: 3,
};

const TYPE_LABEL: Record<FipeVehicleType, string> = {
  carros: "carro",
  motos: "moto",
  caminhoes: "caminhão",
};

interface OfficialRef {
  Label: string;
  Value: string | number;
}

export interface FipeReference {
  /** codigoTabelaReferencia (ex.: 336) */
  codigo: number;
  /** ex.: "agosto/2026" */
  mes: string;
}

async function post<T>(
  path: string,
  body: Record<string, unknown>,
  retry?: RetryOptions,
): Promise<T> {
  const data = await fipeRequest<T | { erro?: string }>(
    `${BASE_URL}/${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://veiculos.fipe.org.br/",
      },
      body: JSON.stringify(body),
    },
    retry,
  );
  if (data && typeof data === "object" && "erro" in data && data.erro) {
    throw new Error(`FIPE oficial: ${data.erro} em ${path}`);
  }
  return data as T;
}

function toRef(items: OfficialRef[]): Array<{ codigo: string; nome: string }> {
  return (items ?? []).map((i) => ({
    codigo: String(i.Value),
    nome: i.Label.trim(),
  }));
}

/** Mês de referência vigente (primeiro item da tabela). */
export async function fetchFipeReference(
  retry?: RetryOptions,
): Promise<FipeReference> {
  const rows = await post<Array<{ Codigo: number; Mes: string }>>(
    "ConsultarTabelaDeReferencia",
    {},
    retry,
  );
  if (!rows?.length) throw new Error("FIPE oficial: tabela de referência vazia");
  return { codigo: rows[0].Codigo, mes: rows[0].Mes.trim() };
}

export async function officialFetchBrands(
  type: FipeVehicleType,
  ref: FipeReference,
  retry?: RetryOptions,
) {
  return toRef(
    await post<OfficialRef[]>(
      "ConsultarMarcas",
      { codigoTabelaReferencia: ref.codigo, codigoTipoVeiculo: TYPE_CODE[type] },
      retry,
    ),
  );
}

export async function officialFetchModels(
  type: FipeVehicleType,
  ref: FipeReference,
  brandId: string,
  retry?: RetryOptions,
) {
  const data = await post<{ Modelos: OfficialRef[] }>(
    "ConsultarModelos",
    {
      codigoTabelaReferencia: ref.codigo,
      codigoTipoVeiculo: TYPE_CODE[type],
      codigoMarca: Number(brandId),
    },
    retry,
  );
  return toRef(data.Modelos ?? []);
}

export async function officialFetchYears(
  type: FipeVehicleType,
  ref: FipeReference,
  brandId: string,
  modelId: string,
  retry?: RetryOptions,
) {
  return toRef(
    await post<OfficialRef[]>(
      "ConsultarAnoModelo",
      {
        codigoTabelaReferencia: ref.codigo,
        codigoTipoVeiculo: TYPE_CODE[type],
        codigoMarca: Number(brandId),
        codigoModelo: Number(modelId),
      },
      retry,
    ),
  );
}

export async function officialFetchPrice(
  type: FipeVehicleType,
  ref: FipeReference,
  brandId: string,
  modelId: string,
  yearCode: string,
  retry?: RetryOptions,
): Promise<ParallelumPrice> {
  // yearCode "2022-5" → anoModelo 2022, combustível 5 (32000 = zero km)
  const [anoModelo, combustivel] = yearCode.split("-");
  const p = await post<ParallelumPrice>(
    "ConsultarValorComTodosParametros",
    {
      codigoTabelaReferencia: ref.codigo,
      codigoTipoVeiculo: TYPE_CODE[type],
      codigoMarca: Number(brandId),
      codigoModelo: Number(modelId),
      anoModelo: Number(anoModelo),
      codigoTipoCombustivel: Number(combustivel ?? 1),
      tipoVeiculo: TYPE_LABEL[type],
      modeloCodigoExterno: "",
      tipoConsulta: "tradicional",
    },
    retry,
  );
  return {
    Valor: p.Valor,
    Marca: p.Marca?.trim(),
    Modelo: p.Modelo?.trim(),
    AnoModelo: p.AnoModelo,
    Combustivel: p.Combustivel?.trim(),
    CodigoFipe: p.CodigoFipe?.trim(),
    MesReferencia: p.MesReferencia?.trim(),
    SiglaCombustivel: p.SiglaCombustivel?.trim(),
  };
}
