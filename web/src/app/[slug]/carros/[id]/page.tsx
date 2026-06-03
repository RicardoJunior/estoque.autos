import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStorefront, getPublicVehicle } from "@/lib/public";
import {
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  CATEGORY_LABELS,
} from "@/lib/types";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";
import { Gallery } from "@/components/storefront/Gallery";
import { LeadDialog } from "@/components/storefront/LeadDialog";
import {
  WhatsAppButton,
  PhoneButton,
} from "@/components/storefront/ContactButtons";
import { StoreLogo } from "@/components/storefront/StoreLogo";
import { StoreFooter } from "@/components/storefront/StoreFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const store = await getStorefront(slug);
  if (!store) return { title: "Não encontrado" };
  const vehicle = await getPublicVehicle(store.id, id);
  if (!vehicle) return { title: "Veículo não encontrado" };

  const title = `${vehicleTitle(vehicle)} · ${formatPrice(vehicle.price)}`;
  const description =
    vehicle.description?.slice(0, 160) ??
    `${vehicleTitle(vehicle)} à venda na ${store.name}.`;
  const cover = vehicle.photos?.[0]?.url;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/${slug}/carros/${id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${appUrl}/${slug}/carros/${id}`,
      siteName: store.name,
      images: cover ? [{ url: cover, width: 1200, height: 900 }] : undefined,
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();
  const vehicle = await getPublicVehicle(store.id, id);
  if (!vehicle) notFound();

  const title = vehicleTitle(vehicle);
  const specs: [string, string | null][] = [
    ["Ano", vehicle.year_model ? String(vehicle.year_model) : null],
    ["Quilometragem", vehicle.mileage != null ? formatKm(vehicle.mileage) : null],
    ["Câmbio", vehicle.transmission ? TRANSMISSION_LABELS[vehicle.transmission] : null],
    ["Combustível", vehicle.fuel ? FUEL_LABELS[vehicle.fuel] : null],
    ["Cor", vehicle.color],
    ["Portas", vehicle.doors ? String(vehicle.doors) : null],
    ["Categoria", CATEGORY_LABELS[vehicle.category]],
  ];

  const waMessage = `Olá! Tenho interesse no ${title} (${formatPrice(
    vehicle.price,
  )}) anunciado no site.`;

  const jsonLd = {
    "@context": "https://schema.org",
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
  };

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      {/* header simples */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href={`/${slug}`} className="flex items-center gap-2.5">
            <StoreLogo store={store} size={36} />
            <span className="font-bold">{store.name}</span>
          </Link>
          <Link
            href={`/${slug}`}
            className="text-sm text-slate-500 hover:underline"
          >
            ← Ver estoque
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* galeria + descrição */}
          <div>
            <Gallery photos={vehicle.photos ?? []} title={title} />

            {vehicle.description && (
              <section className="mt-8">
                <h2 className="mb-2 text-lg font-bold">Descrição</h2>
                <p className="whitespace-pre-line text-slate-600">
                  {vehicle.description}
                </p>
              </section>
            )}

            {vehicle.optionals?.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 text-lg font-bold">Opcionais</h2>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {vehicle.optionals.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <span style={{ color: "var(--sf-primary)" }}>✓</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* coluna de preço + contato (sticky) */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h1 className="text-xl font-bold">{title}</h1>
              <div
                className="mt-2 text-3xl font-extrabold"
                style={{ color: "var(--sf-primary)" }}
              >
                {formatPrice(vehicle.price)}
              </div>
              {vehicle.status === "reserved" && (
                <span className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Reservado
                </span>
              )}

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-5">
                {specs
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-slate-400">{k}</dt>
                      <dd className="text-sm font-medium">{v}</dd>
                    </div>
                  ))}
              </dl>

              <div className="mt-6 space-y-2.5">
                <LeadDialog
                  vehicleId={vehicle.id}
                  vehicleTitle={title}
                  triggerClassName="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold"
                  triggerStyle={{
                    background: "var(--sf-accent)",
                    color: "var(--sf-on-accent)",
                  }}
                  trigger="Fazer proposta"
                />
                {store.whatsapp && (
                  <WhatsAppButton
                    vehicleId={vehicle.id}
                    phone={store.whatsapp}
                    message={waMessage}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-sm font-bold text-white"
                  />
                )}
                {store.phone && (
                  <PhoneButton
                    vehicleId={vehicle.id}
                    phone={store.phone}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Ligar agora
                  </PhoneButton>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <StoreFooter store={store} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // escapa < para impedir quebra de </script> via campos do anúncio
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
