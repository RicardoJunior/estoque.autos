import { describe, it, expect } from "vitest";
import { cnpjSchema, phoneBRSchema, signupSchema, vehicleSchema } from "../validation";

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

describe("vehicleSchema", () => {
  const base = { brand: "Honda", model: "Civic", price: "132900" };

  it("aceita o mínimo (marca, modelo, preço) com defaults", () => {
    const r = vehicleSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.category).toBe("carro");
      expect(r.data.zero_km).toBe(false);
      expect(r.data.optionals).toEqual([]);
    }
  });

  it("valida os campos dos portais", () => {
    const ok = vehicleSchema.safeParse({
      ...base,
      body_type: "suv",
      engine: " 2.0 turbo ",
      steering: "eletrica",
      vin_last6: "ab12x9",
      video_url: "https://youtu.be/abc123XYZ",
      zero_km: true,
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.vin_last6).toBe("AB12X9");
      expect(ok.data.engine).toBe("2.0 turbo");
    }
    expect(vehicleSchema.safeParse({ ...base, body_type: "jipe" }).success).toBe(false);
    expect(vehicleSchema.safeParse({ ...base, vin_last6: "12" }).success).toBe(false);
    expect(vehicleSchema.safeParse({ ...base, video_url: "https://vimeo.com/1" }).success).toBe(false);
    expect(vehicleSchema.safeParse({ ...base, doors: 7 }).success).toBe(false);
  });
});

describe("cnpjSchema", () => {
  it("guarda só dígitos e aceita vazio", () => {
    expect(cnpjSchema.parse("12.345.678/0001-90")).toBe("12345678000190");
    expect(cnpjSchema.parse("")).toBe("");
    expect(cnpjSchema.safeParse("123").success).toBe(false);
  });
});
