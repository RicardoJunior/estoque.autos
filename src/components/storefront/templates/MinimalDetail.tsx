import Link from "next/link";
import type { PublicVehicle, Storefront } from "@/lib/public";
import { VEHICLE_FLAG_LABELS, VEHICLE_FLAG_WARNINGS } from "@/lib/types";
import { vehicleTitle, formatPrice } from "@/lib/format";
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
 * Detalhe do veículo — template Minimal (tom light).
 * Segue a estética editorial da home: branco dominante, tipografia GRANDE em
 * peso leve, hairlines em vez de sombras, cantos retos (rounded-none) e cor
 * só em acentos cirúrgicos (preço, filetes, índice). Sem hero — o foco é o
 * veículo. Todas as cores vêm do tema (var(--sf-*)); nada de marca fixa.
 */
export function MinimalDetail({
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

  // mesma lógica de nav da home Minimal
  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = hasAddress(store.address) ? "Localização" : "Sobre";

  const flags = vehicle.condition_flags ?? [];

  // filete + rótulo em caixa-alta — o "eyebrow" editorial recorrente do Minimal
  const eyebrow = (label: string) => (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="block h-px w-8"
        style={{ background: "var(--sf-accent)" }}
      />
      <span
        className="text-xs font-light uppercase tracking-[0.3em]"
        style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        background: "var(--sf-bg, #ffffff)",
        color: "var(--sf-ink, #0f172a)",
      }}
    >
      {/* masthead editorial — replicado da home Minimal */}
      <header
        className="border-b"
        style={{ borderColor: "var(--sf-border, #e2e8f0)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:gap-6 sm:px-6">
          <Link
            href={`/${slug}`}
            className="flex min-w-0 items-center gap-3 rounded outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ["--tw-ring-color" as string]: "var(--sf-primary)" }}
          >
            <StoreLogo store={store} size={32} />
            {showStoreName(store) && (
              <span
                className="truncate text-sm font-medium tracking-tight"
                style={{
                  fontFamily: "var(--sf-font-head)",
                  color: "var(--sf-ink, #0f172a)",
                }}
              >
                {store.name}
              </span>
            )}
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <Link
              href={`/${slug}`}
              className="hidden font-light tracking-wide underline-offset-[6px] transition hover:underline hover:opacity-70 sm:inline"
              style={{ color: "var(--sf-ink-soft, #64748b)" }}
            >
              Estoque
            </Link>
            {showAbout && (
              <Link
                href={`/${slug}/sobre`}
                className="hidden font-light tracking-wide underline-offset-[6px] transition hover:underline hover:opacity-70 sm:inline"
                style={{ color: "var(--sf-ink-soft, #64748b)" }}
              >
                {aboutLabel}
              </Link>
            )}
            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-light tracking-wide underline-offset-[6px] transition hover:underline"
                style={{
                  color: "var(--sf-ink, #0f172a)",
                  textDecorationColor: "var(--sf-accent)",
                }}
              >
                Contato
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-24">
        {/* voltar discreto — no idioma dos links do Minimal */}
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-light tracking-wide underline-offset-[6px] transition hover:underline hover:opacity-70"
          style={{ color: "var(--sf-ink-soft, #64748b)" }}
        >
          <span aria-hidden>←</span> Voltar ao estoque
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          {/* galeria + descrição + opcionais */}
          <div>
            <Gallery photos={vehicle.photos ?? []} title={title} />

            {vehicle.description && (
              <section className="mt-12">
                {eyebrow("Descrição")}
                <p
                  className="mt-5 whitespace-pre-line text-base font-light leading-relaxed"
                  style={{ color: "var(--sf-ink-soft, #64748b)" }}
                >
                  {vehicle.description}
                </p>
              </section>
            )}

            {optionals.length > 0 && (
              <section className="mt-12">
                {eyebrow("Opcionais")}
                <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  {optionals.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-3 border-t pt-3 text-sm font-light"
                      style={{
                        borderColor: "var(--sf-border, #f1f5f9)",
                        color: "var(--sf-ink, #334155)",
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

          {/* ficha + preço + ações (sticky) */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div
              className="border p-6 sm:p-8"
              style={{
                borderColor: "var(--sf-border, #e2e8f0)",
                background: "var(--sf-surface, #ffffff)",
              }}
            >
              <span
                className="text-sm font-light tabular-nums"
                style={{ color: "var(--sf-accent)" }}
              >
                01
              </span>
              <h1
                className="mt-4 break-words text-2xl font-light leading-[1.1] tracking-tight sm:text-3xl"
                style={{
                  fontFamily: "var(--sf-font-head)",
                  color: "var(--sf-ink, #0f172a)",
                }}
              >
                {title}
              </h1>

              <span
                aria-hidden
                className="mt-6 block h-px w-16"
                style={{ background: "var(--sf-accent)" }}
              />

              <div
                className="mt-6 text-3xl font-normal tracking-tight sm:text-4xl"
                style={{ color: "var(--sf-primary)" }}
              >
                {formatPrice(vehicle.price)}
              </div>

              {(vehicle.status === "reserved" || flags.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {vehicle.status === "reserved" && (
                    <span
                      className="border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest"
                      style={{
                        borderColor: "#f59e0b",
                        background: "rgba(245,158,11,0.12)",
                        color: "#b45309",
                      }}
                    >
                      Reservado
                    </span>
                  )}
                  {flags.map((flag) =>
                    VEHICLE_FLAG_WARNINGS.includes(flag) ? (
                      <span
                        key={flag}
                        className="border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest"
                        style={{
                          borderColor: "#f59e0b",
                          background: "rgba(245,158,11,0.12)",
                          color: "#b45309",
                        }}
                      >
                        {VEHICLE_FLAG_LABELS[flag]}
                      </span>
                    ) : (
                      <span
                        key={flag}
                        className="border px-2.5 py-1 text-[11px] font-light uppercase tracking-widest"
                        style={{
                          borderColor: "var(--sf-border, #e2e8f0)",
                          color: "var(--sf-ink-soft, #64748b)",
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
                  className="mt-4 text-xs font-light"
                  style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                >
                  Tabela FIPE:{" "}
                  <span
                    className="font-normal"
                    style={{ color: "var(--sf-ink, #334155)" }}
                  >
                    {formatPrice(vehicle.fipe_price)}
                  </span>{" "}
                  · ref. {vehicle.fipe_reference}
                </p>
              )}

              {specs.length > 0 && (
                <dl
                  className="mt-7 grid grid-cols-2 gap-x-8 gap-y-5 border-t pt-7"
                  style={{ borderColor: "var(--sf-border, #f1f5f9)" }}
                >
                  {specs.map(([k, v]) => (
                    <div key={k}>
                      <dt
                        className="text-xs font-light uppercase tracking-widest"
                        style={{ color: "var(--sf-ink-faint, #cbd5e1)" }}
                      >
                        {k}
                      </dt>
                      <dd
                        className="mt-1.5 text-sm font-light"
                        style={{ color: "var(--sf-ink, #334155)" }}
                      >
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <div
                className="mt-8 border-t pt-8"
                style={{ borderColor: "var(--sf-border, #f1f5f9)" }}
              >
                <VehicleActions
                  store={store}
                  vehicle={vehicle}
                  demo={demo}
                  tone="light"
                />
              </div>
            </div>
          </aside>
        </div>
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
