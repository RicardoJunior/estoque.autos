// ============================================================
// Cofre de credenciais: AES-256-GCM via WebCrypto (roda no Worker e
// no Node). Chave em INTEGRATIONS_KMS_KEY (32 bytes em base64), IV
// aleatório por registro. Saída em base64 (colunas text).
// ============================================================

const ALGO = "AES-GCM";

function b64encode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

/** Devolve um Uint8Array com ArrayBuffer próprio (BufferSource do WebCrypto). */
function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(s, "base64");
  const out = new Uint8Array(new ArrayBuffer(buf.byteLength));
  out.set(buf);
  return out;
}

let cachedKey: { raw: string; key: CryptoKey } | null = null;

async function importKey(rawB64: string): Promise<CryptoKey> {
  if (cachedKey?.raw === rawB64) return cachedKey.key;
  const raw = b64decode(rawB64);
  if (raw.byteLength !== 32) {
    throw new Error("INTEGRATIONS_KMS_KEY precisa ter 32 bytes em base64");
  }
  const key = await crypto.subtle.importKey("raw", raw, ALGO, false, [
    "encrypt",
    "decrypt",
  ]);
  cachedKey = { raw: rawB64, key };
  return key;
}

function kmsKey(): string {
  const k = process.env.INTEGRATIONS_KMS_KEY;
  if (!k) throw new Error("INTEGRATIONS_KMS_KEY ausente no ambiente");
  return k;
}

export const CREDENTIALS_KEY_VERSION = 1;

export async function encryptJson(
  value: unknown,
  keyB64 = kmsKey(),
): Promise<{ ciphertext: string; iv: string }> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(value));
  const enc = await crypto.subtle.encrypt({ name: ALGO, iv }, key, data);
  return { ciphertext: b64encode(new Uint8Array(enc)), iv: b64encode(iv) };
}

export async function decryptJson<T = unknown>(
  ciphertext: string,
  iv: string,
  keyB64 = kmsKey(),
): Promise<T> {
  const key = await importKey(keyB64);
  const dec = await crypto.subtle.decrypt(
    { name: ALGO, iv: b64decode(iv) },
    key,
    b64decode(ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(dec)) as T;
}

/** HMAC-SHA256 em base64url (state do OAuth, tokens de webhook). */
export async function hmacSha256(message: string, keyB64 = kmsKey()): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    b64decode(keyB64),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64url(new Uint8Array(sig));
}

export function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function randomToken(bytes = 24): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparação em tempo constante (segredos em URL/headers). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
