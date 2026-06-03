/**
 * Marketplace Adapter Interface
 *
 * Base interface that all marketplace integrations must implement.
 * This follows the adapter pattern to standardize marketplace operations.
 */

export interface VehiclePublicationData {
  vehicleId: string;
  tenantId: string;
  brand: string;
  model: string;
  version: string;
  yearFabrication: number;
  yearModel: number;
  plate: string;
  color: string;
  fuel: 'gasoline' | 'ethanol' | 'flex' | 'diesel' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic' | 'cvt' | 'automated';
  mileage: number;
  doors?: number;
  power?: number;
  category: 'car' | 'motorcycle' | 'utility' | 'truck';
  description: string;
  optionals: Record<string, boolean>;
  salePrice: number;
  photos: Array<{ url: string; order: number; is_primary: boolean }>;
}

export interface MarketplacePublicationResult {
  success: boolean;
  marketplaceId?: string; // External ID from the marketplace
  externalUrl?: string; // Public URL on the marketplace
  error?: string;
  errorDetails?: Record<string, any>;
}

export interface MarketplaceUpdateResult {
  success: boolean;
  error?: string;
  errorDetails?: Record<string, any>;
}

export interface MarketplaceRemovalResult {
  success: boolean;
  error?: string;
  errorDetails?: Record<string, any>;
}

export interface MarketplaceLead {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  vehicleId: string; // Our internal vehicle ID
  marketplaceLeadId?: string; // Lead ID from the marketplace
  channel: string; // Marketplace name
}

export interface MarketplaceConnectionTest {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Base interface for all marketplace adapters
 */
export interface IMarketplaceAdapter {
  /**
   * Name of the marketplace (e.g., "webmotors", "olx", "icarros", "mercadolivre")
   */
  readonly name: string;

  /**
   * Test the connection to the marketplace API
   * @param credentials - Marketplace-specific credentials
   */
  testConnection(credentials: Record<string, any>): Promise<MarketplaceConnectionTest>;

  /**
   * Publish a vehicle to the marketplace
   * @param vehicleData - Vehicle data to publish
   * @param credentials - Marketplace credentials from config
   */
  publish(
    vehicleData: VehiclePublicationData,
    credentials: Record<string, any>
  ): Promise<MarketplacePublicationResult>;

  /**
   * Update an existing vehicle listing on the marketplace
   * @param marketplaceId - External ID of the listing
   * @param vehicleData - Updated vehicle data
   * @param credentials - Marketplace credentials from config
   */
  update(
    marketplaceId: string,
    vehicleData: VehiclePublicationData,
    credentials: Record<string, any>
  ): Promise<MarketplaceUpdateResult>;

  /**
   * Remove a vehicle listing from the marketplace
   * @param marketplaceId - External ID of the listing
   * @param credentials - Marketplace credentials from config
   */
  remove(
    marketplaceId: string,
    credentials: Record<string, any>
  ): Promise<MarketplaceRemovalResult>;

  /**
   * Parse and receive leads from the marketplace
   * This can be called from a webhook or email parser
   * @param payload - Raw payload from the marketplace
   * @param credentials - Marketplace credentials from config
   */
  receiveLeads?(payload: any, credentials: Record<string, any>): Promise<MarketplaceLead[]>;
}
