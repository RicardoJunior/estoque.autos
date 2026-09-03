import { portalTitle } from "../../format";
import type { BodyType, Fuel, Steering, Transmission, VehicleCategory } from "../../types";
import { PortalError } from "../errors";
import { publishRequirements } from "../requirements";
import type { CanonicalVehicle, PortalPayload } from "../types";

// ============================================================
// Canônico → anúncio do Autoupload da OLX (ad_list[]). Códigos
// numéricos das listas fixas conforme docs/integracoes-portais.md
// §3.4. vehicle_brand/model/version vêm do catálogo (adapter).
// ============================================================

export const OLX_MAX_PHOTOS = 20;
export const OLX_TITLE_MAX = 90;
export const OLX_BODY_MAX = 6000;
/** limite por chamada do PUT /autoupload/import */
export const OLX_MAX_BATCH_BYTES = 1_000_000;

export const OLX_CATEGORY: Record<VehicleCategory, number> = {
  carro: 2020, // carros, vans e utilitários
  utilitario: 2020,
  moto: 2060,
  caminhao: 2040,
};

/** 1 Gasolina · 2 Álcool · 3 Flex · 5 Diesel · 6 Híbrido · 7 Elétrico (4 GNV deprecado) */
export const OLX_FUEL: Record<Fuel, number> = {
  gasolina: 1,
  etanol: 2,
  flex: 3,
  diesel: 5,
  hibrido: 6,
  eletrico: 7,
  gnv: 1, // + gnv_kit: 1
};

/** 1 Manual · 2 Automático · 3 Semi-automático */
export const OLX_GEARBOX: Record<Transmission, number> = {
  manual: 1,
  automatico: 2,
  cvt: 2,
  automatizado: 3,
};

/** 1 Passeio · 2 Conversível · 3 Pick-up · 4 Antigo · 5 SUV · 6 Buggy · 7 Van/Utilitário · 8 Sedã · 9 Hatch */
export const OLX_CARTYPE: Record<BodyType, number> = {
  hatch: 9,
  sedan: 8,
  suv: 5,
  picape: 3,
  perua: 1,
  minivan: 7,
  cupe: 1,
  conversivel: 2,
  van: 7,
  utilitario: 7,
  outro: 1,
};

/** 1 Hidráulica · 2 Elétrica · 3 Mecânica · 4 Assistida */
export const OLX_STEERING: Record<Steering, number> = {
  hidraulica: 1,
  eletrica: 2,
  mecanica: 3,
  assistida: 4,
};

/**
 * carcolor 1..10 (10 = outra). A numeração oficial fica na página
 * "campos de autos" da OLX, marcada como "em breve" — ordem abaixo
 * a confirmar na homologação do integrador.
 */
export const OLX_COLOR: Record<string, number> = {
  Preto: 1,
  Branco: 2,
  Prata: 3,
  Cinza: 4,
  Vermelho: 5,
  Azul: 6,
  Verde: 7,
  Amarelo: 8,
  Marrom: 9,
};

/** car_features: 1 Ar · 2 Direção hidráulica · 3 Vidro elétrico · 4 Trava · 5 Airbag · 6 Alarme · 7 Som · 8 Sensor de ré · 9 Câmera de ré · 10 Blindado */
export const OLX_FEATURE: Record<string, number> = {
  "Ar-condicionado": 1,
  "Ar-condicionado digital": 1,
  "Ar-condicionado dual zone": 1,
  "Direção hidráulica": 2,
  "Direção elétrica": 2,
  "Vidros elétricos": 3,
  "Travas elétricas": 4,
  Airbag: 5,
  Alarme: 6,
  Multimídia: 7,
  "Sensor de estacionamento": 8,
  "Câmera de ré": 9,
};

/** id do anúncio na OLX: `[A-Za-z0-9_{}-]{1,19}` — derivado do uuid do veículo. */
export function olxAdId(vehicleId: string): string {
  return `ea${vehicleId.replace(/-/g, "").slice(0, 17)}`;
}

export interface OlxTaxonomyIds {
  brand: string | number;
  model: string | number;
  version?: string | number | null;
}

export function buildOlxBody(v: CanonicalVehicle): string {
  const { vehicle } = v;
  const parts: string[] = [];
  if (vehicle.description) parts.push(vehicle.description.trim());
  // só 9 recursos cabem em car_features; o resto vai no texto
  const rest = (vehicle.optionals ?? []).filter((o) => !(o in OLX_FEATURE));
  if (rest.length) parts.push(`Opcionais: ${rest.join(", ")}.`);
  if (vehicle.engine) parts.push(`Motor ${vehicle.engine}.`);
  const text = parts.join("\n\n").trim();
  const body = text.length >= 2 ? text : portalTitle(vehicle, OLX_TITLE_MAX);
  return body.slice(0, OLX_BODY_MAX);
}

export function buildOlxAd(v: CanonicalVehicle, ids: OlxTaxonomyIds): PortalPayload {
  const { vehicle, tenant } = v;
  const missing = publishRequirements("olx", vehicle, tenant);
  if (missing.length > 0) {
    throw new PortalError("validation", `faltam no cadastro: ${missing.join(", ")}`);
  }
  const flags = new Set(vehicle.condition_flags ?? []);
  const params: Record<string, unknown> = {
    regdate: vehicle.year_model,
    mileage: vehicle.mileage ?? 0,
    gearbox: vehicle.transmission ? OLX_GEARBOX[vehicle.transmission] : undefined,
    fuel: vehicle.fuel ? OLX_FUEL[vehicle.fuel] : undefined,
    vehicle_brand: ids.brand,
    vehicle_model: ids.model,
    vehicle_version: ids.version ?? undefined,
    vehicle_tag: vehicle.plate?.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
    doors: vehicle.doors ? (vehicle.doors <= 3 ? 1 : 2) : undefined,
    cartype: vehicle.body_type ? OLX_CARTYPE[vehicle.body_type] : undefined,
    carcolor: vehicle.color ? (OLX_COLOR[vehicle.color] ?? 10) : undefined,
    car_steering: vehicle.steering ? OLX_STEERING[vehicle.steering] : undefined,
    motorpower: vehicle.engine ? Number.parseFloat(vehicle.engine.replace(",", ".")) || undefined : undefined,
    exchange: flags.has("aceita_troca") ? 1 : undefined,
    owner: flags.has("unico_dono") ? 1 : undefined,
    warranty: flags.has("garantia_fabrica") ? 1 : undefined,
    dealership_review: flags.has("revisoes_concessionaria") ? 1 : undefined,
    gnv_kit: vehicle.fuel === "gnv" ? 1 : undefined,
  };
  const financial: number[] = [];
  if (flags.has("alienado")) financial.push(1);
  if (flags.has("ipva_pago")) financial.push(2);
  if (flags.has("leilao")) financial.push(4);
  if (financial.length) params.financial = financial;

  const features = new Set<number>();
  for (const o of vehicle.optionals ?? []) {
    const f = OLX_FEATURE[o];
    if (f) features.add(f);
  }
  if (flags.has("blindado")) features.add(10);
  if (features.size) params.car_features = [...features].sort((a, b) => a - b);

  for (const k of Object.keys(params)) if (params[k] === undefined) delete params[k];

  const ad: PortalPayload = {
    id: olxAdId(vehicle.id),
    operation: "insert",
    category: OLX_CATEGORY[vehicle.category] ?? OLX_CATEGORY.carro,
    subject: portalTitle(vehicle, OLX_TITLE_MAX),
    body: buildOlxBody(v),
    phone: v.phone,
    type: "s",
    price: Math.round(Number(vehicle.price)),
    zipcode: (tenant.address?.cep ?? "").replace(/\D/g, ""),
    images: v.photos.slice(0, OLX_MAX_PHOTOS).map((p) => p.url),
    params,
  };
  if (vehicle.video_url) ad.videos = [vehicle.video_url];
  return ad;
}

export function buildOlxDelete(vehicleId: string): PortalPayload {
  return { id: olxAdId(vehicleId), operation: "delete" };
}

/** Fatia a lista em lotes de até 1 MB (limite do PUT). */
export function chunkAds(ads: PortalPayload[], maxBytes = OLX_MAX_BATCH_BYTES): PortalPayload[][] {
  const chunks: PortalPayload[][] = [];
  let current: PortalPayload[] = [];
  let size = 64;
  for (const ad of ads) {
    const len = JSON.stringify(ad).length + 1;
    if (current.length > 0 && size + len > maxBytes) {
      chunks.push(current);
      current = [];
      size = 64;
    }
    current.push(ad);
    size += len;
  }
  if (current.length) chunks.push(current);
  return chunks;
}
