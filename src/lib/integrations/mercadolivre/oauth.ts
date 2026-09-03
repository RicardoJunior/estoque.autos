import { PortalError } from "../errors";
import { classifyMlError, ML_API, ML_AUTH, type MlErrorBody } from "./client";

// ============================================================
// OAuth 2.0 do Mercado Livre (Authorization Code + PKCE).
// access_token dura 6 h; refresh_token é de USO ÚNICO (6 meses) e
// cada renovação devolve um refresh novo — quem chama precisa gravar
// o novo antes de liberar (lock por job no worker).
// ============================================================

export interface MlTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

function clientCreds(): { id: string; secret: string } {
  const id = process.env.ML_CLIENT_ID;
  const secret = process.env.ML_CLIENT_SECRET;
  if (!id || !secret) {
    throw new PortalError("auth", "ML_CLIENT_ID/ML_CLIENT_SECRET não configurados no servidor");
  }
  return { id, secret };
}

export function mlConfigured(): boolean {
  return !!process.env.ML_CLIENT_ID && !!process.env.ML_CLIENT_SECRET;
}

export function authorizeUrl(input: {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const { id } = clientCreds();
  const u = new URL(ML_AUTH);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", id);
  u.searchParams.set("redirect_uri", input.redirectUri);
  u.searchParams.set("state", input.state);
  u.searchParams.set("code_challenge", input.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  return u.toString();
}

async function tokenRequest(params: Record<string, string>): Promise<MlTokens> {
  const { id, secret } = clientCreds();
  const body = new URLSearchParams({ client_id: id, client_secret: secret, ...params });
  let res: Response;
  try {
    res = await fetch(`${ML_API}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
  } catch (err) {
    throw new PortalError("transient", `rede: ${(err as Error).message}`);
  }
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  if (!res.ok) {
    const err = classifyMlError(res.status, json as MlErrorBody | null, text.slice(0, 200));
    // troca/refresh recusados são sempre problema de autorização
    throw new PortalError(err.kind === "transient" || err.kind === "rate_limit" ? err.kind : "auth", err.message, json);
  }
  const t = json as MlTokens;
  if (!t?.access_token || !t.refresh_token) {
    throw new PortalError("auth", "resposta do token sem access_token/refresh_token", json);
  }
  return t;
}

export function exchangeCode(input: {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}): Promise<MlTokens> {
  return tokenRequest({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    ...(input.codeVerifier ? { code_verifier: input.codeVerifier } : {}),
  });
}

export function refreshTokens(refreshToken: string): Promise<MlTokens> {
  return tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
}

export function expiresAt(tokens: MlTokens): Date {
  return new Date(Date.now() + Math.max(60, tokens.expires_in) * 1000);
}
