import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createSupabaseClient } from '../config/supabase';

/**
 * Validation schema for lead listing query parameters
 */
const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['new', 'in_progress', 'negotiating', 'converted', 'lost']).optional(),
  assigned_to: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  channel: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'name', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

/**
 * Validation schema for lead status update
 */
const updateLeadStatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'negotiating', 'converted', 'lost']),
  lost_reason: z.string().max(255).optional(),
});

/**
 * Validation schema for lead assignment
 */
const assignLeadSchema = z.object({
  assigned_to: z.string().uuid().nullable(),
});

/**
 * GET /api/leads
 * List all leads for the authenticated user's tenant with filters
 */
export const listLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenant_id;
    const userRole = req.user?.role;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Validate query parameters
    const query = listLeadsQuerySchema.parse(req.query);

    const supabase = createSupabaseClient(req.user!.access_token);

    // Build query
    let supabaseQuery = supabase.from('leads').select(
      `
        *,
        vehicle:vehicles(id, brand, model, version, year_model, photos, sale_price),
        assigned_user:users!leads_assigned_to_fkey(id, name, email),
        interactions:lead_interactions(count)
      `,
      { count: 'exact' }
    );

    // If seller role, only show their assigned leads
    if (userRole === 'seller') {
      supabaseQuery = supabaseQuery.eq('assigned_to', userId);
    }

    // Apply filters
    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    if (query.assigned_to) {
      supabaseQuery = supabaseQuery.eq('assigned_to', query.assigned_to);
    }

    if (query.vehicle_id) {
      supabaseQuery = supabaseQuery.eq('vehicle_id', query.vehicle_id);
    }

    if (query.channel) {
      supabaseQuery = supabaseQuery.eq('channel', query.channel);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query.search}%,email.ilike.%${query.search}%,phone.ilike.%${query.search}%`
      );
    }

    if (query.start_date) {
      supabaseQuery = supabaseQuery.gte('created_at', query.start_date);
    }

    if (query.end_date) {
      supabaseQuery = supabaseQuery.lte('created_at', query.end_date);
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(query.sort_by, {
      ascending: query.sort_order === 'asc',
    });

    // Apply pagination
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data: leads, error, count } = await supabaseQuery;

    if (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ error: 'Erro ao buscar leads' });
      return;
    }

    res.json({
      leads,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    console.error('Error in listLeads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/leads/:id
 * Get lead details with full interaction history
 */
export const getLeadById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const supabase = createSupabaseClient(req.user!.access_token);

    const { data: lead, error } = await supabase
      .from('leads')
      .select(
        `
        *,
        vehicle:vehicles(id, brand, model, version, year_model, year_fab, photos, sale_price, status),
        assigned_user:users!leads_assigned_to_fkey(id, name, email, phone),
        interactions:lead_interactions(
          id,
          type,
          content,
          created_at,
          user:users(id, name)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Lead não encontrado' });
        return;
      }
      console.error('Error fetching lead:', error);
      res.status(500).json({ error: 'Erro ao buscar lead' });
      return;
    }

    // If seller, verify they can only access their assigned leads
    if (userRole === 'seller' && lead.assigned_to !== userId) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    res.json({ lead });
  } catch (error) {
    console.error('Error in getLeadById:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * PATCH /api/leads/:id/status
 * Update lead status
 */
export const updateLeadStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Validate request body
    const validatedData = updateLeadStatusSchema.parse(req.body);

    // Require lost_reason when marking as lost
    if (validatedData.status === 'lost' && !validatedData.lost_reason) {
      res.status(400).json({ error: 'Motivo é obrigatório ao marcar lead como perdido' });
      return;
    }

    const supabase = createSupabaseClient(req.user!.access_token);

    // Check if lead exists and user has permission
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('id, assigned_to')
      .eq('id', id)
      .single();

    if (fetchError || !existingLead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }

    // If seller, verify they can only update their assigned leads
    if (userRole === 'seller' && existingLead.assigned_to !== userId) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    // Update lead status
    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        status: validatedData.status,
        lost_reason: validatedData.lost_reason || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status do lead' });
      return;
    }

    res.json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    console.error('Error in updateLeadStatus:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * PATCH /api/leads/:id/assign
 * Assign lead to a user
 */
export const assignLead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Validate request body
    const validatedData = assignLeadSchema.parse(req.body);

    const supabase = createSupabaseClient(req.user!.access_token);

    // Verify lead exists
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingLead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }

    // If assigning to a user, verify user exists and belongs to same tenant
    if (validatedData.assigned_to) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', validatedData.assigned_to)
        .single();

      if (userError || !user) {
        res.status(400).json({ error: 'Usuário não encontrado' });
        return;
      }
    }

    // Update lead assignment
    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        assigned_to: validatedData.assigned_to,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error assigning lead:', error);
      res.status(500).json({ error: 'Erro ao atribuir lead' });
      return;
    }

    res.json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    console.error('Error in assignLead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * POST /api/leads/:id/interactions
 * Add interaction to lead (note, call, visit)
 */
export const addLeadInteraction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Validate interaction data
    const interactionSchema = z.object({
      type: z.enum(['note', 'call', 'visit', 'proposal']),
      content: z.string().min(1).max(1000),
    });

    const validatedData = interactionSchema.parse(req.body);

    const supabase = createSupabaseClient(req.user!.access_token);

    // Verify lead exists
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingLead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }

    // Create interaction
    const { data: interaction, error } = await supabase
      .from('lead_interactions')
      .insert({
        lead_id: id,
        user_id: userId,
        type: validatedData.type,
        content: validatedData.content,
      })
      .select(
        `
        *,
        user:users(id, name)
      `
      )
      .single();

    if (error) {
      console.error('Error creating interaction:', error);
      res.status(500).json({ error: 'Erro ao criar interação' });
      return;
    }

    res.status(201).json({ interaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    console.error('Error in addLeadInteraction:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
