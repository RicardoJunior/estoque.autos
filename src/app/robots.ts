import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/auth"],
    },
    // O blog (Astro, servido em /blog) gera o próprio sitemap.
    sitemap: base
      ? [`${base}/sitemap.xml`, `${base}/blog/sitemap-index.xml`]
      : undefined,
    host: base || undefined,
  };
}
