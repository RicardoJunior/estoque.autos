import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

// Validation schemas
const sellerDashboardQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(), // Format: YYYY-MM
});

/**
 * GET /api/seller/dashboard
 * Get seller-specific dashboard KPIs for current month or specified month
 */
export const getSellerDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const { month } = sellerDashboardQuerySchema.parse(req.query);

    const tenantId = req.user.tenant_id;
    const sellerId = req.user.id;

    // Calculate period (current month or specified month)
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0, 23, 59, 59);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // 1. Get seller's leads for the period
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('assigned_to', sellerId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (leadsError) throw leadsError;

    const totalLeads = leads?.length || 0;
    const newLeads = leads?.filter((l) => l.status === 'new').length || 0;
    const inProgressLeads = leads?.filter((l) => l.status === 'in_progress').length || 0;
    const negotiatingLeads = leads?.filter((l) => l.status === 'negotiating').length || 0;
    const convertedLeads = leads?.filter((l) => l.status === 'converted').length || 0;
    const lostLeads = leads?.filter((l) => l.status === 'lost').length || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // 2. Get seller's sales for the period
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales')
      .select(
        `
        id,
        final_price,
        gross_margin,
        commission_value,
        sold_at,
        vehicle:vehicles (
          id,
          brand,
          model,
          version,
          year_model,
          photos
        )
      `
      )
      .eq('tenant_id', tenantId)
      .eq('seller_id', sellerId)
      .gte('sold_at', startDate.toISOString())
      .lte('sold_at', endDate.toISOString())
      .order('sold_at', { ascending: false });

    if (salesError) throw salesError;

    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((sum, s) => sum + s.final_price, 0) || 0;
    const totalMargin = sales?.reduce((sum, s) => sum + s.gross_margin, 0) || 0;
    const totalCommission = sales?.reduce((sum, s) => sum + (s.commission_value || 0), 0) || 0;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // 3. Get recent leads (last 10)
    const { data: recentLeads, error: recentLeadsError } = await supabaseAdmin
      .from('leads')
      .select(
        `
        id,
        name,
        phone,
        email,
        status,
        type,
        created_at,
        vehicle:vehicles (
          id,
          brand,
          model,
          version,
          year_model
        )
      `
      )
      .eq('tenant_id', tenantId)
      .eq('assigned_to', sellerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentLeadsError) throw recentLeadsError;

    // 4. Get recent sales (last 5)
    const recentSales = sales?.slice(0, 5) || [];

    // 5. Get all-time seller statistics
    const { data: allTimeSales, error: allTimeSalesError } = await supabaseAdmin
      .from('sales')
      .select('id, final_price, gross_margin, commission_value')
      .eq('tenant_id', tenantId)
      .eq('seller_id', sellerId);

    if (allTimeSalesError) throw allTimeSalesError;

    const allTimeTotalSales = allTimeSales?.length || 0;
    const allTimeTotalRevenue = allTimeSales?.reduce((sum, s) => sum + s.final_price, 0) || 0;
    const allTimeTotalCommission =
      allTimeSales?.reduce((sum, s) => sum + (s.commission_value || 0), 0) || 0;

    const { data: allTimeLeads, error: allTimeLeadsError } = await supabaseAdmin
      .from('leads')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('assigned_to', sellerId);

    if (allTimeLeadsError) throw allTimeLeadsError;

    const allTimeTotalLeads = allTimeLeads?.length || 0;
    const allTimeConvertedLeads = allTimeLeads?.filter((l) => l.status === 'converted').length || 0;
    const allTimeConversionRate =
      allTimeTotalLeads > 0 ? (allTimeConvertedLeads / allTimeTotalLeads) * 100 : 0;

    res.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        month: month || new Date().toISOString().slice(0, 7),
      },
      currentPeriod: {
        leads: {
          total: totalLeads,
          new: newLeads,
          inProgress: inProgressLeads,
          negotiating: negotiatingLeads,
          converted: convertedLeads,
          lost: lostLeads,
          conversionRate,
        },
        sales: {
          total: totalSales,
          revenue: totalRevenue,
          margin: totalMargin,
          commission: totalCommission,
          averageTicket,
        },
        recentLeads: recentLeads || [],
        recentSales: recentSales,
      },
      allTime: {
        totalSales: allTimeTotalSales,
        totalRevenue: allTimeTotalRevenue,
        totalCommission: allTimeTotalCommission,
        totalLeads: allTimeTotalLeads,
        conversionRate: allTimeConversionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};
