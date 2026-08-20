import type { MetadataRoute } from "next";
import { createAnonClient } from "@/lib/supabase/server";
import { AJUDA_SLUGS } from "@/lib/content";
import { SITE_URL } from "@/lib/site-url";

// Sitemap raiz: páginas do produto + Central de ajuda + vitrines das lojas.
//
// O /blog NÃO entra aqui: em produção ele é servido por um Worker Astro
// próprio (rota estoque.autos/blog*) que publica o seu próprio
// /blog/sitemap-index.xml (referenciado no robots.txt). Listar /blog aqui
// gerava "Redirect error" no Search Console (307 /blog → /blog/) e duplicava
// os posts que o Astro já cobre.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = SITE_URL;
  const now = new Date(); // build time — sinaliza frescor a cada deploy

  const entries: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${appUrl}/ajuda`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...AJUDA_SLUGS.map((slug) => ({
      url: `${appUrl}/ajuda/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${appUrl}/termos`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${appUrl}/privacidade`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const { data } = await createAnonClient()
      .from("storefronts")
      .select("slug")
      .limit(5000);
    for (const row of data ?? []) {
      entries.push({
        url: `${appUrl}/${row.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  } catch {
    // sem banco no build — sitemap mínimo já é válido
  }

  return entries;
}
