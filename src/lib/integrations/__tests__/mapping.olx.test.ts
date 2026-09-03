import { describe, expect, it } from "vitest";
import { BODY_TYPES, FUELS, STEERINGS, TRANSMISSIONS, VEHICLE_CATEGORIES } from "../../types";
import { PortalError } from "../errors";
import {
  buildOlxAd,
  buildOlxDelete,
  chunkAds,
  olxAdId,
  OLX_CARTYPE,
  OLX_CATEGORY,
  OLX_FUEL,
  OLX_GEARBOX,
  OLX_MAX_PHOTOS,
  OLX_STEERING,
} from "../olx/mapping";
import { canonicalFixture } from "./fixtures";

const ids = { brand: "12", model: "345", version: "6789" };

describe("listas fixas da OLX", () => {
  it("cobrem todos os enums locais", () => {
    for (const f of FUELS) expect(OLX_FUEL[f]).toBeGreaterThan(0);
    for (const t of TRANSMISSIONS) expect(OLX_GEARBOX[t]).toBeGreaterThan(0);
    for (const c of VEHICLE_CATEGORIES) expect(OLX_CATEGORY[c]).toBeGreaterThan(0);
    for (const b of BODY_TYPES) expect(OLX_CARTYPE[b]).toBeGreaterThan(0);
    for (const s of STEERINGS) expect(OLX_STEERING[s]).toBeGreaterThan(0);
  });
});

describe("olxAdId", () => {
  it("respeita [A-Za-z0-9_{}-]{1,19} e é estável", () => {
    const id = olxAdId("22222222-2222-4222-8222-222222222222");
    expect(id).toMatch(/^[A-Za-z0-9_{}-]{1,19}$/);
    expect(id).toBe(olxAdId("22222222-2222-4222-8222-222222222222"));
    expect(id).not.toBe(olxAdId("32222222-2222-4222-8222-222222222222"));
  });
});

describe("buildOlxAd", () => {
  it("monta o anúncio com subject ≤ 90, params numéricos e placa", () => {
    const ad = buildOlxAd(canonicalFixture(), ids);
    expect(ad.operation).toBe("insert");
    expect(ad.category).toBe(2020);
    expect(String(ad.subject).length).toBeLessThanOrEqual(90);
    expect(ad.type).toBe("s");
    expect(ad.price).toBe(164900);
    expect(ad.zipcode).toBe("01310100");
    expect(ad.phone).toBe("1133334444");
    const p = ad.params as Record<string, unknown>;
    expect(p.regdate).toBe(2023);
    expect(p.mileage).toBe(28400);
    expect(p.gearbox).toBe(2);
    expect(p.fuel).toBe(1);
    expect(p.vehicle_brand).toBe("12");
    expect(p.vehicle_model).toBe("345");
    expect(p.vehicle_version).toBe("6789");
    expect(p.vehicle_tag).toBe("ABC1D23");
    expect(p.doors).toBe(2);
    expect(p.cartype).toBe(8);
    expect(p.carcolor).toBe(3);
    expect(p.car_steering).toBe(2);
    expect(p.owner).toBe(1);
    expect(p.exchange).toBe(1);
    expect(p.financial).toEqual([2]);
    expect(p.car_features).toEqual([1, 9]);
    expect(ad.videos).toEqual(["https://www.youtube.com/watch?v=dQw4w9WgXcQ"]);
    // opcionais fora dos 9 recursos vão para o texto
    expect(String(ad.body)).toContain("Teto solar");
  });

  it("GNV → fuel gasolina + gnv_kit; blindado → feature 10; corta em 20 fotos", () => {
    const photos = Array.from({ length: 25 }, (_, i) => ({
      id: `p${i}`,
      path: `t/v/p${i}.webp`,
      url: `https://x/p${i}.webp`,
    }));
    const ad = buildOlxAd(
      canonicalFixture({ fuel: "gnv", condition_flags: ["blindado"], photos }),
      ids,
    );
    const p = ad.params as Record<string, unknown>;
    expect(p.fuel).toBe(1);
    expect(p.gnv_kit).toBe(1);
    expect(p.car_features).toEqual([1, 9, 10]);
    expect((ad.images as string[]).length).toBe(OLX_MAX_PHOTOS);
  });

  it("exige placa e foto", () => {
    expect(() => buildOlxAd(canonicalFixture({ plate: null }), ids)).toThrowError(PortalError);
    try {
      buildOlxAd(canonicalFixture({ plate: null, photos: [] }), ids);
    } catch (err) {
      expect((err as PortalError).message).toContain("placa");
      expect((err as PortalError).message).toContain("foto");
    }
  });

  it("delete e fatiamento por tamanho", () => {
    expect(buildOlxDelete("22222222-2222-4222-8222-222222222222")).toEqual({
      id: olxAdId("22222222-2222-4222-8222-222222222222"),
      operation: "delete",
    });
    const ads = Array.from({ length: 10 }, (_, i) => ({ id: `a${i}`, body: "x".repeat(400) }));
    const chunks = chunkAds(ads, 1000);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.flat().length).toBe(10);
    for (const c of chunks) expect(JSON.stringify(c).length).toBeLessThanOrEqual(1100);
  });
});
