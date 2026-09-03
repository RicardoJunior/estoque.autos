import type { SupabaseClient } from "@supabase/supabase-js";
import { canonicalStorefrontUrl } from "../site-url";
import { sha256Hex } from "./crypto";
import type { CanonicalVehicle, Tenant, Vehicle } from "./types";

// ============================================================
// Veículo canônico: entrada única dos adapters. Resolve loja, fotos
// (JPEG quando houver), URL pública e telefones.
// ============================================================

function digits(s: string | null | undefined): string | null {
  const d = (s ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  return d.length >= 10 ? d : null;
}

export function buildCanonical(
  vehicle: Vehicle,
  tenant: Tenant,
  phoneOverride?: string,
): CanonicalVehicle {
  const photos = (vehicle.photos ?? [])
    .filter((p) => p && typeof p.url === "string")
    .map((p) => ({ url: p.jpeg_url ?? p.url, url_webp: p.url }));
  return {
    vehicle,
    tenant,
    photos,
    storefrontUrl: canonicalStorefrontUrl(tenant, `/carros/${vehicle.id}`),
    phone: digits(phoneOverride) ?? digits(tenant.phone) ?? digits(tenant.whatsapp),
    whatsapp: digits(tenant.whatsapp),
    fipe:
      vehicle.fipe_code && vehicle.fipe_year_id
        ? { code: vehicle.fipe_code, yearId: vehicle.fipe_year_id }
        : null,
  };
}

export async function loadCanonical(
  admin: SupabaseClient,
  vehicleId: string,
  phoneOverride?: string,
): Promise<CanonicalVehicle | null> {
  const { data: vehicle } = await admin
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .maybeSingle();
  if (!vehicle) return null;
  const { data: tenant } = await admin
    .from("tenants")
    .select("*")
    .eq("id", vehicle.tenant_id)
    .maybeSingle();
  if (!tenant) return null;
  return buildCanonical(vehicle as Vehicle, tenant as Tenant, phoneOverride);
}

/** Todos os veículos ativos (available/reserved) da loja, canônicos. */
export async function loadTenantCanonicals(
  admin: SupabaseClient,
  tenantId: string,
  phoneOverride?: string,
): Promise<{ tenant: Tenant; items: CanonicalVehicle[] }> {
  const { data: tenant } = await admin
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();
  const { data: vehicles } = await admin
    .from("vehicles")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("status", ["available", "reserved"])
    .order("created_at", { ascending: true });
  const t = tenant as Tenant;
  return {
    tenant: t,
    items: ((vehicles ?? []) as Vehicle[]).map((v) => buildCanonical(v, t, phoneOverride)),
  };
}

/** JSON com chaves ordenadas — hash estável independente da ordem. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/** Hash do payload canônico — evita sync quando nada mudou. */
export function contentHash(payload: unknown): Promise<string> {
  return sha256Hex(stableStringify(payload));
}

export function isVehicleActive(v: Pick<Vehicle, "status">): boolean {
  return v.status === "available" || v.status === "reserved";
}
