import Image from "next/image";
import Link from "next/link";
import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { WhatsAppFloat } from "../WhatsAppFloat";
import { formatPrice, vehicleTitle } from "@/lib/format";

/**
 * Template Vitrine — claro e visual em primeiro lugar.
 * A imagem domina: um hero showcase grande com a foto de capa do destaque,
 * seguido de uma grade densa de cards tipo galeria. Cores da marca via
 * var(--sf-*); estruturais (branco/slate) ficam em classes.
 */
export function Vitrine({ store, vehicles }: TemplateProps) {
  const hero = vehicles.filter((v) => v.featured)[0] ?? vehicles[0];
  const heroCover = hero?.photos?.[0];
  const heroHref = hero ? `/${store.slug}/carros/${hero.id}` : "#";
  const gallery = hero ? vehicles.filter((v) => v.id !== hero.id) : vehicles;

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      {/* header sobre o hero */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <Link href={`/${store.slug}`} className="flex items-center gap-3">
            <StoreLogo store={store} size={44} />
            <div className="leading-tight text-white drop-shadow">
              <div className="font-semibold tracking-tight">{store.name}</div>
              {store.settings.slogan && (
                <div className="text-xs text-white/80">{store.settings.slogan}</div>
              )}
            </div>
          </Link>
          {store.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full px-5 py-2 text-sm font-semibold shadow-sm backdrop-blur transition hover:opacity-90 sm:block"
              style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}
            >
              Fale conosco
            </a>
          )}
        </div>
      </header>

      {/* HERO SHOWCASE */}
      {hero ? (
        <Link href={heroHref} className="group relative block h-[70vh] min-h-[26rem] w-full overflow-hidden bg-slate-900">
          {heroCover ? (
            <Image
              src={heroCover.url}
              alt={vehicleTitle(hero)}
              fill
              priority
              sizes="100vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto w-full max-w-7xl px-5 pb-12 sm:pb-16">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}
              >
                Destaque
              </span>
              <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white drop-shadow sm:text-5xl">
                {vehicleTitle(hero)}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <span className="text-2xl font-bold text-white drop-shadow sm:text-3xl">
                  {formatPrice(hero.price)}
                </span>
                <span
                  className="rounded-full px-6 py-2.5 text-sm font-semibold shadow transition group-hover:opacity-90"
                  style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}
                >
                  Ver detalhes
                </span>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <section
          className="relative flex h-[60vh] min-h-[22rem] items-center justify-center overflow-hidden text-center"
          style={{ background: "var(--sf-primary-soft)" }}
        >
          <div className="px-5">
            <StoreLogo store={store} size={64} className="mx-auto" />
            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
              {store.name}
            </h1>
            {store.settings.slogan && (
              <p className="mt-4 text-lg text-slate-600">{store.settings.slogan}</p>
            )}
          </div>
        </section>
      )}

      {/* galeria */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">A vitrine</h2>
            <p className="mt-1 text-sm text-slate-500">
              {vehicles.length} veículo{vehicles.length === 1 ? "" : "s"} para explorar
            </p>
          </div>
          <StoreSearch tone="light" />
        </div>

        {gallery.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <p className="font-semibold text-slate-700">
              Nenhum veículo na vitrine ainda.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Volte em breve — novidades chegam toda semana.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gallery.map((v) => (
              <CarCard
                key={v.id}
                vehicle={v}
                slug={store.slug}
                tone="light"
                rounded="rounded-2xl"
              />
            ))}
          </div>
        )}
      </section>

      <StoreFooter store={store} tone="light" />
      <WhatsAppFloat whatsapp={store.whatsapp} storeName={store.name} />
    </div>
  );
}
