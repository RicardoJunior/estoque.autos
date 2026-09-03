import { portalTitle } from "../../format";
import {
  BODY_TYPE_LABELS,
  type BodyType,
  type Fuel,
  type Transmission,
  type VehicleCategory,
} from "../../types";
import { PortalError } from "../errors";
import { publishRequirements } from "../requirements";
import type { CanonicalVehicle, Connection, PortalPayload } from "../types";

// ============================================================
// Canônico → payload do Mercado Livre (POST /items, classificado).
// Listas fixas ficam aqui; BRAND resolve pelo catálogo quando houver
// (adapter.ts). Regras: título ≤ 60, ≥ 1 foto (máx. 15), descrição
// sem telefone/site/endereço, seller_contact com WhatsApp.
// ============================================================

export const ML_MAX_PHOTOS = 15;
export const ML_TITLE_MAX = 60;
export const ML_DESCRIPTION_MAX = 50_000;

export const ML_CATEGORY: Record<VehicleCategory, string> = {
  carro: "MLB1744", // Carros e Caminhonetes
  utilitario: "MLB1744",
  moto: "MLB1763",
  caminhao: "MLB5839",
};

export const ML_FUEL: Record<Fuel, string> = {
  flex: "Flex",
  gasolina: "Gasolina",
  etanol: "Álcool",
  diesel: "Diesel",
  hibrido: "Híbrido",
  eletrico: "Elétrico",
  gnv: "GNV",
};

export const ML_TRANSMISSION: Record<Transmission, string> = {
  manual: "Manual",
  automatico: "Automática",
  cvt: "CVT",
  automatizado: "Automatizada",
};

export const ML_BODY: Record<BodyType, string | null> = {
  hatch: "Hatchback",
  sedan: "Sedã",
  suv: "SUV",
  picape: "Pick-Up",
  perua: "Perua",
  minivan: "Minivan",
  cupe: "Cupê",
  conversivel: "Conversível",
  van: "Van",
  utilitario: "Utilitário",
  outro: null,
};

/** Opcionais (grafia do cadastro) → atributos HAS_* do ML. */
export const ML_OPTIONAL_ATTR: Record<string, string> = {
  "Ar-condicionado": "HAS_AIR_CONDITIONING",
  "Ar-condicionado digital": "HAS_AIR_CONDITIONING",
  "Ar-condicionado dual zone": "HAS_AIR_CONDITIONING",
  "Direção hidráulica": "HAS_POWER_STEERING",
  "Direção elétrica": "HAS_POWER_STEERING",
  "Vidros elétricos": "HAS_POWER_WINDOWS",
  "Travas elétricas": "HAS_POWER_LOCKS",
  Airbag: "HAS_AIRBAGS",
  "Freios ABS": "HAS_ABS_BRAKES",
  Multimídia: "HAS_MULTIMEDIA_SYSTEM",
  "Câmera de ré": "HAS_REAR_CAMERA",
  "Sensor de estacionamento": "HAS_PARKING_SENSOR",
  "Bancos de couro": "HAS_LEATHER_UPHOLSTERY",
  "Teto solar": "HAS_SUNROOF",
  "Teto panorâmico": "HAS_PANORAMIC_ROOF",
  "Rodas de liga leve": "HAS_ALLOY_WHEELS",
  "Piloto automático": "HAS_CRUISE_CONTROL",
  "Piloto automático adaptativo (ACC)": "HAS_ADAPTIVE_CRUISE_CONTROL",
  "Faróis de LED": "HAS_LED_HEADLIGHTS",
  "Faróis de xenônio": "HAS_XENON_HEADLIGHTS",
  "Farol de neblina": "HAS_FOG_LIGHTS",
  Alarme: "HAS_ALARM",
  "Computador de bordo": "HAS_ONBOARD_COMPUTER",
  "Controle de estabilidade": "HAS_STABILITY_CONTROL",
  "Controle de tração": "HAS_TRACTION_CONTROL",
  GPS: "HAS_GPS",
  "Retrovisores elétricos": "HAS_ELECTRIC_MIRRORS",
  "Sensor de chuva": "HAS_RAIN_SENSOR",
  "Volante multifuncional": "HAS_MULTIFUNCTION_STEERING_WHEEL",
  "Bancos com aquecimento": "HAS_HEATED_SEATS",
  "Chave presencial": "HAS_KEYLESS_ENTRY",
  "Partida por botão": "HAS_PUSH_BUTTON_START",
  "Apple CarPlay / Android Auto": "HAS_APPLE_CARPLAY",
  "Câmera 360°": "HAS_360_CAMERA",
  "Sensor de ponto cego": "HAS_BLIND_SPOT_MONITOR",
  "Assistente de permanência em faixa": "HAS_LANE_ASSIST",
  "Frenagem autônoma de emergência": "HAS_AUTONOMOUS_EMERGENCY_BRAKING",
  Isofix: "HAS_ISOFIX",
  "Tração 4x4": "HAS_4X4",
  "Engate para reboque": "HAS_TOW_HITCH",
  "Bancos elétricos": "HAS_ELECTRIC_SEATS",
  "Head-up display": "HAS_HEAD_UP_DISPLAY",
  "Carregador por indução": "HAS_WIRELESS_CHARGER",
};

/** Remove telefone, e-mail, site e endereço da descrição (regra do ML). */
export function sanitizeDescription(text: string): string {
  return text
    .replace(/https?:\/\/\S+|www\.\S+/gi, "")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "")
    .replace(/(\+?55\s*)?\(?\d{2}\)?\s*9?\s?\d{4}[-\s.]?\d{4}/g, "")
    .replace(/\b(rua|av\.?|avenida|alameda|travessa)\s+[^\n,.]{3,60}\b(,|\s)\s*\d{1,5}/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|shorts\/|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

/** "11987654321" → { area: "11", number: "987654321" } */
export function splitPhone(digits: string | null): { area: string; number: string } | null {
  if (!digits || digits.length < 10) return null;
  return { area: digits.slice(0, 2), number: digits.slice(2) };
}

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
  MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
  PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
  SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

export interface MlMappingContext {
  /** BRAND resolvida no catálogo (value_id) — sem catálogo, vai value_name */
  brandValueId?: string | null;
  /** ids de atributos que a categoria aceita; vazio = enviar todos os HAS_* */
  knownAttributes?: Set<string>;
}

interface MlAttribute {
  id: string;
  value_id?: string;
  value_name?: string;
}

export function buildMlDescription(v: CanonicalVehicle): string {
  const { vehicle } = v;
  const parts: string[] = [];
  if (vehicle.description) parts.push(sanitizeDescription(vehicle.description));
  if (vehicle.optionals?.length) parts.push(`Opcionais: ${vehicle.optionals.join(", ")}.`);
  const flags = vehicle.condition_flags ?? [];
  if (flags.length) {
    const labels: Record<string, string> = {
      unico_dono: "Único dono", ipva_pago: "IPVA pago", licenciado: "Licenciado",
      blindado: "Blindado", leilao: "Veículo de leilão", cautelar_aprovada: "Cautelar aprovada",
      garantia_fabrica: "Garantia de fábrica", revisoes_concessionaria: "Revisões na concessionária",
      revisoes_agenda: "Revisões em dia", aceita_troca: "Aceita troca", alienado: "Alienado",
      adaptado_pcd: "Adaptado para PcD",
    };
    parts.push(flags.map((f) => labels[f] ?? f).join(" · "));
  }
  return parts.join("\n\n").slice(0, ML_DESCRIPTION_MAX) || portalTitle(vehicle, ML_TITLE_MAX);
}

/**
 * Monta o payload de POST /items. Lança 'validation' com a lista do
 * que falta (mesma lista do aviso no formulário).
 */
export function buildMlItem(
  v: CanonicalVehicle,
  conn: Pick<Connection, "settings">,
  ctx: MlMappingContext = {},
): PortalPayload {
  const { vehicle, tenant } = v;
  const missing = publishRequirements("mercadolivre", vehicle, tenant);
  if (missing.length > 0) {
    throw new PortalError("validation", `faltam no cadastro: ${missing.join(", ")}`);
  }

  const attrs: MlAttribute[] = [];
  const push = (a: MlAttribute) => {
    if (ctx.knownAttributes?.size && !ctx.knownAttributes.has(a.id)) return;
    attrs.push(a);
  };

  push(ctx.brandValueId
    ? { id: "BRAND", value_id: ctx.brandValueId, value_name: vehicle.brand }
    : { id: "BRAND", value_name: vehicle.brand });
  push({ id: "MODEL", value_name: vehicle.model });
  if (vehicle.version) push({ id: "TRIM", value_name: vehicle.version });
  push({ id: "VEHICLE_YEAR", value_name: String(vehicle.year_model) });
  push({ id: "KILOMETERS", value_name: `${vehicle.mileage ?? 0} km` });
  if (vehicle.fuel) push({ id: "FUEL_TYPE", value_name: ML_FUEL[vehicle.fuel] });
  if (vehicle.fuel === "gnv") push({ id: "HAS_GNV", value_name: "Sim" });
  if (vehicle.transmission) push({ id: "TRANSMISSION", value_name: ML_TRANSMISSION[vehicle.transmission] });
  if (vehicle.color) push({ id: "COLOR", value_name: vehicle.color });
  if (vehicle.doors) push({ id: "DOORS", value_name: String(vehicle.doors) });
  if (vehicle.body_type && ML_BODY[vehicle.body_type]) {
    push({ id: "VEHICLE_BODY_TYPE", value_name: ML_BODY[vehicle.body_type]! });
  }
  if (vehicle.engine) push({ id: "ENGINE", value_name: vehicle.engine });
  if (vehicle.plate) push({ id: "LICENSE_PLATE", value_name: vehicle.plate.toUpperCase() });
  if (vehicle.vin_last6) push({ id: "VIN_LAST_DIGITS", value_name: vehicle.vin_last6 });
  if (vehicle.steering === "hidraulica" || vehicle.steering === "eletrica" || vehicle.steering === "assistida") {
    push({ id: "HAS_POWER_STEERING", value_name: "Sim" });
  }
  const flags = new Set(vehicle.condition_flags ?? []);
  push({ id: "ARMORED", value_name: flags.has("blindado") ? "Sim" : "Não" });
  push({ id: "SINGLE_OWNER", value_name: flags.has("unico_dono") ? "Sim" : "Não" });

  const seen = new Set(attrs.map((a) => a.id));
  for (const opt of vehicle.optionals ?? []) {
    const id = ML_OPTIONAL_ATTR[opt];
    if (id && !seen.has(id)) {
      seen.add(id);
      push({ id, value_name: "Sim" });
    }
  }

  const phone = splitPhone(v.phone);
  const wpp = splitPhone(v.whatsapp) ?? phone;
  const addr = tenant.address ?? {};
  const uf = (addr.state ?? "").toUpperCase();

  const listingType = conn.settings.listing_type ?? "silver";

  const payload: PortalPayload = {
    category_id: ML_CATEGORY[vehicle.category] ?? ML_CATEGORY.carro,
    title: portalTitle(vehicle, ML_TITLE_MAX),
    price: Math.round(Number(vehicle.price)),
    currency_id: "BRL",
    available_quantity: 1,
    buying_mode: "classified",
    listing_type_id: listingType,
    condition: vehicle.zero_km ? "new" : "used",
    channels: ["marketplace"],
    pictures: v.photos.slice(0, ML_MAX_PHOTOS).map((p) => ({ source: p.url })),
    seller_contact: {
      contact: tenant.name,
      other_info: "",
      country_code: "+55",
      area_code: phone?.area ?? "",
      phone: phone?.number ?? "",
      country_code2: "+55",
      area_code2: wpp?.area ?? "",
      phone2: wpp?.number ?? "",
      email: tenant.email ?? "",
      webpage: v.storefrontUrl,
    },
    location: {
      address_line: [addr.street, addr.number].filter(Boolean).join(", "),
      zip_code: (addr.cep ?? "").replace(/\D/g, ""),
      neighborhood: addr.neighborhood ? { name: addr.neighborhood } : undefined,
      city: addr.city ? { name: addr.city } : undefined,
      state: uf ? { id: `BR-${uf}`, name: UF_NAMES[uf] ?? uf } : undefined,
      country: { id: "BR", name: "Brasil" },
    },
    attributes: attrs,
  };
  const video = youtubeId(vehicle.video_url);
  if (video) payload.video_id = video;
  return payload;
}

export function bodyLabel(b: BodyType): string {
  return BODY_TYPE_LABELS[b];
}
