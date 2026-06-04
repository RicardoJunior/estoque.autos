// ============================================================
// Cloudflare for SaaS — custom hostnames.
//
// Quando o lojista aponta um domínio próprio (CNAME para o host do
// app), a Cloudflare precisa saber emitir o certificado e rotear
// esse hostname para o nosso Worker. Isso é feito registrando um
// "custom hostname" na zona do app via API.
//
// Integração OPCIONAL e graciosa: só roda se CLOUDFLARE_API_TOKEN e
// CLOUDFLARE_ZONE_ID estiverem presentes. Sem eles, o fluxo segue só
// com as instruções de DNS (o lojista aponta o CNAME e nós validamos
// o apontamento por DNS/HTTP — útil em dev ou setups self-managed).
// ============================================================

const API_BASE = "https://api.cloudflare.com/client/v4";

/** Status normalizado do custom hostname na Cloudflare. */
export type CustomHostnameStatus =
  | "pending" // criado, aguardando validação de propriedade/SSL
  | "active" // hostname + SSL ativos
  | "error" // validação falhou
  | "unknown";

export interface CustomHostnameResult {
  /** true se a chamada à API foi feita (env presentes e sem erro fatal). */
  configured: boolean;
  status: CustomHostnameStatus;
  /** mensagem para log/UI quando algo deu errado. */
  message?: string;
}

interface CfHostname {
  id: string;
  hostname: string;
  status?: string;
  ssl?: { status?: string };
}

interface CfListResponse {
  success: boolean;
  result?: CfHostname[];
  errors?: { message: string }[];
}

interface CfCreateResponse {
  success: boolean;
  result?: CfHostname;
  errors?: { message: string }[];
}

function credentials(): { token: string; zone: string } | null {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) return null;
  return { token, zone };
}

/** true se a integração Cloudflare for SaaS está configurada por env. */
export function isCloudflareSaasEnabled(): boolean {
  return credentials() !== null;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/** Mapeia o status cru da Cloudflare para o nosso status normalizado. */
function normalizeStatus(h: CfHostname | undefined): CustomHostnameStatus {
  if (!h) return "unknown";
  const ssl = h.ssl?.status;
  if (h.status === "active" && (ssl === "active" || ssl === undefined)) {
    return "active";
  }
  if (h.status === "pending" || ssl === "pending_validation" || ssl === "pending") {
    return "pending";
  }
  if (h.status === "active") return "active";
  return "pending";
}

async function findHostname(
  domain: string,
  token: string,
  zone: string,
): Promise<CfHostname | undefined> {
  const url = `${API_BASE}/zones/${zone}/custom_hostnames?hostname=${encodeURIComponent(domain)}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  const json = (await res.json()) as CfListResponse;
  return json.result?.find((h) => h.hostname === domain) ?? json.result?.[0];
}

/**
 * Registra (idempotente) o custom hostname na zona do app. Se já
 * existir, apenas retorna o status atual. SSL via HTTP (validação
 * automática quando o CNAME já aponta para o host do app).
 */
export async function createCustomHostname(
  domain: string,
): Promise<CustomHostnameResult> {
  const creds = credentials();
  if (!creds) return { configured: false, status: "unknown" };
  const { token, zone } = creds;

  try {
    // já existe? (evita 409 e mantém idempotência)
    const existing = await findHostname(domain, token, zone);
    if (existing) {
      return { configured: true, status: normalizeStatus(existing) };
    }

    const res = await fetch(`${API_BASE}/zones/${zone}/custom_hostnames`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        hostname: domain,
        ssl: { method: "http", type: "dv" },
      }),
    });
    const json = (await res.json()) as CfCreateResponse;
    if (!json.success) {
      return {
        configured: true,
        status: "error",
        message: json.errors?.map((e) => e.message).join("; "),
      };
    }
    return { configured: true, status: normalizeStatus(json.result) };
  } catch (err) {
    return {
      configured: true,
      status: "error",
      message: err instanceof Error ? err.message : "erro desconhecido",
    };
  }
}

/** Consulta o status atual do custom hostname (sem criar). */
export async function getCustomHostnameStatus(
  domain: string,
): Promise<CustomHostnameResult> {
  const creds = credentials();
  if (!creds) return { configured: false, status: "unknown" };
  const { token, zone } = creds;

  try {
    const existing = await findHostname(domain, token, zone);
    if (!existing) return { configured: true, status: "pending" };
    return { configured: true, status: normalizeStatus(existing) };
  } catch (err) {
    return {
      configured: true,
      status: "error",
      message: err instanceof Error ? err.message : "erro desconhecido",
    };
  }
}
