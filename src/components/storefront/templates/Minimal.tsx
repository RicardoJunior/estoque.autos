import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { WhatsAppFloat } from "../WhatsAppFloat";

/**
 * Template Minimal — claro, editorial e discreto.
 * Muito espaço em branco, tipografia grande e leve. A cor da marca aparece
 * apenas em detalhes finos: uma linha de accent sob títulos e no preço (CarCard).
 */
export function Minimal({ store, vehicles }: TemplateProps) {
  const headline = store.settings.slogan ?? store.name;
  const subtitle = store.settings.about ?? "Uma seleção cuidadosa de veículos.";

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      {/* header */}
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-6">
          <div className="flex items-center gap-3">
            <StoreLogo store={store} size={36} />
            <span className="text-sm font-light tracking-tight text-slate-900">
              {store.name}
            </span>
          </div>
          {store.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-light tracking-tight text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
            >
              Contato
            </a>
          )}
        </div>
      </header>

      {/* hero textual mínimo */}
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20">
        <h1 className="max-w-3xl text-4xl font-light leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
          {headline}
        </h1>
        <span
          aria-hidden
          className="mt-8 block h-0.5 w-16"
          style={{ background: "var(--sf-accent)" }}
        />
        <p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-slate-500">
          {subtitle}
        </p>
      </section>

      {/* veículos */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-t border-slate-100 pt-12">
          <h2 className="text-2xl font-light tracking-tight text-slate-900">
            Estoque{" "}
            <span className="text-base font-light text-slate-300">
              {vehicles.length}
            </span>
          </h2>
          <StoreSearch />
        </div>

        {vehicles.length === 0 ? (
          <p className="py-24 text-center text-lg font-light text-slate-300">
            Nenhum veículo disponível no momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <CarCard
                key={v.id}
                vehicle={v}
                slug={store.slug}
                tone="light"
                rounded="rounded-lg"
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
