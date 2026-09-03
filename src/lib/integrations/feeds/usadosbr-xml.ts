import { vehicleTitle } from "../../format";
import {
  BODY_TYPE_LABELS,
  CATEGORY_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  VEHICLE_FLAG_LABELS,
} from "../../types";
import type { CanonicalVehicle } from "../types";

// ============================================================
// Feed XML de catálogo por loja (Usadosbr e hubs que leem XML).
// Layout genérico com os campos usuais dos integradores; o suporte
// da Usadosbr (suporte@usadosbr.com) confirma o mapeamento.
// ============================================================

export function xmlEscape(v: unknown): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value: unknown): string {
  const s = value == null || value === "" ? "" : xmlEscape(value);
  return `<${name}>${s}</${name}>`;
}

export function buildUsadosbrXml(
  items: CanonicalVehicle[],
  tenant: { name: string; slug: string; cnpj?: string | null; phone?: string | null; whatsapp?: string | null },
  generatedAt = new Date(),
): string {
  const out: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<estoque origem="estoque.autos" gerado_em="${generatedAt.toISOString()}">`,
    `<loja>${tag("nome", tenant.name)}${tag("cnpj", tenant.cnpj ?? "")}${tag("telefone", tenant.phone ?? "")}${tag("whatsapp", tenant.whatsapp ?? "")}</loja>`,
    `<veiculos>`,
  ];
  for (const c of items) {
    const v = c.vehicle;
    out.push(
      `<veiculo>` +
        tag("id", v.id) +
        tag("titulo", vehicleTitle(v)) +
        tag("categoria", CATEGORY_LABELS[v.category]) +
        tag("marca", v.brand) +
        tag("modelo", v.model) +
        tag("versao", v.version ?? "") +
        tag("ano_fabricacao", v.year_fab ?? "") +
        tag("ano_modelo", v.year_model ?? "") +
        tag("km", v.mileage ?? "") +
        tag("cor", v.color ?? "") +
        tag("combustivel", v.fuel ? FUEL_LABELS[v.fuel] : "") +
        tag("cambio", v.transmission ? TRANSMISSION_LABELS[v.transmission] : "") +
        tag("portas", v.doors ?? "") +
        tag("carroceria", v.body_type ? BODY_TYPE_LABELS[v.body_type] : "") +
        tag("motor", v.engine ?? "") +
        tag("zero_km", v.zero_km ? "S" : "N") +
        tag("preco", Math.round(Number(v.price))) +
        tag("codigo_fipe", v.fipe_code ?? "") +
        tag("descricao", v.description ?? "") +
        `<opcionais>${(v.optionals ?? []).map((o) => tag("opcional", o)).join("")}</opcionais>` +
        `<condicoes>${(v.condition_flags ?? []).map((f) => tag("condicao", VEHICLE_FLAG_LABELS[f])).join("")}</condicoes>` +
        tag("url", c.storefrontUrl) +
        tag("video", v.video_url ?? "") +
        `<fotos>${c.photos.map((p) => tag("foto", p.url)).join("")}</fotos>` +
        `</veiculo>`,
    );
  }
  out.push(`</veiculos>`, `</estoque>`);
  return out.join("\n");
}
