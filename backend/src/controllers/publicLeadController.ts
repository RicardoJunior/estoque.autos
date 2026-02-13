import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

/**
 * Validation schema for lead creation
 */
const createLeadSchema = z.object({
  vehicle_id: z.string().uuid('ID do veículo inválido'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255),
  phone: z.string().min(10, 'Telefone inválido').max(20),
  email: z.string().email('E-mail inválido').max(255),
  type: z.enum(['proposal', 'whatsapp', 'phone'], {
    errorMap: () => ({ message: 'Tipo de lead inválido' }),
  }),
  proposal_value: z.number().positive().optional(),
  trade_vehicle: z.string().max(255).optional(),
  message: z.string().max(1000).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
});

/**
 * POST /api/public/:slug/leads
 * Create a new lead from public landing page
 * Rate limited to prevent spam
 */
export const createPublicLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    // Validate request body
    const validatedData = createLeadSchema.parse(req.body);

    // Find the tenant by slug
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      res.status(404).json({ error: 'Loja não encontrada' });
      return;
    }

    // Verify vehicle exists and belongs to this tenant
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('id, status')
      .eq('id', validatedData.vehicle_id)
      .eq('tenant_id', tenant.id)
      .single();

    if (vehicleError || !vehicle) {
      res.status(404).json({ error: 'Veículo não encontrado' });
      return;
    }

    // Capture device info from user agent
    const userAgent = req.headers['user-agent'] || '';
    let device = 'desktop';
    if (/mobile/i.test(userAgent)) {
      device = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
      device = 'tablet';
    }

    // Create lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert({
        tenant_id: tenant.id,
        vehicle_id: validatedData.vehicle_id,
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email,
        type: validatedData.type,
        proposal_value: validatedData.proposal_value,
        trade_vehicle: validatedData.trade_vehicle,
        channel: 'landing_page',
        status: 'new',
        utm_source: validatedData.utm_source,
        utm_medium: validatedData.utm_medium,
        utm_campaign: validatedData.utm_campaign,
        device,
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      res.status(500).json({ error: 'Erro ao criar lead' });
      return;
    }

    // If there's a message, create an interaction
    if (validatedData.message) {
      await supabaseAdmin.from('lead_interactions').insert({
        lead_id: lead.id,
        type: 'note',
        content: validatedData.message,
      });
    }

    res.status(201).json({
      message: 'Lead criado com sucesso',
      lead: {
        id: lead.id,
        status: lead.status,
      },
    });
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

    console.error('Error in createPublicLead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
