import { PortalError } from "../errors";
import type { Connection } from "../types";

// ============================================================
// Cliente HTTP do Mercado Livre (api.mercadolibre.com) com
// classificação de erro: 401/403 → auth; 429 → rate_limit; 404 →
// not_found; 400/422 → validation (ou needs_plan quando a causa é
// pacote/listing_type); 5xx → transient.
// ============================================================

export const ML_API = "https://api.mercadolibre.com";
export const ML_AUTH = "https://auth.mercadolivre.com.br/authorization";

export interface MlErrorBody {
  message?: string;
  error?: string;
  status?: number;
  cause?: { code?: string | number; message?: string; type?: string }[];
}

const PLAN_HINTS = [
  "package",
  "pacote",
  "listing_type",
  "not_allowed_to_list",
  "user.not.allowed",
  "motors",
  "quota",
];

export function classifyMlError(status: number, body: MlErrorBody | null, fallback: string): PortalError {
  const causes = (body?.cause ?? [])
    .map((c) => [c.code, c.message].filter(Boolean).join(": "))
    .filter(Boolean);
  const text = [body?.message, body?.error, ...causes].filter(Boolean).join(" · ") || fallback;
  const lower = text.toLowerCase();

  if (status === 401 || (status === 403 && /token|unauthorized|forbidden/.test(lower))) {
    return new PortalError("auth", text, body);
  }
  if (status === 429) return new PortalError("rate_limit", text, body);
  if (status === 404) return new PortalError("not_found", text, body);
  if (status === 400 || status === 403 || status === 422) {
    if (PLAN_HINTS.some((h) => lower.includes(h))) {
      return new PortalError("needs_plan", text, body);
    }
    return new PortalError("validation", text, body);
  }
  if (status >= 500) return new PortalError("transient", text, body);
  return new PortalError("transient", text, body);
}

export interface MlRequest {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** chamada sem token (OAuth, catálogos públicos) */
  anonymous?: boolean;
}

export async function mlFetch<T = unknown>(
  conn: Connection | null,
  path: string,
  init: MlRequest = {},
): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : `${ML_API}${path}`);
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!init.anonymous) {
    const token = conn?.creds.access_token;
    if (!token) throw new PortalError("auth", "conexão sem access_token");
    headers.Authorization = `Bearer ${token}`;
  }
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch (err) {
    throw new PortalError("transient", `rede: ${(err as Error).message}`);
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    throw classifyMlError(res.status, json as MlErrorBody | null, `${res.status} ${text.slice(0, 200)}`);
  }
  return json as T;
}
