import Image from "next/image";
import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { WhatsAppFloat } from "../WhatsAppFloat";
import { formatPrice, vehicleTitle } from "@/lib/format";

/**
 * Template Premium — escuro, refinado e de alto padrão.
 * Fundo quase-preto, tipografia leve com tracking largo, hero com a foto
 * do veículo em destaque e acentos vindos do tema da loja (var(--sf-*)).
 */
export function Premium({ store, vehicles }: TemplateProps) {
  const hero = vehicles.find((v) => v.featured) ?? vehicles[0];
  const heroCover = hero?.photos?.[0];

  return (
    <div className="min-h-dvh bg-[#0b1120] text-slate-100">
      {/* header */}
      <header className="border-b border-white/10 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <StoreLogo store={store} size={44} />
            <div>
              <div className="font-light tracking-widest text-white uppercase">
                {store.name}
              </div>
              {store.settings.slogan && (
                <div className="text-xs tracking-wide text-slate-400">
                  {store.settings.slogan}
                </div>
              )}
            </div>
          </div>
          {store.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border px-5 py-2 text-sm font-light tracking-wide transition hover:bg-white/5 sm:block"
              style={{ borderColor: "var(--sf-primary)", color: "var(--sf-primary)" }}
            >
              Fale conosco
            </a>
          )}
        </div>
      </header>

      {/* hero */}
      {hero ? (
        <section className="relative">
          <div className="relative aspect-video w-full overflow-hidden">
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
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/70 to-[#0b1120]/20" />
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-6xl px-5 pb-12 sm:pb-16">
                <span
                  className="text-xs font-light uppercase tracking-[0.3em]"
                  style={{ color: "var(--sf-primary)" }}
                >
                  Destaque
                </span>
                <h1 className="mt-3 text-3xl font-light tracking-wide text-white sm:text-5xl">
                  {vehicleTitle(hero)}
                </h1>
                <div
                  className="mt-2 h-px w-20"
                  style={{ background: "var(--sf-primary)" }}
                />
                <div className="mt-5 flex flex-wrap items-center gap-5">
                  <span className="text-2xl font-light tracking-wide text-white sm:text-3xl">
                    {formatPrice(hero.price)}
                  </span>
                  <a
                    href={`/${store.slug}/carros/${hero.id}`}
                    className="rounded-full px-6 py-2.5 text-sm font-medium tracking-wide transition hover:opacity-90"
                    style={{
                      background: "var(--sf-accent)",
                      color: "var(--sf-on-accent)",
                    }}
                  >
                    Ver detalhes
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, var(--sf-primary), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 py-24 text-center">
            <span
              className="text-xs font-light uppercase tracking-[0.3em]"
              style={{ color: "var(--sf-primary)" }}
            >
              Bem-vindo
            </span>
            <h1 className="mt-4 text-4xl font-light tracking-wide text-white sm:text-6xl">
              {store.name}
            </h1>
            <div
              className="mx-auto mt-4 h-px w-24"
              style={{ background: "var(--sf-primary)" }}
            />
            {store.settings.slogan && (
              <p className="mt-6 text-lg font-light tracking-wide text-slate-300">
                {store.settings.slogan}
              </p>
            )}
          </div>
        </section>
      )}

      {/* coleção */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-light uppercase tracking-widest text-white">
              Nossa coleção
            </h2>
            <div
              className="mt-3 h-px w-16"
              style={{ background: "var(--sf-primary)" }}
            />
            <p className="mt-3 text-sm font-light tracking-wide text-slate-400">
              {vehicles.length} veículo{vehicles.length === 1 ? "" : "s"} disponíve
              {vehicles.length === 1 ? "l" : "is"}
            </p>
          </div>
          <StoreSearch tone="dark" />
        </div>

        {vehicles.length === 0 ? (
          <p className="py-20 text-center font-light tracking-wide text-slate-500">
            Nenhum veículo disponível no momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <CarCard
                key={v.id}
                vehicle={v}
                slug={store.slug}
                tone="dark"
                rounded="rounded-xl"
              />
            ))}
          </div>
        )}
      </section>

      <StoreFooter store={store} tone="dark" />
      <WhatsAppFloat whatsapp={store.whatsapp} storeName={store.name} />
    </div>
  );
}
