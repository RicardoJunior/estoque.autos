/**
 * Base Marketplace Adapter
 * Abstract base class for all marketplace integrations
 */

import type {
  MarketplaceAdapter,
  MarketplaceVehicleData,
  MarketplacePublishResult,
  MarketplaceLead,
  MarketplaceCredentials,
} from '../../types/marketplace';

export abstract class BaseMarketplaceAdapter implements MarketplaceAdapter {
  protected credentials: MarketplaceCredentials;
  protected tenantId: string;

  constructor(credentials: MarketplaceCredentials, tenantId: string) {
    this.credentials = credentials;
    this.tenantId = tenantId;
  }

  /**
   * Publish a vehicle to the marketplace
   * Must be implemented by each marketplace adapter
   */
  abstract publish(vehicleData: MarketplaceVehicleData): Promise<MarketplacePublishResult>;

  /**
   * Update a vehicle listing on the marketplace
   * Must be implemented by each marketplace adapter
   */
  abstract update(
    vehicleData: MarketplaceVehicleData,
    externalId: string
  ): Promise<MarketplacePublishResult>;

  /**
   * Remove a vehicle listing from the marketplace
   * Must be implemented by each marketplace adapter
   */
  abstract remove(externalId: string): Promise<MarketplacePublishResult>;

  /**
   * Test connection to the marketplace
   * Must be implemented by each marketplace adapter
   */
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;

  /**
   * Receive leads from the marketplace (optional)
   * Can be overridden by adapters that support lead reception
   */
  async receiveLeads(): Promise<MarketplaceLead[]> {
    return [];
  }

  /**
   * Validate credentials format
   * Can be overridden by specific adapters for custom validation
   */
  protected validateCredentials(): boolean {
    return Object.keys(this.credentials).length > 0;
  }

  /**
   * Map internal vehicle data to marketplace-specific format
   * Should be overridden by each adapter
   */
  protected mapVehicleData(vehicleData: MarketplaceVehicleData): unknown {
    return vehicleData;
  }

  /**
   * Handle API errors consistently
   */
  protected handleError(error: unknown, action: string): MarketplacePublishResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to ${action}`,
      details: errorMessage,
    };
  }
}
