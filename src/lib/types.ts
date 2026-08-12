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

export const PLAN_IDS = ["basico", "pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** Status do Stripe que liberam acesso ao produto. */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

// ------------------------------------------------------------
// Equipe (memberships) — owner é único por loja
// ------------------------------------------------------------
export type TeamRole = "owner" | "admin" | "vendedor";

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  vendedor: "Vendedor",
};

/** linha devolvida pela RPC team_members */
export interface TeamMember {
  user_id: string;
  role: TeamRole;
  name: string;
  email: string;
  created_at: string;
}

export interface Invite {
  id: string;
  tenant_id: string;
  email: string;
  role: Exclude<TeamRole, "owner">;
  token: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  tenant_id: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: PlanId;
  /** status cru do Stripe (active, trialing, past_due, canceled…) */
  status: string;
  /** intervalo de cobrança do Stripe (month = mensal, year = anual) */
  billing_interval: "month" | "year" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantColors {
  /** Cor principal da loja (header, links, destaques) */
  primary: string;
  /** Cor de destaque (CTAs, botões de ação) */
  accent: string;
  /** Cor de fundo do site; ausente = padrão do template */
  background?: string;
}

export const DEFAULT_COLORS: TenantColors = {
  primary: "#1d4ed8",
  accent: "#f59e0b",
};

/** Fontes da vitrine — nomes EXATOS de famílias do Google Fonts. */
export interface TenantFonts {
  /** Família dos títulos/display (ex.: "Playfair Display") */
  head: string;
  /** Família do corpo de texto (ex.: "Inter") */
  body: string;
}

export const HERO_MEDIA_TYPES = ["none", "video", "images"] as const;
export type HeroMediaType = (typeof HERO_MEDIA_TYPES)[number];

/** IDs de rastreamento/marketing da vitrine — recurso do plano Pro. */
export interface TenantTracking {
  /** Meta (Facebook) Pixel ID — numérico */
  facebook_pixel?: string;
  /** TikTok Pixel ID */
  tiktok_pixel?: string;
  /** GA4 Measurement ID (G-XXXXXXXXXX) */
  google_analytics?: string;
}

/** Redes sociais exibidas no footer da vitrine (URLs completas). */
export const SOCIAL_NETWORKS = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "youtube",
  "linkedin",
  "threads",
  "kwai",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X (Twitter)",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  threads: "Threads",
  kwai: "Kwai",
};

/** Hero configurável da vitrine (textos + mídia de fundo). */
export interface TenantHero {
  /** Olho/eyebrow acima do título; "" = não renderiza */
  eyebrow?: string;
  /** Título principal; ausente = padrão do template (ou slogan) */
  title?: string;
  /** Subtítulo/apoio; ausente = padrão do template (ou "sobre") */
  subtitle?: string;
  /** Rótulo do botão principal do hero; "" = não renderiza o botão */
  cta_label?: string;
  /** Fundo da hero: nada (padrão do template), vídeo ou carrossel */
  media?: HeroMediaType;
  /** URL https de um .mp4/.webm (autoplay mudo em loop) */
  video_url?: string;
  /** Imagens do carrossel (mesmo shape de VehiclePhoto) */
  images?: { id: string; path: string; url: string }[];
}

export interface TenantSettings {
  slogan?: string;
  about?: string;
  footer_text?: string;
  business_hours?: string;
  /** LEGADO: id da lista curada antiga (ver src/lib/fonts.ts). Mantido só como fallback de leitura. */
  font?: string;
  /** Fontes escolhidas no catálogo completo do Google Fonts. Tem precedência sobre `font`. */
  fonts?: TenantFonts;
  /** Hero configurável (textos + mídia de fundo). */
  hero?: TenantHero;
  /** Headings editáveis das seções ("" = ocultar; ver lib/template-texts). */
  texts?: {
    featured_title?: string;
    featured_subtitle?: string;
    stock_title?: string;
  };
  /**
   * Exibir o nome da loja em TEXTO ao lado do logo. Default false:
   * com logo, só o logo aparece; sem logo, o nome sempre aparece.
   */
  show_name?: boolean;
  /** pixels de marketing (só renderizados no plano Pro) */
  tracking?: TenantTracking;
  /** links de redes sociais do footer (URLs https completas) */
  social?: Partial<Record<SocialNetwork, string>>;
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
  /** domínio próprio apontado pelo lojista (normalizado), ou null */
  custom_domain: string | null;
  /** 'pending' até o apontamento ser verificado, depois 'active' */
  custom_domain_status: "pending" | "active";
  /** cópia de conveniência; fonte da verdade é subscriptions.status */
  plan: PlanId | null;
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

/**
 * Marcadores de condição do anúncio (conjunto do Webmotors).
 * A maioria é argumento de venda; leilão/alienado são DIVULGAÇÃO
 * obrigatória de procedência — a UI os destaca em tom de aviso.
 */
export const VEHICLE_FLAGS = [
  "unico_dono",
  "ipva_pago",
  "licenciado",
  "blindado",
  "leilao",
  "cautelar_aprovada",
  "garantia_fabrica",
  "revisoes_concessionaria",
  "revisoes_agenda",
  "aceita_troca",
  "alienado",
  "adaptado_pcd",
] as const;
export type VehicleFlag = (typeof VEHICLE_FLAGS)[number];

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
  /** marcadores de condição (Blindado, IPVA pago, Leilão…) */
  condition_flags: VehicleFlag[];
  sold_at: string | null;
  /** snapshot FIPE (cascata no cadastro); null = cadastro manual */
  fipe_code: string | null;
  fipe_year_id: string | null;
  fipe_price: number | null;
  fipe_reference: string | null;
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

export const VEHICLE_FLAG_LABELS: Record<VehicleFlag, string> = {
  unico_dono: "Único dono",
  ipva_pago: "IPVA pago",
  licenciado: "Licenciado",
  blindado: "Blindado",
  leilao: "Veículo de leilão",
  cautelar_aprovada: "Cautelar aprovada",
  garantia_fabrica: "Garantia de fábrica",
  revisoes_concessionaria: "Revisões na concessionária",
  revisoes_agenda: "Revisões pela agenda do carro",
  aceita_troca: "Aceita troca",
  alienado: "Alienado",
  adaptado_pcd: "Adaptado para PcD",
};

/** leilão/alienado são divulgação de procedência, não venda */
export const VEHICLE_FLAG_WARNINGS: readonly VehicleFlag[] = [
  "leilao",
  "alienado",
];

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
