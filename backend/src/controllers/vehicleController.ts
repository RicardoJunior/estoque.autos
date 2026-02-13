import { Response } from 'express';
import { z } from 'zod';
import { createSupabaseClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

// Validation schemas
const createVehicleSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  version: z.string().optional(),
  year_fab: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  year_model: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 2),
  plate: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
  fuel: z.enum(['gasoline', 'ethanol', 'flex', 'diesel', 'electric', 'hybrid']),
  transmission: z.enum(['manual', 'automatic', 'automated', 'cvt']),
  mileage: z.number().int().min(0),
  doors: z.number().int().min(2).max(5).optional(),
  power: z.string().optional(),
  category: z.enum(['car', 'motorcycle', 'utility', 'truck']),
  description: z.string().optional(),
  optionals: z.array(z.string()).optional(),
  purchase_price: z.number().min(0),
  expenses: z.record(z.number()).optional(),
  sale_price: z.number().min(0),
  max_discount: z.number().min(0).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'inactive']).default('available'),
  featured: z.boolean().default(false),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        order: z.number().int().min(0),
        is_primary: z.boolean(),
      })
    )
    .optional(),
});

const updateVehicleSchema = createVehicleSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['available', 'reserved', 'sold', 'inactive']),
});

const vehicleQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  status: z.enum(['available', 'reserved', 'sold', 'inactive']).optional(),
  category: z.enum(['car', 'motorcycle', 'utility', 'truck']).optional(),
  brand: z.string().optional(),
  min_price: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  max_price: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  min_year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  max_year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  search: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'sale_price', 'mileage', 'year_model'])
    .optional()
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Create a new vehicle
 */
export const createVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createVehicleSchema.parse(req.body);
    const userId = req.user!.id;
    const tenantId = req.user!.tenant_id;

    // Create user-scoped Supabase client
    const supabase = createSupabaseClient(req.user!.access_token);

    // Calculate gross margin
    const totalExpenses = validatedData.expenses
      ? Object.values(validatedData.expenses).reduce((sum, val) => sum + val, 0)
      : 0;
    const grossMargin = validatedData.sale_price - validatedData.purchase_price - totalExpenses;

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({
        ...validatedData,
        tenant_id: tenantId,
        created_by: userId,
        gross_margin: grossMargin,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      return res.status(400).json({ error: error.message });
    }

    // AUTOMATIC CASH FLOW ENTRIES
    // 1. Create expense entry for vehicle purchase
    const vehicleLabel =
      `${validatedData.brand} ${validatedData.model} ${validatedData.version || ''} ${validatedData.year_model}`.trim();

    await supabase.from('cash_flow_entries').insert({
      tenant_id: tenantId,
      type: 'expense',
      category: 'Compra de Veículo',
      description: `Aquisição - ${vehicleLabel}`,
      amount: validatedData.purchase_price,
      reference_id: vehicle.id,
      reference_type: 'vehicle',
      entry_date: new Date().toISOString().split('T')[0],
      created_by: userId,
    });

    // 2. Create expense entries for each vehicle expense
    if (validatedData.expenses && Object.keys(validatedData.expenses).length > 0) {
      const expenseEntries = Object.entries(validatedData.expenses).map(([category, amount]) => ({
        tenant_id: tenantId,
        type: 'expense' as const,
        category: category,
        description: `${category} - ${vehicleLabel}`,
        amount: amount,
        reference_id: vehicle.id,
        reference_type: 'vehicle',
        entry_date: new Date().toISOString().split('T')[0],
        created_by: userId,
      }));

      await supabase.from('cash_flow_entries').insert(expenseEntries);
    }

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error in createVehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all vehicles with filters and pagination
 */
export const getVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const query = vehicleQuerySchema.parse(req.query);
    const tenantId = req.user!.tenant_id;

    // Create user-scoped Supabase client
    const supabase = createSupabaseClient(req.user!.access_token);

    // Build query
    let queryBuilder = supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Apply filters
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }
    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }
    if (query.brand) {
      queryBuilder = queryBuilder.ilike('brand', `%${query.brand}%`);
    }
    if (query.min_price !== undefined) {
      queryBuilder = queryBuilder.gte('sale_price', query.min_price);
    }
    if (query.max_price !== undefined) {
      queryBuilder = queryBuilder.lte('sale_price', query.max_price);
    }
    if (query.min_year !== undefined) {
      queryBuilder = queryBuilder.gte('year_model', query.min_year);
    }
    if (query.max_year !== undefined) {
      queryBuilder = queryBuilder.lte('year_model', query.max_year);
    }
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `brand.ilike.%${query.search}%,model.ilike.%${query.search}%,plate.ilike.%${query.search}%`
      );
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(query.sort_by, { ascending: query.sort_order === 'asc' });

    // Apply pagination
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data: vehicles, error, count } = await queryBuilder;

    if (error) {
      console.error('Error fetching vehicles:', error);
      return res.status(400).json({ error: error.message });
    }

    const totalPages = Math.ceil((count || 0) / query.limit);

    res.json({
      vehicles,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error in getVehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a single vehicle by ID
 */
export const getVehicleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenant_id;

    // Create user-scoped Supabase client
    const supabase = createSupabaseClient(req.user!.access_token);

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select(
        `
        *,
        created_by_user:users!vehicles_created_by_fkey(id, name, email),
        status_log:vehicle_status_log(*)
      `
      )
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      console.error('Error fetching vehicle:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Error in getVehicleById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a vehicle
 */
export const updateVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateVehicleSchema.parse(req.body);
    const userId = req.user!.id;
    const tenantId = req.user!.tenant_id;

    // Create user-scoped Supabase client
    const supabase = createSupabaseClient(req.user!.access_token);

    // Get current vehicle data
    const { data: currentVehicle } = await supabase
      .from('vehicles')
      .select('brand, model, version, year_model, purchase_price, sale_price, expenses')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!currentVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Recalculate gross margin if financial data changed
    const updates: Record<string, unknown> = { ...validatedData };

    if (
      validatedData.purchase_price !== undefined ||
      validatedData.sale_price !== undefined ||
      validatedData.expenses !== undefined
    ) {
      const purchasePrice = validatedData.purchase_price ?? currentVehicle.purchase_price;
      const salePrice = validatedData.sale_price ?? currentVehicle.sale_price;
      const expenses = validatedData.expenses ?? currentVehicle.expenses ?? {};

      const totalExpenses = Object.values(expenses).reduce(
        (sum: number, val) => sum + (val as number),
        0
      );
      updates.gross_margin = salePrice - purchasePrice - totalExpenses;
    }

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      console.error('Error updating vehicle:', error);
      return res.status(400).json({ error: error.message });
    }

    // AUTOMATIC CASH FLOW ENTRIES UPDATE
    const vehicleLabel =
      `${vehicle.brand} ${vehicle.model} ${vehicle.version || ''} ${vehicle.year_model}`.trim();

    // Update purchase price cash flow entry if changed
    if (
      validatedData.purchase_price !== undefined &&
      validatedData.purchase_price !== currentVehicle.purchase_price
    ) {
      // Delete old purchase entry
      await supabase
        .from('cash_flow_entries')
        .delete()
        .eq('reference_id', id)
        .eq('reference_type', 'vehicle')
        .eq('category', 'Compra de Veículo');

      // Create new purchase entry
      await supabase.from('cash_flow_entries').insert({
        tenant_id: tenantId,
        type: 'expense',
        category: 'Compra de Veículo',
        description: `Aquisição - ${vehicleLabel}`,
        amount: validatedData.purchase_price,
        reference_id: id,
        reference_type: 'vehicle',
        entry_date: new Date().toISOString().split('T')[0],
        created_by: userId,
      });
    }

    // Update expenses cash flow entries if changed
    if (validatedData.expenses !== undefined) {
      const newExpenses = validatedData.expenses;

      // Delete all old expense entries (except purchase)
      await supabase
        .from('cash_flow_entries')
        .delete()
        .eq('reference_id', id)
        .eq('reference_type', 'vehicle')
        .neq('category', 'Compra de Veículo');

      // Create new expense entries
      if (Object.keys(newExpenses).length > 0) {
        const expenseEntries = Object.entries(newExpenses).map(([category, amount]) => ({
          tenant_id: tenantId,
          type: 'expense' as const,
          category: category,
          description: `${category} - ${vehicleLabel}`,
          amount: amount,
          reference_id: id,
          reference_type: 'vehicle',
          entry_date: new Date().toISOString().split('T')[0],
          created_by: userId,
        }));

        await supabase.from('cash_flow_entries').insert(expenseEntries);
      }
    }

    res.json({
      message: 'Vehicle updated successfully',
      vehicle,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error in updateVehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update vehicle status
 */
export const updateVehicleStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);
    const userId = req.user!.id;
    const tenantId = req.user!.tenant_id;

    // Create user-scoped Supabase client
    const supabase = createSupabaseClient(req.user!.access_token);

    // Get current status
    const { data: currentVehicle } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!currentVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const oldStatus = currentVehicle.status;

    // Update status
    const { data: vehicle, error: updateError } = await supabase
      .from('vehicles')
      .update({ status })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating vehicle status:', updateError);
      return res.status(400).json({ error: updateError.message });
    }

    // Log status change
    const { error: logError } = await supabase.from('vehicle_status_log').insert({
      vehicle_id: id,
      old_status: oldStatus,
      new_status: status,
      changed_by: userId,
    });

    if (logError) {
      console.error('Error logging status change:', logError);
      // Don't fail the request if logging fails
    }

    res.json({
      message: 'Vehicle status updated successfully',
      vehicle,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error in updateVehicleStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a vehicle (soft delete by setting status to inactive)
 */
export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenant_id;

    // Create user-scoped Supabase client
    const supabase = createSupabaseClient(req.user!.access_token);

    // Soft delete by setting status to inactive
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({ status: 'inactive' })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      console.error('Error deleting vehicle:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Vehicle deleted successfully',
      vehicle,
    });
  } catch (error) {
    console.error('Error in deleteVehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
