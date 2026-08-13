import type { PublicVehicle, Storefront } from "@/lib/public";
import {
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  CATEGORY_LABELS,
} from "@/lib/types";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";

// ============================================================
// Dados compartilhados da página de detalhe do veículo — os 6
// layouts (um por template) reusam specs, mensagem de WhatsApp e
// JSON-LD daqui, para não divergir a lógica/SEO por template.
// ============================================================

/** Ficha técnica (rótulo → valor) já filtrada dos campos vazios. */
export function vehicleSpecs(vehicle: PublicVehicle): [string, string][] {
  const raw: [string, string | null][] = [
    ["Ano", vehicle.year_model ? String(vehicle.year_model) : null],
    ["Quilometragem", vehicle.mileage != null ? formatKm(vehicle.mileage) : null],
    ["Câmbio", vehicle.transmission ? TRANSMISSION_LABELS[vehicle.transmission] : null],
    ["Combustível", vehicle.fuel ? FUEL_LABELS[vehicle.fuel] : null],
    ["Cor", vehicle.color],
    ["Portas", vehicle.doors ? String(vehicle.doors) : null],
    ["Categoria", CATEGORY_LABELS[vehicle.category]],
  ];
  return raw.filter((e): e is [string, string] => e[1] != null);
}

/** Opcionais em ordem alfabética (independe da ordem gravada). */
export function vehicleOptionals(vehicle: PublicVehicle): string[] {
  return [...(vehicle.optionals ?? [])].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Mensagem padrão de WhatsApp/proposta para o veículo. */
export function vehicleWaMessage(vehicle: PublicVehicle): string {
  return `Olá! Tenho interesse no ${vehicleTitle(vehicle)} (${formatPrice(
    vehicle.price,
  )}) anunciado no site.`;
}

/**
 * JSON-LD (schema.org Car + Breadcrumb) já escapado para <script>.
 * Retorna null em modo demo (o veículo não existe no banco).
 */
export function vehicleJsonLd(
  store: Storefront,
  vehicle: PublicVehicle,
  slug: string,
  demo: boolean,
): string | null {
  if (demo) return null;
  const title = vehicleTitle(vehicle);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Car",
        name: title,
        brand: vehicle.brand,
        model: vehicle.model,
        vehicleModelDate: vehicle.year_model ?? undefined,
        mileageFromOdometer: vehicle.mileage
          ? { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT" }
          : undefined,
        fuelType: vehicle.fuel ? FUEL_LABELS[vehicle.fuel] : undefined,
        image: vehicle.photos?.map((p) => p.url),
        offers: {
          "@type": "Offer",
          price: vehicle.price,
          priceCurrency: "BRL",
          availability:
            vehicle.status === "available"
              ? "https://schema.org/InStock"
              : "https://schema.org/LimitedAvailability",
          seller: { "@type": "AutoDealer", name: store.name },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: store.name,
            item: `${appUrl}/${slug}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: title,
            item: `${appUrl}/${slug}/carros/${vehicle.id}`,
          },
        ],
      },
    ],
  };
  // escapa < para impedir quebra de </script> via campos do anúncio
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
