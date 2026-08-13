import Link from "next/link";
import type { PublicVehicle, Storefront } from "@/lib/public";
import { vehicleTitle, formatPrice } from "@/lib/format";
import { VEHICLE_FLAG_LABELS, VEHICLE_FLAG_WARNINGS } from "@/lib/types";
import {
  vehicleSpecs,
  vehicleOptionals,
  vehicleJsonLd,
} from "@/components/storefront/vehicle-detail-data";
import { VehicleActions } from "@/components/storefront/VehicleActions";
import { Gallery } from "@/components/storefront/Gallery";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { StoreLogo } from "@/components/storefront/StoreLogo";
import { showStoreName } from "@/components/storefront/identity";
import { hasAddress } from "@/components/storefront/address";

/**
 * Detalhe de veículo no vestido do template Premium — boutique de
 * seminovos de luxo. Herda o TEMA da loja (var(--sf-*)); tom dark, sem
 * cores de marca fixas. Replica o cabeçalho do Premium (sticky, blur,
 * tipografia display com tracking largo) e troca o hero da home por um
 * foco no veículo: galeria cinematográfica + coluna de preço/ficha/ações.
 */
export function PremiumDetail({
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
  const aboutHref = `/${slug}/sobre`;
  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = store.settings.about ? "Sobre" : "Localização";

  // estilo de link discreto da navegação (uppercase, tracking largo)
  const navLink =
    "hidden transition hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none sm:inline";

  return (
    <div
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        background: "var(--sf-bg, #0a0e1a)",
        color: "var(--sf-ink, #e2e8f0)",
      }}
    >
      {/* header — réplica do Premium, links adaptados ao detalhe */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          borderColor: "var(--sf-border, rgba(255,255,255,0.06))",
          background:
            "color-mix(in srgb, var(--sf-bg, #0a0e1a) 85%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <Link href={`/${slug}`} className="flex min-w-0 items-center gap-3.5">
            <StoreLogo store={store} size={44} />
            {showStoreName(store) && (
              <div className="min-w-0 leading-tight">
                <div
                  className="text-sm font-light uppercase tracking-[0.28em] break-words"
                  style={{
                    fontFamily: "var(--sf-font-head)",
                    color: "var(--sf-ink, #ffffff)",
                  }}
                >
                  {store.name}
                </div>
                {store.settings.slogan && (
                  <div
                    className="mt-0.5 text-[11px] font-light tracking-[0.2em]"
                    style={{ color: "var(--sf-ink-soft, #94a3b8)" }}
                  >
                    {store.settings.slogan}
                  </div>
                )}
              </div>
            )}
          </Link>

          <nav className="flex shrink-0 items-center gap-7 text-[13px] font-light tracking-[0.15em] uppercase">
            <Link
              href={`/${slug}`}
              className={navLink}
              style={{ color: "var(--sf-ink, #cbd5e1)" }}
            >
              Coleção
            </Link>
            {showAbout && (
              <Link
                href={aboutHref}
                className={navLink}
                style={{ color: "var(--sf-ink, #cbd5e1)" }}
              >
                {aboutLabel}
              </Link>
            )}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border px-5 py-2 text-[11px] tracking-[0.2em] transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{ borderColor: "var(--sf-accent)", color: "var(--sf-accent)" }}
              >
                Fale conosco
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* voltar ao acervo — discreto, na linguagem do template */}
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-[11px] font-light uppercase tracking-[0.3em] transition hover:opacity-70 focus-visible:outline-none focus-visible:opacity-70"
          style={{ color: "var(--sf-accent)" }}
        >
          <span aria-hidden>←</span> Voltar ao acervo
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          {/* galeria + descrição + opcionais */}
          <div className="min-w-0">
            <Gallery photos={vehicle.photos ?? []} title={title} />

            {vehicle.description && (
              <section className="mt-12">
                <span
                  className="text-[11px] font-light uppercase tracking-[0.4em]"
                  style={{ color: "var(--sf-accent)" }}
                >
                  A peça
                </span>
                <h2
                  className="mt-3 text-xl font-light uppercase tracking-[0.2em]"
                  style={{
                    fontFamily: "var(--sf-font-head)",
                    color: "var(--sf-ink, #ffffff)",
                  }}
                >
                  Descrição
                </h2>
                <div
                  aria-hidden
                  className="mt-5 h-px w-full"
                  style={{
                    background:
                      "linear-gradient(to right, var(--sf-accent), transparent 70%)",
                  }}
                />
                <p
                  className="mt-6 whitespace-pre-line text-sm font-light leading-relaxed tracking-wide"
                  style={{ color: "var(--sf-ink-soft, #cbd5e1)" }}
                >
                  {vehicle.description}
                </p>
              </section>
            )}

            {optionals.length > 0 && (
              <section className="mt-12">
                <span
                  className="text-[11px] font-light uppercase tracking-[0.4em]"
                  style={{ color: "var(--sf-accent)" }}
                >
                  Detalhamento
                </span>
                <h2
                  className="mt-3 text-xl font-light uppercase tracking-[0.2em]"
                  style={{
                    fontFamily: "var(--sf-font-head)",
                    color: "var(--sf-ink, #ffffff)",
                  }}
                >
                  Opcionais
                </h2>
                <div
                  aria-hidden
                  className="mt-5 h-px w-full"
                  style={{
                    background:
                      "linear-gradient(to right, var(--sf-accent), transparent 70%)",
                  }}
                />
                <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  {optionals.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-3 border-b pb-3 text-sm font-light tracking-wide"
                      style={{
                        borderColor: "var(--sf-border, rgba(255,255,255,0.08))",
                        color: "var(--sf-ink-soft, #cbd5e1)",
                      }}
                    >
                      <span aria-hidden style={{ color: "var(--sf-accent)" }}>
                        ✓
                      </span>
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* coluna de preço + ficha + ações (sticky) */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div
              className="rounded-2xl border p-6 sm:p-8"
              style={{
                borderColor: "var(--sf-border, rgba(255,255,255,0.08))",
                background: "var(--sf-surface, rgba(255,255,255,0.03))",
              }}
            >
              {vehicle.status === "reserved" && (
                <span
                  className="mb-4 inline-block rounded-full border px-3.5 py-1.5 text-[10px] font-light uppercase tracking-[0.3em]"
                  style={{
                    borderColor: "rgba(251,191,36,0.4)",
                    background: "rgba(251,191,36,0.1)",
                    color: "#fcd34d",
                  }}
                >
                  Reservado
                </span>
              )}

              <h1
                className="text-2xl font-light leading-[1.1] tracking-[0.01em] break-words sm:text-3xl"
                style={{
                  fontFamily: "var(--sf-font-head)",
                  color: "var(--sf-ink, #ffffff)",
                }}
              >
                {title}
              </h1>

              <div
                aria-hidden
                className="mt-5 h-px w-16"
                style={{ background: "var(--sf-accent)" }}
              />

              <div
                className="mt-5 text-3xl font-light tracking-wide sm:text-4xl"
                style={{ color: "var(--sf-ink, #ffffff)" }}
              >
                {formatPrice(vehicle.price)}
              </div>

              {vehicle.fipe_price != null && vehicle.fipe_reference && (
                <p
                  className="mt-3 text-xs font-light tracking-wide"
                  style={{ color: "var(--sf-ink-faint, #64748b)" }}
                >
                  Tabela FIPE:{" "}
                  <span style={{ color: "var(--sf-ink-soft, #94a3b8)" }}>
                    {formatPrice(vehicle.fipe_price)}
                  </span>{" "}
                  · ref. {vehicle.fipe_reference}
                </p>
              )}

              {(vehicle.condition_flags?.length ?? 0) > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {vehicle.condition_flags.map((flag) => {
                    const warn = VEHICLE_FLAG_WARNINGS.includes(flag);
                    return (
                      <span
                        key={flag}
                        className="rounded-full border px-3 py-1 text-[10px] font-light uppercase tracking-[0.2em]"
                        style={
                          warn
                            ? {
                                borderColor: "rgba(251,191,36,0.4)",
                                background: "rgba(251,191,36,0.1)",
                                color: "#fcd34d",
                              }
                            : {
                                borderColor:
                                  "var(--sf-border, rgba(255,255,255,0.15))",
                                color: "var(--sf-ink-soft, #cbd5e1)",
                              }
                        }
                      >
                        {VEHICLE_FLAG_LABELS[flag]}
                      </span>
                    );
                  })}
                </div>
              )}

              {specs.length > 0 && (
                <dl
                  className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-7"
                  style={{ borderColor: "var(--sf-border, rgba(255,255,255,0.08))" }}
                >
                  {specs.map(([k, v]) => (
                    <div key={k}>
                      <dt
                        className="text-[10px] font-light uppercase tracking-[0.2em]"
                        style={{ color: "var(--sf-ink-faint, #64748b)" }}
                      >
                        {k}
                      </dt>
                      <dd
                        className="mt-1 text-sm font-light tracking-wide"
                        style={{ color: "var(--sf-ink, #e2e8f0)" }}
                      >
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <div
                aria-hidden
                className="mt-8 h-px w-full"
                style={{ background: "var(--sf-border, rgba(255,255,255,0.08))" }}
              />
              <VehicleActions
                store={store}
                vehicle={vehicle}
                demo={demo}
                tone="dark"
                className="mt-8"
              />
            </div>
          </aside>
        </div>
      </main>

      <StoreFooter store={store} tone="dark" />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
    </div>
  );
}
