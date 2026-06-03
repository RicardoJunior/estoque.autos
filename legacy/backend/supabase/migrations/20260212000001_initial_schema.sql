-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-super-secret-jwt-token-with-at-least-32-characters-long';

-- Create tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cnpj VARCHAR(18),
    address JSONB,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    logo_square_url TEXT,
    logo_wide_url TEXT,
    template_id VARCHAR(50) DEFAULT 'classic',
    colors JSONB DEFAULT '{"primary": "#3B82F6", "secondary": "#10B981", "accent": "#F59E0B"}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auth_id UUID UNIQUE, -- Reference to Supabase Auth user
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'seller')),
    is_active BOOLEAN DEFAULT true,
    commission_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    version VARCHAR(150),
    year_fab INTEGER NOT NULL,
    year_model INTEGER NOT NULL,
    plate VARCHAR(10),
    color VARCHAR(50),
    fuel VARCHAR(30) CHECK (fuel IN ('gasoline', 'ethanol', 'flex', 'diesel', 'electric', 'hybrid')),
    transmission VARCHAR(30) CHECK (transmission IN ('manual', 'automatic', 'cvt', 'automated')),
    mileage INTEGER,
    doors INTEGER,
    power VARCHAR(20),
    category VARCHAR(30) NOT NULL CHECK (category IN ('car', 'motorcycle', 'utility', 'truck')),
    description TEXT,
    optionals JSONB DEFAULT '[]'::jsonb,
    purchase_price DECIMAL(12,2),
    expenses JSONB DEFAULT '[]'::jsonb,
    sale_price DECIMAL(12,2) NOT NULL,
    max_discount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'inactive')),
    featured BOOLEAN DEFAULT false,
    photos JSONB DEFAULT '[]'::jsonb,
    marketplace_ids JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicle_status_log table
CREATE TABLE vehicle_status_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    type VARCHAR(20) NOT NULL CHECK (type IN ('proposal', 'whatsapp', 'phone', 'manual')),
    proposal_value DECIMAL(12,2),
    trade_vehicle TEXT,
    channel VARCHAR(50) DEFAULT 'landing_page',
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'negotiating', 'converted', 'lost')),
    lost_reason TEXT,
    assigned_to UUID REFERENCES users(id),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    device VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lead_interactions table
CREATE TABLE lead_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('note', 'call', 'visit', 'proposal')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    lead_id UUID REFERENCES leads(id),
    seller_id UUID REFERENCES users(id),
    buyer_name VARCHAR(255) NOT NULL,
    buyer_document VARCHAR(20),
    buyer_phone VARCHAR(20),
    buyer_email VARCHAR(255),
    final_price DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    trade_value DECIMAL(12,2) DEFAULT 0,
    commission_value DECIMAL(12,2) DEFAULT 0,
    gross_margin DECIMAL(12,2),
    net_margin DECIMAL(12,2),
    notes TEXT,
    sold_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cash_flow_entries table
CREATE TABLE cash_flow_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    entry_date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create marketplace_configs table
CREATE TABLE marketplace_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('webmotors', 'olx', 'icarros', 'mercadolivre')),
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, platform)
);

-- Create marketplace_logs table
CREATE TABLE marketplace_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('publish', 'update', 'remove')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
    error_detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_created_at ON vehicles(created_at DESC);
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_vehicle_id ON leads(vehicle_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sales_sold_at ON sales(sold_at DESC);
CREATE INDEX idx_cash_flow_tenant_id ON cash_flow_entries(tenant_id);
CREATE INDEX idx_cash_flow_entry_date ON cash_flow_entries(entry_date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_configs_updated_at BEFORE UPDATE ON marketplace_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
