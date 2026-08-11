import Link from "next/link";
import type { TemplateProps } from "../types";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { Hero } from "../blocks/Hero";
import { SectionHeader } from "../blocks/SectionHeader";
import { VehicleGrid } from "../blocks/VehicleGrid";
import { HeroMedia } from "../HeroMedia";
import { heroMediaActive, showStoreName } from "../identity";
import { formatAddressShort, hasAddress } from "../address";

/**
 * Template Clássico — concessionária estabelecida, sóbria e confiável.
 * Barra de utilidades fina, cabeçalho com nav tipográfica clássica
 * (var(--sf-font-head)), hero claro com traço de destaque, selos de
 * confiança, faixa de destaques, grid de 3 colunas e rodapé completo.
 * Tom claro.
 */
export function Classico({ store, vehicles }: TemplateProps) {
  const featured = vehicles.filter((v) => v.featured).slice(0, 3);
  const { settings, slug } = store;

  const hero = settings.hero;
  const withMedia = heroMediaActive(hero);
  const heroTitle =
    hero?.title ?? (settings.about ? store.name : "O carro certo, com confiança");
  const heroSubtitle =
    hero?.subtitle ??
    settings.about ??
    "Veículos selecionados e revisados, com atendimento próximo do início ao fim da sua compra.";

  const aboutHref = `/${slug}/sobre`;
  const showAbout = !!settings.about || hasAddress(store.address);
  const aboutLabel = settings.about ? "Sobre" : "Localização";
  const addressShort = formatAddressShort(store.address);

  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  const navLinks: { label: string; href: string }[] = [
    { label: "Estoque", href: "#estoque" },
    ...(featured.length > 0
      ? [{ label: "Destaques", href: "#destaques" }]
      : []),
    ...(showAbout ? [{ label: aboutLabel, href: aboutHref }] : []),
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
      {/* barra de utilidades */}
      <div
        className="hidden text-xs sm:block"
        style={{
          background: "var(--sf-primary-dark)",
          color: "var(--sf-on-primary)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2">
          <span className="opacity-90">
            {settings.business_hours
              ? settings.business_hours.split("\n")[0]
              : "Seu próximo carro está aqui"}
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

      {/* cabeçalho */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{
          borderColor: "var(--sf-border, #e2e8f0)",
          background: "color-mix(in srgb, var(--sf-bg, #ffffff) 88%, transparent)",
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

      {/* hero claro com traço clássico — com mídia configurada vira hero
          escuro sobre foto/vídeo (overlay garante leitura) */}
      <section className="relative isolate overflow-hidden">
        {withMedia && (
          <>
            <HeroMedia hero={hero} />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/25"
            />
          </>
        )}
        <Hero
          eyebrow={settings.slogan ?? "Concessionária"}
          title={heroTitle}
          subtitle={heroSubtitle}
          cta={{ label: "Ver estoque", href: "#estoque" }}
          accentRule
          align="left"
          tone={withMedia ? "dark" : "light"}
        />
      </section>

      {/* selos de confiança */}
      <section
        className="border-y"
        style={{
          borderColor: "var(--sf-border, #e2e8f0)",
          background: "var(--sf-surface, #f8fafc)",
        }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Trust
            value={`${vehicles.length}`}
            label={vehicles.length === 1 ? "veículo no estoque" : "veículos no estoque"}
          />
          <Trust value="Revisados" label="Procedência verificada" />
          <Trust value="Atendimento" label="Próximo e sem pressa" />
        </div>
      </section>

      {/* destaques */}
      {featured.length > 0 && (
        <section id="destaques" className="mx-auto max-w-6xl px-5 pt-14">
          <SectionHeader
            title="Destaques da loja"
            subtitle="Selecionados a dedo pela nossa equipe."
            accentRule
            tone="light"
          />
          <VehicleGrid
            vehicles={featured}
            slug={slug}
            tone="light"
            rounded="rounded-lg"
          />
        </section>
      )}

      {/* estoque completo */}
      <section id="estoque" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <SectionHeader
          title="Todo o estoque"
          subtitle={`${vehicles.length} ${
            vehicles.length === 1 ? "veículo disponível" : "veículos disponíveis"
          }`}
          accentRule
          tone="light"
          action={<StoreSearch />}
        />
        <VehicleGrid
          vehicles={vehicles}
          slug={slug}
          tone="light"
          rounded="rounded-lg"
          emptyText="Nenhum veículo encontrado para esta busca."
        />
      </section>

      {/* convite à página sobre/localização */}
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
    </div>
  );
}

/** Selo de confiança da faixa abaixo do hero. */
function Trust({ value, label }: { value: string; label: string }) {
  return (
    // borderColor cobre os divisores criados pelos divide-* do grid pai
    <div
      className="flex flex-col items-center gap-0.5 px-5 py-6 text-center"
      style={{ borderColor: "var(--sf-border, #e2e8f0)" }}
    >
      <span
        className="text-xl font-bold"
        style={{ fontFamily: "var(--sf-font-head)", color: "var(--sf-primary)" }}
      >
        {value}
      </span>
      <span className="text-sm" style={{ color: "var(--sf-ink-soft, #64748b)" }}>
        {label}
      </span>
    </div>
  );
}
