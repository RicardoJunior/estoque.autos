import Link from "next/link";
import type { PublicVehicle, Storefront } from "@/lib/public";
import { vehicleTitle, formatPrice } from "@/lib/format";
import { VEHICLE_FLAG_LABELS, VEHICLE_FLAG_WARNINGS } from "@/lib/types";
import { Gallery } from "@/components/storefront/Gallery";
import { StoreLogo } from "@/components/storefront/StoreLogo";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { VehicleActions } from "@/components/storefront/VehicleActions";
import {
  vehicleSpecs,
  vehicleOptionals,
  vehicleJsonLd,
} from "@/components/storefront/vehicle-detail-data";
import { showStoreName } from "@/components/storefront/identity";
import { hasAddress } from "@/components/storefront/address";

/**
 * Detalhe do veículo no template Moderno — mesma vibe startup automotiva:
 * claro e arrojado, cabeçalho sticky com blur, cantos arredondados grandes
 * (3xl), cartões "flutuantes" e micro-interações no hover. Sem hero (é
 * página de detalhe). Cores/fonte 100% var(--sf-*), tom light.
 */
export function ModernoDetail({
  store,
  vehicle,
  slug,
  demo = false,
}: {
  store: Storefront;
  vehicle: PublicVehicle;
  slug: string;
  demo?: boolean;
}) {
  const title = vehicleTitle(vehicle);
  const specs = vehicleSpecs(vehicle);
  const optionals = vehicleOptionals(vehicle);
  const jsonLd = vehicleJsonLd(store, vehicle, slug, demo);

  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  // Nav "Sobre" só quando há conteúdo para a página /{slug}/sobre.
  const hasAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = hasAddress(store.address) ? "Localização" : "Sobre";

  const flags = vehicle.condition_flags ?? [];

  return (
    <div
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        background: "var(--sf-bg, #ffffff)",
        color: "var(--sf-ink, #0f172a)",
      }}
    >
      {/* ── header (replicado do template Moderno) ───────────────── */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--sf-border, rgba(226,232,240,0.7))",
          background: "color-mix(in srgb, var(--sf-bg, #ffffff) 88%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Link href={`/${slug}`} className="flex min-w-0 items-center gap-3">
            <StoreLogo store={store} size={44} className="shrink-0 rounded-2xl" />
            {showStoreName(store) && (
              <div className="min-w-0">
                <div
                  className="break-words font-extrabold leading-tight tracking-tight"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  {store.name}
                </div>
                {store.settings.slogan && (
                  <div
                    className="text-xs"
                    style={{ color: "var(--sf-ink-soft, #64748b)" }}
                  >
                    {store.settings.slogan}
                  </div>
                )}
              </div>
            )}
          </Link>

          <nav className="flex items-center gap-1.5">
            <Link
              href={`/${slug}`}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 sm:block"
              style={{ color: "var(--sf-ink-soft, #64748b)" }}
            >
              Estoque
            </Link>
            {hasAbout && (
              <Link
                href={`/${slug}/sobre`}
                className="hidden rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 sm:block"
                style={{ color: "var(--sf-ink-soft, #64748b)" }}
              >
                {aboutLabel}
              </Link>
            )}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-5 py-2 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: "var(--sf-accent)",
                  color: "var(--sf-on-accent)",
                }}
              >
                Fale conosco
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* ── conteúdo do veículo ──────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
        {/* voltar ao estoque — discreto, no estilo pill do Moderno */}
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
          style={{ color: "var(--sf-ink-soft, #64748b)" }}
        >
          <span aria-hidden>←</span> Voltar ao estoque
        </Link>

        <div className="mt-5 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* galeria + descrição + opcionais */}
          <div className="min-w-0">
            <Gallery photos={vehicle.photos ?? []} title={title} />

            {vehicle.description && (
              <section
                className="mt-8 rounded-3xl border p-6 sm:p-7"
                style={{
                  borderColor: "var(--sf-border, #e2e8f0)",
                  background: "var(--sf-surface, #f8fafc)",
                }}
              >
                <h2
                  className="text-lg font-extrabold tracking-tight"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  Descrição
                </h2>
                <p
                  className="mt-3 whitespace-pre-line leading-relaxed"
                  style={{ color: "var(--sf-ink-soft, #64748b)" }}
                >
                  {vehicle.description}
                </p>
              </section>
            )}

            {optionals.length > 0 && (
              <section
                className="mt-6 rounded-3xl border p-6 sm:p-7"
                style={{
                  borderColor: "var(--sf-border, #e2e8f0)",
                  background: "var(--sf-surface, #f8fafc)",
                }}
              >
                <h2
                  className="text-lg font-extrabold tracking-tight"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  Opcionais
                </h2>
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                  {optionals.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--sf-ink-soft, #64748b)" }}
                    >
                      <span
                        className="font-bold"
                        style={{ color: "var(--sf-primary)" }}
                      >
                        ✓
                      </span>
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* coluna de preço + ficha + ações (cartão flutuante, sticky) */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div
              className="rounded-3xl border p-6 shadow-lg sm:p-7"
              style={{
                borderColor: "var(--sf-border, #e2e8f0)",
                background: "var(--sf-bg, #ffffff)",
              }}
            >
              <h1
                className="break-words text-xl font-extrabold leading-tight tracking-tight"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                {title}
              </h1>

              <div
                className="mt-2 text-3xl font-extrabold tracking-tight"
                style={{ color: "var(--sf-primary)" }}
              >
                {formatPrice(vehicle.price)}
              </div>

              {(vehicle.status === "reserved" || flags.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {vehicle.status === "reserved" && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                      Reservado
                    </span>
                  )}
                  {flags.map((flag) =>
                    VEHICLE_FLAG_WARNINGS.includes(flag) ? (
                      <span
                        key={flag}
                        className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800"
                      >
                        {VEHICLE_FLAG_LABELS[flag]}
                      </span>
                    ) : (
                      <span
                        key={flag}
                        className="rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{
                          background: "var(--sf-primary-soft)",
                          color: "var(--sf-primary)",
                        }}
                      >
                        {VEHICLE_FLAG_LABELS[flag]}
                      </span>
                    ),
                  )}
                </div>
              )}

              {vehicle.fipe_price != null && vehicle.fipe_reference && (
                <p
                  className="mt-3 text-xs"
                  style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                >
                  Tabela FIPE:{" "}
                  <span
                    className="font-bold"
                    style={{ color: "var(--sf-ink-soft, #64748b)" }}
                  >
                    {formatPrice(vehicle.fipe_price)}
                  </span>{" "}
                  · ref. {vehicle.fipe_reference}
                </p>
              )}

              {specs.length > 0 && (
                <dl
                  className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-5"
                  style={{ borderColor: "var(--sf-border, #e2e8f0)" }}
                >
                  {specs.map(([k, v]) => (
                    <div key={k}>
                      <dt
                        className="text-xs font-medium uppercase tracking-wide"
                        style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                      >
                        {k}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <VehicleActions
                store={store}
                vehicle={vehicle}
                demo={demo}
                tone="light"
                className="mt-6"
              />
            </div>
          </aside>
        </div>
      </main>

      <StoreFooter store={store} />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
    </div>
  );
}
