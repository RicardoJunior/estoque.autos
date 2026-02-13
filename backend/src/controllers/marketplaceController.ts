/**
 * Marketplace Configuration Controller
 *
 * Handles marketplace integration configuration, testing, and vehicle publishing.
 */

import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createSupabaseClient } from '../config/supabase';
import { MarketplaceService } from '../services/MarketplaceService';
import { MarketplaceAdapterFactory } from '../services/marketplaceAdapter';

// Validation schemas
const configSchema = z.object({
  platform: z.string().min(1),
  credentials: z.record(z.string()),
  is_active: z.boolean().optional().default(true),
});

const testConnectionSchema = z.object({
  platform: z.string().min(1),
  credentials: z.record(z.string()),
});

const publishVehicleSchema = z.object({
  vehicle_id: z.string().uuid(),
  platforms: z.array(z.string()),
});

const syncStatusSchema = z.object({
  vehicle_id: z.string().uuid(),
  status: z.enum(['available', 'reserved', 'sold', 'inactive']),
});

/**
 * GET /api/marketplace/configs
 * Get all marketplace configurations for the tenant
 */
export async function getMarketplaceConfigs(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID not found' });
    }

    const supabase = createSupabaseClient(req.user!.access_token);
    const service = new MarketplaceService(supabase);

    const configs = await service.getAllMarketplaceConfigs(tenantId);

    // Remove sensitive credential data from response
    const sanitizedConfigs = configs.map((config) => ({
      ...config,
      credentials: undefined, // Don't send credentials to frontend
      has_credentials: Object.keys(config.credentials || {}).length > 0,
    }));

    res.json({ configs: sanitizedConfigs });
  } catch (error) {
    console.error('Error fetching marketplace configs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/marketplace/platforms
 * Get all available marketplace platforms
 */
export async function getAvailablePlatforms(req: AuthRequest, res: Response) {
  try {
    const platforms = MarketplaceAdapterFactory.getRegisteredPlatforms();

    const platformDetails = platforms.map((platform) => {
      const adapter = MarketplaceAdapterFactory.create(platform);
      return {
        name: platform,
        displayName: getDisplayName(platform),
        requiredFields: adapter.getRequiredFields(),
      };
    });

    res.json({ platforms: platformDetails });
  } catch (error) {
    console.error('Error fetching available platforms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/marketplace/configs
 * Create or update marketplace configuration
 */
export async function saveMarketplaceConfig(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID not found' });
    }

    const validatedData = configSchema.parse(req.body);

    // Validate credentials with adapter
    const adapter = MarketplaceAdapterFactory.create(validatedData.platform);
    if (!adapter.validateCredentials(validatedData.credentials)) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'Invalid credentials for this marketplace',
      });
    }

    const supabase = createSupabaseClient(req.user!.access_token);

    // Check if config already exists
    const { data: existing } = await supabase
      .from('marketplace_configs')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('platform', validatedData.platform)
      .single();

    let result;
    if (existing) {
      // Update existing config
      const { data, error } = await supabase
        .from('marketplace_configs')
        .update({
          credentials: validatedData.credentials,
          is_active: validatedData.is_active,
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('marketplace_configs')
        .insert({
          tenant_id: tenantId,
          platform: validatedData.platform,
          credentials: validatedData.credentials,
          is_active: validatedData.is_active,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Don't send credentials back
    res.json({
      config: {
        ...result,
        credentials: undefined,
        has_credentials: true,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }
    console.error('Error saving marketplace config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/marketplace/test-connection
 * Test connection to marketplace API
 */
export async function testConnection(req: AuthRequest, res: Response) {
  try {
    const validatedData = testConnectionSchema.parse(req.body);

    const adapter = MarketplaceAdapterFactory.create(validatedData.platform);

    // Initialize adapter with test credentials
    await adapter.initialize({
      tenant_id: 'test',
      platform: validatedData.platform,
      credentials: validatedData.credentials,
      is_active: true,
    });

    // Test connection
    const result = await adapter.testConnection();

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/marketplace/publish
 * Publish vehicle to one or more marketplaces
 */
export async function publishVehicle(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID not found' });
    }

    const validatedData = publishVehicleSchema.parse(req.body);

    const supabase = createSupabaseClient(req.user!.access_token);
    const service = new MarketplaceService(supabase);

    const results: Record<string, unknown> = {};

    // Publish to each platform
    for (const platform of validatedData.platforms) {
      try {
        const result = await service.publishVehicle(tenantId, validatedData.vehicle_id, platform);
        results[platform] = result;
      } catch (error) {
        results[platform] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    res.json({ results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }
    console.error('Error publishing vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/marketplace/unpublish/:vehicleId/:platform
 * Remove vehicle from a marketplace
 */
export async function unpublishVehicle(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID not found' });
    }

    const { vehicleId, platform } = req.params;

    const supabase = createSupabaseClient(req.user!.access_token);
    const service = new MarketplaceService(supabase);

    const result = await service.removeVehicle(tenantId, vehicleId, platform);

    res.json(result);
  } catch (error) {
    console.error('Error unpublishing vehicle:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/marketplace/sync-status
 * Sync vehicle status across all marketplaces
 */
export async function syncVehicleStatus(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID not found' });
    }

    const validatedData = syncStatusSchema.parse(req.body);

    const supabase = createSupabaseClient(req.user!.access_token);
    const service = new MarketplaceService(supabase);

    await service.syncVehicleStatus(tenantId, validatedData.vehicle_id, validatedData.status);

    res.json({ success: true, message: 'Status synced across marketplaces' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }
    console.error('Error syncing vehicle status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/marketplace/logs/:vehicleId
 * Get marketplace logs for a vehicle
 */
export async function getVehicleLogs(req: AuthRequest, res: Response) {
  try {
    const { vehicleId } = req.params;
    const { platform } = req.query;

    const supabase = createSupabaseClient(req.user!.access_token);
    const service = new MarketplaceService(supabase);

    const logs = await service.getVehicleLogs(vehicleId, platform as string | undefined);

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching vehicle logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Helper function to get display name for platform
 */
function getDisplayName(platform: string): string {
  const displayNames: Record<string, string> = {
    webmotors: 'Webmotors',
    olx: 'OLX',
    icarros: 'iCarros',
    mercado_livre: 'Mercado Livre',
  };
  return displayNames[platform] || platform;
}
