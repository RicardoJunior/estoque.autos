import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/auth"],
    },
    // O blog (Astro, servido em /blog) gera o próprio sitemap.
    sitemap: [`${base}/sitemap.xml`, `${base}/blog/sitemap-index.xml`],
    host: base,
  };
}
