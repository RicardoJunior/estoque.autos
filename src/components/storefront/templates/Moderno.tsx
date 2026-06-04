import Link from "next/link";
import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { SectionHeader } from "../blocks/SectionHeader";
import { VehicleGrid } from "../blocks/VehicleGrid";
import { hasAddress } from "../address";

/**
 * Template Moderno — vibe startup automotiva: claro e arrojado.
 * Hero full-bleed com busca proeminente em "cartão flutuante", blocos
 * sólidos na cor primária, cantos arredondados grandes (3xl) e
 * micro-interações no hover. Tom light. Cores/fonte 100% var(--sf-*).
 */
export function Moderno({ store, vehicles }: TemplateProps) {
  const featured = vehicles.filter((v) => v.featured).slice(0, 3);
  const headline = store.settings.slogan ?? "Seu próximo carro está aqui";
  const subtitle =
    store.settings.about ??
    "Estoque selecionado, condições especiais e atendimento direto. Encontre o veículo certo para você.";

  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  // Nav "Sobre" só quando há conteúdo para a página /{slug}/sobre.
  const hasAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = hasAddress(store.address) ? "Localização" : "Sobre";

  const stats = [
    { value: vehicles.length, label: "no estoque" },
    { value: featured.length, label: "em destaque" },
    { value: "100%", label: "atendimento direto" },
  ];

  return (
    <div
      className="min-h-dvh bg-white text-slate-900"
      style={{ fontFamily: "var(--sf-font)" }}
    >
      {/* ── header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Link href={`/${store.slug}`} className="flex items-center gap-3">
            <StoreLogo store={store} size={44} className="rounded-2xl" />
            <div>
              <div
                className="font-extrabold leading-tight tracking-tight"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                {store.name}
              </div>
              {store.settings.slogan && (
                <div className="text-xs text-slate-500">
                  {store.settings.slogan}
                </div>
              )}
            </div>
          </Link>

          <nav className="flex items-center gap-1.5">
            <Link
              href={`/${store.slug}`}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:block"
            >
              Estoque
            </Link>
            {hasAbout && (
              <Link
                href={`/${store.slug}/sobre`}
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:block"
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
      <section
        className="relative isolate overflow-hidden"
        style={{
          background:
            "linear-gradient(150deg, var(--sf-primary) 0%, var(--sf-primary-dark) 100%)",
          color: "var(--sf-on-primary)",
        }}
      >
        {/* blobs decorativos da cor accent / primary */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--sf-accent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-24 h-[26rem] w-[26rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--sf-on-primary)" }}
        />
        {/* grade sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 pb-28 pt-16 sm:pb-32 sm:pt-24">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur"
            style={{
              background: "color-mix(in srgb, var(--sf-on-primary) 16%, transparent)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--sf-accent)" }}
            />
            {vehicles.length} veículos disponíveis agora
          </span>

          <h1
            className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
            style={{ fontFamily: "var(--sf-font-head)" }}
          >
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-base/relaxed opacity-80 sm:text-lg/relaxed">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#estoque"
              className="rounded-full px-6 py-3 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: "var(--sf-accent)",
                color: "var(--sf-on-accent)",
              }}
            >
              Explorar estoque
            </a>
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
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
            <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-400">
              Encontre seu carro
            </label>
            <StoreSearch tone="light" />
          </div>
        </div>
      </section>

      {/* faixa de stats sólida abaixo do cartão de busca */}
      <section className="bg-white pt-20 sm:pt-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-5 text-center transition hover:-translate-y-0.5 hover:shadow-md sm:px-6 sm:py-6"
              >
                <div
                  className="text-2xl font-extrabold tracking-tight sm:text-4xl"
                  style={{ color: "var(--sf-primary)" }}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
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
          <SectionHeader
            title="Destaques da semana"
            subtitle="Seleção especial do nosso time"
          />
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
          title="Todo o estoque"
          subtitle={`${vehicles.length} ${vehicles.length === 1 ? "veículo" : "veículos"} à sua espera`}
        />
        <VehicleGrid
          vehicles={vehicles}
          slug={store.slug}
          rounded="rounded-3xl"
          empty={
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
              <p className="font-bold text-slate-700">
                Nenhum veículo por aqui ainda.
              </p>
              <p className="mt-1 text-sm text-slate-400">
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
