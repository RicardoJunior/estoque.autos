import { describe, it, expect } from "vitest";
import { slugify, vehicleTitle, whatsappLink, formatPrice } from "../format";
import { readableText } from "../colors";
import { publicLeadSchema, slugSchema } from "../validation";

describe("slugify", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugify("Auto Center Silva")).toBe("auto-center-silva");
    expect(slugify("Veículos & Cia")).toBe("veiculos-cia");
  });
  it("remove hífens nas pontas e limita tamanho", () => {
    expect(slugify("  --Olá--  ")).toBe("ola");
    expect(slugify("a".repeat(60)).length).toBeLessThanOrEqual(40);
  });
});

describe("slugSchema", () => {
  it("aceita slug válido", () => {
    expect(slugSchema.safeParse("auto-center").success).toBe(true);
  });
  it("rejeita maiúsculas, símbolos e curtos", () => {
    expect(slugSchema.safeParse("AB").success).toBe(false);
    expect(slugSchema.safeParse("loja_legal").success).toBe(false);
    expect(slugSchema.safeParse("-loja").success).toBe(false);
  });
});

describe("vehicleTitle", () => {
  it("junta sem buracos quando há nulos", () => {
    expect(
      vehicleTitle({ brand: "Honda", model: "Civic", version: null, year_model: 2022 }),
    ).toBe("Honda Civic 2022");
    expect(
      vehicleTitle({ brand: "Fiat", model: "Uno", version: "Way", year_model: null }),
    ).toBe("Fiat Uno Way");
  });
});

describe("whatsappLink", () => {
  it("adiciona código do país e codifica a mensagem", () => {
    const link = whatsappLink("(11) 99999-8888", "Olá mundo");
    expect(link).toContain("wa.me/5511999998888");
    expect(link).toContain("Ol%C3%A1%20mundo");
  });
  it("não duplica o 55 quando já presente", () => {
    expect(whatsappLink("5511999998888", "x")).toContain("wa.me/5511999998888");
  });
});

describe("formatPrice", () => {
  it("formata em BRL sem centavos", () => {
    expect(formatPrice(132900)).toMatch(/R\$\s?132\.900/);
  });
});

describe("readableText (contraste)", () => {
  it("texto escuro sobre cor clara, claro sobre escura", () => {
    expect(readableText("#ffffff")).toBe("#0f172a");
    expect(readableText("#1d4ed8")).toBe("#ffffff");
    expect(readableText("#000000")).toBe("#ffffff");
  });
});

describe("publicLeadSchema", () => {
  const base = { vehicle_id: "00000000-0000-0000-0000-000000000000" };

  it("proposta EXIGE nome e telefone", () => {
    const r = publicLeadSchema.safeParse({ ...base, type: "proposal" });
    expect(r.success).toBe(false);
  });

  it("proposta válida com nome e telefone", () => {
    const r = publicLeadSchema.safeParse({
      ...base,
      type: "proposal",
      name: "João",
      phone: "11999998888",
    });
    expect(r.success).toBe(true);
  });

  it("clique de whatsapp NÃO exige contato (fix do bug v1)", () => {
    const r = publicLeadSchema.safeParse({ ...base, type: "whatsapp" });
    expect(r.success).toBe(true);
  });

  it("clique de telefone NÃO exige e-mail", () => {
    const r = publicLeadSchema.safeParse({ ...base, type: "phone" });
    expect(r.success).toBe(true);
  });

  it("aceita e-mail vazio (opcional)", () => {
    const r = publicLeadSchema.safeParse({
      ...base,
      type: "proposal",
      name: "Ana",
      phone: "11999998888",
      email: "",
    });
    expect(r.success).toBe(true);
  });
});
