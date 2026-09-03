import { vehicleTitle } from "../../format";
import type { BodyType, Fuel, Transmission } from "../../types";
import type { CanonicalVehicle } from "../types";

// ============================================================
// Feed CSV do catálogo de veículos da Meta (Automotive Inventory
// Ads). A Meta busca a URL pelo menos a cada 24 h.
// ============================================================

const COLUMNS = [
  "vehicle_id",
  "title",
  "description",
  "url",
  "image[0].url",
  "image[1].url",
  "image[2].url",
  "make",
  "model",
  "trim",
  "year",
  "mileage.value",
  "mileage.unit",
  "price",
  "state_of_vehicle",
  "exterior_color",
  "transmission",
  "fuel_type",
  "body_style",
  "drivetrain",
  "vin",
  "condition",
  "availability",
  "address.addr1",
  "address.city",
  "address.region",
  "address.country",
  "address.postal_code",
  "dealer_name",
  "dealer_id",
] as const;

const FUEL: Record<Fuel, string> = {
  flex: "FLEX",
  gasolina: "GASOLINE",
  etanol: "FLEX",
  diesel: "DIESEL",
  hibrido: "HYBRID",
  eletrico: "ELECTRIC",
  gnv: "OTHER",
};

const TRANSMISSION: Record<Transmission, string> = {
  manual: "MANUAL",
  automatico: "AUTOMATIC",
  cvt: "AUTOMATIC",
  automatizado: "AUTOMATIC",
};

const BODY: Record<BodyType, string> = {
  hatch: "HATCHBACK",
  sedan: "SEDAN",
  suv: "SUV",
  picape: "TRUCK",
  perua: "WAGON",
  minivan: "MINIVAN",
  cupe: "COUPE",
  conversivel: "CONVERTIBLE",
  van: "VAN",
  utilitario: "VAN",
  outro: "OTHER",
};

export function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function metaAiaRow(c: CanonicalVehicle): Record<(typeof COLUMNS)[number], string> {
  const { vehicle, tenant } = c;
  const addr = tenant.address ?? {};
  const description = (vehicle.description ?? "").replace(/\s+/g, " ").trim() || vehicleTitle(vehicle);
  return {
    vehicle_id: vehicle.id,
    title: vehicleTitle(vehicle).slice(0, 150),
    description: description.slice(0, 5000),
    url: c.storefrontUrl,
    "image[0].url": c.photos[0]?.url ?? "",
    "image[1].url": c.photos[1]?.url ?? "",
    "image[2].url": c.photos[2]?.url ?? "",
    make: vehicle.brand,
    model: vehicle.model,
    trim: vehicle.version ?? "",
    year: vehicle.year_model ? String(vehicle.year_model) : "",
    "mileage.value": vehicle.mileage != null ? String(vehicle.mileage) : "0",
    "mileage.unit": "KM",
    price: `${Math.round(Number(vehicle.price))} BRL`,
    state_of_vehicle: vehicle.zero_km ? "NEW" : "USED",
    exterior_color: vehicle.color ?? "",
    transmission: vehicle.transmission ? TRANSMISSION[vehicle.transmission] : "",
    fuel_type: vehicle.fuel ? FUEL[vehicle.fuel] : "",
    body_style: vehicle.body_type ? BODY[vehicle.body_type] : "",
    drivetrain: (vehicle.optionals ?? []).includes("Tração 4x4") ? "AWD" : "",
    vin: "",
    condition: "GOOD",
    availability: vehicle.status === "available" ? "AVAILABLE" : "PENDING",
    "address.addr1": [addr.street, addr.number].filter(Boolean).join(", "),
    "address.city": addr.city ?? "",
    "address.region": addr.state ?? "",
    "address.country": "BR",
    "address.postal_code": (addr.cep ?? "").replace(/\D/g, ""),
    dealer_name: tenant.name,
    dealer_id: tenant.slug,
  };
}

export function buildMetaAiaCsv(items: CanonicalVehicle[]): string {
  const lines = [COLUMNS.join(",")];
  for (const c of items) {
    if (c.photos.length === 0) continue; // a Meta exige imagem
    const row = metaAiaRow(c);
    lines.push(COLUMNS.map((col) => csvCell(row[col])).join(","));
  }
  // BOM: planilhas/Meta leem UTF-8 com acentos sem adivinhar o charset
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
