import { describe, expect, it } from "vitest";
import { portalTitle } from "../../format";
import { canonicalStorefrontUrl } from "../../site-url";
import { contentHash, stableStringify } from "../canonical";
import {
  decryptJson,
  encryptJson,
  hmacSha256,
  randomToken,
  safeEqual,
} from "../crypto";
import { humanMessage, PortalError, toPortalError } from "../errors";
import { createPkce, packCookie, signState, unpackCookie, verifyState } from "../oauth-state";
import { backoffMs, MAX_ATTEMPTS } from "../queue";
import { publishRequirements } from "../requirements";
import { normalizeName } from "../taxonomy";
import { canonicalFixture, tenantFixture, vehicleFixture } from "./fixtures";

const KEY = Buffer.from(new Uint8Array(32).map((_, i) => i)).toString("base64");
process.env.INTEGRATIONS_KMS_KEY = KEY;

describe("crypto", () => {
  it("cifra e decifra com IV por registro", async () => {
    const a = await encryptJson({ access_token: "abc", refresh_token: "r" }, KEY);
    const b = await encryptJson({ access_token: "abc", refresh_token: "r" }, KEY);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
    expect(await decryptJson(a.ciphertext, a.iv, KEY)).toEqual({ access_token: "abc", refresh_token: "r" });
  });
  it("rejeita chave errada", async () => {
    const other = Buffer.from(new Uint8Array(32).fill(7)).toString("base64");
    const { ciphertext, iv } = await encryptJson({ x: 1 }, KEY);
    await expect(decryptJson(ciphertext, iv, other)).rejects.toBeTruthy();
  });
  it("hmac determinístico e safeEqual", async () => {
    expect(await hmacSha256("a", KEY)).toBe(await hmacSha256("a", KEY));
    expect(await hmacSha256("a", KEY)).not.toBe(await hmacSha256("b", KEY));
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "ab")).toBe(false);
    expect(randomToken(24)).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });
});

describe("oauth state", () => {
  it("assina, valida e expira", async () => {
    const state = await signState({ tenantId: "t1", portal: "mercadolivre", nonce: "n1" });
    const ok = await verifyState(state, "n1");
    expect(ok?.tenantId).toBe("t1");
    expect(await verifyState(state, "outro")).toBeNull();
    expect(await verifyState(state.slice(0, -2) + "xx", "n1")).toBeNull();
    expect(await verifyState(null, "n1")).toBeNull();
  });
  it("cookie assinado e PKCE S256", async () => {
    const c = await packCookie({ nonce: "n", verifier: "v" });
    expect(await unpackCookie(c)).toEqual({ nonce: "n", verifier: "v" });
    expect(await unpackCookie(c + "x")).toBeNull();
    const pkce = await createPkce();
    expect(pkce.verifier.length).toBeGreaterThanOrEqual(43);
    expect(pkce.challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe("queue backoff", () => {
  it("1, 5, 30, 120, 720 min e depois desiste", () => {
    expect(backoffMs(1)).toBe(60_000);
    expect(backoffMs(2)).toBe(5 * 60_000);
    expect(backoffMs(3)).toBe(30 * 60_000);
    expect(backoffMs(4)).toBe(120 * 60_000);
    expect(backoffMs(5)).toBe(720 * 60_000);
    expect(backoffMs(MAX_ATTEMPTS)).toBeNull();
  });
});

describe("canonical", () => {
  it("prioriza JPEG, resolve URL canônica e telefones", () => {
    const c = canonicalFixture();
    expect(c.photos[0].url).toBe("https://x.supabase.co/p1.jpg");
    expect(c.photos[1].url).toBe("https://x.supabase.co/p2.webp");
    expect(c.storefrontUrl).toBe("https://estoque.autos/auto-center/carros/22222222-2222-4222-8222-222222222222");
    expect(c.phone).toBe("1133334444");
    expect(c.whatsapp).toBe("11987654321");
    expect(c.fipe).toEqual({ code: "014042-3", yearId: "2023-1" });
  });
  it("domínio próprio ativo muda a URL", () => {
    expect(
      canonicalStorefrontUrl({ slug: "x", custom_domain: "www.loja.com.br", custom_domain_status: "active" }, "/carros/1"),
    ).toBe("https://www.loja.com.br/carros/1");
    expect(
      canonicalStorefrontUrl({ slug: "x", custom_domain: "www.loja.com.br", custom_domain_status: "pending" }, "/carros/1"),
    ).toBe("https://estoque.autos/x/carros/1");
  });
  it("hash estável independente da ordem das chaves", async () => {
    expect(stableStringify({ b: 1, a: [{ d: 2, c: 3 }] })).toBe('{"a":[{"c":3,"d":2}],"b":1}');
    expect(await contentHash({ b: 1, a: 2 })).toBe(await contentHash({ a: 2, b: 1 }));
    expect(await contentHash({ a: 2 })).not.toBe(await contentHash({ a: 3 }));
  });
});

describe("portalTitle", () => {
  it("cabe no limite cortando a versão por palavra, ano sempre no fim", () => {
    const v = { brand: "Chevrolet", model: "Onix Plus", version: "Premier 1.0 Turbo Flex Automático Completo", year_model: 2024 };
    const t = portalTitle(v, 60);
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t.endsWith("2024")).toBe(true);
    expect(t.startsWith("Chevrolet Onix Plus Premier")).toBe(true);
    expect(portalTitle(v, 90)).toBe("Chevrolet Onix Plus Premier 1.0 Turbo Flex Automático Completo 2024");
    expect(portalTitle({ brand: "Fiat", model: "Uno", year_model: null }, 60)).toBe("Fiat Uno");
  });
});

describe("publishRequirements", () => {
  it("lista o que falta por portal", () => {
    const t = tenantFixture();
    expect(publishRequirements("mercadolivre", vehicleFixture(), t)).toEqual([]);
    expect(publishRequirements("olx", vehicleFixture(), t)).toEqual([]);
    const missing = publishRequirements("olx", vehicleFixture({ plate: null, photos: [] }), tenantFixture({ address: null }));
    expect(missing).toContain("pelo menos 1 foto");
    expect(missing.some((m) => m.startsWith("placa"))).toBe(true);
    expect(missing.some((m) => m.startsWith("CEP"))).toBe(true);
    expect(publishRequirements("webmotors", vehicleFixture(), tenantFixture({ cnpj: null }))[0]).toContain("CNPJ");
  });
});

describe("errors", () => {
  it("classifica e humaniza", () => {
    expect(toPortalError(new Error("x")).kind).toBe("transient");
    expect(toPortalError(new PortalError("auth", "y")).kind).toBe("auth");
    expect(humanMessage(new PortalError("mapping", "marca X"))).toMatch(/^mapeamento pendente: marca X/);
    expect(humanMessage(new PortalError("needs_plan", "no package"))).toContain("Sem plano");
  });
});

describe("normalizeName", () => {
  it("remove acento, caixa e pontuação", () => {
    expect(normalizeName("Citroën C3 1.6 Exclusive")).toBe("citroen c3 1 6 exclusive");
    expect(normalizeName("  VOLKSWAGEN ")).toBe("volkswagen");
  });
});
