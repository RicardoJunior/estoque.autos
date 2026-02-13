// User roles
export type UserRole = 'owner' | 'manager' | 'seller';

// Cash flow types
export type CashFlowType = 'income' | 'expense';

export interface CashFlowEntry {
  id: string;
  tenant_id: string;
  type: CashFlowType;
  category: string;
  description: string;
  amount: number;
  entry_date: string;
  reference_id?: string;
  reference_type?: string;
  created_by: string;
  created_at: string;
  created_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

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
  commission_percentage?: number;
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

// Margin Report types
export interface MarginReportSale {
  id: string;
  sold_at: string;
  final_price: number;
  gross_margin: number;
  margin_percentage: number;
  total_cost: number;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    version?: string;
    year_model: number;
    purchase_price: number;
    total_expenses: number;
    photo?: string | null;
  } | null;
  seller: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface MarginReportSummary {
  total_sales: number;
  total_revenue: number;
  total_cost: number;
  total_margin: number;
  average_margin: number;
  average_margin_percentage: number;
  best_margin: {
    vehicle: string;
    margin: number;
    percentage: number;
  } | null;
  worst_margin: {
    vehicle: string;
    margin: number;
    percentage: number;
  } | null;
}

export interface MarginReportData {
  period: {
    start: string;
    end: string;
  };
  summary: MarginReportSummary;
  sales: MarginReportSale[];
}

// Turnover Report Types
export interface TurnoverVehicle {
  id: string;
  brand: string;
  model: string;
  version: string;
  year_model: number;
  photo: string | null;
  created_at: string;
  sold_at: string | null;
  days_in_stock: number;
  final_price: number | null;
  gross_margin: number | null;
  status: 'sold' | 'available' | 'reserved';
}

export interface TurnoverReportSummary {
  average_days_to_sell: number;
  total_sold_in_period: number;
  current_inventory_count: number;
  stale_vehicles_count: number; // > 60 days
  critical_vehicles_count: number; // > 90 days
  turnover_rate: number; // vehicles sold per month
  fastest_sale: {
    vehicle: string;
    days: number;
  } | null;
  slowest_sale: {
    vehicle: string;
    days: number;
  } | null;
}

export interface TurnoverReportData {
  period: {
    start: string;
    end: string;
  };
  summary: TurnoverReportSummary;
  sold_vehicles: TurnoverVehicle[];
  current_inventory: TurnoverVehicle[];
}

// Seller Dashboard types
export interface SellerDashboardData {
  period: {
    start: string;
    end: string;
    month: string;
  };
  currentPeriod: {
    leads: {
      total: number;
      new: number;
      inProgress: number;
      negotiating: number;
      converted: number;
      lost: number;
      conversionRate: number;
    };
    sales: {
      total: number;
      revenue: number;
      margin: number;
      commission: number;
      averageTicket: number;
    };
    recentLeads: Array<{
      id: string;
      name: string;
      phone: string;
      email: string;
      status: string;
      type: string;
      created_at: string;
      vehicle: {
        id: string;
        brand: string;
        model: string;
        version?: string;
        year_model: number;
      } | null;
    }>;
    recentSales: Array<{
      id: string;
      final_price: number;
      gross_margin: number;
      commission_value: number;
      sold_at: string;
      vehicle: {
        id: string;
        brand: string;
        model: string;
        version?: string;
        year_model: number;
        photos?: Photo[];
      } | null;
    }>;
  };
  allTime: {
    totalSales: number;
    totalRevenue: number;
    totalCommission: number;
    totalLeads: number;
    conversionRate: number;
  };
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
