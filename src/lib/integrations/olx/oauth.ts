import { PortalError } from "../errors";
import { OLX_APPS, OLX_AUTH } from "./client";

// ============================================================
// OAuth 2.0 da OLX. Escopos: basic_user_info (identifica a conta),
// autoupload (anúncios), autoservice (leads/webhooks). A doc não
// documenta expires_in nem refresh: tratamos o token como longo e
// um 401 vira estado "reconectar".
// ============================================================

export const OLX_SCOPES = "basic_user_info autoupload autoservice";

function clientCreds(): { id: string; secret: string } {
  const id = process.env.OLX_CLIENT_ID;
  const secret = process.env.OLX_CLIENT_SECRET;
  if (!id || !secret) {
    throw new PortalError("auth", "OLX_CLIENT_ID/OLX_CLIENT_SECRET não configurados no servidor");
  }
  return { id, secret };
}

export function olxConfigured(): boolean {
  return !!process.env.OLX_CLIENT_ID && !!process.env.OLX_CLIENT_SECRET;
}

export function authorizeUrl(input: { redirectUri: string; state: string }): string {
  const { id } = clientCreds();
  const u = new URL(OLX_AUTH);
  u.searchParams.set("client_id", id);
  u.searchParams.set("redirect_uri", input.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", OLX_SCOPES);
  u.searchParams.set("state", input.state);
  return u.toString();
}

export interface OlxTokens {
  access_token: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
}

export async function exchangeCode(input: { code: string; redirectUri: string }): Promise<OlxTokens> {
  const { id, secret } = clientCreds();
  const body = new URLSearchParams({
    code: input.code,
    client_id: id,
    client_secret: secret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
  });
  let res: Response;
  try {
    res = await fetch(`${OLX_AUTH}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });
  } catch (err) {
    throw new PortalError("transient", `rede: ${(err as Error).message}`);
  }
  const text = await res.text();
  let json: OlxTokens | null = null;
  try {
    json = JSON.parse(text) as OlxTokens;
  } catch {
    json = null;
  }
  if (!res.ok || !json?.access_token) {
    throw new PortalError("auth", `troca do código recusada pela OLX (${res.status}): ${text.slice(0, 200)}`);
  }
  return json;
}

export interface OlxUserInfo {
  user_email?: string;
  user_name?: string;
  user_id?: string | number;
}

export async function basicUserInfo(accessToken: string): Promise<OlxUserInfo> {
  const res = await fetch(`${OLX_APPS}/oauth_api/basic_user_info`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!res.ok) throw new PortalError("auth", `basic_user_info ${res.status}`);
  return (await res.json()) as OlxUserInfo;
}
