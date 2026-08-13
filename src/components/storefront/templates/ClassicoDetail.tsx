import Link from "next/link";
import type { PublicVehicle, Storefront } from "@/lib/public";
import { vehicleTitle, formatPrice } from "@/lib/format";
import { VEHICLE_FLAG_LABELS, VEHICLE_FLAG_WARNINGS } from "@/lib/types";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { Gallery } from "../Gallery";
import { VehicleActions } from "../VehicleActions";
import {
  vehicleSpecs,
  vehicleOptionals,
  vehicleJsonLd,
} from "../vehicle-detail-data";
import { showStoreName } from "../identity";
import { formatAddressShort, hasAddress } from "../address";

/**
 * Detalhe de veículo do template Clássico — mesma estética sóbria da home
 * (barra de utilidades fina, cabeçalho tipográfico com var(--sf-font-head),
 * traço de destaque em var(--sf-primary), molduras discretas e cantos
 * suaves). Sem hero: o foco é o veículo. Tom claro; cores 100% do tema.
 */
export function ClassicoDetail({
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
  const { settings } = store;
  const title = vehicleTitle(vehicle);
  const specs = vehicleSpecs(vehicle);
  const optionals = vehicleOptionals(vehicle);
  const jsonLd = vehicleJsonLd(store, vehicle, slug, demo);

  const aboutHref = `/${slug}/sobre`;
  const showAbout = !!settings.about || hasAddress(store.address);
  const aboutLabel = settings.about ? "Sobre" : "Localização";
  const addressShort = formatAddressShort(store.address);

  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  const navLinks: { label: string; href: string }[] = [
    { label: "Estoque", href: `/${slug}` },
    ...(showAbout ? [{ label: aboutLabel, href: aboutHref }] : []),
  ];

  const flags = vehicle.condition_flags ?? [];
  const hasFipe = vehicle.fipe_price != null && !!vehicle.fipe_reference;

  return (
    <div
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        background: "var(--sf-bg, #ffffff)",
        color: "var(--sf-ink, #0f172a)",
      }}
    >
      {/* barra de utilidades — idêntica à home */}
      <div
        className="hidden text-xs sm:block"
        style={{
          background: "var(--sf-primary-dark)",
          color: "var(--sf-on-primary)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2">
          <span className="opacity-90">
            {settings.business_hours?.split("\n")[0]}
          </span>
          <div className="flex items-center gap-5">
            {store.phone && <span className="opacity-90">{store.phone}</span>}
            {addressShort && (
              <span className="hidden opacity-90 lg:inline">
                {addressShort}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* cabeçalho — replicado do template (sem hero) */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{
          borderColor: "var(--sf-border, #e2e8f0)",
          background:
            "color-mix(in srgb, var(--sf-bg, #ffffff) 88%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href={`/${slug}`} className="flex items-center gap-3">
            <StoreLogo store={store} size={46} />
            {showStoreName(store) && (
              <div className="leading-tight">
                <div
                  className="text-lg font-bold tracking-tight"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  {store.name}
                </div>
                {settings.slogan && (
                  <div
                    className="text-xs"
                    style={{ color: "var(--sf-ink-soft, #64748b)" }}
                  >
                    {settings.slogan}
                  </div>
                )}
              </div>
            )}
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-sm text-sm font-medium underline-offset-8 transition hover:underline hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  fontFamily: "var(--sf-font-head)",
                  color: "var(--sf-ink-soft, #64748b)",
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: "var(--sf-accent)",
                color: "var(--sf-on-accent)",
              }}
            >
              Fale conosco
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        {/* voltar ao estoque — discreto, no ritmo tipográfico do template */}
        <Link
          href={`/${slug}`}
          className="group inline-flex items-center gap-2 rounded-sm text-sm underline-offset-8 transition hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            fontFamily: "var(--sf-font-head)",
            color: "var(--sf-ink-soft, #64748b)",
          }}
        >
          <span
            aria-hidden
            className="transition-transform group-hover:-translate-x-0.5"
          >
            ←
          </span>
          Voltar ao estoque
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-10">
          {/* galeria + descrição + opcionais */}
          <div>
            <Gallery photos={vehicle.photos ?? []} title={title} />

            {vehicle.description && (
              <section className="mt-10">
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  Descrição
                </h2>
                <div
                  className="mt-3 h-px w-16"
                  style={{ background: "var(--sf-primary)" }}
                />
                <p
                  className="mt-4 whitespace-pre-line text-sm leading-relaxed"
                  style={{ color: "var(--sf-ink-soft, #64748b)" }}
                >
                  {vehicle.description}
                </p>
              </section>
            )}

            {optionals.length > 0 && (
              <section className="mt-10">
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  Opcionais
                </h2>
                <div
                  className="mt-3 h-px w-16"
                  style={{ background: "var(--sf-primary)" }}
                />
                <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {optionals.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--sf-ink-soft, #64748b)" }}
                    >
                      <span style={{ color: "var(--sf-primary)" }}>✓</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* coluna de preço + ficha + ações (moldura clássica, sticky) */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div
              className="rounded-lg border p-6 shadow-sm"
              style={{
                borderColor: "var(--sf-border, #e2e8f0)",
                background: "var(--sf-surface, #f8fafc)",
              }}
            >
              <h1
                className="text-xl font-bold tracking-tight sm:text-2xl"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                {title}
              </h1>

              <div
                className="mt-2 text-3xl font-extrabold"
                style={{ color: "var(--sf-primary)" }}
              >
                {formatPrice(vehicle.price)}
              </div>

              {(vehicle.status === "reserved" || flags.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {vehicle.status === "reserved" && (
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        background: "var(--sf-primary-soft)",
                        color: "var(--sf-primary)",
                      }}
                    >
                      Reservado
                    </span>
                  )}
                  {flags.map((flag) =>
                    VEHICLE_FLAG_WARNINGS.includes(flag) ? (
                      <span
                        key={flag}
                        className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
                      >
                        {VEHICLE_FLAG_LABELS[flag]}
                      </span>
                    ) : (
                      <span
                        key={flag}
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
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

              {hasFipe && (
                <p
                  className="mt-3 text-xs"
                  style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                >
                  Tabela FIPE:{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "var(--sf-ink, #0f172a)" }}
                  >
                    {formatPrice(vehicle.fipe_price!)}
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
                        className="text-xs"
                        style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                      >
                        {k}
                      </dt>
                      <dd className="text-sm font-medium">{v}</dd>
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

      {showAbout && (
        <section
          className="border-t"
          style={{
            borderColor: "var(--sf-border, #e2e8f0)",
            background: "var(--sf-surface, #f8fafc)",
          }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8">
            <div>
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                {settings.about ? `Conheça a ${store.name}` : "Venha nos visitar"}
              </h2>
              {addressShort && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--sf-ink-soft, #64748b)" }}
                >
                  {addressShort}
                </p>
              )}
            </div>
            <Link
              href={aboutHref}
              className="rounded-md border px-5 py-2.5 text-sm font-semibold transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                borderColor: "var(--sf-primary)",
                color: "var(--sf-primary)",
              }}
            >
              {aboutLabel}
            </Link>
          </div>
        </section>
      )}

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
