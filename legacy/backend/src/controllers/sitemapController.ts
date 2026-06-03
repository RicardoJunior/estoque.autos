import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Generate XML sitemap for a tenant's public pages
 * GET /api/public/:slug/sitemap.xml
 */
export const generateSitemap = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Find tenant by slug
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, updated_at')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return res
        .status(404)
        .send('<?xml version="1.0" encoding="UTF-8"?><error>Store not found</error>');
    }

    // Get all available vehicles for this tenant
    const { data: vehicles, error: vehiclesError } = await supabaseAdmin
      .from('vehicles')
      .select('id, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('status', 'available')
      .order('updated_at', { ascending: false });

    if (vehiclesError) {
      return res
        .status(500)
        .send('<?xml version="1.0" encoding="UTF-8"?><error>Error fetching vehicles</error>');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const currentDate = new Date().toISOString();

    // Build sitemap XML
    const urls: string[] = [];

    // Landing page (highest priority, changes frequently)
    urls.push(`
  <url>
    <loc>${baseUrl}/${slug}</loc>
    <lastmod>${tenant.updated_at || currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

    // Vehicle detail pages (medium-high priority)
    vehicles?.forEach((vehicle) => {
      urls.push(`
  <url>
    <loc>${baseUrl}/${slug}/vehicles/${vehicle.id}</loc>
    <lastmod>${vehicle.updated_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res
      .status(500)
      .send('<?xml version="1.0" encoding="UTF-8"?><error>Internal server error</error>');
  }
};
