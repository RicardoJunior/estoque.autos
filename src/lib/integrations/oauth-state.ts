// ============================================================
// OAuth: `state` assinado (HMAC + expiração + nonce) e PKCE S256.
// O nonce também vai num cookie httpOnly — o callback confere os
// dois (CSRF). (docs/integracoes-portais.md §5.10)
// ============================================================

import { base64url, hmacSha256, randomToken, safeEqual } from "./crypto";
import type { PortalId } from "./types";

export const OAUTH_COOKIE = "ea_oauth";
const STATE_TTL_MS = 10 * 60 * 1000;

export interface OAuthStatePayload {
  tenantId: string;
  portal: PortalId;
  nonce: string;
  exp: number;
}

function encode(obj: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(obj)));
}

function decode<T>(s: string): T | null {
  try {
    const pad = s.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(pad, "base64").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function signState(payload: Omit<OAuthStatePayload, "exp">): Promise<string> {
  const body = encode({ ...payload, exp: Date.now() + STATE_TTL_MS });
  const sig = await hmacSha256(body);
  return `${body}.${sig}`;
}

export async function verifyState(
  state: string | null,
  nonceFromCookie: string | undefined,
): Promise<OAuthStatePayload | null> {
  if (!state) return null;
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = await hmacSha256(body);
  if (!safeEqual(expected, sig)) return null;
  const payload = decode<OAuthStatePayload>(body);
  if (!payload || payload.exp < Date.now()) return null;
  if (!nonceFromCookie || !safeEqual(nonceFromCookie, payload.nonce)) return null;
  return payload;
}

/** PKCE: verifier aleatório + challenge S256 (base64url do SHA-256). */
export async function createPkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomToken(48);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

/** Conteúdo do cookie da etapa OAuth (nonce + verifier), assinado. */
export interface OAuthCookie {
  nonce: string;
  verifier?: string;
}

export async function packCookie(c: OAuthCookie): Promise<string> {
  const body = encode(c);
  return `${body}.${await hmacSha256(body)}`;
}

export async function unpackCookie(raw: string | undefined): Promise<OAuthCookie | null> {
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  if (!safeEqual(await hmacSha256(body), sig)) return null;
  return decode<OAuthCookie>(body);
}
