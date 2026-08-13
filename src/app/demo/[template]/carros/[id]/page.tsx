import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  demoSlug,
  demoStorefront,
  getDemoVehicle,
  isTemplateId,
} from "@/lib/demo-store";
import { formatPrice, vehicleTitle } from "@/lib/format";
import { VehicleDetailView } from "@/components/storefront/registry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ template: string; id: string }>;
}): Promise<Metadata> {
  const { template, id } = await params;
  const vehicle = getDemoVehicle(id);
  if (!isTemplateId(template) || !vehicle) return { title: "Não encontrado" };
  return {
    title: `${vehicleTitle(vehicle)} · ${formatPrice(vehicle.price)} — demonstração`,
  };
}

export default async function DemoVehiclePage({
  params,
}: {
  params: Promise<{ template: string; id: string }>;
}) {
  const { template, id } = await params;
  if (!isTemplateId(template)) notFound();
  const vehicle = getDemoVehicle(id);
  if (!vehicle) notFound();

  return (
    <VehicleDetailView
      store={demoStorefront(template)}
      vehicle={vehicle}
      slug={demoSlug(template)}
      demo
    />
  );
}
