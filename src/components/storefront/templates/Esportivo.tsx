import { InlineRichText } from "../InlineRichText";
import Image from "next/image";
import Link from "next/link";
import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { VehicleGrid } from "../blocks/VehicleGrid";
import { HeroMedia } from "../HeroMedia";
import { heroMediaActive, showStoreName } from "../identity";
import { hasAddress } from "../address";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/types";
import { templateTexts } from "@/lib/template-texts";

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

  // config da hero editável ("hero" aqui já é o veículo em destaque)
  const heroCfg = store.settings.hero;
  const withMedia = heroMediaActive(heroCfg);

  // textos editáveis (undefined = default do template; "" = apagado → não renderiza)
  const { heroEyebrow, heroTitle, heroSubtitle, heroCta, featuredTitle, stockTitle } =
    templateTexts("esportivo", store.settings);
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
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        // fundo FIXO do template: header/hero/footer mantêm a identidade
        // esportiva; a cor personalizada (--sf-bg) pinta só o miolo (main)
        background: "#020617",
        color: "#ffffff",
      }}
    >
      {/* header — não responde a --sf-bg/--sf-ink (identidade do template) */}
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
          <Link href={`/${store.slug}`} className="flex min-w-0 items-center gap-3">
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
            <a
              href="#estoque"
              className="hidden rounded text-sm font-bold uppercase tracking-wide opacity-70 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:block"
              style={{ color: "#ffffff" }}
            >
              Estoque
            </a>
            {showAbout && (
              <Link
                href={`/${store.slug}/sobre`}
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

      {/* hero — texto branco explícito: fica sobre marca/foto/mídia, não sobre o fundo do site */}
      <section className="relative isolate overflow-hidden text-white">
        {/* mídia de fundo configurável (vídeo/carrossel) + overlay escuro */}
        {withMedia && (
          <>
            <HeroMedia hero={heroCfg} />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/25"
            />
          </>
        )}
        {/* fundo próprio (foto do destaque/gradiente + raias) só quando NÃO há mídia */}
        {!withMedia && (
          <>
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
          </>
        )}
        {/* faixa accent na base */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1.5"
          style={{ background: "var(--sf-accent)" }}
        />

        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-32">
          {heroEyebrow && (
            <span
              className="inline-flex -skew-x-6 items-center px-3 py-1 text-xs font-black uppercase tracking-[0.2em]"
              style={{
                background: "var(--sf-accent)",
                color: "var(--sf-on-accent)",
              }}
            >
              <span className="block skew-x-6">{heroEyebrow}</span>
            </span>
          )}
          {heroTitle && (
            <h1
              className="mt-6 max-w-3xl break-words text-4xl font-black uppercase italic leading-[0.95] tracking-tighter sm:text-7xl sm:leading-[0.92]"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              <InlineRichText value={heroTitle} />
            </h1>
          )}
          {heroSubtitle && (
            <p className="mt-5 max-w-xl text-base font-medium text-white/75 sm:text-lg">
              <InlineRichText value={heroSubtitle} />
            </p>
          )}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {heroCta && (
              <a
                href="#estoque"
                className="-skew-x-6 px-8 py-4 text-base font-black uppercase italic tracking-wide shadow-xl transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{
                  background: "var(--sf-accent)",
                  color: "var(--sf-on-accent)",
                }}
              >
                <span className="block skew-x-6">{heroCta}</span>
              </a>
            )}
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
              <div className="min-w-0 skew-x-3">
                {featuredTitle && (
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/55">
                    {featuredTitle}
                  </span>
                )}
                <div
                  className="mt-1 break-words text-xl font-black uppercase italic tracking-tight"
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

      {/* busca — faixa pintada na primária: texto branco independente do fundo do site */}
      <section
        className="border-y text-white"
        style={{
          borderColor: "var(--sf-border, rgba(255,255,255,0.1))",
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

      {/* miolo: é AQUI que a cor de fundo personalizada (--sf-bg) atua —
          header/hero/busca/footer mantêm a identidade do template */}
      <main
        style={{
          background: "var(--sf-bg, transparent)",
          color: "var(--sf-ink, #ffffff)",
        }}
      >
      {/* destaques (pista de bólidos selecionados) */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-14">
          {featuredTitle && (
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
                {featuredTitle}
              </h2>
            </div>
          )}
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
        {stockTitle && (
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
              {stockTitle}{" "}
              <span
                className="text-base font-bold not-italic"
                style={{ color: "var(--sf-ink-faint, rgba(255,255,255,0.4))" }}
              >
                ({vehicles.length})
              </span>
            </h2>
          </div>
        )}

        <VehicleGrid
          vehicles={vehicles}
          slug={store.slug}
          tone="dark"
          rounded="rounded-none"
          columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          empty={
            <div
              className="border border-dashed py-20 text-center"
              style={{
                borderColor: "var(--sf-border, rgba(255,255,255,0.15))",
                background: "var(--sf-surface, rgba(255,255,255,0.05))",
              }}
            >
              <p
                className="text-lg font-black uppercase italic tracking-tight"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                Garagem vazia por enquanto.
              </p>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--sf-ink-soft, rgba(255,255,255,0.5))" }}
              >
                Novos bólidos chegam em breve — fique de olho.
              </p>
            </div>
          }
        />
      </section>
      </main>

      <StoreFooter store={store} tone="dark" />
    </div>
  );
}
