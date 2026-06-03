// ============================================================
// Tipos de domínio — espelham o schema (supabase/migrations).
// Fonte única: nada de tipos duplicados/divergentes como na v1.
// ============================================================

export const TEMPLATE_IDS = [
  "classico",
  "moderno",
  "premium",
  "minimal",
  "esportivo",
  "vitrine",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface TenantColors {
  /** Cor principal da loja (header, links, destaques) */
  primary: string;
  /** Cor de destaque (CTAs, botões de ação) */
  accent: string;
}

export const DEFAULT_COLORS: TenantColors = {
  primary: "#1d4ed8",
  accent: "#f59e0b",
};

export interface TenantSettings {
  slogan?: string;
  about?: string;
  footer_text?: string;
  business_hours?: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: Record<string, string> | null;
  template_id: TemplateId;
  colors: TenantColors;
  logo_url: string | null;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  name: string;
  phone: string | null;
  created_at: string;
}

export const FUELS = [
  "flex",
  "gasolina",
  "etanol",
  "diesel",
  "hibrido",
  "eletrico",
  "gnv",
] as const;
export type Fuel = (typeof FUELS)[number];

export const TRANSMISSIONS = [
  "manual",
  "automatico",
  "cvt",
  "automatizado",
] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export const VEHICLE_CATEGORIES = [
  "carro",
  "moto",
  "utilitario",
  "caminhao",
] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const VEHICLE_STATUSES = [
  "available",
  "reserved",
  "sold",
  "archived",
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

/** Foto com id estável (v1 manipulava por índice e corrompia o array). */
export interface VehiclePhoto {
  id: string;
  path: string;
  url: string;
}

export interface Vehicle {
  id: string;
  tenant_id: string;
  brand: string;
  model: string;
  version: string | null;
  year_fab: number | null;
  year_model: number | null;
  plate: string | null;
  color: string | null;
  fuel: Fuel | null;
  transmission: Transmission | null;
  mileage: number | null;
  doors: number | null;
  category: VehicleCategory;
  price: number;
  description: string | null;
  optionals: string[];
  photos: VehiclePhoto[];
  featured: boolean;
  status: VehicleStatus;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export const LEAD_TYPES = ["proposal", "whatsapp", "phone"] as const;
export type LeadType = (typeof LEAD_TYPES)[number];

export const LEAD_STATUSES = ["new", "in_progress", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: string;
  tenant_id: string;
  vehicle_id: string | null;
  type: LeadType;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  proposal_value: number | null;
  trade_vehicle: string | null;
  status: LeadStatus;
  notes: string | null;
  utm: Record<string, string> | null;
  device: string | null;
  created_at: string;
  updated_at: string;
  /** join opcional */
  vehicle?: Pick<Vehicle, "id" | "brand" | "model" | "year_model" | "price" | "photos"> | null;
}

// ------------------------------------------------------------
// Labels PT-BR centralizados (v1 duplicava esses mapas em 3+ páginas)
// ------------------------------------------------------------

export const FUEL_LABELS: Record<Fuel, string> = {
  flex: "Flex",
  gasolina: "Gasolina",
  etanol: "Etanol",
  diesel: "Diesel",
  hibrido: "Híbrido",
  eletrico: "Elétrico",
  gnv: "GNV",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  manual: "Manual",
  automatico: "Automático",
  cvt: "CVT",
  automatizado: "Automatizado",
};

export const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  carro: "Carro",
  moto: "Moto",
  utilitario: "Utilitário",
  caminhao: "Caminhão",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  available: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
  archived: "Arquivado",
};

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  proposal: "Proposta",
  whatsapp: "WhatsApp",
  phone: "Ligação",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  in_progress: "Em atendimento",
  won: "Convertido",
  lost: "Perdido",
};
