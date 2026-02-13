// User roles
export type UserRole = 'owner' | 'manager' | 'seller';

// User type
export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

// Tenant type
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  logo_url?: string;
  template_id?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  settings?: Record<string, unknown>;
  created_at: string;
}

// Vehicle status
export type VehicleStatus = 'available' | 'reserved' | 'sold' | 'inactive';

// Vehicle category
export type VehicleCategory = 'car' | 'motorcycle' | 'utility' | 'truck';

// Transmission type
export type TransmissionType = 'manual' | 'automatic' | 'cvt' | 'automated';

// Fuel type
export type FuelType = 'gasoline' | 'ethanol' | 'flex' | 'diesel' | 'electric' | 'hybrid';

// Photo type
export interface Photo {
  url: string;
  order: number;
  is_primary: boolean;
}

// Vehicle type
export interface Vehicle {
  id: string;
  tenant_id: string;
  brand: string;
  model: string;
  version?: string;
  year_fab: number;
  year_model: number;
  plate?: string;
  color: string;
  fuel: FuelType;
  transmission: TransmissionType;
  mileage: number;
  doors?: number;
  power?: string;
  category: VehicleCategory;
  description?: string;
  optionals?: Record<string, boolean>;
  purchase_price?: number;
  expenses?: { description: string; amount: number }[];
  sale_price: number;
  max_discount?: number;
  status: VehicleStatus;
  featured: boolean;
  photos?: Photo[];
  marketplace_ids?: Record<string, string>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Lead status
export type LeadStatus = 'new' | 'in_progress' | 'negotiating' | 'converted' | 'lost';

// Lead type
export type LeadType = 'proposal' | 'whatsapp' | 'phone';

// Lead channel
export type LeadChannel =
  | 'landing_page'
  | 'webmotors'
  | 'olx'
  | 'icarros'
  | 'mercado_livre'
  | 'manual';

// Lead type
export interface Lead {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  name: string;
  phone: string;
  email?: string;
  type: LeadType;
  proposal_value?: number;
  trade_vehicle?: string;
  channel: LeadChannel;
  status: LeadStatus;
  lost_reason?: string;
  assigned_to?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device?: string;
  created_at: string;
}

// Sale type
export interface Sale {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  lead_id?: string;
  seller_id: string;
  buyer_name: string;
  buyer_document: string;
  buyer_phone: string;
  buyer_email?: string;
  final_price: number;
  payment_method: string;
  trade_value?: number;
  commission_value?: number;
  gross_margin?: number;
  notes?: string;
  sold_at: string;
  created_at: string;
}

// Financial Dashboard types
export interface FinancialKPIs {
  revenue: number;
  grossMargin: number;
  salesCount: number;
  inventorySaleValue: number;
  inventoryCostValue: number;
  inventoryCount: number;
  activeLeadsCount: number;
  conversionRate: number;
  averageTicket: number;
  averageMarginPercentage: number;
}

export interface MonthlyEvolution {
  month: string;
  revenue: number;
  margin: number;
  salesCount: number;
}

export interface DashboardData {
  period: {
    month: string;
    start: string;
    end: string;
  };
  kpis: FinancialKPIs;
  monthlyEvolution: MonthlyEvolution[];
  topVehicles: Array<{
    id: string;
    gross_margin: number;
    final_price: number;
    vehicles: {
      id: string;
      brand: string;
      model: string;
      version?: string;
      year_model: number;
      photos?: Photo[];
    };
  }>;
  staleVehicles: Array<{
    id: string;
    brand: string;
    model: string;
    version?: string;
    year_model: number;
    created_at: string;
    photos?: Photo[];
    sale_price: number;
  }>;
}

// Auth state (for backward compatibility - actual interface is in authStore.ts)
export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
}
