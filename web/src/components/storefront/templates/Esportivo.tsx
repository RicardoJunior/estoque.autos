import Image from "next/image";
import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { WhatsAppFloat } from "../WhatsAppFloat";
import { formatPrice, vehicleTitle } from "@/lib/format";

/**
 * Template Esportivo — escuro, energia e velocidade.
 * Fundo slate-950, gradientes da primária ao primary-dark, detalhes em accent,
 * headings italic/uppercase com sensação de movimento e CTAs agressivos.
 * Hero impactante com foto do primeiro destaque quando disponível.
 */
export function Esportivo({ store, vehicles }: TemplateProps) {
  const hero = vehicles.find((v) => v.featured) ?? vehicles[0];
  const heroCover = hero?.photos?.[0];
  const headline =
    store.settings.slogan ?? store.settings.about ?? "POTÊNCIA NA SUA GARAGEM";
  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <StoreLogo store={store} size={44} />
            <div>
              <div className="text-lg font-black uppercase italic leading-none tracking-tight">
                {store.name}
              </div>
              {store.settings.slogan && (
                <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                  {store.settings.slogan}
                </div>
              )}
            </div>
          </div>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden -skew-x-6 px-6 py-2.5 text-sm font-black uppercase italic tracking-wide shadow-lg transition hover:opacity-90 sm:block"
              style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}
            >
              <span className="block skew-x-6">Fale conosco</span>
            </a>
          )}
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        {heroCover ? (
          <Image
            src={heroCover.url}
            alt={vehicleTitle(hero)}
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
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, var(--sf-primary-dark) 0%, color-mix(in srgb, var(--sf-primary) 65%, transparent) 45%, rgba(2,6,23,0.92) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-2"
          style={{ background: "var(--sf-accent)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <span
            className="inline-flex -skew-x-6 items-center px-3 py-1 text-xs font-black uppercase tracking-widest"
            style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}
          >
            <span className="block skew-x-6">
              {vehicles.length} no estoque · pronta entrega
            </span>
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-black uppercase italic leading-[0.95] tracking-tighter sm:text-7xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium text-white/70 sm:text-lg">
            {store.settings.about ??
              "Velocidade, adrenalina e os melhores negócios. Acelere rumo ao carro dos seus sonhos."}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#estoque"
              className="-skew-x-6 px-8 py-4 text-base font-black uppercase italic tracking-wide shadow-xl transition hover:opacity-90"
              style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}
            >
              <span className="block skew-x-6">Ver estoque</span>
            </a>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="-skew-x-6 border-2 border-white/30 px-8 py-4 text-base font-black uppercase italic tracking-wide transition hover:border-white/70"
              >
                <span className="block skew-x-6">Acelere agora</span>
              </a>
            )}
          </div>
          {hero && heroCover && (
            <div className="mt-10 inline-flex items-center gap-3 text-sm">
              <span className="font-bold uppercase tracking-widest text-white/60">
                Destaque
              </span>
              <span className="font-bold">{vehicleTitle(hero)}</span>
              <span
                className="-skew-x-6 px-3 py-1 font-black"
                style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}
              >
                <span className="block skew-x-6">{formatPrice(hero.price)}</span>
              </span>
            </div>
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
          <h2 className="text-xl font-black uppercase italic tracking-tight">
            Encontre o seu
          </h2>
          <div className="w-full max-w-xl">
            <StoreSearch tone="dark" />
          </div>
        </div>
      </section>

      {/* estoque */}
      <section id="estoque" className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-8 flex items-center gap-4">
          <span
            className="h-8 w-2 -skew-x-12"
            style={{ background: "var(--sf-accent)" }}
          />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">
            Todo o estoque{" "}
            <span className="text-base font-bold not-italic text-white/40">
              ({vehicles.length})
            </span>
          </h2>
        </div>

        {vehicles.length === 0 ? (
          <div className="border border-dashed border-white/15 bg-white/5 py-20 text-center">
            <p className="text-lg font-black uppercase italic tracking-tight">
              Garagem vazia por enquanto.
            </p>
            <p className="mt-2 text-sm text-white/50">
              Novos bólidos chegam em breve — fique de olho.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <CarCard key={v.id} vehicle={v} slug={store.slug} tone="dark" />
            ))}
          </div>
        )}
      </section>

      <StoreFooter store={store} tone="dark" />
      <WhatsAppFloat whatsapp={store.whatsapp} storeName={store.name} />
    </div>
  );
}
