import type { Tenant, Vehicle } from "../../types";
import { buildCanonical } from "../canonical";
import type { Connection } from "../types";

export function tenantFixture(over: Partial<Tenant> = {}): Tenant {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "auto-center",
    name: "Auto Center Silva",
    phone: "1133334444",
    whatsapp: "11987654321",
    email: "contato@autocenter.com.br",
    address: {
      cep: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
    template_id: "classico",
    colors: { primary: "#1d4ed8", accent: "#f59e0b" },
    logo_url: null,
    settings: {},
    custom_domain: null,
    custom_domain_status: "pending",
    cnpj: "12345678000190",
    plan: "pro",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

export function vehicleFixture(over: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    tenant_id: "11111111-1111-4111-8111-111111111111",
    brand: "Honda",
    model: "Civic",
    version: "Touring 1.5 Turbo",
    year_fab: 2023,
    year_model: 2023,
    plate: "ABC1D23",
    color: "Prata",
    fuel: "gasolina",
    transmission: "cvt",
    mileage: 28400,
    doors: 4,
    category: "carro",
    price: 164900,
    description: "Único dono. Ligue (11) 98765-4321 ou acesse www.loja.com.br",
    optionals: ["Ar-condicionado", "Câmera de ré", "Teto solar", "Bancos de couro"],
    photos: [
      { id: "p1", path: "t/v/p1.webp", url: "https://x.supabase.co/p1.webp", jpeg_path: "t/v/p1.jpg", jpeg_url: "https://x.supabase.co/p1.jpg" },
      { id: "p2", path: "t/v/p2.webp", url: "https://x.supabase.co/p2.webp" },
    ],
    featured: false,
    status: "available",
    consigned: false,
    condition_flags: ["unico_dono", "ipva_pago", "aceita_troca"],
    body_type: "sedan",
    engine: "1.5 turbo",
    steering: "eletrica",
    vin_last6: "AB1234",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    zero_km: false,
    sold_at: null,
    fipe_code: "014042-3",
    fipe_year_id: "2023-1",
    fipe_price: 160000,
    fipe_reference: "setembro de 2026",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...over,
  };
}

export function canonicalFixture(v: Partial<Vehicle> = {}, t: Partial<Tenant> = {}) {
  return buildCanonical(vehicleFixture(v), tenantFixture(t));
}

export function connectionFixture(over: Partial<Connection> = {}): Connection {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    tenant_id: "11111111-1111-4111-8111-111111111111",
    portal: "mercadolivre",
    status: "active",
    external_account_id: "123456",
    key_version: 1,
    token_expires_at: null,
    settings: {},
    last_error: null,
    last_ok_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    creds: { access_token: "APP_USR-token" },
    ...over,
  };
}
