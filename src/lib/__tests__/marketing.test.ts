import { describe, expect, it } from "vitest";
import {
  socialSettingsSchema,
  trackingSettingsSchema,
  vehicleSchema,
} from "../validation";

describe("trackingSettingsSchema", () => {
  it("aceita IDs válidos e vazios", () => {
    const r = trackingSettingsSchema.safeParse({
      facebook_pixel: "123456789012345",
      tiktok_pixel: "ABCDEF1234567890",
      google_analytics: "G-AB12CD34",
    });
    expect(r.success).toBe(true);
    expect(trackingSettingsSchema.safeParse({}).success).toBe(true);
    expect(
      trackingSettingsSchema.safeParse({ facebook_pixel: "" }).success,
    ).toBe(true);
  });

  it("rejeita formatos que poderiam injetar script", () => {
    expect(
      trackingSettingsSchema.safeParse({
        facebook_pixel: "123');alert(1);//",
      }).success,
    ).toBe(false);
    expect(
      trackingSettingsSchema.safeParse({ google_analytics: "UA-1234-5" })
        .success,
    ).toBe(false);
    expect(
      trackingSettingsSchema.safeParse({
        tiktok_pixel: "abc</script>",
      }).success,
    ).toBe(false);
  });
});

describe("socialSettingsSchema", () => {
  it("aceita URLs https e vazios", () => {
    const r = socialSettingsSchema.safeParse({
      instagram: "https://instagram.com/loja",
      x: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejeita http e javascript:", () => {
    expect(
      socialSettingsSchema.safeParse({ facebook: "http://facebook.com/x" })
        .success,
    ).toBe(false);
    expect(
      socialSettingsSchema.safeParse({ tiktok: "javascript:alert(1)" })
        .success,
    ).toBe(false);
  });
});

describe("vehicleSchema condition_flags", () => {
  const base = { brand: "Fiat", model: "Argo", price: 50000 };

  it("aceita flags conhecidas e default vazio", () => {
    const r = vehicleSchema.safeParse({
      ...base,
      condition_flags: ["blindado", "ipva_pago", "leilao"],
    });
    expect(r.success).toBe(true);
    const empty = vehicleSchema.safeParse(base);
    expect(empty.success && empty.data.condition_flags).toEqual([]);
  });

  it("rejeita flag desconhecida", () => {
    expect(
      vehicleSchema.safeParse({ ...base, condition_flags: ["turbo_nitro"] })
        .success,
    ).toBe(false);
  });
});
