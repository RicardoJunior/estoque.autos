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

  return <StorefrontView store={store} vehicles={vehicles} />;
}
