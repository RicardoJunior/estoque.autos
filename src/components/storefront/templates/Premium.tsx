import { InlineRichText } from "../InlineRichText";
import Image from "next/image";
import Link from "next/link";
import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { HeroMedia } from "../HeroMedia";
import { heroMediaActive, showStoreName } from "../identity";
import { hasAddress } from "../address";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/types";
import { templateTexts } from "@/lib/template-texts";

/**
 * Template Premium — boutique de seminovos de luxo.
 * Dark profundo, tipografia display com tracking largo, muito espaço
 * negativo e hero cinematográfico com a foto do destaque sob um gradiente.
 * Acentos vêm do tema da loja (var(--sf-accent)); tom dark.
 */
export function Premium({ store, vehicles }: TemplateProps) {
  const featured = vehicles.find((v) => v.featured) ?? vehicles[0];
  const featuredCover = featured?.photos?.[0];
  const rest = featured ? vehicles.filter((v) => v.id !== featured.id) : vehicles;
  const curated = (featured ? rest : vehicles).slice(0, 3);

  // hero configurável (textos + mídia); com mídia, ela vence a foto do destaque
  const hero = store.settings.hero;
  const withMedia = heroMediaActive(hero);
  // textos editáveis ("" = oculta); título/subtítulo caem em dados da
  // loja (nome/slogan) — nunca em texto genérico
  const texts = templateTexts("premium", store.settings);
  const heroEyebrow = texts.heroEyebrow;
  const heroCta = texts.heroCta;
  const heroTitle = texts.heroTitle ?? store.name;
  const heroSubtitle = texts.heroSubtitle ?? (store.settings.slogan || null);

  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;
  const aboutHref = `/${store.slug}/sobre`;
  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = store.settings.about ? "Sobre" : "Localização";

  // specs do veículo em destaque (chips elegantes no hero)
  const featuredSpecs: string[] = featured
    ? [
        featured.year_model ? String(featured.year_model) : null,
        featured.mileage != null ? formatKm(featured.mileage) : null,
        featured.transmission ? TRANSMISSION_LABELS[featured.transmission] : null,
        featured.fuel ? FUEL_LABELS[featured.fuel] : null,
      ].filter((s): s is string => s != null)
    : [];

  return (
    <div
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        background: "var(--sf-bg, #0a0e1a)",
        color: "var(--sf-ink, #e2e8f0)",
      }}
    >
      {/* header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          borderColor: "var(--sf-border, rgba(255,255,255,0.06))",
          background: "color-mix(in srgb, var(--sf-bg, #0a0e1a) 85%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <Link href={`/${store.slug}`} className="flex min-w-0 items-center gap-3.5">
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
            <a
              href="#colecao"
              className="hidden transition hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none sm:inline"
              style={{ color: "var(--sf-ink, #cbd5e1)" }}
            >
              Coleção
            </a>
            {showAbout && (
              <Link
                href={aboutHref}
                className="hidden transition hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none sm:inline"
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

      {/* hero cinematográfico */}
      {featured ? (
        <section className="relative">
          <div className="relative isolate aspect-[4/5] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
            {withMedia ? (
              <>
                {/* mídia configurada pela loja vence a foto do destaque */}
                <HeroMedia hero={hero} />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/25"
                />
              </>
            ) : (
              <>
                {featuredCover ? (
                  <Image
                    src={featuredCover.url}
                    alt={vehicleTitle(featured)}
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
                        "radial-gradient(120% 120% at 70% 10%, var(--sf-primary-soft), transparent 55%)",
                    }}
                  />
                )}
                {/* gradiente cinematográfico — escurece base e laterais */}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, var(--sf-bg, #0a0e1a) 4%, color-mix(in srgb, var(--sf-bg, #0a0e1a) 72%, transparent) 38%, color-mix(in srgb, var(--sf-bg, #0a0e1a) 15%, transparent) 72%, color-mix(in srgb, var(--sf-bg, #0a0e1a) 35%, transparent) 100%)",
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to right, color-mix(in srgb, var(--sf-bg, #0a0e1a) 55%, transparent), transparent 45%)",
                  }}
                />
              </>
            )}

            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16 lg:pb-20">
                {heroEyebrow && (
                  <span
                    className="text-[11px] font-light uppercase tracking-[0.4em]"
                    style={{ color: "var(--sf-accent)" }}
                  >
                    {heroEyebrow}
                  </span>
                )}
                <h1
                  className="mt-4 max-w-3xl text-4xl font-light leading-[1.05] tracking-[0.01em] break-words sm:text-6xl"
                  style={{
                    fontFamily: "var(--sf-font-head)",
                    color: withMedia ? "#ffffff" : "var(--sf-ink, #ffffff)",
                  }}
                >
                  {texts.heroTitle ?? vehicleTitle(featured)}
                </h1>
                <div
                  aria-hidden
                  className="mt-6 h-px w-24"
                  style={{ background: "var(--sf-accent)" }}
                />

                {hero?.subtitle && (
                  <p
                    className="mt-6 max-w-2xl text-sm font-light leading-relaxed tracking-wide"
                    style={{
                      color: withMedia
                        ? "rgba(255,255,255,0.85)"
                        : "var(--sf-ink-soft, #cbd5e1)",
                    }}
                  >
                    {hero.subtitle}
                  </p>
                )}

                {featuredSpecs.length > 0 && (
                  <ul
                    className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-light uppercase tracking-[0.2em]"
                    style={{
                      color: withMedia
                        ? "rgba(255,255,255,0.85)"
                        : "var(--sf-ink, #cbd5e1)",
                    }}
                  >
                    {featuredSpecs.map((spec, i) => (
                      <li key={i} className="flex items-center gap-4">
                        {i > 0 && (
                          <span aria-hidden className="text-white/20">
                            /
                          </span>
                        )}
                        {spec}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-6">
                  <span
                    className="text-2xl font-light tracking-wide sm:text-3xl"
                    style={{
                      color: withMedia ? "#ffffff" : "var(--sf-ink, #ffffff)",
                    }}
                  >
                    {formatPrice(featured.price)}
                  </span>
                  {heroCta && (
                    <Link
                      href={`/${store.slug}/carros/${featured.id}`}
                      className="rounded-full px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      style={{
                        background: "var(--sf-accent)",
                        color: "var(--sf-on-accent)",
                      }}
                    >
                      {heroCta}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section
          className="relative isolate overflow-hidden border-b"
          style={{ borderColor: "var(--sf-border, rgba(255,255,255,0.06))" }}
        >
          {/* mídia de fundo configurável (vídeo/carrossel) + overlay */}
          {withMedia && (
            <>
              <HeroMedia hero={hero} />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/25"
              />
            </>
          )}
          {/* decoração própria só quando NÃO há mídia */}
          {!withMedia && (
            <div
              aria-hidden
              className="absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(60% 80% at 30% 0%, var(--sf-primary-soft), transparent 60%)",
              }}
            />
          )}
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-36">
            {heroEyebrow && (
              <span
                className="text-[11px] font-light uppercase tracking-[0.4em]"
                style={{ color: "var(--sf-accent)" }}
              >
                {heroEyebrow}
              </span>
            )}
            <h1
              className="mt-5 text-4xl font-light tracking-[0.01em] break-words sm:text-6xl"
              style={{
                fontFamily: "var(--sf-font-head)",
                color: withMedia ? "#ffffff" : "var(--sf-ink, #ffffff)",
              }}
            >
              <InlineRichText value={heroTitle} />
            </h1>
            <div
              aria-hidden
              className="mx-auto mt-6 h-px w-24"
              style={{ background: "var(--sf-accent)" }}
            />
            {heroSubtitle && (
              <p
                className="mx-auto mt-7 max-w-xl text-base font-light leading-relaxed tracking-wide"
                style={{
                  color: withMedia
                    ? "rgba(255,255,255,0.85)"
                    : "var(--sf-ink-soft, #94a3b8)",
                }}
              >
                <InlineRichText value={heroSubtitle} />
              </p>
            )}
          </div>
        </section>
      )}

      {/* seleção curada (quando houver veículos além do destaque) */}
      {curated.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6 sm:pt-28">
          <div className="flex items-end justify-between gap-4">
            <div>
              {texts.featuredSubtitle && (
                <span
                  className="text-[11px] font-light uppercase tracking-[0.4em]"
                  style={{ color: "var(--sf-accent)" }}
                >
                  {texts.featuredSubtitle}
                </span>
              )}
              {texts.featuredTitle && (
                <h2
                  className="mt-3 text-2xl font-light uppercase tracking-[0.2em] sm:text-3xl"
                  style={{
                    fontFamily: "var(--sf-font-head)",
                    color: "var(--sf-ink, #ffffff)",
                  }}
                >
                  {texts.featuredTitle}
                </h2>
              )}
            </div>
          </div>
          <div
            aria-hidden
            className="mt-6 h-px w-full"
            style={{
              background:
                "linear-gradient(to right, var(--sf-accent), transparent 70%)",
            }}
          />
          <div className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {curated.map((v) => (
              <CarCard
                key={v.id}
                vehicle={v}
                slug={store.slug}
                tone="dark"
                rounded="rounded-2xl"
              />
            ))}
          </div>
        </section>
      )}

      {/* coleção completa */}
      <section id="colecao" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-10 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span
              className="text-[11px] font-light uppercase tracking-[0.4em]"
              style={{ color: "var(--sf-accent)" }}
            >
              O acervo
            </span>
            {texts.stockTitle && (
              <h2
                className="mt-3 text-2xl font-light uppercase tracking-[0.2em] sm:text-3xl"
                style={{
                  fontFamily: "var(--sf-font-head)",
                  color: "var(--sf-ink, #ffffff)",
                }}
              >
                {texts.stockTitle}
              </h2>
            )}
            <p
              className="mt-3 text-xs font-light uppercase tracking-[0.25em]"
              style={{ color: "var(--sf-ink-faint, #64748b)" }}
            >
              {vehicles.length} veículo{vehicles.length === 1 ? "" : "s"}{" "}
              disponíve{vehicles.length === 1 ? "l" : "is"}
            </p>
          </div>
          <div className="w-full sm:max-w-md">
            <StoreSearch tone="dark" />
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div
            className="border border-dashed py-24 text-center"
            style={{ borderColor: "var(--sf-border, rgba(255,255,255,0.1))" }}
          >
            <p
              className="text-sm font-light uppercase tracking-[0.3em]"
              style={{ color: "var(--sf-ink-soft, #94a3b8)" }}
            >
              Acervo em curadoria
            </p>
            <p
              className="mt-3 text-xs font-light tracking-wide"
              style={{ color: "var(--sf-ink-faint, #475569)" }}
            >
              Novas peças chegam em breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <CarCard
                key={v.id}
                vehicle={v}
                slug={store.slug}
                tone="dark"
                rounded="rounded-2xl"
              />
            ))}
          </div>
        )}
      </section>

      <StoreFooter store={store} tone="dark" />
    </div>
  );
}
