import Image from "next/image";
import Link from "next/link";
import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { hasAddress } from "../address";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/types";

/**
 * Template Premium — boutique de seminovos de luxo.
 * Dark profundo, tipografia display com tracking largo, muito espaço
 * negativo e hero cinematográfico com a foto do destaque sob um gradiente.
 * Acentos vêm do tema da loja (var(--sf-accent)); tom dark.
 */
export function Premium({ store, vehicles }: TemplateProps) {
  const hero = vehicles.find((v) => v.featured) ?? vehicles[0];
  const heroCover = hero?.photos?.[0];
  const rest = hero ? vehicles.filter((v) => v.id !== hero.id) : vehicles;
  const curated = (hero ? rest : vehicles).slice(0, 3);

  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;
  const aboutHref = `/${store.slug}/sobre`;
  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = store.settings.about ? "Sobre" : "Localização";

  // specs do veículo em destaque (chips elegantes no hero)
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
      className="min-h-dvh bg-[#0a0e1a] text-slate-200"
      style={{ fontFamily: "var(--sf-font)" }}
    >
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link href={`/${store.slug}`} className="flex items-center gap-3.5">
            <StoreLogo store={store} size={44} />
            <div className="leading-tight">
              <div
                className="text-sm font-light uppercase tracking-[0.28em] text-white"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                {store.name}
              </div>
              {store.settings.slogan && (
                <div className="mt-0.5 text-[11px] font-light tracking-[0.2em] text-slate-400">
                  {store.settings.slogan}
                </div>
              )}
            </div>
          </Link>

          <nav className="flex items-center gap-7 text-[13px] font-light tracking-[0.15em] uppercase">
            <a
              href="#colecao"
              className="hidden text-slate-300 transition hover:text-white focus-visible:text-white focus-visible:outline-none sm:inline"
            >
              Coleção
            </a>
            {showAbout && (
              <Link
                href={aboutHref}
                className="hidden text-slate-300 transition hover:text-white focus-visible:text-white focus-visible:outline-none sm:inline"
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
      {hero ? (
        <section className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
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
                  "linear-gradient(to top, #0a0e1a 4%, rgba(10,14,26,0.72) 38%, rgba(10,14,26,0.15) 72%, rgba(10,14,26,0.35) 100%)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(10,14,26,0.55), transparent 45%)",
              }}
            />

            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-6xl px-6 pb-12 sm:pb-16 lg:pb-20">
                <span
                  className="text-[11px] font-light uppercase tracking-[0.4em]"
                  style={{ color: "var(--sf-accent)" }}
                >
                  Destaque da casa
                </span>
                <h1
                  className="mt-4 max-w-3xl text-4xl font-light leading-[1.05] tracking-[0.01em] text-white sm:text-6xl"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  {vehicleTitle(hero)}
                </h1>
                <div
                  aria-hidden
                  className="mt-6 h-px w-24"
                  style={{ background: "var(--sf-accent)" }}
                />

                {heroSpecs.length > 0 && (
                  <ul className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-light uppercase tracking-[0.2em] text-slate-300">
                    {heroSpecs.map((spec, i) => (
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
                  <span className="text-2xl font-light tracking-wide text-white sm:text-3xl">
                    {formatPrice(hero.price)}
                  </span>
                  <Link
                    href={`/${store.slug}/carros/${hero.id}`}
                    className="rounded-full px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    style={{
                      background: "var(--sf-accent)",
                      color: "var(--sf-on-accent)",
                    }}
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(60% 80% at 30% 0%, var(--sf-primary-soft), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 py-28 text-center sm:py-36">
            <span
              className="text-[11px] font-light uppercase tracking-[0.4em]"
              style={{ color: "var(--sf-accent)" }}
            >
              Bem-vindo
            </span>
            <h1
              className="mt-5 text-4xl font-light tracking-[0.01em] text-white sm:text-6xl"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              {store.name}
            </h1>
            <div
              aria-hidden
              className="mx-auto mt-6 h-px w-24"
              style={{ background: "var(--sf-accent)" }}
            />
            {(store.settings.slogan || store.settings.about) && (
              <p className="mx-auto mt-7 max-w-xl text-base font-light leading-relaxed tracking-wide text-slate-400">
                {store.settings.about ?? store.settings.slogan}
              </p>
            )}
          </div>
        </section>
      )}

      {/* seleção curada (quando houver veículos além do destaque) */}
      {curated.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-20 sm:pt-28">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span
                className="text-[11px] font-light uppercase tracking-[0.4em]"
                style={{ color: "var(--sf-accent)" }}
              >
                Seleção curada
              </span>
              <h2
                className="mt-3 text-2xl font-light uppercase tracking-[0.2em] text-white sm:text-3xl"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                Recém-chegados
              </h2>
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
      <section id="colecao" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="mb-10 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span
              className="text-[11px] font-light uppercase tracking-[0.4em]"
              style={{ color: "var(--sf-accent)" }}
            >
              O acervo
            </span>
            <h2
              className="mt-3 text-2xl font-light uppercase tracking-[0.2em] text-white sm:text-3xl"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              Nossa coleção
            </h2>
            <p className="mt-3 text-xs font-light uppercase tracking-[0.25em] text-slate-500">
              {vehicles.length} veículo{vehicles.length === 1 ? "" : "s"}{" "}
              disponíve{vehicles.length === 1 ? "l" : "is"}
            </p>
          </div>
          <div className="w-full sm:max-w-md">
            <StoreSearch tone="dark" />
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="border border-dashed border-white/10 py-24 text-center">
            <p className="text-sm font-light uppercase tracking-[0.3em] text-slate-400">
              Acervo em curadoria
            </p>
            <p className="mt-3 text-xs font-light tracking-wide text-slate-600">
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
