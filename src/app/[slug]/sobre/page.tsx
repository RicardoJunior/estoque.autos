import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/public";
import { richTextToPlain } from "@/lib/rich-text";
import { StoreAbout } from "@/components/storefront/StoreAbout";
import { formatAddressShort } from "@/components/storefront/address";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return { title: "Loja não encontrada" };

  const title = `Sobre · ${store.name}`;
  // about pode ser HTML do editor — para SEO, sempre texto puro
  const description =
    (store.settings.about
      ? richTextToPlain(store.settings.about)
      : undefined) ??
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

  return <StoreAbout store={store} slug={slug} />;
}
