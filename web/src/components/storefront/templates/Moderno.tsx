import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { WhatsAppFloat } from "../WhatsAppFloat";

/**
 * Template Moderno — claro, tecnológico e arrojado.
 * Hero full-width com forte uso da cor primária e busca integrada,
 * seção de destaques, grid arejado e CTAs em accent.
 */
export function Moderno({ store, vehicles }: TemplateProps) {
  const featured = vehicles.filter((v) => v.featured).slice(0, 3);
  const headline = store.settings.slogan ?? "Seu próximo carro está aqui";
  const subtitle =
    store.settings.about ??
    "Estoque selecionado, condições especiais e atendimento direto. Encontre o veículo certo para você.";

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <StoreLogo store={store} size={44} />
            <div>
              <div className="font-bold leading-tight tracking-tight">
                {store.name}
              </div>
              {store.settings.slogan && (
                <div className="text-xs text-slate-500">
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
              className="hidden rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition hover:opacity-90 sm:block"
              style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}
            >
              Fale conosco
            </a>
          )}
        </div>
      </header>

      {/* hero */}
      <section
        className="relative overflow-hidden border-b border-slate-200"
        style={{
          background:
            "linear-gradient(135deg, var(--sf-primary-soft) 0%, var(--sf-primary-soft) 55%, #ffffff 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--sf-primary)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}
          >
            {vehicles.length} veículos disponíveis
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-8 max-w-2xl">
            <StoreSearch tone="light" />
          </div>
        </div>
      </section>

      {/* destaques */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-12">
          <div className="mb-5 flex items-center gap-3">
            <span
              className="h-6 w-1.5 rounded-full"
              style={{ background: "var(--sf-accent)" }}
            />
            <h2 className="text-xl font-bold tracking-tight">Destaques</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <CarCard key={v.id} vehicle={v} slug={store.slug} rounded="rounded-2xl" />
            ))}
          </div>
        </section>
      )}

      {/* todos os veículos */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-6 flex items-center gap-3">
          <span
            className="h-6 w-1.5 rounded-full"
            style={{ background: "var(--sf-primary)" }}
          />
          <h2 className="text-xl font-bold tracking-tight">
            Todo o estoque{" "}
            <span className="text-sm font-normal text-slate-400">
              ({vehicles.length})
            </span>
          </h2>
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <p className="font-semibold text-slate-700">
              Nenhum veículo por aqui ainda.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Volte em breve — novos carros chegam toda semana.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <CarCard key={v.id} vehicle={v} slug={store.slug} rounded="rounded-2xl" />
            ))}
          </div>
        )}
      </section>

      <StoreFooter store={store} />
      <WhatsAppFloat whatsapp={store.whatsapp} storeName={store.name} />
    </div>
  );
}
