-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM users
        WHERE auth_id = auth.uid()
        AND role = required_role
    );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Tenants policies
CREATE POLICY "Users can view their own tenant"
    ON tenants FOR SELECT
    USING (id = get_user_tenant_id());

CREATE POLICY "Owners can update their tenant"
    ON tenants FOR UPDATE
    USING (id = get_user_tenant_id() AND has_role('owner'));

-- Users policies
CREATE POLICY "Users can view users in their tenant"
    ON users FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Owners and managers can insert users"
    ON users FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND (has_role('owner') OR has_role('manager'))
    );

CREATE POLICY "Owners and managers can update users"
    ON users FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id()
        AND (has_role('owner') OR has_role('manager'))
    );

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth_id = auth.uid());

-- Vehicles policies
CREATE POLICY "Users can view vehicles in their tenant"
    ON vehicles FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Authorized users can insert vehicles"
    ON vehicles FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND (has_role('owner') OR has_role('manager'))
    );

CREATE POLICY "Authorized users can update vehicles"
    ON vehicles FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id()
        AND (has_role('owner') OR has_role('manager'))
    );

CREATE POLICY "Authorized users can delete vehicles"
    ON vehicles FOR DELETE
    USING (
        tenant_id = get_user_tenant_id()
        AND has_role('owner')
    );

-- Vehicle status log policies
CREATE POLICY "Users can view status log in their tenant"
    ON vehicle_status_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = vehicle_status_log.vehicle_id
            AND vehicles.tenant_id = get_user_tenant_id()
        )
    );

CREATE POLICY "System can insert status log"
    ON vehicle_status_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = vehicle_status_log.vehicle_id
            AND vehicles.tenant_id = get_user_tenant_id()
        )
    );

-- Leads policies
CREATE POLICY "Users can view leads in their tenant"
    ON leads FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can insert leads"
    ON leads FOR INSERT
    WITH CHECK (true); -- Public endpoint creates leads

CREATE POLICY "Authorized users can update leads"
    ON leads FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id()
        AND (has_role('owner') OR has_role('manager') OR assigned_to IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        ))
    );

-- Lead interactions policies
CREATE POLICY "Users can view interactions in their tenant"
    ON lead_interactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = lead_interactions.lead_id
            AND leads.tenant_id = get_user_tenant_id()
        )
    );

CREATE POLICY "Users can insert interactions"
    ON lead_interactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = lead_interactions.lead_id
            AND leads.tenant_id = get_user_tenant_id()
        )
    );

-- Sales policies
CREATE POLICY "Users can view sales in their tenant"
    ON sales FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Authorized users can insert sales"
    ON sales FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND (has_role('owner') OR has_role('manager'))
    );

CREATE POLICY "Owners can update sales"
    ON sales FOR UPDATE
    USING (tenant_id = get_user_tenant_id() AND has_role('owner'));

-- Cash flow policies
CREATE POLICY "Owners and managers can view cash flow"
    ON cash_flow_entries FOR SELECT
    USING (
        tenant_id = get_user_tenant_id()
        AND (has_role('owner') OR has_role('manager'))
    );

CREATE POLICY "Owners and managers can insert cash flow"
    ON cash_flow_entries FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND (has_role('owner') OR has_role('manager'))
    );

CREATE POLICY "Owners can update cash flow"
    ON cash_flow_entries FOR UPDATE
    USING (tenant_id = get_user_tenant_id() AND has_role('owner'));

-- Marketplace configs policies
CREATE POLICY "Owners can view marketplace configs"
    ON marketplace_configs FOR SELECT
    USING (tenant_id = get_user_tenant_id() AND has_role('owner'));

CREATE POLICY "Owners can manage marketplace configs"
    ON marketplace_configs FOR ALL
    USING (tenant_id = get_user_tenant_id() AND has_role('owner'));

-- Marketplace logs policies
CREATE POLICY "Users can view marketplace logs"
    ON marketplace_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = marketplace_logs.vehicle_id
            AND vehicles.tenant_id = get_user_tenant_id()
        )
    );

CREATE POLICY "System can insert marketplace logs"
    ON marketplace_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = marketplace_logs.vehicle_id
            AND vehicles.tenant_id = get_user_tenant_id()
        )
    );
