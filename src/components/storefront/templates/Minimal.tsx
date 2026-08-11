import Image from "next/image";
import Link from "next/link";
import type { TemplateProps } from "../types";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { VehicleGrid } from "../blocks/VehicleGrid";
import { HeroMedia } from "../HeroMedia";
import { heroMediaActive, showStoreName } from "../identity";
import { hasAddress, formatAddressShort } from "../address";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";

/**
 * Template Minimal — editorial/galeria.
 * Branco dominante, tipografia GRANDE como elemento gráfico, linhas finas e
 * cor só em acentos cirúrgicos (preço, underline, índice). A marca controla
 * cor/fonte via var(--sf-*); o shell neutro usa var(--sf-bg/ink/border, …)
 * com fallback no visual original (branco/slate).
 */
export function Minimal({ store, vehicles }: TemplateProps) {
  const hero = store.settings.hero;
  const withMedia = heroMediaActive(hero);
  const headline = hero?.title ?? store.settings.slogan ?? store.name;
  const subtitle =
    hero?.subtitle ??
    store.settings.about ??
    "Uma seleção cuidadosa de veículos.";

  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = hasAddress(store.address) ? "Localização" : "Sobre";

  // destaque editorial: primeiro "featured", senão o primeiro do estoque
  const feature = vehicles.filter((v) => v.featured)[0] ?? vehicles[0];
  const featureCover = feature?.photos?.[0];
  const rest = feature ? vehicles.filter((v) => v.id !== feature.id) : vehicles;

  return (
    <div
      className="min-h-dvh"
      style={{
        fontFamily: "var(--sf-font)",
        background: "var(--sf-bg, #ffffff)",
        color: "var(--sf-ink, #0f172a)",
      }}
    >
      {/* masthead editorial */}
      <header
        className="border-b"
        style={{ borderColor: "var(--sf-border, #e2e8f0)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
          <Link
            href={`/${store.slug}`}
            className="flex items-center gap-3 rounded outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ["--tw-ring-color" as string]: "var(--sf-primary)" }}
          >
            <StoreLogo store={store} size={32} />
            {showStoreName(store) && (
              <span
                className="text-sm font-medium tracking-tight"
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
            <a
              href="#estoque"
              className="hidden font-light tracking-wide underline-offset-[6px] transition hover:underline hover:opacity-70 sm:inline"
              style={{ color: "var(--sf-ink-soft, #64748b)" }}
            >
              Estoque
            </a>
            {showAbout && (
              <Link
                href={`/${store.slug}/sobre`}
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

      {/* hero tipográfico — o título É o elemento gráfico; com mídia,
          vira hero alto com foto/vídeo ao fundo e tipografia branca */}
      <section
        className="relative isolate overflow-hidden"
        style={withMedia ? { background: "#0b1120" } : undefined}
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

        <div
          className={`relative mx-auto max-w-6xl px-6 ${
            withMedia
              ? "pt-32 pb-24 sm:pt-48 sm:pb-32"
              : "pt-20 pb-14 sm:pt-32 sm:pb-20"
          }`}
        >
          <span
            className="block text-xs font-light uppercase tracking-[0.4em]"
            style={{
              color: withMedia
                ? "rgba(255,255,255,0.7)"
                : "var(--sf-ink-faint, #94a3b8)",
            }}
          >
            Estoque · {new Date().getFullYear()}
          </span>
          <h1
            className="mt-7 max-w-5xl text-[2.75rem] font-light leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.5rem]"
            style={{
              fontFamily: "var(--sf-font-head)",
              color: withMedia ? "#ffffff" : "var(--sf-ink, #0f172a)",
            }}
          >
            {headline}
          </h1>
          <span
            aria-hidden
            className="mt-9 block h-px w-24"
            style={{ background: "var(--sf-accent)" }}
          />
          <p
            className="mt-9 max-w-xl text-lg font-light leading-relaxed"
            style={{
              color: withMedia
                ? "rgba(255,255,255,0.85)"
                : "var(--sf-ink-soft, #64748b)",
            }}
          >
            {subtitle}
          </p>
        </div>
      </section>

      {/* destaque editorial — uma peça grande, índice + foto + meta */}
      {feature && (
        <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24">
          <Link
            href={`/${store.slug}/carros/${feature.id}`}
            className="group grid items-stretch gap-8 border-t pt-10 outline-none focus-visible:ring-2 focus-visible:ring-offset-4 sm:gap-12 lg:grid-cols-2"
            style={{
              ["--tw-ring-color" as string]: "var(--sf-primary)",
              borderColor: "var(--sf-border, #e2e8f0)",
            }}
          >
            <div className="relative aspect-[5/4] overflow-hidden bg-slate-100">
              {featureCover ? (
                <Image
                  src={featureCover.url}
                  alt={vehicleTitle(feature)}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-light text-slate-300">
                  sem foto
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-4">
                <span
                  className="text-sm font-light tabular-nums"
                  style={{ color: "var(--sf-accent)" }}
                >
                  01
                </span>
                <span
                  className="text-xs font-light uppercase tracking-[0.3em]"
                  style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                >
                  Em destaque
                </span>
              </div>
              <h2
                className="mt-5 text-3xl font-light leading-[1.05] tracking-tight sm:text-5xl"
                style={{
                  fontFamily: "var(--sf-font-head)",
                  color: "var(--sf-ink, #0f172a)",
                }}
              >
                {vehicleTitle(feature)}
              </h2>

              <dl
                className="mt-8 flex flex-wrap gap-x-10 gap-y-3 border-t pt-6 text-sm font-light"
                style={{
                  borderColor: "var(--sf-border, #f1f5f9)",
                  color: "var(--sf-ink-soft, #64748b)",
                }}
              >
                {feature.year_model && (
                  <div>
                    <dt
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "var(--sf-ink-faint, #cbd5e1)" }}
                    >
                      Ano
                    </dt>
                    <dd
                      className="mt-1"
                      style={{ color: "var(--sf-ink, #334155)" }}
                    >
                      {feature.year_model}
                    </dd>
                  </div>
                )}
                {feature.mileage != null && (
                  <div>
                    <dt
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "var(--sf-ink-faint, #cbd5e1)" }}
                    >
                      Km
                    </dt>
                    <dd
                      className="mt-1"
                      style={{ color: "var(--sf-ink, #334155)" }}
                    >
                      {formatKm(feature.mileage)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt
                    className="text-xs uppercase tracking-widest"
                    style={{ color: "var(--sf-ink-faint, #cbd5e1)" }}
                  >
                    Valor
                  </dt>
                  <dd
                    className="mt-1 text-lg font-normal"
                    style={{ color: "var(--sf-primary)" }}
                  >
                    {formatPrice(feature.price)}
                  </dd>
                </div>
              </dl>

              <span
                className="mt-8 inline-flex items-center gap-2 text-sm font-light tracking-wide"
                style={{ color: "var(--sf-ink, #0f172a)" }}
              >
                Ver detalhes
                <span
                  aria-hidden
                  className="block h-px w-8 transition-all duration-300 group-hover:w-14"
                  style={{ background: "var(--sf-accent)" }}
                />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* estoque — grade arejada */}
      <section id="estoque" className="mx-auto max-w-6xl px-6 pb-28">
        <div
          className="mb-12 flex flex-wrap items-end justify-between gap-6 border-t pt-12"
          style={{ borderColor: "var(--sf-border, #e2e8f0)" }}
        >
          <div>
            <h2
              className="text-2xl font-light tracking-tight sm:text-3xl"
              style={{
                fontFamily: "var(--sf-font-head)",
                color: "var(--sf-ink, #0f172a)",
              }}
            >
              Estoque
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span
                aria-hidden
                className="block h-px w-10"
                style={{ background: "var(--sf-accent)" }}
              />
              <span
                className="text-sm font-light tabular-nums"
                style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
              >
                {vehicles.length} veículo{vehicles.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <StoreSearch tone="light" />
        </div>

        <VehicleGrid
          vehicles={rest}
          slug={store.slug}
          tone="light"
          rounded="rounded-none"
          columns="grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          empty={
            <div
              className="border-t py-24 text-center"
              style={{ borderColor: "var(--sf-border, #f1f5f9)" }}
            >
              <p
                className="text-lg font-light"
                style={{ color: "var(--sf-ink-faint, #cbd5e1)" }}
              >
                {vehicles.length === 0
                  ? "Nenhum veículo disponível no momento."
                  : "Nenhum outro veículo no estoque."}
              </p>
              {(store.settings.about || formatAddressShort(store.address)) &&
                vehicles.length === 0 && (
                  <p
                    className="mt-2 text-sm font-light"
                    style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
                  >
                    Novidades chegam em breve.
                  </p>
                )}
            </div>
          }
        />
      </section>

      <StoreFooter store={store} tone="light" />
    </div>
  );
}
