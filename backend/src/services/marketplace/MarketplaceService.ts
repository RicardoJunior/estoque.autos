/**
 * Marketplace Service
 * Factory and orchestration service for marketplace integrations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MarketplacePlatform,
  MarketplaceAdapter,
  MarketplaceVehicleData,
  MarketplacePublishResult,
  MarketplaceConfig,
} from '../../types/marketplace';
import { WebmotorsAdapter } from './WebmotorsAdapter';
import { OLXAdapter } from './OLXAdapter';

export class MarketplaceService {
  private adapters: Map<MarketplacePlatform, MarketplaceAdapter> = new Map();

  constructor(
    private supabase: SupabaseClient,
    private tenantId: string
  ) {}

  /**
   * Initialize adapters for all active marketplace configurations
   */
  async initialize(): Promise<void> {
    const { data: configs, error } = await this.supabase
      .from('marketplace_configs')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to load marketplace configurations: ${error.message}`);
    }

    for (const config of configs || []) {
      const adapter = this.createAdapter(config);
      if (adapter) {
        this.adapters.set(config.platform, adapter);
      }
    }
  }

  /**
   * Create an adapter instance for a specific marketplace
   */
  private createAdapter(config: MarketplaceConfig): MarketplaceAdapter | null {
    switch (config.platform) {
      case 'webmotors':
        return new WebmotorsAdapter(config.credentials, this.tenantId);
      case 'olx':
        return new OLXAdapter(config.credentials, this.tenantId);
      case 'icarros':
        // TODO: Implement iCarros adapter
        return null;
      case 'mercado_livre':
        // TODO: Implement Mercado Livre adapter
        return null;
      default:
        console.warn(`Unknown marketplace platform: ${config.platform}`);
        return null;
    }
  }

  /**
   * Get adapter for a specific platform
   */
  getAdapter(platform: MarketplacePlatform): MarketplaceAdapter | undefined {
    return this.adapters.get(platform);
  }

  /**
   * Publish a vehicle to selected marketplaces
   */
  async publishVehicle(
    vehicleData: MarketplaceVehicleData,
    platforms: MarketplacePlatform[]
  ): Promise<Map<MarketplacePlatform, MarketplacePublishResult>> {
    const results = new Map<MarketplacePlatform, MarketplacePublishResult>();

    for (const platform of platforms) {
      const adapter = this.adapters.get(platform);
      if (!adapter) {
        results.set(platform, {
          success: false,
          error: `No adapter configured for ${platform}`,
        });
        continue;
      }

      try {
        const result = await adapter.publish(vehicleData);
        results.set(platform, result);

        // Log the operation
        await this.logMarketplaceOperation(
          vehicleData.vehicleId,
          platform,
          'publish',
          result.success ? 'success' : 'error',
          result.error
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.set(platform, {
          success: false,
          error: errorMessage,
        });

        await this.logMarketplaceOperation(
          vehicleData.vehicleId,
          platform,
          'publish',
          'error',
          errorMessage
        );
      }
    }

    return results;
  }

  /**
   * Update a vehicle on selected marketplaces
   */
  async updateVehicle(
    vehicleData: MarketplaceVehicleData,
    marketplaceIds: Record<MarketplacePlatform, string>
  ): Promise<Map<MarketplacePlatform, MarketplacePublishResult>> {
    const results = new Map<MarketplacePlatform, MarketplacePublishResult>();

    for (const [platform, externalId] of Object.entries(marketplaceIds) as Array<
      [MarketplacePlatform, string]
    >) {
      const adapter = this.adapters.get(platform);
      if (!adapter) {
        results.set(platform, {
          success: false,
          error: `No adapter configured for ${platform}`,
        });
        continue;
      }

      try {
        const result = await adapter.update(vehicleData, externalId);
        results.set(platform, result);

        await this.logMarketplaceOperation(
          vehicleData.vehicleId,
          platform,
          'update',
          result.success ? 'success' : 'error',
          result.error
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.set(platform, {
          success: false,
          error: errorMessage,
        });

        await this.logMarketplaceOperation(
          vehicleData.vehicleId,
          platform,
          'update',
          'error',
          errorMessage
        );
      }
    }

    return results;
  }

  /**
   * Remove a vehicle from selected marketplaces
   */
  async removeVehicle(
    vehicleId: string,
    marketplaceIds: Record<MarketplacePlatform, string>
  ): Promise<Map<MarketplacePlatform, MarketplacePublishResult>> {
    const results = new Map<MarketplacePlatform, MarketplacePublishResult>();

    for (const [platform, externalId] of Object.entries(marketplaceIds) as Array<
      [MarketplacePlatform, string]
    >) {
      const adapter = this.adapters.get(platform);
      if (!adapter) {
        results.set(platform, {
          success: false,
          error: `No adapter configured for ${platform}`,
        });
        continue;
      }

      try {
        const result = await adapter.remove(externalId);
        results.set(platform, result);

        await this.logMarketplaceOperation(
          vehicleId,
          platform,
          'remove',
          result.success ? 'success' : 'error',
          result.error
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.set(platform, {
          success: false,
          error: errorMessage,
        });

        await this.logMarketplaceOperation(vehicleId, platform, 'remove', 'error', errorMessage);
      }
    }

    return results;
  }

  /**
   * Test connection for a specific marketplace
   */
  async testConnection(
    platform: MarketplacePlatform
  ): Promise<{ success: boolean; error?: string }> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      return {
        success: false,
        error: `No adapter configured for ${platform}`,
      };
    }

    return adapter.testConnection();
  }

  /**
   * Log marketplace operation to database
   */
  private async logMarketplaceOperation(
    vehicleId: string,
    platform: MarketplacePlatform,
    action: string,
    status: 'success' | 'error',
    errorDetail?: string
  ): Promise<void> {
    try {
      await this.supabase.from('marketplace_logs').insert({
        vehicle_id: vehicleId,
        platform,
        action,
        status,
        error_detail: errorDetail || null,
      });
    } catch (error) {
      console.error('Failed to log marketplace operation:', error);
    }
  }
}
