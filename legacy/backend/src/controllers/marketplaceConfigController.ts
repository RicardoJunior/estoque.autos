/**
 * Marketplace Configuration Controller
 * Handles marketplace integration configuration
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth';
import { createSupabaseClient } from '../config/supabase';

// Validation schemas
const createConfigSchema = z.object({
  platform: z.enum(['webmotors', 'olx', 'icarros', 'mercado_livre']),
  credentials: z.record(z.string()),
  is_active: z.boolean().default(true),
});

const updateConfigSchema = z.object({
  credentials: z.record(z.string()).optional(),
  is_active: z.boolean().optional(),
});

const testConnectionSchema = z.object({
  platform: z.enum(['webmotors', 'olx', 'icarros', 'mercado_livre']),
  credentials: z.record(z.string()),
});

/**
 * Get all marketplace configurations for tenant
 */
export const getMarketplaceConfigs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenant_id;
    const supabase = createSupabaseClient(req.user!.access_token);

    const { data: configs, error } = await supabase
      .from('marketplace_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('platform');

    if (error) {
      res.status(500).json({ error: 'Failed to fetch marketplace configurations' });
      return;
    }

    res.json({ configs });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a specific marketplace configuration
 */
export const getMarketplaceConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const supabase = createSupabaseClient(req.user!.access_token);

    const { data: config, error } = await supabase
      .from('marketplace_configs')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !config) {
      res.status(404).json({ error: 'Marketplace configuration not found' });
      return;
    }

    res.json({ config });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create a new marketplace configuration
 */
export const createMarketplaceConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createConfigSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.error.errors,
      });
      return;
    }

    const tenantId = req.user?.tenant_id;
    const supabase = createSupabaseClient(req.user!.access_token);

    // Check if configuration already exists for this platform
    const { data: existing } = await supabase
      .from('marketplace_configs')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('platform', validation.data.platform)
      .single();

    if (existing) {
      res.status(400).json({
        error: 'Configuration already exists for this marketplace',
      });
      return;
    }

    const { data: config, error } = await supabase
      .from('marketplace_configs')
      .insert({
        tenant_id: tenantId,
        platform: validation.data.platform,
        credentials: validation.data.credentials,
        is_active: validation.data.is_active,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to create marketplace configuration' });
      return;
    }

    res.status(201).json({ config });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a marketplace configuration
 */
export const updateMarketplaceConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validation = updateConfigSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.error.errors,
      });
      return;
    }

    const tenantId = req.user?.tenant_id;
    const supabase = createSupabaseClient(req.user!.access_token);

    const { data: config, error } = await supabase
      .from('marketplace_configs')
      .update(validation.data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error || !config) {
      res.status(404).json({ error: 'Marketplace configuration not found' });
      return;
    }

    res.json({ config });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a marketplace configuration
 */
export const deleteMarketplaceConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const supabase = createSupabaseClient(req.user!.access_token);

    const { error } = await supabase
      .from('marketplace_configs')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      res.status(404).json({ error: 'Marketplace configuration not found' });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Test marketplace connection
 */
export const testMarketplaceConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = testConnectionSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.error.errors,
      });
      return;
    }

    const { platform, credentials } = validation.data;

    // Import adapters dynamically
    const { WebmotorsAdapter } = await import('../services/marketplace/WebmotorsAdapter');
    const { OLXAdapter } = await import('../services/marketplace/OLXAdapter');

    // Create adapter based on platform
    let adapter;
    const tenantId = 'test'; // Temporary tenant ID for testing

    switch (platform) {
      case 'webmotors':
        adapter = new WebmotorsAdapter(credentials, tenantId);
        break;
      case 'olx':
        adapter = new OLXAdapter(credentials, tenantId);
        break;
      case 'icarros':
      case 'mercado_livre':
        res.status(501).json({
          error: 'Not implemented',
          details: `${platform} adapter is not yet implemented`,
        });
        return;
      default:
        res.status(400).json({ error: 'Invalid platform' });
        return;
    }

    const result = await adapter.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get marketplace logs for a vehicle
 */
export const getMarketplaceLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const tenantId = req.user?.tenant_id;
    const supabase = createSupabaseClient(req.user!.access_token);

    // Verify vehicle belongs to tenant
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('tenant_id', tenantId)
      .single();

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const { data: logs, error } = await supabase
      .from('marketplace_logs')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch marketplace logs' });
      return;
    }

    res.json({ logs });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
