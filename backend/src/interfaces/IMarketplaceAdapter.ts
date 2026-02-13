/**
 * Marketplace Adapter Interface
 *
 * This interface defines the contract that all marketplace integrations must implement.
 * Each marketplace (Webmotors, OLX, iCarros, Mercado Livre) will have its own adapter
 * that implements this interface.
 */

export interface MarketplaceCredentials {
  [key: string]: string | number | boolean;
}

export interface MarketplaceVehicleData {
  vehicleId: string;
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
  photos: Array<{
    url: string;
    order: number;
    isPrimary: boolean;
  }>;
}

export interface MarketplacePublishResult {
  success: boolean;
  externalId?: string; // ID do anúncio no marketplace
  error?: string;
  details?: Record<string, unknown>;
}

export interface MarketplaceUpdateResult {
  success: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

export interface MarketplaceRemoveResult {
  success: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

export interface MarketplaceLead {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  vehicleId: string; // ID do veículo no nosso sistema
  externalVehicleId: string; // ID do anúncio no marketplace
  channel: string; // Nome do marketplace
  createdAt: Date;
}

export interface IMarketplaceAdapter {
  /**
   * Nome do marketplace (ex: 'webmotors', 'olx', 'icarros', 'mercado_livre')
   */
  readonly name: string;

  /**
   * Configura as credenciais do marketplace
   * @param credentials Credenciais específicas do marketplace
   */
  configure(credentials: MarketplaceCredentials): void;

  /**
   * Testa a conexão com o marketplace
   * @returns Promise<boolean> true se a conexão foi bem sucedida
   */
  testConnection(): Promise<boolean>;

  /**
   * Publica um veículo no marketplace
   * @param vehicle Dados do veículo a ser publicado
   * @returns Promise com resultado da publicação
   */
  publish(vehicle: MarketplaceVehicleData): Promise<MarketplacePublishResult>;

  /**
   * Atualiza um anúncio existente no marketplace
   * @param externalId ID do anúncio no marketplace
   * @param vehicle Dados atualizados do veículo
   * @returns Promise com resultado da atualização
   */
  update(externalId: string, vehicle: MarketplaceVehicleData): Promise<MarketplaceUpdateResult>;

  /**
   * Remove um anúncio do marketplace
   * @param externalId ID do anúncio no marketplace
   * @returns Promise com resultado da remoção
   */
  remove(externalId: string): Promise<MarketplaceRemoveResult>;

  /**
   * Recebe leads do marketplace via webhook ou polling
   * @returns Promise com array de leads recebidos
   */
  receiveLeads(): Promise<MarketplaceLead[]>;
}
