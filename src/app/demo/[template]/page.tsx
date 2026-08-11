import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontView } from "@/components/storefront/registry";
import {
  demoStorefront,
  filterDemoVehicles,
  isTemplateId,
} from "@/lib/demo-store";
import { getTemplate } from "@/lib/templates";

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
  params: Promise<{ template: string }>;
}): Promise<Metadata> {
  const { template } = await params;
  if (!isTemplateId(template)) return { title: "Template não encontrado" };
  const info = getTemplate(template);
  return {
    title: `Template ${info.name} — demonstração ao vivo`,
    description: `Navegue por um site de exemplo criado com o template ${info.name} do estoque.autos: ${info.vibe}.`,
  };
}

/** Preço vindo da URL: NaN ou negativo viram "sem filtro". */
function parsePrice(raw?: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default async function DemoStorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ template: string }>;
  searchParams: Promise<SP>;
}) {
  const { template } = await params;
  const sp = await searchParams;
  if (!isTemplateId(template)) notFound();

  const store = demoStorefront(template);
  const vehicles = filterDemoVehicles({
    search: sp.q,
    sort: sp.sort,
    category: sp.category,
    fuel: sp.fuel,
    transmission: sp.transmission,
    minPrice: parsePrice(sp.minPrice),
    maxPrice: parsePrice(sp.maxPrice),
  });

  return <StorefrontView store={store} vehicles={vehicles} />;
}
