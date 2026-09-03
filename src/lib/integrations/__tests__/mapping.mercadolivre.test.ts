import { describe, expect, it } from "vitest";
import { BODY_TYPES, FUELS, TRANSMISSIONS, VEHICLE_CATEGORIES } from "../../types";
import { PortalError } from "../errors";
import {
  buildMlDescription,
  buildMlItem,
  ML_BODY,
  ML_CATEGORY,
  ML_FUEL,
  ML_MAX_PHOTOS,
  ML_TRANSMISSION,
  sanitizeDescription,
  splitPhone,
  youtubeId,
} from "../mercadolivre/mapping";
import { canonicalFixture, connectionFixture } from "./fixtures";

const conn = connectionFixture();

function attr(payload: Record<string, unknown>, id: string) {
  const attrs = payload.attributes as { id: string; value_name?: string; value_id?: string }[];
  return attrs.find((a) => a.id === id);
}

describe("listas fixas do Mercado Livre", () => {
  it("cobrem todos os enums locais", () => {
    for (const f of FUELS) expect(ML_FUEL[f]).toBeTruthy();
    for (const t of TRANSMISSIONS) expect(ML_TRANSMISSION[t]).toBeTruthy();
    for (const c of VEHICLE_CATEGORIES) expect(ML_CATEGORY[c]).toMatch(/^MLB\d+$/);
    for (const b of BODY_TYPES) expect(b in ML_BODY).toBe(true);
  });
});

describe("buildMlItem", () => {
  it("monta classificado com título ≤ 60, fotos JPEG e atributos obrigatórios", () => {
    const item = buildMlItem(canonicalFixture(), conn);
    expect(item.category_id).toBe("MLB1744");
    expect(item.buying_mode).toBe("classified");
    expect(item.listing_type_id).toBe("silver");
    expect(item.condition).toBe("used");
    expect(String(item.title).length).toBeLessThanOrEqual(60);
    expect(item.title).toBe("Honda Civic Touring 1.5 Turbo 2023");
    const pics = item.pictures as { source: string }[];
    // usa a variante JPEG quando existe, senão o WebP
    expect(pics[0].source).toBe("https://x.supabase.co/p1.jpg");
    expect(pics[1].source).toBe("https://x.supabase.co/p2.webp");
    expect(attr(item, "BRAND")?.value_name).toBe("Honda");
    expect(attr(item, "MODEL")?.value_name).toBe("Civic");
    expect(attr(item, "TRIM")?.value_name).toBe("Touring 1.5 Turbo");
    expect(attr(item, "VEHICLE_YEAR")?.value_name).toBe("2023");
    expect(attr(item, "KILOMETERS")?.value_name).toBe("28400 km");
    expect(attr(item, "FUEL_TYPE")?.value_name).toBe("Gasolina");
    expect(attr(item, "TRANSMISSION")?.value_name).toBe("CVT");
    expect(attr(item, "VEHICLE_BODY_TYPE")?.value_name).toBe("Sedã");
    expect(attr(item, "SINGLE_OWNER")?.value_name).toBe("Sim");
    expect(attr(item, "ARMORED")?.value_name).toBe("Não");
    expect(attr(item, "HAS_AIR_CONDITIONING")?.value_name).toBe("Sim");
    expect(attr(item, "HAS_REAR_CAMERA")?.value_name).toBe("Sim");
    expect(attr(item, "VIN_LAST_DIGITS")?.value_name).toBe("AB1234");
    expect(attr(item, "LICENSE_PLATE")?.value_name).toBe("ABC1D23");
    expect(item.video_id).toBe("dQw4w9WgXcQ");
  });

  it("seller_contact separa DDD e número; WhatsApp em phone2", () => {
    const item = buildMlItem(canonicalFixture(), conn);
    const c = item.seller_contact as Record<string, string>;
    expect(c.area_code).toBe("11");
    expect(c.phone).toBe("33334444");
    expect(c.area_code2).toBe("11");
    expect(c.phone2).toBe("987654321");
    expect(c.webpage).toContain("/auto-center/carros/");
    const loc = item.location as { zip_code: string; state: { id: string } };
    expect(loc.zip_code).toBe("01310100");
    expect(loc.state.id).toBe("BR-SP");
  });

  it("usa value_id de BRAND e filtra atributos fora do catálogo quando há contexto", () => {
    const item = buildMlItem(canonicalFixture(), conn, {
      brandValueId: "374002",
      knownAttributes: new Set(["BRAND", "MODEL", "VEHICLE_YEAR", "KILOMETERS"]),
    });
    expect(attr(item, "BRAND")?.value_id).toBe("374002");
    expect(attr(item, "HAS_AIR_CONDITIONING")).toBeUndefined();
    expect(attr(item, "FUEL_TYPE")).toBeUndefined();
  });

  it("0 km → condition new; GNV vira Gasolina + HAS_GNV; corta em 15 fotos", () => {
    const photos = Array.from({ length: 20 }, (_, i) => ({
      id: `p${i}`,
      path: `t/v/p${i}.webp`,
      url: `https://x/p${i}.webp`,
    }));
    const item = buildMlItem(canonicalFixture({ zero_km: true, fuel: "gnv", photos }), conn);
    expect(item.condition).toBe("new");
    expect(attr(item, "FUEL_TYPE")?.value_name).toBe("GNV");
    expect(attr(item, "HAS_GNV")?.value_name).toBe("Sim");
    expect((item.pictures as unknown[]).length).toBe(ML_MAX_PHOTOS);
  });

  it("respeita listing_type e telefone da conexão", () => {
    const item = buildMlItem(
      canonicalFixture({}, {}),
      connectionFixture({ settings: { listing_type: "gold" } }),
    );
    expect(item.listing_type_id).toBe("gold");
  });

  it("lança validation com a lista do que falta", () => {
    expect(() =>
      buildMlItem(canonicalFixture({ photos: [], mileage: null, color: null }), conn),
    ).toThrowError(PortalError);
    try {
      buildMlItem(canonicalFixture({ photos: [], mileage: null }), conn);
    } catch (err) {
      const pe = err as PortalError;
      expect(pe.kind).toBe("validation");
      expect(pe.message).toContain("pelo menos 1 foto");
      expect(pe.message).toContain("quilometragem");
    }
  });
});

describe("descrição", () => {
  it("remove telefone, site e e-mail (regra do ML)", () => {
    const s = sanitizeDescription(
      "Único dono. Ligue (11) 98765-4321 ou acesse www.loja.com.br / https://loja.com.br e mande e-mail para x@y.com",
    );
    expect(s).not.toMatch(/98765/);
    expect(s).not.toMatch(/loja\.com\.br/);
    expect(s).not.toMatch(/x@y\.com/);
    expect(s).toContain("Único dono.");
  });

  it("agrega opcionais e selos", () => {
    const d = buildMlDescription(canonicalFixture());
    expect(d).toContain("Opcionais: Ar-condicionado");
    expect(d).toContain("Único dono");
    expect(d).not.toMatch(/98765/);
  });
});

describe("helpers", () => {
  it("youtubeId aceita watch, shorts e youtu.be", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=abc123XYZ")).toBe("abc123XYZ");
    expect(youtubeId("https://youtu.be/abc123XYZ")).toBe("abc123XYZ");
    expect(youtubeId("https://youtube.com/shorts/abc123XYZ")).toBe("abc123XYZ");
    expect(youtubeId(null)).toBeNull();
  });
  it("splitPhone", () => {
    expect(splitPhone("11987654321")).toEqual({ area: "11", number: "987654321" });
    expect(splitPhone("123")).toBeNull();
  });
});
