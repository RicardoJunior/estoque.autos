import type { TemplateProps } from "../types";
import { CarCard } from "../CarCard";
import { StoreLogo } from "../StoreLogo";
import { StoreFooter } from "../StoreFooter";
import { StoreSearch } from "../StoreSearch";
import { WhatsAppFloat } from "../WhatsAppFloat";

/**
 * Template Clássico — claro, direto e confiável.
 * Header simples, faixa de boas-vindas, grid de 3 colunas, footer.
 */
export function Classico({ store, vehicles }: TemplateProps) {
  const featured = vehicles.filter((v) => v.featured).slice(0, 3);

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      {/* header */}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <StoreLogo store={store} size={44} />
            <div>
              <div className="font-bold leading-tight">{store.name}</div>
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
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold sm:block"
              style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}
            >
              Fale conosco
            </a>
          )}
        </div>
      </header>

      {/* faixa de destaque */}
      <section
        className="border-b border-slate-200"
        style={{ background: "var(--sf-primary-soft)" }}
      >
        <div className="mx-auto max-w-6xl px-5 py-10">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {store.settings.about ? store.name : "Nosso estoque"}
          </h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            {store.settings.about ?? "Encontre o carro ideal para você."}
          </p>
        </div>
      </section>

      {/* destaques */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-10">
          <h2 className="mb-4 text-lg font-bold">Destaques</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <CarCard key={v.id} vehicle={v} slug={store.slug} />
            ))}
          </div>
        </section>
      )}

      {/* todos os veículos */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            Todos os veículos{" "}
            <span className="text-sm font-normal text-slate-400">
              ({vehicles.length})
            </span>
          </h2>
          <StoreSearch />
        </div>

        {vehicles.length === 0 ? (
          <p className="py-12 text-center text-slate-400">
            Nenhum veículo encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <CarCard key={v.id} vehicle={v} slug={store.slug} />
            ))}
          </div>
        )}
      </section>

      <StoreFooter store={store} />
      <WhatsAppFloat whatsapp={store.whatsapp} storeName={store.name} />
    </div>
  );
}
