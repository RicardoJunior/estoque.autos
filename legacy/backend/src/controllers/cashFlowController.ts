import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createSupabaseClient } from '../config/supabase';

// Helper to get access token from AuthRequest
function getAccessToken(req: AuthRequest): string | undefined {
  return req.user?.access_token;
}

// Validation schemas
const createCashFlowSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  entry_date: z.string().datetime().optional(),
});

const listCashFlowSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['entry_date', 'amount', 'created_at']).optional().default('entry_date'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Create manual cash flow entry
 * POST /api/cash-flow
 */
export async function createCashFlowEntry(req: AuthRequest, res: Response) {
  try {
    const validatedData = createCashFlowSchema.parse(req.body);
    const userId = req.user?.id;
    const tenantId = req.user?.tenant_id;
    const accessToken = getAccessToken(req);

    if (!userId || !tenantId || !accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createSupabaseClient(accessToken);

    // Create cash flow entry
    const { data: entry, error } = await supabase
      .from('cash_flow_entries')
      .insert({
        tenant_id: tenantId,
        type: validatedData.type,
        category: validatedData.category,
        description: validatedData.description,
        amount: validatedData.amount,
        entry_date: validatedData.entry_date || new Date().toISOString(),
        reference_id: null,
        reference_type: 'manual',
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cash flow entry:', error);
      return res.status(500).json({ error: 'Failed to create cash flow entry' });
    }

    return res.status(201).json({ entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }
    console.error('Error in createCashFlowEntry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * List cash flow entries with filters
 * GET /api/cash-flow
 */
export async function listCashFlowEntries(req: AuthRequest, res: Response) {
  try {
    const validatedQuery = listCashFlowSchema.parse(req.query);
    const tenantId = req.user?.tenant_id;
    const accessToken = getAccessToken(req);

    if (!tenantId || !accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createSupabaseClient(accessToken);

    // Build query
    let query = supabase
      .from('cash_flow_entries')
      .select('*, created_by_user:users!cash_flow_entries_created_by_fkey(id, name, email)', {
        count: 'exact',
      })
      .eq('tenant_id', tenantId);

    // Apply filters
    if (validatedQuery.type) {
      query = query.eq('type', validatedQuery.type);
    }

    if (validatedQuery.category) {
      query = query.eq('category', validatedQuery.category);
    }

    if (validatedQuery.start_date) {
      query = query.gte('entry_date', validatedQuery.start_date);
    }

    if (validatedQuery.end_date) {
      query = query.lte('entry_date', validatedQuery.end_date);
    }

    if (validatedQuery.search) {
      query = query.or(
        `description.ilike.%${validatedQuery.search}%,category.ilike.%${validatedQuery.search}%`
      );
    }

    // Apply sorting
    query = query.order(validatedQuery.sort_by, { ascending: validatedQuery.sort_order === 'asc' });

    // Apply pagination
    const from = (validatedQuery.page - 1) * validatedQuery.limit;
    const to = from + validatedQuery.limit - 1;
    query = query.range(from, to);

    const { data: entries, error, count } = await query;

    if (error) {
      console.error('Error fetching cash flow entries:', error);
      return res.status(500).json({ error: 'Failed to fetch cash flow entries' });
    }

    return res.json({
      entries: entries || [],
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / validatedQuery.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }
    console.error('Error in listCashFlowEntries:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get cash flow entry by ID
 * GET /api/cash-flow/:id
 */
export async function getCashFlowEntry(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const accessToken = getAccessToken(req);

    if (!tenantId || !accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createSupabaseClient(accessToken);

    const { data: entry, error } = await supabase
      .from('cash_flow_entries')
      .select('*, created_by_user:users!cash_flow_entries_created_by_fkey(id, name, email)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !entry) {
      return res.status(404).json({ error: 'Cash flow entry not found' });
    }

    return res.json({ entry });
  } catch (error) {
    console.error('Error in getCashFlowEntry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete cash flow entry (manual entries only)
 * DELETE /api/cash-flow/:id
 */
export async function deleteCashFlowEntry(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const accessToken = getAccessToken(req);

    if (!tenantId || !accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createSupabaseClient(accessToken);

    // First, verify the entry exists and is manual
    const { data: entry, error: fetchError } = await supabase
      .from('cash_flow_entries')
      .select('id, reference_type')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !entry) {
      return res.status(404).json({ error: 'Cash flow entry not found' });
    }

    // Only allow deletion of manual entries
    if (entry.reference_type !== 'manual') {
      return res.status(403).json({
        error:
          'Cannot delete automatic cash flow entries. These are linked to sales or vehicle expenses.',
      });
    }

    // Delete the entry
    const { error: deleteError } = await supabase
      .from('cash_flow_entries')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Error deleting cash flow entry:', deleteError);
      return res.status(500).json({ error: 'Failed to delete cash flow entry' });
    }

    return res.json({ message: 'Cash flow entry deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCashFlowEntry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get cash flow summary (income vs expenses for a period)
 * GET /api/cash-flow/summary
 */
export async function getCashFlowSummary(req: AuthRequest, res: Response) {
  try {
    const { start_date, end_date } = req.query;
    const tenantId = req.user?.tenant_id;
    const accessToken = getAccessToken(req);

    if (!tenantId || !accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createSupabaseClient(accessToken);

    // Build query
    let query = supabase.from('cash_flow_entries').select('type, amount').eq('tenant_id', tenantId);

    if (start_date) {
      query = query.gte('entry_date', start_date as string);
    }

    if (end_date) {
      query = query.lte('entry_date', end_date as string);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error('Error fetching cash flow summary:', error);
      return res.status(500).json({ error: 'Failed to fetch cash flow summary' });
    }

    // Calculate totals
    const summary = (entries || []).reduce(
      (
        acc: { totalIncome: number; totalExpenses: number },
        entry: { type: string; amount: number }
      ) => {
        if (entry.type === 'income') {
          acc.totalIncome += entry.amount;
        } else {
          acc.totalExpenses += entry.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0 }
    );

    const balance = summary.totalIncome - summary.totalExpenses;

    return res.json({
      summary: {
        ...summary,
        balance,
      },
    });
  } catch (error) {
    console.error('Error in getCashFlowSummary:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
