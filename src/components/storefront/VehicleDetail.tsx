import Link from "next/link";
import type { PublicVehicle, Storefront } from "@/lib/public";
import {
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  CATEGORY_LABELS,
  VEHICLE_FLAG_LABELS,
  VEHICLE_FLAG_WARNINGS,
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

/**
 * Página de veículo da vitrine — extraída de [slug]/carros/[id] para
 * ser reutilizada pelas demos dos templates (/demo/[template]).
 *
 * Em `demo`: sem JSON-LD e sem ações de lead (o veículo não existe no
 * banco); o CTA vira convite para criar o próprio site.
 */
export function VehicleDetail({
  store,
  vehicle,
  slug,
  demo = false,
}: {
  store: Storefront;
  vehicle: PublicVehicle;
  /** prefixo das URLs internas (ex.: "minha-loja" ou "demo/moderno") */
  slug: string;
  demo?: boolean;
}) {
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const jsonLd = demo
    ? null
    : {
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
                  {/* ordem alfabética no DISPLAY: independe da ordem gravada
                      (cadastros antigos guardaram a ordem de clique) */}
                  {[...vehicle.optionals]
                    .sort((a, b) => a.localeCompare(b, "pt-BR"))
                    .map((o) => (
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
              {(vehicle.condition_flags?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {vehicle.condition_flags.map((flag) => (
                    <span
                      key={flag}
                      className={
                        VEHICLE_FLAG_WARNINGS.includes(flag)
                          ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
                          : "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                      }
                    >
                      {VEHICLE_FLAG_LABELS[flag]}
                    </span>
                  ))}
                </div>
              )}
              {vehicle.fipe_price != null && vehicle.fipe_reference && (
                <p className="mt-2 text-xs text-slate-500">
                  Tabela FIPE:{" "}
                  <span className="font-semibold text-slate-700">
                    {formatPrice(vehicle.fipe_price)}
                  </span>{" "}
                  · ref. {vehicle.fipe_reference}
                </p>
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
                {demo ? (
                  <>
                    <Link
                      href="/cadastro"
                      className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold"
                      style={{
                        background: "var(--sf-accent)",
                        color: "var(--sf-on-accent)",
                      }}
                    >
                      Quero um site como este
                    </Link>
                    <p className="text-center text-xs text-slate-400">
                      Site de demonstração — no seu site, os botões de
                      proposta, WhatsApp e telefone ficam ativos aqui.
                    </p>
                  </>
                ) : (
                  <>
                    <LeadDialog
                      vehicleId={vehicle.id}
                      vehicleTitle={title}
                      storeName={store.name}
                      whatsapp={store.whatsapp}
                      waMessage={waMessage}
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
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <StoreFooter store={store} />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // escapa < para impedir quebra de </script> via campos do anúncio
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </div>
  );
}
