import { cache } from "react";
import { createAnonClient } from "./supabase/server";
import {
  DEFAULT_COLORS,
  type PlanId,
  type TemplateId,
  type TenantColors,
  type TenantSettings,
  type Vehicle,
} from "./types";

/** Loja exposta publicamente (view `storefronts`, sem dados internos). */
export interface Storefront {
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
  /** plano vigente (view storefronts) — gate de recursos Pro na
   *  vitrine (pixels); pode vir undefined antes da migration */
  plan?: PlanId | null;
}

/**
 * Veículo público (view `vehicles_public`, sem placa nem sold_at).
 * A view expõe fipe_price/fipe_reference (referência estilo
 * Webmotors), mas não o código/ano internos da FIPE.
 */
export type PublicVehicle = Omit<
  Vehicle,
  // consigned e vin_last6 são internos (a view vehicles_public não os projeta)
  | "plate"
  | "sold_at"
  | "updated_at"
  | "fipe_code"
  | "fipe_year_id"
  | "consigned"
  | "vin_last6"
>;

function normalizeColors(raw: unknown): TenantColors {
  const c = (raw ?? {}) as Partial<TenantColors>;
  return {
    primary: c.primary ?? DEFAULT_COLORS.primary,
    accent: c.accent ?? DEFAULT_COLORS.accent,
    // fundo custom é opcional — não pode ser descartado na normalização
    background: c.background,
  };
}

/** Busca a loja pelo slug. `cache` deduplica entre layout/page/metadata. */
export const getStorefront = cache(
  async (slug: string): Promise<Storefront | null> => {
    const supabase = createAnonClient();
    const { data } = await supabase
      .from("storefronts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    return {
      ...data,
      colors: normalizeColors(data.colors),
      settings: (data.settings ?? {}) as TenantSettings,
    } as Storefront;
  },
);

export interface VehicleQuery {
  search?: string;
  category?: string;
  fuel?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "recent" | "price_asc" | "price_desc" | "km_asc";
}

function isValidPrice(n: number | undefined): n is number {
  return n != null && Number.isFinite(n) && n >= 0;
}

const SORTS: Record<string, { col: string; asc: boolean }> = {
  recent: { col: "created_at", asc: false },
  price_asc: { col: "price", asc: true },
  price_desc: { col: "price", asc: false },
  km_asc: { col: "mileage", asc: true },
};

export async function listPublicVehicles(
  tenantId: string,
  q: VehicleQuery = {},
): Promise<PublicVehicle[]> {
  const supabase = createAnonClient();
  const sort = SORTS[q.sort ?? "recent"] ?? SORTS.recent;

  let query = supabase
    .from("vehicles_public")
    .select("*")
    .eq("tenant_id", tenantId);

  // destaque só "fura a fila" na ordenação padrão; quando o visitante
  // pede "menor preço"/"menor km", a lista obedece SÓ o critério pedido
  // (destaque pinado fazia o sort parecer quebrado)
  if ((q.sort ?? "recent") === "recent") {
    query = query.order("featured", { ascending: false });
  }
  query = query.order(sort.col, { ascending: sort.asc, nullsFirst: false });

  if (q.category) query = query.eq("category", q.category);
  if (q.fuel) query = query.eq("fuel", q.fuel);
  if (q.transmission) query = query.eq("transmission", q.transmission);
  // NaN/negativo no filtro derrubaria a query no PostgREST → ignora
  if (isValidPrice(q.minPrice)) query = query.gte("price", q.minPrice);
  if (isValidPrice(q.maxPrice)) query = query.lte("price", q.maxPrice);
  if (q.search) {
    // busca por PALAVRA: "honda civic" exige que cada palavra apareça em
    // alguma coluna (o ilike do termo inteiro numa coluna só devolvia
    // zero resultado para consultas de duas palavras — "busca quebrada")
    const words = q.search
      .replace(/[%,()]/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 5);
    for (const w of words) {
      query = query.or(
        `brand.ilike.%${w}%,model.ilike.%${w}%,version.ilike.%${w}%`,
      );
    }
  }

  const { data } = await query;
  return (data ?? []) as PublicVehicle[];
}

export const getPublicVehicle = cache(
  async (tenantId: string, vehicleId: string): Promise<PublicVehicle | null> => {
    const supabase = createAnonClient();
    const { data } = await supabase
      .from("vehicles_public")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", vehicleId)
      .maybeSingle();
    return (data as PublicVehicle) ?? null;
  },
);
