import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront, getPublicVehicle } from "@/lib/public";
import { formatPrice, vehicleTitle } from "@/lib/format";
import { VehicleDetail } from "@/components/storefront/VehicleDetail";

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/${slug}/carros/${id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${appUrl}/${slug}/carros/${id}`,
      siteName: store.name,
      images: cover ? [{ url: cover, width: 1200, height: 900 }] : undefined,
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title,
      description,
      images: cover ? [cover] : undefined,
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

  return <VehicleDetail store={store} vehicle={vehicle} slug={slug} />;
}
