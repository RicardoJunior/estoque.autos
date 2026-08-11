import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoSlug, demoStorefront, isTemplateId } from "@/lib/demo-store";
import { StoreAbout } from "@/components/storefront/StoreAbout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ template: string }>;
}): Promise<Metadata> {
  const { template } = await params;
  if (!isTemplateId(template)) return { title: "Não encontrado" };
  return { title: `Sobre · ${demoStorefront(template).name} — demonstração` };
}

export default async function DemoAboutPage({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;
  if (!isTemplateId(template)) notFound();

  const store = demoStorefront(template);
  return <StoreAbout store={store} slug={demoSlug(template)} />;
}
