import { describe, it, expect } from "vitest";
import { phoneBRSchema, signupSchema } from "../validation";

describe("phoneBRSchema", () => {
  it("aceita celular e fixo com DDD, guardando só dígitos", () => {
    expect(phoneBRSchema.parse("(11) 98765-4321")).toBe("11987654321");
    expect(phoneBRSchema.parse("11 3333-4444")).toBe("1133334444");
    expect(phoneBRSchema.parse("21987654321")).toBe("21987654321");
  });
  it("tira o +55 quando vem junto", () => {
    expect(phoneBRSchema.parse("+55 (11) 98765-4321")).toBe("11987654321");
    expect(phoneBRSchema.parse("5511987654321")).toBe("11987654321");
  });
  it("rejeita vazio, curto, longo e DDD inválido", () => {
    expect(phoneBRSchema.safeParse("").success).toBe(false);
    expect(phoneBRSchema.safeParse("98765-4321").success).toBe(false);
    expect(phoneBRSchema.safeParse("119876543210").success).toBe(false);
    expect(phoneBRSchema.safeParse("01987654321").success).toBe(false);
    expect(phoneBRSchema.safeParse(null).success).toBe(false);
  });
  it("mensagem amigável quando falta o campo", () => {
    const r = signupSchema.safeParse({
      name: "Ricardo",
      email: "r@x.com",
      password: "12345678",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const phoneIssue = r.error.issues.find((i) => i.path[0] === "phone");
      expect(phoneIssue?.message).toBe("Informe seu celular");
    }
  });
});

describe("signupSchema", () => {
  it("exige telefone e devolve os dígitos", () => {
    const r = signupSchema.safeParse({
      name: "Ricardo",
      email: "r@x.com",
      phone: "(11) 98765-4321",
      password: "12345678",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("11987654321");
  });
});
