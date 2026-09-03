import { PortalError } from "../errors";
import type { Connection } from "../types";

// ============================================================
// Cliente HTTP da OLX (apps.olx.com.br). A API é "token no corpo":
// quase todas as chamadas são POST/PUT JSON com access_token dentro.
// Retorno síncrono do autoupload: statusCode 0 ok · -2 bloqueio por
// excesso · -4 validação · -6 sem permissão (sem plano Empresa).
// ============================================================

export const OLX_APPS = "https://apps.olx.com.br";
export const OLX_AUTH = "https://auth.olx.com.br/oauth";

export interface OlxResponse {
  statusCode?: number;
  statusMessage?: string;
  token?: string;
  errors?: unknown;
  [k: string]: unknown;
}

export function classifyOlxStatus(res: OlxResponse): PortalError | null {
  const code = res.statusCode;
  if (code === 0 || code === undefined) return null;
  const msg = [res.statusMessage, res.errors ? JSON.stringify(res.errors).slice(0, 300) : null]
    .filter(Boolean)
    .join(" · ") || `statusCode ${code}`;
  switch (code) {
    case -6:
      return new PortalError("needs_plan", msg, res);
    case -2:
      return new PortalError("rate_limit", msg, res);
    case -4:
      return new PortalError("validation", msg, res);
    case -1:
    case -5:
      return new PortalError("auth", msg, res);
    default:
      return new PortalError("transient", msg, res);
  }
}

export async function olxFetch<T = OlxResponse>(
  conn: Connection | null,
  path: string,
  init: { method?: "GET" | "POST" | "PUT"; body?: Record<string, unknown>; anonymous?: boolean } = {},
): Promise<T> {
  const token = conn?.creds.access_token;
  if (!init.anonymous && !token) throw new PortalError("auth", "conexão sem access_token");
  const url = path.startsWith("http") ? path : `${OLX_APPS}${path}`;
  const body = init.body ? { ...(init.anonymous ? {} : { access_token: token }), ...init.body } : undefined;

  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
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
  if (res.status === 401 || res.status === 403) {
    throw new PortalError("auth", `OLX ${res.status}: ${text.slice(0, 200)}`);
  }
  if (res.status === 429) throw new PortalError("rate_limit", "OLX 429");
  if (res.status === 404) throw new PortalError("not_found", `OLX 404 ${path}`);
  if (!res.ok) {
    throw new PortalError(res.status >= 500 ? "transient" : "validation", `OLX ${res.status}: ${text.slice(0, 300)}`);
  }
  return json as T;
}
