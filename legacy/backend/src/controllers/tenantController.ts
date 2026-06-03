import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createSupabaseClient } from '../config/supabase';

// Validation schemas
const updateTenantSettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(3)
    .max(50)
    .optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  template_id: z.enum(['classic', 'modern', 'premium']).optional(),
  colors: z
    .object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    })
    .optional(),
  settings: z.record(z.any()).optional(),
});

const updateLogoSchema = z.object({
  logo_url: z.string().url(),
});

/**
 * Get tenant settings
 * GET /api/tenant/settings
 */
export const getTenantSettings = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID not found' });
    }

    const supabase = createSupabaseClient(req.user!.access_token);

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching tenant:', error);
      return res.status(500).json({ message: 'Error fetching tenant settings' });
    }

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    return res.json({ tenant });
  } catch (error) {
    console.error('Error in getTenantSettings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update tenant settings
 * PATCH /api/tenant/settings
 */
export const updateTenantSettings = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID not found' });
    }

    // Validate request body
    const validatedData = updateTenantSettingsSchema.parse(req.body);

    // If slug is being updated, check uniqueness
    if (validatedData.slug) {
      const supabase = createSupabaseClient(req.user!.access_token);

      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', validatedData.slug)
        .neq('id', tenantId)
        .single();

      if (existingTenant) {
        return res.status(409).json({ message: 'Slug already in use' });
      }
    }

    const supabase = createSupabaseClient(req.user!.access_token);

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(validatedData)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant:', error);
      return res.status(500).json({ message: 'Error updating tenant settings' });
    }

    return res.json({ tenant, message: 'Tenant settings updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }

    console.error('Error in updateTenantSettings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update tenant logo
 * PATCH /api/tenant/logo
 */
export const updateTenantLogo = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID not found' });
    }

    // Validate request body
    const validatedData = updateLogoSchema.parse(req.body);

    const supabase = createSupabaseClient(req.user!.access_token);

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({ logo_url: validatedData.logo_url })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating logo:', error);
      return res.status(500).json({ message: 'Error updating logo' });
    }

    return res.json({ tenant, message: 'Logo updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }

    console.error('Error in updateTenantLogo:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
