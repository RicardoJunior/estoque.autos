import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createSupabaseClient } from '../config/supabase';

/**
 * Validation schema for sale creation
 */
const createSaleSchema = z.object({
  vehicle_id: z.string().uuid(),
  lead_id: z.string().uuid().optional().nullable(),
  seller_id: z.string().uuid(),
  buyer_name: z.string().min(2).max(255),
  buyer_document: z.string().min(11).max(18),
  buyer_phone: z.string().min(10).max(20),
  buyer_email: z.string().email().max(255),
  final_price: z.number().positive(),
  payment_method: z.enum(['cash', 'financing', 'consortium', 'trade_and_cash']),
  trade_value: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  sold_at: z.string().optional(), // ISO date string
});

/**
 * Validation schema for sale listing query parameters
 */
const listSalesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  seller_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  sort_by: z.enum(['sold_at', 'final_price', 'gross_margin']).default('sold_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

/**
 * POST /api/sales
 * Create a new sale and perform post-sale automations
 */
export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenant_id;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Validate request body
    const saleData = createSaleSchema.parse(req.body);

    const supabase = createSupabaseClient(req.user!.access_token);

    // 1. Verify vehicle exists and belongs to tenant
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, purchase_price, expenses, sale_price, tenant_id')
      .eq('id', saleData.vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      res.status(404).json({ error: 'Veículo não encontrado' });
      return;
    }

    // 2. Verify seller exists and belongs to tenant
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id, name, tenant_id')
      .eq('id', saleData.seller_id)
      .single();

    if (sellerError || !seller) {
      res.status(404).json({ error: 'Vendedor não encontrado' });
      return;
    }

    // 3. Calculate gross margin and commission
    const totalExpenses = Array.isArray(vehicle.expenses)
      ? vehicle.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
      : 0;

    const grossMargin = saleData.final_price - vehicle.purchase_price - totalExpenses;

    // TODO: Get commission percentage from user settings (default to 0 for now)
    const commissionValue = 0;

    // 4. Create sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        tenant_id: tenantId,
        vehicle_id: saleData.vehicle_id,
        lead_id: saleData.lead_id || null,
        seller_id: saleData.seller_id,
        buyer_name: saleData.buyer_name,
        buyer_document: saleData.buyer_document,
        buyer_phone: saleData.buyer_phone,
        buyer_email: saleData.buyer_email,
        final_price: saleData.final_price,
        payment_method: saleData.payment_method,
        trade_value: saleData.trade_value || null,
        commission_value: commissionValue,
        gross_margin: grossMargin,
        notes: saleData.notes || null,
        sold_at: saleData.sold_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (saleError) {
      console.error('Error creating sale:', saleError);
      res.status(500).json({ error: 'Erro ao criar venda' });
      return;
    }

    // 5. POST-SALE AUTOMATIONS

    // 5.1. Update vehicle status to 'sold'
    const { error: vehicleUpdateError } = await supabase
      .from('vehicles')
      .update({ status: 'sold' })
      .eq('id', saleData.vehicle_id);

    if (vehicleUpdateError) {
      console.error('Error updating vehicle status:', vehicleUpdateError);
    }

    // 5.2. Log vehicle status change
    const { error: statusLogError } = await supabase.from('vehicle_status_log').insert({
      vehicle_id: saleData.vehicle_id,
      old_status: 'available', // Assume it was available
      new_status: 'sold',
      changed_by: userId,
    });

    if (statusLogError) {
      console.error('Error logging vehicle status:', statusLogError);
    }

    // 5.3. Update lead status to 'converted' if lead_id provided
    if (saleData.lead_id) {
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ status: 'converted' })
        .eq('id', saleData.lead_id);

      if (leadUpdateError) {
        console.error('Error updating lead status:', leadUpdateError);
      }
    }

    // 5.4. Create cash flow entry (income)
    const { error: cashFlowError } = await supabase.from('cash_flow_entries').insert({
      tenant_id: tenantId,
      type: 'income',
      category: 'vehicle_sale',
      description: `Venda de veículo - ${saleData.buyer_name}`,
      amount: saleData.final_price,
      reference_id: sale.id,
      reference_type: 'sale',
      entry_date: saleData.sold_at || new Date().toISOString(),
      created_by: userId,
    });

    if (cashFlowError) {
      console.error('Error creating cash flow entry:', cashFlowError);
    }

    res.status(201).json({ sale });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    console.error('Error in createSale:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/sales
 * List all sales for the authenticated user's tenant with filters
 */
export const listSales = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenant_id;
    const userRole = req.user?.role;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Validate query parameters
    const query = listSalesQuerySchema.parse(req.query);

    const supabase = createSupabaseClient(req.user!.access_token);

    // Build query
    let supabaseQuery = supabase.from('sales').select(
      `
        *,
        vehicle:vehicles(id, brand, model, version, year_model, photos),
        seller:users!sales_seller_id_fkey(id, name, email),
        lead:leads(id, name, phone, email)
      `,
      { count: 'exact' }
    );

    // If seller role, only show their own sales
    if (userRole === 'seller') {
      supabaseQuery = supabaseQuery.eq('seller_id', userId);
    }

    // Apply filters
    if (query.seller_id) {
      supabaseQuery = supabaseQuery.eq('seller_id', query.seller_id);
    }

    if (query.start_date) {
      supabaseQuery = supabaseQuery.gte('sold_at', query.start_date);
    }

    if (query.end_date) {
      supabaseQuery = supabaseQuery.lte('sold_at', query.end_date);
    }

    // Search in buyer name or document
    if (query.search) {
      supabaseQuery = supabaseQuery.or(
        `buyer_name.ilike.%${query.search}%,buyer_document.ilike.%${query.search}%`
      );
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(query.sort_by, { ascending: query.sort_order === 'asc' });

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    supabaseQuery = supabaseQuery.range(offset, offset + query.limit - 1);

    const { data: sales, error, count } = await supabaseQuery;

    if (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ error: 'Erro ao buscar vendas' });
      return;
    }

    res.json({
      sales,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Parâmetros inválidos', details: error.errors });
      return;
    }
    console.error('Error in listSales:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/sales/:id
 * Get a specific sale by ID
 */
export const getSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenant_id;
    const userRole = req.user?.role;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const saleId = req.params.id;

    const supabase = createSupabaseClient(req.user!.access_token);

    let query = supabase.from('sales').select(
      `
        *,
        vehicle:vehicles(id, brand, model, version, year_model, year_fab, photos, purchase_price, expenses),
        seller:users!sales_seller_id_fkey(id, name, email, phone),
        lead:leads(id, name, phone, email, type, channel)
      `
    );

    // If seller role, only allow viewing their own sales
    if (userRole === 'seller') {
      query = query.eq('seller_id', userId);
    }

    const { data: sale, error } = await query.eq('id', saleId).single();

    if (error || !sale) {
      res.status(404).json({ error: 'Venda não encontrada' });
      return;
    }

    res.json({ sale });
  } catch (error) {
    console.error('Error in getSale:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
