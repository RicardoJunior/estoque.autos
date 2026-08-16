import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getStorefront, getPublicVehicle } from "@/lib/public";
import { formatPrice, vehicleTitle } from "@/lib/format";
import { storefrontUrl } from "@/lib/site-url";
import { VehicleDetailView } from "@/components/storefront/registry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const store = await getStorefront(slug);
  if (!store) return { title: "Não encontrado" };
  const vehicle = await getPublicVehicle(store.id, id);
  if (!vehicle) return { title: "Veículo não encontrado" };

  const title = `${vehicleTitle(vehicle)} · ${formatPrice(vehicle.price)}`;
  const description =
    vehicle.description?.slice(0, 160) ??
    `${vehicleTitle(vehicle)} à venda na ${store.name}.`;
  const cover = vehicle.photos?.[0]?.url;
  const host = (await headers()).get("host");
  const url = storefrontUrl(host, slug, `/carros/${id}`);

  return {
    // absoluto: anúncio white-label não herda "· estoque.autos"
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: store.name,
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
    // reforça preço/moeda no Open Graph (coerente com o JSON-LD Car+Offer)
    other: {
      "product:price:amount": String(vehicle.price),
      "product:price:currency": "BRL",
    },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();
  const vehicle = await getPublicVehicle(store.id, id);
  if (!vehicle) notFound();

  return <VehicleDetailView store={store} vehicle={vehicle} slug={slug} />;
}
