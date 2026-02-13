import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

// Public endpoint validation - no auth required
const publicVehicleQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  category: z.enum(['car', 'motorcycle', 'utility', 'truck']).optional(),
  brand: z.string().optional(),
  min_price: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  max_price: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  min_year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  max_year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  fuel: z.enum(['gasoline', 'ethanol', 'flex', 'diesel', 'electric', 'hybrid']).optional(),
  transmission: z.enum(['manual', 'automatic', 'automated', 'cvt']).optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'sale_price', 'mileage', 'year_model'])
    .optional()
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  featured_only: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Get public vehicles by tenant slug
 * Endpoint: GET /public/:slug/vehicles
 * Returns only available vehicles without financial data
 */
export const getPublicVehicles = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const query = publicVehicleQuerySchema.parse(req.query);

    // First, get tenant by slug
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, logo_url, phone, whatsapp, email, address, settings')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Build query for vehicles - only return available status
    let queryBuilder = supabaseAdmin
      .from('vehicles')
      .select(
        `
        id,
        brand,
        model,
        version,
        year_fab,
        year_model,
        color,
        fuel,
        transmission,
        mileage,
        doors,
        power,
        category,
        description,
        optionals,
        sale_price,
        status,
        featured,
        photos,
        created_at
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', tenant.id)
      .eq('status', 'available'); // Only show available vehicles

    // Apply filters
    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }
    if (query.brand) {
      queryBuilder = queryBuilder.ilike('brand', `%${query.brand}%`);
    }
    if (query.fuel) {
      queryBuilder = queryBuilder.eq('fuel', query.fuel);
    }
    if (query.transmission) {
      queryBuilder = queryBuilder.eq('transmission', query.transmission);
    }
    if (query.min_price !== undefined) {
      queryBuilder = queryBuilder.gte('sale_price', query.min_price);
    }
    if (query.max_price !== undefined) {
      queryBuilder = queryBuilder.lte('sale_price', query.max_price);
    }
    if (query.min_year !== undefined) {
      queryBuilder = queryBuilder.gte('year_model', query.min_year);
    }
    if (query.max_year !== undefined) {
      queryBuilder = queryBuilder.lte('year_model', query.max_year);
    }
    if (query.featured_only) {
      queryBuilder = queryBuilder.eq('featured', true);
    }
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `brand.ilike.%${query.search}%,model.ilike.%${query.search}%,version.ilike.%${query.search}%`
      );
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(query.sort_by, { ascending: query.sort_order === 'asc' });

    // Apply pagination
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data: vehicles, error: vehiclesError, count } = await queryBuilder;

    if (vehiclesError) {
      console.error('Error fetching public vehicles:', vehiclesError);
      return res.status(400).json({ error: vehiclesError.message });
    }

    const totalPages = Math.ceil((count || 0) / query.limit);

    res.json({
      store: {
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        phone: tenant.phone,
        whatsapp: tenant.whatsapp,
        email: tenant.email,
        address: tenant.address,
      },
      vehicles,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error in getPublicVehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get public vehicle details by ID
 * Endpoint: GET /public/:slug/vehicles/:id
 * Returns only available vehicles without financial data
 */
export const getPublicVehicleById = async (req: Request, res: Response) => {
  try {
    const { slug, id } = req.params;

    // First, get tenant by slug
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, logo_url, phone, whatsapp, email, address, settings')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get vehicle - only if available
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select(
        `
        id,
        brand,
        model,
        version,
        year_fab,
        year_model,
        color,
        fuel,
        transmission,
        mileage,
        doors,
        power,
        category,
        description,
        optionals,
        sale_price,
        status,
        featured,
        photos,
        created_at
      `
      )
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .eq('status', 'available')
      .single();

    if (vehicleError) {
      if (vehicleError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found or not available' });
      }
      console.error('Error fetching public vehicle:', vehicleError);
      return res.status(400).json({ error: vehicleError.message });
    }

    res.json({
      store: {
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        phone: tenant.phone,
        whatsapp: tenant.whatsapp,
        email: tenant.email,
        address: tenant.address,
      },
      vehicle,
    });
  } catch (error) {
    console.error('Error in getPublicVehicleById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
