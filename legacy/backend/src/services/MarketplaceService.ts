/**
 * Marketplace Service
 *
 * Manages marketplace integrations, vehicle publishing, and lead reception.
 * Coordinates between the database and marketplace adapters.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  IMarketplaceAdapter,
  MarketplaceAdapterFactory,
  VehicleData,
  PublishResult,
  UpdateResult,
  RemoveResult,
} from './marketplaceAdapter';
import { WebmotorsAdapter } from './adapters/WebmotorsAdapter';
import { OLXAdapter } from './adapters/OLXAdapter';

// Register all available adapters
MarketplaceAdapterFactory.register('webmotors', WebmotorsAdapter);
MarketplaceAdapterFactory.register('olx', OLXAdapter);

export class MarketplaceService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get marketplace configuration for a tenant
   */
  async getMarketplaceConfig(tenantId: string, platform: string) {
    const { data, error } = await this.supabase
      .from('marketplace_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('platform', platform)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all marketplace configurations for a tenant
   */
  async getAllMarketplaceConfigs(tenantId: string) {
    const { data, error } = await this.supabase
      .from('marketplace_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('platform');

    if (error) throw error;
    return data || [];
  }

  /**
   * Initialize an adapter with configuration
   */
  async getAdapter(tenantId: string, platform: string): Promise<IMarketplaceAdapter> {
    const config = await this.getMarketplaceConfig(tenantId, platform);

    if (!config || !config.is_active) {
      throw new Error(`Marketplace ${platform} is not configured or inactive`);
    }

    const adapter = MarketplaceAdapterFactory.create(platform);
    await adapter.initialize(config);

    return adapter;
  }

  /**
   * Publish a vehicle to a specific marketplace
   */
  async publishVehicle(
    tenantId: string,
    vehicleId: string,
    platform: string
  ): Promise<PublishResult> {
    try {
      // Get vehicle data
      const { data: vehicle, error: vehicleError } = await this.supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('tenant_id', tenantId)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('Vehicle not found');
      }

      // Get adapter
      const adapter = await this.getAdapter(tenantId, platform);

      // Publish to marketplace
      const result = await adapter.publish(vehicle as VehicleData);

      // Log the operation
      await this.logMarketplaceOperation(
        vehicleId,
        platform,
        'publish',
        result.success ? 'success' : 'error',
        result.error
      );

      // Update vehicle's marketplace_ids if successful
      if (result.success && result.marketplace_vehicle_id) {
        const marketplaceIds = (vehicle.marketplace_ids as Record<string, string>) || {};
        marketplaceIds[platform] = result.marketplace_vehicle_id;

        await this.supabase
          .from('vehicles')
          .update({ marketplace_ids: marketplaceIds })
          .eq('id', vehicleId);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logMarketplaceOperation(vehicleId, platform, 'publish', 'error', errorMessage);
      throw error;
    }
  }

  /**
   * Update a vehicle on a specific marketplace
   */
  async updateVehicle(
    tenantId: string,
    vehicleId: string,
    platform: string
  ): Promise<UpdateResult> {
    try {
      // Get vehicle data
      const { data: vehicle, error: vehicleError } = await this.supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('tenant_id', tenantId)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('Vehicle not found');
      }

      // Get marketplace vehicle ID
      const marketplaceIds = (vehicle.marketplace_ids as Record<string, string>) || {};
      const marketplaceVehicleId = marketplaceIds[platform];

      if (!marketplaceVehicleId) {
        throw new Error(`Vehicle not published to ${platform}`);
      }

      // Get adapter
      const adapter = await this.getAdapter(tenantId, platform);

      // Update on marketplace
      const result = await adapter.update(marketplaceVehicleId, vehicle as VehicleData);

      // Log the operation
      await this.logMarketplaceOperation(
        vehicleId,
        platform,
        'update',
        result.success ? 'success' : 'error',
        result.error
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logMarketplaceOperation(vehicleId, platform, 'update', 'error', errorMessage);
      throw error;
    }
  }

  /**
   * Remove a vehicle from a specific marketplace
   */
  async removeVehicle(
    tenantId: string,
    vehicleId: string,
    platform: string
  ): Promise<RemoveResult> {
    try {
      // Get vehicle data
      const { data: vehicle, error: vehicleError } = await this.supabase
        .from('vehicles')
        .select('marketplace_ids')
        .eq('id', vehicleId)
        .eq('tenant_id', tenantId)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('Vehicle not found');
      }

      // Get marketplace vehicle ID
      const marketplaceIds = (vehicle.marketplace_ids as Record<string, string>) || {};
      const marketplaceVehicleId = marketplaceIds[platform];

      if (!marketplaceVehicleId) {
        throw new Error(`Vehicle not published to ${platform}`);
      }

      // Get adapter
      const adapter = await this.getAdapter(tenantId, platform);

      // Remove from marketplace
      const result = await adapter.remove(marketplaceVehicleId);

      // Log the operation
      await this.logMarketplaceOperation(
        vehicleId,
        platform,
        'remove',
        result.success ? 'success' : 'error',
        result.error
      );

      // Remove from vehicle's marketplace_ids if successful
      if (result.success) {
        delete marketplaceIds[platform];

        await this.supabase
          .from('vehicles')
          .update({ marketplace_ids: marketplaceIds })
          .eq('id', vehicleId);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logMarketplaceOperation(vehicleId, platform, 'remove', 'error', errorMessage);
      throw error;
    }
  }

  /**
   * Sync vehicle status across all active marketplaces
   */
  async syncVehicleStatus(tenantId: string, vehicleId: string, status: string): Promise<void> {
    const { data: vehicle } = await this.supabase
      .from('vehicles')
      .select('marketplace_ids')
      .eq('id', vehicleId)
      .eq('tenant_id', tenantId)
      .single();

    if (!vehicle) return;

    const marketplaceIds = (vehicle.marketplace_ids as Record<string, string>) || {};
    const platforms = Object.keys(marketplaceIds);

    // If vehicle is sold or inactive, remove from all marketplaces
    if (status === 'sold' || status === 'inactive') {
      for (const platform of platforms) {
        try {
          await this.removeVehicle(tenantId, vehicleId, platform);
        } catch (error) {
          console.error(`Failed to remove vehicle from ${platform}:`, error);
        }
      }
    }
    // If vehicle is available or reserved, update on all marketplaces
    else if (status === 'available' || status === 'reserved') {
      for (const platform of platforms) {
        try {
          await this.updateVehicle(tenantId, vehicleId, platform);
        } catch (error) {
          console.error(`Failed to update vehicle on ${platform}:`, error);
        }
      }
    }
  }

  /**
   * Log a marketplace operation
   */
  private async logMarketplaceOperation(
    vehicleId: string,
    platform: string,
    action: string,
    status: string,
    errorDetail?: string
  ): Promise<void> {
    await this.supabase.from('marketplace_logs').insert({
      vehicle_id: vehicleId,
      platform,
      action,
      status,
      error_detail: errorDetail,
    });
  }

  /**
   * Get marketplace logs for a vehicle
   */
  async getVehicleLogs(vehicleId: string, platform?: string) {
    let query = this.supabase
      .from('marketplace_logs')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get all available marketplace platforms
   */
  getAvailablePlatforms(): string[] {
    return MarketplaceAdapterFactory.getRegisteredPlatforms();
  }
}
