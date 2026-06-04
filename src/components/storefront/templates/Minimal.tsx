import Image from "next/image";
import Link from "next/link";
import type { TemplateProps } from "../types";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { VehicleGrid } from "../blocks/VehicleGrid";
import { hasAddress, formatAddressShort } from "../address";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";

/**
 * Template Minimal — editorial/galeria.
 * Branco dominante, tipografia GRANDE como elemento gráfico, linhas finas e
 * cor só em acentos cirúrgicos (preço, underline, índice). A marca controla
 * cor/fonte via var(--sf-*); estrutura neutra fica em classes (branco/slate).
 */
export function Minimal({ store, vehicles }: TemplateProps) {
  const headline = store.settings.slogan ?? store.name;
  const subtitle =
    store.settings.about ?? "Uma seleção cuidadosa de veículos.";

  const showAbout = !!store.settings.about || hasAddress(store.address);
  const aboutLabel = hasAddress(store.address) ? "Localização" : "Sobre";

  // destaque editorial: primeiro "featured", senão o primeiro do estoque
  const feature = vehicles.filter((v) => v.featured)[0] ?? vehicles[0];
  const featureCover = feature?.photos?.[0];
  const rest = feature ? vehicles.filter((v) => v.id !== feature.id) : vehicles;

  return (
    <div
      className="min-h-dvh bg-white text-slate-900"
      style={{ fontFamily: "var(--sf-font)" }}
    >
      {/* masthead editorial */}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
          <Link
            href={`/${store.slug}`}
            className="flex items-center gap-3 rounded outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ["--tw-ring-color" as string]: "var(--sf-primary)" }}
          >
            <StoreLogo store={store} size={32} />
            <span
              className="text-sm font-medium tracking-tight text-slate-900"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              {store.name}
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <a
              href="#estoque"
              className="hidden font-light tracking-wide text-slate-500 underline-offset-[6px] transition hover:text-slate-900 hover:underline sm:inline"
            >
              Estoque
            </a>
            {showAbout && (
              <Link
                href={`/${store.slug}/sobre`}
                className="hidden font-light tracking-wide text-slate-500 underline-offset-[6px] transition hover:text-slate-900 hover:underline sm:inline"
              >
                {aboutLabel}
              </Link>
            )}
            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-light tracking-wide text-slate-900 underline-offset-[6px] transition hover:underline"
                style={{ textDecorationColor: "var(--sf-accent)" }}
              >
                Contato
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* hero tipográfico — o título É o elemento gráfico */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-14 sm:pt-32 sm:pb-20">
        <span className="block text-xs font-light uppercase tracking-[0.4em] text-slate-400">
          Estoque · {new Date().getFullYear()}
        </span>
        <h1
          className="mt-7 max-w-5xl text-[2.75rem] font-light leading-[0.98] tracking-tight text-slate-900 sm:text-7xl lg:text-[5.5rem]"
          style={{ fontFamily: "var(--sf-font-head)" }}
        >
          {headline}
        </h1>
        <span
          aria-hidden
          className="mt-9 block h-px w-24"
          style={{ background: "var(--sf-accent)" }}
        />
        <p className="mt-9 max-w-xl text-lg font-light leading-relaxed text-slate-500">
          {subtitle}
        </p>
      </section>

      {/* destaque editorial — uma peça grande, índice + foto + meta */}
      {feature && (
        <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24">
          <Link
            href={`/${store.slug}/carros/${feature.id}`}
            className="group grid items-stretch gap-8 border-t border-slate-200 pt-10 outline-none focus-visible:ring-2 focus-visible:ring-offset-4 sm:gap-12 lg:grid-cols-2"
            style={{ ["--tw-ring-color" as string]: "var(--sf-primary)" }}
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
                <span className="text-xs font-light uppercase tracking-[0.3em] text-slate-400">
                  Em destaque
                </span>
              </div>
              <h2
                className="mt-5 text-3xl font-light leading-[1.05] tracking-tight text-slate-900 sm:text-5xl"
                style={{ fontFamily: "var(--sf-font-head)" }}
              >
                {vehicleTitle(feature)}
              </h2>

              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 border-t border-slate-100 pt-6 text-sm font-light text-slate-500">
                {feature.year_model && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-slate-300">
                      Ano
                    </dt>
                    <dd className="mt-1 text-slate-700">{feature.year_model}</dd>
                  </div>
                )}
                {feature.mileage != null && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-slate-300">
                      Km
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {formatKm(feature.mileage)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-widest text-slate-300">
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

              <span className="mt-8 inline-flex items-center gap-2 text-sm font-light tracking-wide text-slate-900">
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
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-t border-slate-200 pt-12">
          <div>
            <h2
              className="text-2xl font-light tracking-tight text-slate-900 sm:text-3xl"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              Estoque
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span
                aria-hidden
                className="block h-px w-10"
                style={{ background: "var(--sf-accent)" }}
              />
              <span className="text-sm font-light tabular-nums text-slate-400">
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
            <div className="border-t border-slate-100 py-24 text-center">
              <p className="text-lg font-light text-slate-300">
                {vehicles.length === 0
                  ? "Nenhum veículo disponível no momento."
                  : "Nenhum outro veículo no estoque."}
              </p>
              {(store.settings.about || formatAddressShort(store.address)) &&
                vehicles.length === 0 && (
                  <p className="mt-2 text-sm font-light text-slate-400">
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
