import type { MetadataRoute } from "next";
import { createAnonClient } from "@/lib/supabase/server";
import { AJUDA_SLUGS, BLOG_SLUGS } from "@/lib/content";

// Sitemap raiz: páginas do produto + artigos + vitrines das lojas.
// Cada loja tem ainda o próprio /{slug}/sitemap.xml (com os carros).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const entries: MetadataRoute.Sitemap = [
    { url: appUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${appUrl}/ajuda`, changeFrequency: "monthly", priority: 0.7 },
    ...BLOG_SLUGS.map((slug) => ({
      url: `${appUrl}/blog/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...AJUDA_SLUGS.map((slug) => ({
      url: `${appUrl}/ajuda/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  try {
    const { data } = await createAnonClient()
      .from("storefronts")
      .select("slug")
      .limit(5000);
    for (const row of data ?? []) {
      entries.push({
        url: `${appUrl}/${row.slug}`,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  } catch {
    // sem banco no build — sitemap mínimo já é válido
  }

  return entries;
}
