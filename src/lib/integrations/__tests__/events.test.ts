import { describe, expect, it } from "vitest";
import { classifyMlError } from "../mercadolivre/client";
import { leadFromMl, notificationKey, parseNotification } from "../mercadolivre/leads";
import { classifyOlxStatus } from "../olx/client";
import { isOlxLead, leadFromOlx, olxLeadKey } from "../olx/leads";
import { buildMetaAiaCsv, csvCell } from "../feeds/meta-aia";
import { buildUsadosbrXml, xmlEscape } from "../feeds/usadosbr-xml";
import { canonicalFixture, tenantFixture } from "./fixtures";

// Payloads reais (formato documentado) — docs/integracoes-portais.md §3.3/§3.4

const ML_NOTIFICATION = {
  resource: "/vis/leads/abc-123",
  user_id: 123456,
  topic: "vis_leads",
  application_id: 5503910054141466,
  attempts: 1,
  sent: "2026-09-03T12:00:00.000Z",
  received: "2026-09-03T12:00:00.100Z",
};

const ML_LEAD = {
  id: "abc-123",
  item_id: "MLB1234567890",
  contact_type: "whatsapp",
  channel: "mobile",
  created_at: "2026-09-03T11:59:58Z",
  status: "new",
  buyer: { id: 99, name: "Maria Souza", email: "maria@example.com", phone: { area_code: "11", number: "988887777" } },
  item: { id: "MLB1234567890", permalink: "https://carro.mercadolivre.com.br/MLB-1234567890" },
};

const OLX_LEAD = {
  source: "whatsapp",
  listId: 1234567890,
  linkAd: "https://sp.olx.com.br/autos-e-pecas/carros/honda-civic-1234567890",
  name: "João Lima",
  email: "joao@example.com",
  phone: "11977776666",
  message: "Ainda está disponível?",
  createdAt: "2026-09-03T12:00:00Z",
  adId: "ea22222222222222222",
  adsInfo: { brand: "Honda", model: "Civic" },
};

describe("Mercado Livre", () => {
  it("parseia a notificação e gera chave idempotente", () => {
    const n = parseNotification(ML_NOTIFICATION);
    expect(n?.resource).toBe("/vis/leads/abc-123");
    expect(notificationKey(n!)).toBe("vis_leads:/vis/leads/abc-123");
    expect(parseNotification({ nope: 1 })).toBeNull();
  });
  it("converte o lead do ML em lead canônico", () => {
    const l = leadFromMl(ML_LEAD, "abc-123");
    expect(l).toMatchObject({
      kind: "lead",
      externalId: "abc-123",
      externalListingId: "MLB1234567890",
      externalUrl: "https://carro.mercadolivre.com.br/MLB-1234567890",
      channel: "whatsapp",
      name: "Maria Souza",
      email: "maria@example.com",
      phone: "11988887777",
      createdAt: "2026-09-03T11:59:58Z",
    });
  });
  it("classifica erros da API", () => {
    expect(classifyMlError(401, { message: "invalid token" }, "").kind).toBe("auth");
    expect(classifyMlError(429, null, "").kind).toBe("rate_limit");
    expect(classifyMlError(404, null, "").kind).toBe("not_found");
    expect(classifyMlError(500, null, "").kind).toBe("transient");
    expect(
      classifyMlError(400, { message: "Validation error", cause: [{ code: 173, message: "LTP_PICTURE_REQUIRED" }] }, "").kind,
    ).toBe("validation");
    const plan = classifyMlError(400, { message: "user.without.available.package" }, "");
    expect(plan.kind).toBe("needs_plan");
  });
});

describe("OLX", () => {
  it("reconhece e converte o webhook de lead", () => {
    expect(isOlxLead(OLX_LEAD)).toBe(true);
    expect(isOlxLead({ foo: 1 })).toBe(false);
    const l = leadFromOlx(OLX_LEAD);
    expect(l).toMatchObject({
      kind: "lead",
      externalListingId: "ea22222222222222222",
      channel: "whatsapp",
      name: "João Lima",
      phone: "11977776666",
      message: "Ainda está disponível?",
    });
    expect(olxLeadKey(OLX_LEAD)).toBe(olxLeadKey({ ...OLX_LEAD, name: "outro" }));
    expect(olxLeadKey({ ...OLX_LEAD, leadId: 7 })).toBe("lead:7");
  });
  it("classifica statusCode do autoupload", () => {
    expect(classifyOlxStatus({ statusCode: 0 })).toBeNull();
    expect(classifyOlxStatus({ statusCode: -6, statusMessage: "sem permissão" })?.kind).toBe("needs_plan");
    expect(classifyOlxStatus({ statusCode: -4, errors: ["NO_IMAGE"] })?.kind).toBe("validation");
    expect(classifyOlxStatus({ statusCode: -2 })?.kind).toBe("rate_limit");
  });
});

describe("feeds", () => {
  it("CSV da Meta escapa células e usa o cabeçalho esperado", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    const csv = buildMetaAiaCsv([canonicalFixture({ description: "Linha 1\nLinha 2, com vírgula" })]);
    const [header, row] = csv.replace(/^\uFEFF/, "").split("\r\n");
    expect(header.startsWith("vehicle_id,title,description,url,image[0].url")).toBe(true);
    expect(row).toContain("164900 BRL");
    expect(row).toContain("USED");
    expect(row).toContain("AUTOMATIC");
    expect(row).toContain("SEDAN");
    expect(row).toContain('"Linha 1 Linha 2, com vírgula"');
    // sem foto não entra
    expect(buildMetaAiaCsv([canonicalFixture({ photos: [] })]).split("\r\n").filter(Boolean).length).toBe(1);
  });
  it("XML da Usadosbr escapa e lista fotos", () => {
    expect(xmlEscape('a<b>&"c"')).toBe("a&lt;b&gt;&amp;&quot;c&quot;");
    const xml = buildUsadosbrXml([canonicalFixture({ description: "Preço & condição" })], tenantFixture());
    expect(xml).toContain("<cnpj>12345678000190</cnpj>");
    expect(xml).toContain("<descricao>Preço &amp; condição</descricao>");
    expect(xml).toContain("<foto>https://x.supabase.co/p1.jpg</foto>");
    expect(xml).toContain("<codigo_fipe>014042-3</codigo_fipe>");
  });
});
