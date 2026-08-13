import { InlineRichText } from "../InlineRichText";
import Link from "next/link";
import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { SectionHeader } from "../blocks/SectionHeader";
import { VehicleGrid } from "../blocks/VehicleGrid";
import { HeroMedia } from "../HeroMedia";
import { heroMediaActive, showStoreName } from "../identity";
import { hasAddress } from "../address";
import { templateTexts } from "@/lib/template-texts";

/**
 * Template Moderno — vibe startup automotiva: claro e arrojado.
 * Hero full-bleed com busca proeminente em "cartão flutuante", blocos
 * sólidos na cor primária, cantos arredondados grandes (3xl) e
 * micro-interações no hover. Tom light. Cores/fonte 100% var(--sf-*).
 */
export function Moderno({ store, vehicles }: TemplateProps) {
  const featured = vehicles.filter((v) => v.featured).slice(0, 3);
  const hero = store.settings.hero;
  const withMedia = heroMediaActive(hero);
  // textos editáveis em Meu site → Conteúdo ("" = elemento não renderiza)
  const {
    heroEyebrow,
    heroTitle,
    heroSubtitle,
    heroCta,
    featuredTitle,
    featuredSubtitle,
    stockTitle,
  } = templateTexts("moderno", store.settings);

  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  // Nav "Sobre" só quando há conteúdo para a página /{slug}/sobre.
  const hasAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = hasAddress(store.address) ? "Localização" : "Sobre";

  const stats = [
    { value: vehicles.length, label: "no estoque" },
    { value: featured.length, label: "em destaque" },
  ];

  return (
    <div
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        background: "var(--sf-bg, #ffffff)",
        color: "var(--sf-ink, #0f172a)",
      }}
    >
      {/* ── header ───────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--sf-border, rgba(226,232,240,0.7))",
          background: "color-mix(in srgb, var(--sf-bg, #ffffff) 88%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Link href={`/${store.slug}`} className="flex min-w-0 items-center gap-3">
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
              href={`/${store.slug}`}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 sm:block"
              style={{ color: "var(--sf-ink-soft, #64748b)" }}
            >
              Estoque
            </Link>
            {hasAbout && (
              <Link
                href={`/${store.slug}/sobre`}
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

      {/* ── hero full-bleed ──────────────────────────────────── */}
      {/* SEM overflow-hidden na section: o cartão de busca pende -mb-12 além
          da borda e era cortado; o clip fica só no layer das decorações. */}
      <section
        className="relative isolate"
        style={{
          background: withMedia
            ? "#0b1120"
            : "linear-gradient(150deg, var(--sf-primary) 0%, var(--sf-primary-dark) 100%)",
          color: withMedia ? "#ffffff" : "var(--sf-on-primary)",
        }}
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
        {/* decoração própria só quando NÃO há mídia — os blobs estouram a
            seção, então o clip vive neste layer (inset-0), não na section */}
        {!withMedia && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
              style={{ background: "var(--sf-accent)" }}
            />
            <div
              className="absolute -bottom-48 -left-24 h-[26rem] w-[26rem] rounded-full opacity-20 blur-3xl"
              style={{ background: "var(--sf-on-primary)" }}
            />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-5 pb-28 pt-16 sm:pb-32 sm:pt-24">
          {heroEyebrow && (
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur"
              style={{
                background:
                  "color-mix(in srgb, var(--sf-on-primary) 16%, transparent)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--sf-accent)" }}
              />
              {heroEyebrow}
            </span>
          )}

          {heroTitle && (
            <h1
              className="mt-6 max-w-3xl break-words text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              <InlineRichText value={heroTitle} />
            </h1>
          )}
          {heroSubtitle && (
            <p className="mt-5 max-w-xl text-base/relaxed opacity-80 sm:text-lg/relaxed">
              <InlineRichText value={heroSubtitle} />
            </p>
          )}

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {heroCta && (
              <a
                href="#estoque"
                className="rounded-full px-6 py-3 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: "var(--sf-accent)",
                  color: "var(--sf-on-accent)",
                }}
              >
                {heroCta}
              </a>
            )}
            {hasAbout && (
              <Link
                href={`/${store.slug}/sobre`}
                className="rounded-full border px-6 py-3 text-sm font-bold backdrop-blur transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--sf-on-primary) 35%, transparent)",
                  background:
                    "color-mix(in srgb, var(--sf-on-primary) 8%, transparent)",
                }}
              >
                {aboutLabel}
              </Link>
            )}
          </div>
        </div>

        {/* busca proeminente — cartão flutuante sobre a borda do hero */}
        <div className="relative mx-auto -mb-12 max-w-6xl px-5">
          <div
            className="rounded-3xl border p-5 shadow-2xl sm:p-6"
            style={{
              background: "var(--sf-bg, #ffffff)",
              borderColor: "var(--sf-border, #e2e8f0)",
              color: "var(--sf-ink, #0f172a)",
            }}
          >
            <label
              className="mb-3 block text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
            >
              Encontre seu carro
            </label>
            <StoreSearch tone="light" />
          </div>
        </div>
      </section>

      {/* faixa de stats sólida abaixo do cartão de busca */}
      <section className="pt-20 sm:pt-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-3xl border px-4 py-5 text-center transition hover:-translate-y-0.5 hover:shadow-md sm:px-6 sm:py-6"
                style={{
                  borderColor: "var(--sf-border, #f1f5f9)",
                  background: "var(--sf-surface, #f8fafc)",
                }}
              >
                <div
                  className="text-2xl font-extrabold tracking-tight sm:text-4xl"
                  style={{ color: "var(--sf-primary)" }}
                >
                  {s.value}
                </div>
                <div
                  className="mt-1 text-[11px] font-medium uppercase tracking-wide sm:text-xs"
                  style={{ color: "var(--sf-ink-soft, #64748b)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── destaques ────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-16">
          <SectionHeader title={featuredTitle} subtitle={featuredSubtitle} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <CarCard
                key={v.id}
                vehicle={v}
                slug={store.slug}
                rounded="rounded-3xl"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── todo o estoque ───────────────────────────────────── */}
      <section id="estoque" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <SectionHeader
          title={stockTitle}
          subtitle={`${vehicles.length} ${vehicles.length === 1 ? "veículo" : "veículos"} à sua espera`}
        />
        <VehicleGrid
          vehicles={vehicles}
          slug={store.slug}
          rounded="rounded-3xl"
          empty={
            <div
              className="rounded-3xl border border-dashed py-20 text-center"
              style={{
                borderColor: "var(--sf-border, #e2e8f0)",
                background: "var(--sf-surface, #f8fafc)",
              }}
            >
              <p className="font-bold" style={{ color: "var(--sf-ink, #334155)" }}>
                Nenhum veículo por aqui ainda.
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
              >
                Volte em breve — novos carros chegam toda semana.
              </p>
            </div>
          }
        />
      </section>

      {/* ── CTA final sólido na primária ─────────────────────── */}
      {waHref && (
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div
            className="relative overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:px-12 sm:py-16"
            style={{
              background:
                "linear-gradient(135deg, var(--sf-primary) 0%, var(--sf-primary-dark) 100%)",
              color: "var(--sf-on-primary)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
              style={{ background: "var(--sf-accent)" }}
            />
            <h2
              className="relative text-2xl font-extrabold tracking-tight sm:text-3xl"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              Não achou o que procura?
            </h2>
            <p className="relative mx-auto mt-2 max-w-md opacity-80">
              Fale com a gente — ajudamos você a encontrar o carro ideal.
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-6 inline-flex rounded-full px-7 py-3 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: "var(--sf-accent)",
                color: "var(--sf-on-accent)",
              }}
            >
              Falar no WhatsApp
            </a>
          </div>
        </section>
      )}

      <StoreFooter store={store} />
    </div>
  );
}
