/**
 * Marketplace Adapter Interface
 *
 * This interface defines the contract that all marketplace integrations must implement.
 * Each marketplace (Webmotors, OLX, iCarros, Mercado Livre) will have its own adapter
 * that implements this interface.
 */

export interface VehicleData {
  id: string;
  brand: string;
  model: string;
  version?: string;
  year_fab: number;
  year_model: number;
  color: string;
  fuel: string;
  transmission: string;
  mileage: number;
  doors?: number;
  power?: number;
  category: string;
  description?: string;
  optionals?: Record<string, boolean>;
  sale_price: number;
  photos: Array<{
    url: string;
    order: number;
    is_primary: boolean;
  }>;
  plate?: string;
}

export interface LeadData {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  vehicle_id: string;
  type: 'proposal' | 'whatsapp' | 'phone';
  proposal_value?: number;
  trade_vehicle?: string;
}

export interface MarketplaceConfig {
  tenant_id: string;
  platform: string;
  credentials: Record<string, string>;
  is_active: boolean;
}

export interface PublishResult {
  success: boolean;
  marketplace_vehicle_id?: string;
  error?: string;
  details?: string;
}

export interface UpdateResult {
  success: boolean;
  error?: string;
  details?: string;
}

export interface RemoveResult {
  success: boolean;
  error?: string;
  details?: string;
}

export interface TestConnectionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Base Marketplace Adapter Interface
 *
 * All marketplace integrations must implement this interface.
 * This ensures a consistent API for interacting with different marketplaces.
 */
export interface IMarketplaceAdapter {
  /**
   * Name of the marketplace (e.g., 'webmotors', 'olx', 'icarros', 'mercado_livre')
   */
  readonly name: string;

  /**
   * Initialize the adapter with configuration
   */
  initialize(config: MarketplaceConfig): Promise<void>;

  /**
   * Test connection with the marketplace API
   */
  testConnection(): Promise<TestConnectionResult>;

  /**
   * Publish a vehicle to the marketplace
   */
  publish(vehicle: VehicleData): Promise<PublishResult>;

  /**
   * Update a vehicle listing on the marketplace
   */
  update(marketplaceVehicleId: string, vehicle: VehicleData): Promise<UpdateResult>;

  /**
   * Remove a vehicle listing from the marketplace
   */
  remove(marketplaceVehicleId: string): Promise<RemoveResult>;

  /**
   * Receive leads from the marketplace (webhook handler)
   * This method processes incoming lead data from the marketplace
   */
  receiveLead(payload: unknown): Promise<LeadData | null>;

  /**
   * Validate credentials for the marketplace
   */
  validateCredentials(credentials: Record<string, string>): boolean;

  /**
   * Get required credential fields for configuration
   */
  getRequiredFields(): Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder?: string;
    required: boolean;
  }>;
}

/**
 * Abstract Base Adapter
 *
 * Provides common functionality for all marketplace adapters.
 * Concrete adapters should extend this class.
 */
export abstract class BaseMarketplaceAdapter implements IMarketplaceAdapter {
  protected config?: MarketplaceConfig;

  abstract readonly name: string;

  async initialize(config: MarketplaceConfig): Promise<void> {
    if (!this.validateCredentials(config.credentials)) {
      throw new Error(`Invalid credentials for ${this.name}`);
    }
    this.config = config;
  }

  abstract testConnection(): Promise<TestConnectionResult>;
  abstract publish(vehicle: VehicleData): Promise<PublishResult>;
  abstract update(marketplaceVehicleId: string, vehicle: VehicleData): Promise<UpdateResult>;
  abstract remove(marketplaceVehicleId: string): Promise<RemoveResult>;
  abstract receiveLead(payload: unknown): Promise<LeadData | null>;
  abstract validateCredentials(credentials: Record<string, string>): boolean;
  abstract getRequiredFields(): Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder?: string;
    required: boolean;
  }>;

  /**
   * Helper method to check if adapter is initialized
   */
  protected ensureInitialized(): void {
    if (!this.config) {
      throw new Error(`${this.name} adapter not initialized`);
    }
  }

  /**
   * Helper method to map vehicle data to marketplace-specific format
   * Concrete adapters should override this method
   */
  protected mapVehicleData(vehicle: VehicleData): unknown {
    return vehicle;
  }

  /**
   * Helper method to map marketplace lead data to our format
   * Concrete adapters should override this method
   */
  protected mapLeadData(_payload: unknown): LeadData | null {
    return null;
  }
}

/**
 * Marketplace Adapter Factory
 *
 * Creates the appropriate adapter instance based on the platform name.
 */
export class MarketplaceAdapterFactory {
  private static adapters = new Map<string, new () => IMarketplaceAdapter>();

  /**
   * Register a new marketplace adapter
   */
  static register(platform: string, adapter: new () => IMarketplaceAdapter): void {
    this.adapters.set(platform.toLowerCase(), adapter);
  }

  /**
   * Create an adapter instance for the specified platform
   */
  static create(platform: string): IMarketplaceAdapter {
    const AdapterClass = this.adapters.get(platform.toLowerCase());
    if (!AdapterClass) {
      throw new Error(`No adapter registered for platform: ${platform}`);
    }
    return new AdapterClass();
  }

  /**
   * Get list of all registered platforms
   */
  static getRegisteredPlatforms(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a platform is registered
   */
  static isRegistered(platform: string): boolean {
    return this.adapters.has(platform.toLowerCase());
  }
}
