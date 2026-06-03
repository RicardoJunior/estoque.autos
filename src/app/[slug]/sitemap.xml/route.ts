import { getStorefront, listPublicVehicles } from "@/lib/public";

/** Sitemap por loja: landing + cada veículo exposto. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return new Response("Not found", { status: 404 });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const vehicles = await listPublicVehicles(store.id);

  const urls = [
    `<url><loc>${base}/${slug}</loc><changefreq>daily</changefreq></url>`,
    ...vehicles.map(
      (v) =>
        `<url><loc>${base}/${slug}/carros/${v.id}</loc><lastmod>${new Date(
          v.created_at,
        ).toISOString()}</lastmod></url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
