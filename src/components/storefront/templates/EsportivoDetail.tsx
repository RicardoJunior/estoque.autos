import Link from "next/link";
import type { CSSProperties } from "react";
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
 * Detalhe de veículo — layout do template Esportivo (tom dark).
 * Reusa o shell de identidade do template (fundo #020617, texto branco,
 * cabeçalho com hairline primary→accent, headings black uppercase italic
 * em var(--sf-font-head), formas com skew e cantos retos). Sem hero: o
 * foco é o veículo. Cores/superfícies vêm do tema (var(--sf-*, fallback
 * escuro)) para a cor custom da loja repintar cartões/inks sem quebrar a
 * identidade esportiva. Peças sensíveis (ações/galeria/rodapé) reusadas.
 */
export function EsportivoDetail({
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

  // specs de destaque (badges na linha do título — energia esportiva)
  const KEY = new Set(["Ano", "Quilometragem", "Câmbio", "Combustível"]);
  const keyBadges = specs.filter(([k]) => KEY.has(k)).map(([, v]) => v);

  // cabeçalho: mesma lógica de "Sobre/Localização" do template
  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = hasAddress(store.address) ? "Localização" : "Sobre";
  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  const accent: CSSProperties = {
    background: "var(--sf-accent)",
    color: "var(--sf-on-accent)",
  };
  // aviso (leilão/alienado + reservado): destaque em âmbar sobre o dark
  const warn: CSSProperties = {
    borderColor: "rgba(251,191,36,0.45)",
    background: "rgba(251,191,36,0.12)",
    color: "#fcd34d",
  };

  return (
    <div
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        // fundo FIXO do template: header/footer mantêm a identidade
        // esportiva; superfícies/inks abaixo usam var(--sf-*) com
        // fallback escuro, então a cor custom repinta os cartões
        background: "#020617",
        color: "#ffffff",
      }}
    >
      {/* header replicado do template — não responde a --sf-bg/--sf-ink */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          background: "color-mix(in srgb, #020617 85%, transparent)",
        }}
      >
        <div
          aria-hidden
          className="h-0.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--sf-primary), var(--sf-accent))",
          }}
        />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Link href={`/${slug}`} className="flex min-w-0 items-center gap-3">
            <StoreLogo store={store} size={44} />
            {showStoreName(store) && (
              <div className="min-w-0">
                <div
                  className="truncate text-lg font-black uppercase italic leading-none tracking-tight"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  {store.name}
                </div>
                {store.settings.slogan && (
                  <div
                    className="truncate text-[11px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {store.settings.slogan}
                  </div>
                )}
              </div>
            )}
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href={`/${slug}`}
              className="hidden rounded text-sm font-bold uppercase tracking-wide opacity-70 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:block"
              style={{ color: "#ffffff" }}
            >
              Estoque
            </Link>
            {showAbout && (
              <Link
                href={`/${slug}/sobre`}
                className="hidden rounded text-sm font-bold uppercase tracking-wide opacity-70 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:block"
                style={{ color: "#ffffff" }}
              >
                {aboutLabel}
              </Link>
            )}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="-skew-x-6 px-5 py-2.5 text-sm font-black uppercase italic tracking-wide shadow-lg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={accent}
              >
                <span className="block skew-x-6">Fale conosco</span>
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        {/* voltar discreto no tom do template */}
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] opacity-60 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          style={{ color: "#ffffff" }}
        >
          <span aria-hidden>←</span> Voltar ao estoque
        </Link>

        {/* título energético (hero-less) com barra accent + badges-chave */}
        <div className="mt-5 flex items-start gap-4">
          <span
            aria-hidden
            className="mt-1 h-10 w-2 shrink-0 -skew-x-12"
            style={{ background: "var(--sf-accent)" }}
          />
          <div className="min-w-0">
            <h1
              className="break-words text-3xl font-black uppercase italic leading-[0.95] tracking-tighter sm:text-5xl sm:leading-[0.92]"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              {title}
            </h1>
            {keyBadges.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {keyBadges.map((b) => (
                  <span
                    key={b}
                    className="border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/80"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* galeria + descrição + opcionais */}
          <div>
            <Gallery photos={vehicle.photos ?? []} title={title} />

            {vehicle.description && (
              <section className="mt-10">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-7 w-1.5 -skew-x-12"
                    style={{ background: "var(--sf-primary)" }}
                  />
                  <h2
                    className="text-xl font-black uppercase italic tracking-tight"
                    style={{ fontFamily: "var(--sf-font-head)" }}
                  >
                    Descrição
                  </h2>
                </div>
                <p
                  className="whitespace-pre-line text-[15px] leading-relaxed"
                  style={{ color: "var(--sf-ink-soft, rgba(255,255,255,0.72))" }}
                >
                  {vehicle.description}
                </p>
              </section>
            )}

            {optionals.length > 0 && (
              <section className="mt-10">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-7 w-1.5 -skew-x-12"
                    style={{ background: "var(--sf-accent)" }}
                  />
                  <h2
                    className="text-xl font-black uppercase italic tracking-tight"
                    style={{ fontFamily: "var(--sf-font-head)" }}
                  >
                    Opcionais
                  </h2>
                </div>
                <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {optionals.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-2 text-sm"
                      style={{
                        color: "var(--sf-ink-soft, rgba(255,255,255,0.75))",
                      }}
                    >
                      <span
                        className="font-black"
                        style={{ color: "var(--sf-accent)" }}
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

          {/* coluna de preço + ficha + ações (sticky) */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div
              className="relative border p-6"
              style={{
                borderColor: "var(--sf-border, rgba(255,255,255,0.14))",
                background: "var(--sf-surface, rgba(255,255,255,0.04))",
              }}
            >
              {/* hairline accent no topo do painel (eco do header) */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5"
                style={{
                  background:
                    "linear-gradient(90deg, var(--sf-primary), var(--sf-accent))",
                }}
              />

              {/* selos: reservado + condição (avisos em âmbar) */}
              {(vehicle.status === "reserved" ||
                (vehicle.condition_flags?.length ?? 0) > 0) && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {vehicle.status === "reserved" && (
                    <span
                      className="inline-flex items-center border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide"
                      style={warn}
                    >
                      Reservado
                    </span>
                  )}
                  {vehicle.condition_flags?.map((flag) =>
                    VEHICLE_FLAG_WARNINGS.includes(flag) ? (
                      <span
                        key={flag}
                        className="inline-flex items-center border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide"
                        style={warn}
                      >
                        {VEHICLE_FLAG_LABELS[flag]}
                      </span>
                    ) : (
                      <span
                        key={flag}
                        className="inline-flex items-center border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/80"
                      >
                        {VEHICLE_FLAG_LABELS[flag]}
                      </span>
                    ),
                  )}
                </div>
              )}

              <div
                className="text-[11px] font-black uppercase tracking-[0.25em]"
                style={{ color: "var(--sf-ink-faint, rgba(255,255,255,0.45))" }}
              >
                Valor
              </div>
              <div className="mt-2">
                <span
                  className="inline-block -skew-x-6 px-4 py-2 text-3xl font-black"
                  style={accent}
                >
                  <span className="block skew-x-6">
                    {formatPrice(vehicle.price)}
                  </span>
                </span>
              </div>

              {vehicle.fipe_price != null && vehicle.fipe_reference && (
                <p
                  className="mt-3 text-xs"
                  style={{
                    color: "var(--sf-ink-faint, rgba(255,255,255,0.5))",
                  }}
                >
                  Tabela FIPE:{" "}
                  <span className="font-bold text-white/85">
                    {formatPrice(vehicle.fipe_price)}
                  </span>{" "}
                  · ref. {vehicle.fipe_reference}
                </p>
              )}

              {specs.length > 0 && (
                <dl
                  className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-6"
                  style={{
                    borderColor: "var(--sf-border, rgba(255,255,255,0.1))",
                  }}
                >
                  {specs.map(([k, v]) => (
                    <div key={k}>
                      <dt
                        className="text-[11px] font-bold uppercase tracking-wide"
                        style={{
                          color: "var(--sf-ink-faint, rgba(255,255,255,0.45))",
                        }}
                      >
                        {k}
                      </dt>
                      <dd
                        className="mt-0.5 text-sm font-semibold"
                        style={{ color: "var(--sf-ink, #ffffff)" }}
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
                tone="dark"
                className="mt-6"
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
