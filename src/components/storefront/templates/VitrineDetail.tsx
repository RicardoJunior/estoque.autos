import Link from "next/link";
import type { ReactNode } from "react";
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
 * Detalhe do veículo no template Vitrine — editorial, a foto em primeiro
 * lugar, tom claro. Sem hero da home: o cabeçalho flutuante branco-sobre-foto
 * vira uma faixa clara e legível, e o veículo ganha o palco. Reaproveita as
 * peças compartilhadas (Gallery, VehicleActions, StoreFooter) e temas via
 * var(--sf-*) — nada de cor de marca fixa. Assinaturas de dados/SEO/lead
 * vêm de vehicle-detail-data e VehicleActions para não divergir por template.
 */
export function VitrineDetail({
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

  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = store.settings.about ? "Sobre" : "Localização";
  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        background: "var(--sf-bg, #ffffff)",
        color: "var(--sf-ink, #0f172a)",
      }}
    >
      {/* cabeçalho: mesma estrutura do Vitrine (logo+nome / Sobre / Fale
          conosco), mas em faixa clara — sem hero, o branco-sobre-foto sairia
          ilegível, então usamos os tokens de tinta do tema */}
      <header
        className="border-b"
        style={{
          borderColor: "var(--sf-border, #e2e8f0)",
          background: "var(--sf-bg, #ffffff)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href={`/${slug}`}
            className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2"
            style={{ ["--tw-ring-color" as string]: "var(--sf-primary)" }}
          >
            <StoreLogo store={store} size={44} />
            {showStoreName(store) && (
              <div className="min-w-0 leading-tight">
                <div
                  className="text-sm font-semibold tracking-tight sm:text-base"
                  style={{
                    fontFamily: "var(--sf-font-head)",
                    color: "var(--sf-ink, #0f172a)",
                  }}
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

          <nav className="flex items-center gap-1.5 sm:gap-3">
            {showAbout && (
              <Link
                href={`/${slug}/sobre`}
                className="hidden rounded-full px-4 py-2 text-sm font-medium outline-none transition hover:bg-black/[0.04] focus-visible:ring-2 sm:block"
                style={{
                  color: "var(--sf-ink-soft, #64748b)",
                  ["--tw-ring-color" as string]: "var(--sf-primary)",
                }}
              >
                {aboutLabel}
              </Link>
            )}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-5 py-2 text-sm font-semibold shadow-sm outline-none transition hover:opacity-90 focus-visible:ring-2"
                style={{
                  background: "var(--sf-accent)",
                  color: "var(--sf-on-accent)",
                  ["--tw-ring-color" as string]: "var(--sf-primary)",
                }}
              >
                Fale conosco
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {/* voltar ao estoque no idioma editorial da Vitrine: filete de acento
            + rótulo em versalete */}
        <Link
          href={`/${slug}`}
          className="group inline-flex items-center gap-3 outline-none"
        >
          <span
            className="h-px w-8 transition-all duration-300 group-hover:w-12"
            style={{ background: "var(--sf-accent)" }}
          />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.25em]"
            style={{ color: "var(--sf-ink-soft, #64748b)" }}
          >
            Voltar ao estoque
          </span>
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* galeria domina, como na vitrine editorial */}
          <div>
            <Gallery photos={vehicle.photos ?? []} title={title} />
          </div>

          {/* ficha + preço + ações — painel emoldurado, acompanha a rolagem */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div
              className="rounded-2xl border p-6 sm:p-7"
              style={{
                borderColor: "var(--sf-border, #e2e8f0)",
                background: "var(--sf-surface, #f8fafc)",
              }}
            >
              {/* olho editorial: marca em versalete sob filete de acento */}
              {vehicle.brand && (
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className="h-px w-6"
                    style={{ background: "var(--sf-accent)" }}
                  />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                  >
                    {vehicle.brand}
                  </span>
                </div>
              )}

              <h1
                className="text-xl font-bold leading-snug tracking-tight"
                style={{
                  fontFamily: "var(--sf-font-head)",
                  color: "var(--sf-ink, #0f172a)",
                }}
              >
                {title}
              </h1>

              {/* preço com o marcador de acento vertical — assinatura da Vitrine */}
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="h-8 w-1.5 rounded-full"
                  style={{ background: "var(--sf-accent)" }}
                />
                <span
                  className="text-3xl font-extrabold tracking-tight"
                  style={{ color: "var(--sf-ink, #0f172a)" }}
                >
                  {formatPrice(vehicle.price)}
                </span>
              </div>

              {/* selos de condição — reservado + flags (leilão/alienado em aviso) */}
              {(vehicle.status === "reserved" ||
                (vehicle.condition_flags?.length ?? 0) > 0) && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {vehicle.status === "reserved" && (
                    <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                      Reservado
                    </span>
                  )}
                  {vehicle.condition_flags?.map((flag) => {
                    const warn = VEHICLE_FLAG_WARNINGS.includes(flag);
                    return (
                      <span
                        key={flag}
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={
                          warn
                            ? { background: "#fef3c7", color: "#92400e" }
                            : {
                                background: "var(--sf-primary-soft)",
                                color: "var(--sf-primary)",
                              }
                        }
                      >
                        {VEHICLE_FLAG_LABELS[flag]}
                      </span>
                    );
                  })}
                </div>
              )}

              {vehicle.fipe_price != null && vehicle.fipe_reference && (
                <p
                  className="mt-4 text-xs"
                  style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                >
                  Tabela FIPE:{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "var(--sf-ink-soft, #64748b)" }}
                  >
                    {formatPrice(vehicle.fipe_price)}
                  </span>{" "}
                  · ref. {vehicle.fipe_reference}
                </p>
              )}

              {specs.length > 0 && (
                <dl
                  className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-6"
                  style={{ borderColor: "var(--sf-border, #e2e8f0)" }}
                >
                  {specs.map(([k, v]) => (
                    <div key={k}>
                      <dt
                        className="text-[11px] uppercase tracking-wide"
                        style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                      >
                        {k}
                      </dt>
                      <dd
                        className="mt-0.5 text-sm font-medium"
                        style={{ color: "var(--sf-ink, #0f172a)" }}
                      >
                        {v}
                      </dd>
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

        {/* descrição + opcionais em coluna estreita sob a galeria — leitura
            editorial; no mobile vêm depois da ficha/preço */}
        {(vehicle.description || optionals.length > 0) && (
          <div className="mt-12 max-w-3xl space-y-10">
            {vehicle.description && (
              <section>
                <SectionTitle>Descrição</SectionTitle>
                <p
                  className="mt-4 whitespace-pre-line leading-relaxed"
                  style={{ color: "var(--sf-ink-soft, #64748b)" }}
                >
                  {vehicle.description}
                </p>
              </section>
            )}

            {optionals.length > 0 && (
              <section>
                <SectionTitle>Opcionais</SectionTitle>
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                  {optionals.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--sf-ink-soft, #64748b)" }}
                    >
                      <span style={{ color: "var(--sf-accent)" }}>✓</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>

      <StoreFooter store={store} tone="light" />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
    </div>
  );
}

/** Título de seção no ritmo da Vitrine: fonte de título + filete de acento. */
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2
        className="text-lg font-bold tracking-tight"
        style={{
          fontFamily: "var(--sf-font-head)",
          color: "var(--sf-ink, #0f172a)",
        }}
      >
        {children}
      </h2>
      <span
        className="mt-2 block h-0.5 w-10 rounded-full"
        style={{ background: "var(--sf-accent)" }}
      />
    </div>
  );
}
