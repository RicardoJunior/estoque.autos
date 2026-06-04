import Image from "next/image";
import Link from "next/link";
import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { VehicleGrid } from "../blocks/VehicleGrid";
import { hasAddress } from "../address";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/types";

/**
 * Template Esportivo — performance, energia e velocidade.
 * Dark slate, gradientes primary→primary-dark, headings italic uppercase
 * pesados, CTAs com skew, faixa de specs (km/câmbio/combustível) em destaque
 * e detalhes em accent. Tom dark. Cores e fonte vêm do tema da loja (--sf-*).
 */
export function Esportivo({ store, vehicles }: TemplateProps) {
  const hero = vehicles.find((v) => v.featured) ?? vehicles[0];
  const heroCover = hero?.photos?.[0];
  const featured = vehicles.filter((v) => v.featured).slice(0, 3);

  const headline =
    store.settings.slogan ?? store.settings.about ?? "POTÊNCIA NA SUA GARAGEM";
  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = hasAddress(store.address) ? "Localização" : "Sobre";

  // specs do veículo em destaque (badges em destaque na vibe esportiva)
  const heroSpecs: string[] = hero
    ? [
        hero.year_model ? String(hero.year_model) : null,
        hero.mileage != null ? formatKm(hero.mileage) : null,
        hero.transmission ? TRANSMISSION_LABELS[hero.transmission] : null,
        hero.fuel ? FUEL_LABELS[hero.fuel] : null,
      ].filter((s): s is string => s != null)
    : [];

  return (
    <div
      className="min-h-dvh bg-slate-950 text-white"
      style={{ fontFamily: "var(--sf-font)" }}
    >
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div
          aria-hidden
          className="h-0.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--sf-primary), var(--sf-accent))",
          }}
        />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Link href={`/${store.slug}`} className="flex items-center gap-3">
            <StoreLogo store={store} size={44} />
            <div>
              <div
                className="text-lg font-black uppercase italic leading-none tracking-tight"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                {store.name}
              </div>
              {store.settings.slogan && (
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                  {store.settings.slogan}
                </div>
              )}
            </div>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <a
              href="#estoque"
              className="hidden rounded text-sm font-bold uppercase tracking-wide text-white/70 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:block"
            >
              Estoque
            </a>
            {showAbout && (
              <Link
                href={`/${store.slug}/sobre`}
                className="hidden rounded text-sm font-bold uppercase tracking-wide text-white/70 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:block"
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
                style={{
                  background: "var(--sf-accent)",
                  color: "var(--sf-on-accent)",
                }}
              >
                <span className="block skew-x-6">Fale conosco</span>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        {heroCover ? (
          <Image
            src={heroCover.url}
            alt={hero ? vehicleTitle(hero) : store.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, var(--sf-primary), var(--sf-primary-dark))",
            }}
          />
        )}
        {/* overlay diagonal primary→dark para legibilidade e energia */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, var(--sf-primary-dark) 0%, color-mix(in srgb, var(--sf-primary) 60%, transparent) 42%, rgba(2,6,23,0.94) 100%)",
          }}
        />
        {/* raias diagonais sutis (motivo de velocidade) */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 26px)",
          }}
        />
        {/* faixa accent na base */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1.5"
          style={{ background: "var(--sf-accent)" }}
        />

        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <span
            className="inline-flex -skew-x-6 items-center px-3 py-1 text-xs font-black uppercase tracking-[0.2em]"
            style={{
              background: "var(--sf-accent)",
              color: "var(--sf-on-accent)",
            }}
          >
            <span className="block skew-x-6">
              {vehicles.length} no estoque · pronta entrega
            </span>
          </span>
          <h1
            className="mt-6 max-w-3xl text-5xl font-black uppercase italic leading-[0.92] tracking-tighter sm:text-7xl"
            style={{ fontFamily: "var(--sf-font-head)" }}
          >
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium text-white/75 sm:text-lg">
            {store.settings.about ??
              "Velocidade, adrenalina e os melhores negócios. Acelere rumo ao carro dos seus sonhos."}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#estoque"
              className="-skew-x-6 px-8 py-4 text-base font-black uppercase italic tracking-wide shadow-xl transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{
                background: "var(--sf-accent)",
                color: "var(--sf-on-accent)",
              }}
            >
              <span className="block skew-x-6">Ver estoque</span>
            </a>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="-skew-x-6 border-2 border-white/30 px-8 py-4 text-base font-black uppercase italic tracking-wide transition hover:border-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="block skew-x-6">Acelere agora</span>
              </a>
            )}
          </div>

          {/* card de specs do destaque */}
          {hero && heroCover && (
            <Link
              href={`/${store.slug}/carros/${hero.id}`}
              className="group mt-12 inline-flex max-w-full -skew-x-3 flex-col gap-3 border border-white/15 bg-black/40 p-5 backdrop-blur transition hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex-row sm:items-center sm:gap-6"
            >
              <div className="skew-x-3">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/55">
                  Em destaque
                </span>
                <div
                  className="mt-1 text-xl font-black uppercase italic tracking-tight"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  {vehicleTitle(hero)}
                </div>
                {heroSpecs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {heroSpecs.map((spec) => (
                      <span
                        key={spec}
                        className="border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/80"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="skew-x-3">
                <span
                  className="inline-block -skew-x-6 px-4 py-2 text-lg font-black"
                  style={{
                    background: "var(--sf-accent)",
                    color: "var(--sf-on-accent)",
                  }}
                >
                  <span className="block skew-x-6">
                    {formatPrice(hero.price)}
                  </span>
                </span>
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* busca */}
      <section
        className="border-y border-white/10"
        style={{
          background:
            "linear-gradient(120deg, var(--sf-primary), var(--sf-primary-dark))",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6">
          <h2
            className="text-xl font-black uppercase italic tracking-tight"
            style={{ fontFamily: "var(--sf-font-head)" }}
          >
            Encontre o seu
          </h2>
          <div className="w-full max-w-xl">
            <StoreSearch tone="dark" />
          </div>
        </div>
      </section>

      {/* destaques (pista de bólidos selecionados) */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-14">
          <div className="mb-7 flex items-center gap-4">
            <span
              aria-hidden
              className="h-8 w-2 -skew-x-12"
              style={{ background: "var(--sf-accent)" }}
            />
            <h2
              className="text-2xl font-black uppercase italic tracking-tighter sm:text-3xl"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              Em destaque
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <CarCard
                key={v.id}
                vehicle={v}
                slug={store.slug}
                tone="dark"
                rounded="rounded-none"
              />
            ))}
          </div>
        </section>
      )}

      {/* estoque */}
      <section id="estoque" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <div className="mb-8 flex items-center gap-4">
          <span
            aria-hidden
            className="h-8 w-2 -skew-x-12"
            style={{ background: "var(--sf-primary)" }}
          />
          <h2
            className="text-3xl font-black uppercase italic tracking-tighter"
            style={{ fontFamily: "var(--sf-font-head)" }}
          >
            Todo o estoque{" "}
            <span className="text-base font-bold not-italic text-white/40">
              ({vehicles.length})
            </span>
          </h2>
        </div>

        <VehicleGrid
          vehicles={vehicles}
          slug={store.slug}
          tone="dark"
          rounded="rounded-none"
          columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          empty={
            <div className="border border-dashed border-white/15 bg-white/5 py-20 text-center">
              <p
                className="text-lg font-black uppercase italic tracking-tight"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                Garagem vazia por enquanto.
              </p>
              <p className="mt-2 text-sm text-white/50">
                Novos bólidos chegam em breve — fique de olho.
              </p>
            </div>
          }
        />
      </section>

      <StoreFooter store={store} tone="dark" />
    </div>
  );
}
