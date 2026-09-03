import type { PortalId, Tenant, Vehicle } from "../types";

// ============================================================
// O que falta no cadastro para publicar em cada portal. Puro e
// compartilhado: o form do veículo mostra como aviso (sem bloquear)
// e o adapter lança 'validation' com a mesma lista.
// ============================================================

type V = Pick<
  Vehicle,
  | "brand"
  | "model"
  | "year_model"
  | "price"
  | "mileage"
  | "fuel"
  | "transmission"
  | "color"
  | "doors"
  | "plate"
  | "photos"
  | "category"
>;
type T = Pick<Tenant, "phone" | "whatsapp" | "address" | "cnpj">;

export function publishRequirements(
  portal: PortalId,
  v: V,
  t: T,
): string[] {
  const missing: string[] = [];
  const has = (x: unknown) => x != null && x !== "";
  const photos = Array.isArray(v.photos) ? v.photos.length : 0;
  const phone = t.phone || t.whatsapp;

  if (!has(v.year_model)) missing.push("ano do modelo");
  if (!(Number(v.price) > 0)) missing.push("preço");
  if (photos === 0) missing.push("pelo menos 1 foto");

  switch (portal) {
    case "mercadolivre":
      if (!has(v.mileage)) missing.push("quilometragem");
      if (!has(v.fuel)) missing.push("combustível");
      if (!has(v.transmission)) missing.push("câmbio");
      if (!has(v.color)) missing.push("cor");
      if (v.category !== "moto" && !has(v.doors)) missing.push("portas");
      if (!phone) missing.push("telefone da loja (Configurações)");
      if (!t.address?.cep) missing.push("CEP da loja (Configurações)");
      break;
    case "olx":
      if (!has(v.mileage)) missing.push("quilometragem");
      if (!has(v.fuel)) missing.push("combustível");
      if (!has(v.transmission)) missing.push("câmbio");
      if (!has(v.plate)) missing.push("placa (validada pela OLX, não é exibida)");
      if (!phone) missing.push("telefone da loja (Configurações)");
      if (!t.address?.cep) missing.push("CEP da loja (Configurações)");
      break;
    case "webmotors":
      if (!t.cnpj) missing.push("CNPJ da loja (Configurações)");
      if (!has(v.mileage)) missing.push("quilometragem");
      if (!has(v.color)) missing.push("cor");
      break;
    case "chavesnamao":
    case "usadosbr":
    case "meta_catalog":
      break;
  }
  return missing;
}
