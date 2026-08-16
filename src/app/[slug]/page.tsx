import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getStorefront, listPublicVehicles } from "@/lib/public";
import { richTextToPlain } from "@/lib/rich-text";
import { storefrontUrl } from "@/lib/site-url";
import { StorefrontView } from "@/components/storefront/registry";

/** Descrição de meta: texto puro, cortado em ~157 chars sem quebrar palavra. */
function metaDescription(raw: string): string {
  const clean = raw.replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  return clean.slice(0, 157).replace(/\s+\S*$/, "").trimEnd() + "…";
}

type SP = {
  q?: string;
  sort?: "recent" | "price_asc" | "price_desc" | "km_asc";
  category?: string;
  fuel?: string;
  transmission?: string;
  minPrice?: string;
  maxPrice?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return { title: "Loja não encontrada" };

  const title = store.name;
  // about pode ser HTML do editor — para SEO, sempre texto puro e truncado
  const description = metaDescription(
    store.settings.slogan ??
      (store.settings.about
        ? richTextToPlain(store.settings.about)
        : undefined) ??
      `Confira o estoque de veículos da ${store.name}.`,
  );
  // canonical respeita domínio próprio (Pro) em vez de forçar o host da plataforma
  const host = (await headers()).get("host");
  const url = storefrontUrl(host, store.slug);

  return {
    // absoluto: vitrine white-label não herda "· estoque.autos"
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
    twitter: { card: "summary", title, description },
  };
}

/** Preço vindo da URL: NaN ou negativo viram "sem filtro". */
function parsePrice(raw?: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const store = await getStorefront(slug);
  if (!store) notFound();

  const vehicles = await listPublicVehicles(store.id, {
    search: sp.q,
    sort: sp.sort,
    category: sp.category,
    fuel: sp.fuel,
    transmission: sp.transmission,
    minPrice: parsePrice(sp.minPrice),
    maxPrice: parsePrice(sp.maxPrice),
  });

  const host = (await headers()).get("host");
  const url = storefrontUrl(host, store.slug);
  const a = store.address ?? {};
  const dealer = {
    "@type": "AutoDealer",
    "@id": `${url}#dealer`,
    name: store.name,
    url,
    telephone: store.phone ?? store.whatsapp ?? undefined,
    email: store.email ?? undefined,
    image: store.logo_url ?? undefined,
    description:
      store.settings.slogan ??
      (store.settings.about
        ? richTextToPlain(store.settings.about)
        : undefined),
    address: a.city
      ? {
          "@type": "PostalAddress",
          streetAddress: [a.street, a.number].filter(Boolean).join(", ") || undefined,
          addressLocality: a.city,
          addressRegion: a.state ?? undefined,
          postalCode: a.cep ?? undefined,
          addressCountry: "BR",
        }
      : undefined,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}?q={query}`,
      "query-input": "required name=query",
    },
  };
  const itemList =
    vehicles.length > 0
      ? {
          "@type": "ItemList",
          name: `Estoque — ${store.name}`,
          numberOfItems: vehicles.length,
          itemListElement: vehicles.slice(0, 30).map((v, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: storefrontUrl(host, store.slug, `/carros/${v.id}`),
          })),
        }
      : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [dealer, ...(itemList ? [itemList] : [])],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // escapa < para impedir quebra de </script> via campos da loja
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <StorefrontView store={store} vehicles={vehicles} />
    </>
  );
}
