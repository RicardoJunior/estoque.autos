import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getStorefront } from "@/lib/public";
import { richTextToPlain } from "@/lib/rich-text";
import { storefrontUrl } from "@/lib/site-url";
import { StoreAbout } from "@/components/storefront/StoreAbout";
import { formatAddressShort } from "@/components/storefront/address";

function metaDescription(raw: string): string {
  const clean = raw.replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  return clean.slice(0, 157).replace(/\s+\S*$/, "").trimEnd() + "…";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return { title: "Loja não encontrada" };

  const title = `Sobre · ${store.name}`;
  // about pode ser HTML do editor — para SEO, sempre texto puro e truncado
  const description = metaDescription(
    (store.settings.about
      ? richTextToPlain(store.settings.about)
      : undefined) ??
      formatAddressShort(store.address) ??
      `Conheça a ${store.name}: localização, horário e contato.`,
  );
  const host = (await headers()).get("host");
  const url = storefrontUrl(host, slug, "/sobre");

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
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
