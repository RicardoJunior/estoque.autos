import Image from "next/image";
import Link from "next/link";
import type { TemplateProps, PublicVehicle } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { SectionHeader } from "../blocks/SectionHeader";
import { hasAddress } from "../address";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";

/**
 * Template Vitrine — galeria editorial, a foto em primeiro lugar.
 * Hero showcase ~70vh com a capa do destaque + grade densa estilo galeria
 * onde o hover revela as infos (texto mínimo no repouso). Tom claro.
 * Cores/fonte da marca via var(--sf-*); estruturais (branco/slate) em classes.
 */
export function Vitrine({ store, vehicles }: TemplateProps) {
  const hero = vehicles.filter((v) => v.featured)[0] ?? vehicles[0];
  const heroCover = hero?.photos?.[0];
  const heroHref = hero ? `/${store.slug}/carros/${hero.id}` : "#";
  const gallery = hero ? vehicles.filter((v) => v.id !== hero.id) : vehicles;

  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = store.settings.about ? "Sobre" : "Localização";
  const waHref = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div
      className="min-h-dvh bg-white text-slate-900"
      style={{ fontFamily: "var(--sf-font)" }}
    >
      {/* header flutuante sobre o hero */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href={`/${store.slug}`}
            className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <StoreLogo store={store} size={44} />
            <div className="leading-tight text-white drop-shadow-sm">
              <div
                className="text-sm font-semibold tracking-tight sm:text-base"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                {store.name}
              </div>
              {store.settings.slogan && (
                <div className="text-xs text-white/75">
                  {store.settings.slogan}
                </div>
              )}
            </div>
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-3">
            {showAbout && (
              <Link
                href={`/${store.slug}/sobre`}
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/90 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/80 sm:block"
              >
                {aboutLabel}
              </Link>
            )}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-5 py-2 text-sm font-semibold shadow-sm outline-none backdrop-blur transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/80"
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

      {/* HERO SHOWCASE */}
      {hero ? (
        <Link
          href={heroHref}
          className="group relative block h-[70vh] min-h-[28rem] w-full overflow-hidden bg-slate-900 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/70"
        >
          {heroCover ? (
            <Image
              src={heroCover.url}
              alt={vehicleTitle(hero)}
              fill
              priority
              sizes="100vw"
              className="object-cover transition duration-[1200ms] ease-out group-hover:scale-105"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--sf-primary) 0%, var(--sf-primary-dark) 100%)",
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30" />

          {/* marcador editorial no topo */}
          <div className="absolute inset-x-0 top-24 hidden sm:block">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-8 text-white/70">
              <span
                className="h-px w-12"
                style={{ background: "var(--sf-accent)" }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.4em]">
                A vitrine
              </span>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8 sm:pb-16">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  background: "var(--sf-primary)",
                  color: "var(--sf-on-primary)",
                }}
              >
                Destaque
              </span>
              <h1
                className="mt-4 max-w-3xl text-3xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-sm sm:text-6xl"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                {vehicleTitle(hero)}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <span className="text-2xl font-extrabold text-white drop-shadow-sm sm:text-3xl">
                  {formatPrice(hero.price)}
                </span>
                {(hero.year_model || hero.mileage != null) && (
                  <span className="text-sm font-medium text-white/80">
                    {[
                      hero.year_model,
                      hero.mileage != null ? formatKm(hero.mileage) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
                <span
                  className="ml-auto inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold shadow transition group-hover:opacity-90 sm:ml-0"
                  style={{
                    background: "var(--sf-accent)",
                    color: "var(--sf-on-accent)",
                  }}
                >
                  Ver detalhes
                  <span aria-hidden className="transition group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <section
          className="relative flex h-[60vh] min-h-[24rem] items-center justify-center overflow-hidden text-center"
          style={{ background: "var(--sf-primary-soft)" }}
        >
          <div className="px-5">
            <StoreLogo store={store} size={64} className="mx-auto" />
            <h1
              className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              {store.name}
            </h1>
            {store.settings.slogan && (
              <p className="mt-4 text-lg text-slate-600">
                {store.settings.slogan}
              </p>
            )}
          </div>
        </section>
      )}

      {/* GALERIA */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <SectionHeader
          title="A vitrine"
          subtitle={`${vehicles.length} veículo${
            vehicles.length === 1 ? "" : "s"
          } para explorar`}
          accentRule
          tone="light"
          action={<StoreSearch tone="light" />}
        />

        {gallery.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
            <p className="font-semibold text-slate-700">
              Nenhum veículo na vitrine ainda.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Volte em breve — novidades chegam toda semana.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {gallery.map((v, i) => (
              <GalleryTile
                key={v.id}
                vehicle={v}
                slug={store.slug}
                /* tiles ocasionalmente maiores → ritmo de galeria editorial */
                wide={i % 6 === 0}
              />
            ))}
          </div>
        )}
      </section>

      <StoreFooter store={store} tone="light" />
    </div>
  );
}

/**
 * Tile de galeria: a foto domina; título/preço aparecem no hover (e sempre
 * visíveis em telas de toque via focus). Quando não há foto, cai no CarCard
 * para preservar a info essencial. Cores da marca via var(--sf-*).
 */
function GalleryTile({
  vehicle,
  slug,
  wide,
}: {
  vehicle: PublicVehicle;
  slug: string;
  wide?: boolean;
}) {
  const cover = vehicle.photos?.[0];
  const reserved = vehicle.status === "reserved";

  if (!cover) {
    return (
      <div className={wide ? "sm:col-span-2 lg:col-span-2" : undefined}>
        <CarCard
          vehicle={vehicle}
          slug={slug}
          tone="light"
          rounded="rounded-2xl"
        />
      </div>
    );
  }

  return (
    <Link
      href={`/${slug}/carros/${vehicle.id}`}
      className={`group relative block overflow-hidden rounded-2xl bg-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        wide ? "aspect-[4/3] sm:col-span-2 sm:aspect-[16/9] lg:col-span-2" : "aspect-[4/5]"
      }`}
      style={{ ["--tw-ring-color" as string]: "var(--sf-primary)" }}
    >
      <Image
        src={cover.url}
        alt={vehicleTitle(vehicle)}
        fill
        sizes={
          wide
            ? "(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 50vw"
            : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        }
        className="object-cover transition duration-700 ease-out group-hover:scale-105"
      />

      {/* overlay base sempre presente p/ legibilidade do preço */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0" />
      {/* overlay extra que escurece no hover/focus revelando os metadados */}
      <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/35 group-focus-visible:bg-black/35" />

      {reserved && (
        <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
          Reservado
        </span>
      )}
      {(vehicle.photos?.length ?? 0) > 1 && (
        <span className="absolute right-3 top-3 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
          {vehicle.photos!.length} fotos
        </span>
      )}

      {/* info: preço sempre visível; título/specs sobem no hover */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-24 group-hover:opacity-100 group-focus-visible:max-h-24 group-focus-visible:opacity-100">
          <h3
            className="line-clamp-2 text-sm font-semibold leading-snug text-white sm:text-base"
            style={{ fontFamily: "var(--sf-font-head)" }}
          >
            {vehicleTitle(vehicle)}
          </h3>
          {(vehicle.year_model || vehicle.mileage != null) && (
            <p className="mt-0.5 text-[11px] text-white/75">
              {[
                vehicle.year_model,
                vehicle.mileage != null ? formatKm(vehicle.mileage) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="h-3.5 w-1 rounded-full"
            style={{ background: "var(--sf-accent)" }}
          />
          <span className="text-base font-bold text-white drop-shadow-sm sm:text-lg">
            {formatPrice(vehicle.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
