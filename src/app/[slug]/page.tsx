import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront, listPublicVehicles } from "@/lib/public";
import { StorefrontView } from "@/components/storefront/registry";

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
  const description =
    store.settings.slogan ??
    store.settings.about ??
    `Confira o estoque de veículos da ${store.name}.`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/${store.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${appUrl}/${store.slug}`,
      siteName: store.name,
      images: store.logo_url ? [{ url: store.logo_url }] : undefined,
    },
    twitter: { card: "summary", title, description },
  };
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
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const a = store.address ?? {};
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: store.name,
    url: `${appUrl}/${store.slug}`,
    telephone: store.phone ?? store.whatsapp ?? undefined,
    email: store.email ?? undefined,
    image: store.logo_url ?? undefined,
    description: store.settings.slogan ?? store.settings.about ?? undefined,
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
