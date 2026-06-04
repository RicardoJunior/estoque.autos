import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/public";
import { StoreLogo } from "@/components/storefront/StoreLogo";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { StoreMap } from "@/components/storefront/StoreMap";
import {
  formatAddressFull,
  formatAddressShort,
} from "@/components/storefront/address";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return { title: "Loja não encontrada" };

  const title = `Sobre · ${store.name}`;
  const description =
    store.settings.about ??
    formatAddressShort(store.address) ??
    `Conheça a ${store.name}: localização, horário e contato.`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/${slug}/sobre` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${appUrl}/${slug}/sobre`,
      siteName: store.name,
      images: store.logo_url ? [{ url: store.logo_url }] : undefined,
    },
  };
}

export default async function StoreAboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();

  const address = formatAddressFull(store.address);
  const hours = store.settings.business_hours;

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      {/* header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href={`/${slug}`} className="flex items-center gap-2.5">
            <StoreLogo store={store} size={36} />
            <span
              className="font-bold"
              style={{ fontFamily: "var(--sf-font-head)" }}
            >
              {store.name}
            </span>
          </Link>
          <Link
            href={`/${slug}`}
            className="text-sm text-slate-500 hover:underline"
          >
            ← Ver estoque
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1
          className="text-3xl font-bold sm:text-4xl"
          style={{ fontFamily: "var(--sf-font-head)" }}
        >
          Sobre a {store.name}
        </h1>
        {store.settings.slogan && (
          <p className="mt-2 text-lg text-slate-500">{store.settings.slogan}</p>
        )}
        <div
          className="mt-4 h-px w-20"
          style={{ background: "var(--sf-primary)" }}
        />

        {store.settings.about && (
          <section className="mt-8 max-w-3xl">
            <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">
              {store.settings.about}
            </p>
          </section>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* dados de contato/localização */}
          <div className="space-y-6">
            {address && (
              <div>
                <h2
                  className="text-sm font-semibold uppercase tracking-wide text-slate-400"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  Endereço
                </h2>
                <p className="mt-1 text-slate-700">{address}</p>
              </div>
            )}

            {hours && (
              <div>
                <h2
                  className="text-sm font-semibold uppercase tracking-wide text-slate-400"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  Horário de atendimento
                </h2>
                <p className="mt-1 whitespace-pre-line text-slate-700">
                  {hours}
                </p>
              </div>
            )}

            {(store.whatsapp || store.phone || store.email) && (
              <div>
                <h2
                  className="text-sm font-semibold uppercase tracking-wide text-slate-400"
                  style={{ fontFamily: "var(--sf-font-head)" }}
                >
                  Contato
                </h2>
                <ul className="mt-1 space-y-1 text-slate-700">
                  {store.whatsapp && <li>WhatsApp: {store.whatsapp}</li>}
                  {store.phone && <li>Telefone: {store.phone}</li>}
                  {store.email && <li>{store.email}</li>}
                </ul>
              </div>
            )}
          </div>

          {/* mapa */}
          <StoreMap address={store.address} storeName={store.name} />
        </div>

        {!address && !hours && !store.settings.about && (
          <p className="mt-8 text-slate-400">
            Em breve mais informações sobre a loja.
          </p>
        )}
      </main>

      <StoreFooter store={store} />
    </div>
  );
}
