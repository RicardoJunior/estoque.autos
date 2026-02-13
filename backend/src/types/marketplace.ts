/**
 * Marketplace Integration Types
 * Defines the adapter pattern for marketplace integrations
 */

export type MarketplacePlatform = 'webmotors' | 'olx' | 'icarros' | 'mercado_livre';

export type MarketplaceAction = 'publish' | 'update' | 'remove';

export interface MarketplaceCredentials {
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  dealerId?: string;
  accessToken?: string;
  refreshToken?: string;
  [key: string]: string | undefined;
}

export interface MarketplaceConfig {
  id: string;
  tenant_id: string;
  platform: MarketplacePlatform;
  credentials: MarketplaceCredentials;
  is_active: boolean;
  last_sync_at: string | null;
}

export interface MarketplaceVehicleData {
  vehicleId: string;
  tenantId: string;
  brand: string;
  model: string;
  version: string;
  yearFab: number;
  yearModel: number;
  color: string;
  fuel: string;
  transmission: string;
  mileage: number;
  doors: number;
  power?: number;
  category: string;
  description: string;
  optionals: Record<string, boolean>;
  salePrice: number;
  photos: Array<{ url: string; order: number; is_primary: boolean }>;
}

export interface MarketplaceLead {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  vehicleId: string;
  proposalValue?: number;
  tradeVehicle?: string;
  channel: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface MarketplacePublishResult {
  success: boolean;
  externalId?: string;
  url?: string;
  error?: string;
  details?: string;
}

export interface MarketplaceAdapter {
  /**
   * Publish a vehicle to the marketplace
   */
  publish(vehicleData: MarketplaceVehicleData): Promise<MarketplacePublishResult>;

  /**
   * Update a vehicle listing on the marketplace
   */
  update(
    vehicleData: MarketplaceVehicleData,
    externalId: string
  ): Promise<MarketplacePublishResult>;

  /**
   * Remove a vehicle listing from the marketplace
   */
  remove(externalId: string): Promise<MarketplacePublishResult>;

  /**
   * Receive leads from the marketplace (webhook or polling)
   */
  receiveLeads?(): Promise<MarketplaceLead[]>;

  /**
   * Test connection to the marketplace
   */
  testConnection(): Promise<{ success: boolean; error?: string }>;
}
