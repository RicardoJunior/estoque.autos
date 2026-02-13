import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

// Validation schemas
const dashboardQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(), // Format: YYYY-MM
});

/**
 * GET /api/financial/dashboard
 * Get financial dashboard KPIs for current month or specified month
 */
export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const { month } = dashboardQuerySchema.parse(req.query);

    // Determine the month to query
    const targetDate = month ? new Date(month + '-01') : new Date();
    const year = targetDate.getFullYear();
    const monthNum = targetDate.getMonth() + 1;
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const endDate = new Date(year, monthNum, 0); // Last day of month
    const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    const tenantId = req.user.tenant_id;

    // 1. Total revenue (sales) for the month
    const { data: salesData } = await supabaseAdmin
      .from('sales')
      .select('final_price, gross_margin')
      .eq('tenant_id', tenantId)
      .gte('sold_at', startDate)
      .lte('sold_at', endDateStr + 'T23:59:59');

    const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.final_price || 0), 0) || 0;
    const totalGrossMargin =
      salesData?.reduce((sum, sale) => sum + (sale.gross_margin || 0), 0) || 0;
    const salesCount = salesData?.length || 0;

    // 2. Total inventory value (available and reserved vehicles)
    const { data: inventoryData } = await supabaseAdmin
      .from('vehicles')
      .select('sale_price, purchase_price, expenses')
      .eq('tenant_id', tenantId)
      .in('status', ['available', 'reserved']);

    const inventorySaleValue =
      inventoryData?.reduce((sum, vehicle) => sum + (vehicle.sale_price || 0), 0) || 0;
    const inventoryCostValue =
      inventoryData?.reduce((sum, vehicle) => {
        const expenses = (vehicle.expenses as Array<{ description: string; amount: number }>) || [];
        const totalExpenses = expenses.reduce((expSum, exp) => expSum + (exp.amount || 0), 0);
        return sum + (vehicle.purchase_price || 0) + totalExpenses;
      }, 0) || 0;
    const inventoryCount = inventoryData?.length || 0;

    // 3. Active leads count
    const { data: leadsData } = await supabaseAdmin
      .from('leads')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .in('status', ['new', 'in_progress', 'negotiating']);

    const activeLeadsCount = leadsData?.length || 0;

    // 4. Conversion rate (leads converted / total leads in period)
    const { data: allLeadsInPeriod } = await supabaseAdmin
      .from('leads')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate)
      .lte('created_at', endDateStr + 'T23:59:59');

    const totalLeadsInPeriod = allLeadsInPeriod?.length || 0;
    const convertedLeadsInPeriod =
      allLeadsInPeriod?.filter((lead) => lead.status === 'converted').length || 0;
    const conversionRate =
      totalLeadsInPeriod > 0 ? (convertedLeadsInPeriod / totalLeadsInPeriod) * 100 : 0;

    // 5. Average ticket (average sale value)
    const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;

    // 6. Average margin percentage
    const averageMarginPercentage = totalRevenue > 0 ? (totalGrossMargin / totalRevenue) * 100 : 0;

    // 7. Monthly evolution (last 12 months)
    const monthlyEvolutionData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const evYear = date.getFullYear();
      const evMonth = date.getMonth() + 1;
      const evStartDate = `${evYear}-${String(evMonth).padStart(2, '0')}-01`;
      const evEndDate = new Date(evYear, evMonth, 0);
      const evEndDateStr = `${evYear}-${String(evMonth).padStart(2, '0')}-${String(evEndDate.getDate()).padStart(2, '0')}`;

      const { data: monthSales } = await supabaseAdmin
        .from('sales')
        .select('final_price, gross_margin')
        .eq('tenant_id', tenantId)
        .gte('sold_at', evStartDate)
        .lte('sold_at', evEndDateStr + 'T23:59:59');

      const monthRevenue = monthSales?.reduce((sum, sale) => sum + (sale.final_price || 0), 0) || 0;
      const monthMargin = monthSales?.reduce((sum, sale) => sum + (sale.gross_margin || 0), 0) || 0;
      const monthSalesCount = monthSales?.length || 0;

      monthlyEvolutionData.push({
        month: `${evYear}-${String(evMonth).padStart(2, '0')}`,
        revenue: monthRevenue,
        margin: monthMargin,
        salesCount: monthSalesCount,
      });
    }

    // 8. Top 5 vehicles by margin (sold in period)
    const { data: topVehicles } = await supabaseAdmin
      .from('sales')
      .select(
        `
        id,
        gross_margin,
        final_price,
        vehicles (
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
      .gte('sold_at', startDate)
      .lte('sold_at', endDateStr + 'T23:59:59')
      .order('gross_margin', { ascending: false })
      .limit(5);

    // 9. Vehicles in stock for too long (> 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];

    const { data: staleVehicles } = await supabaseAdmin
      .from('vehicles')
      .select('id, brand, model, version, year_model, created_at, photos, sale_price')
      .eq('tenant_id', tenantId)
      .eq('status', 'available')
      .lte('created_at', sixtyDaysAgoStr)
      .order('created_at', { ascending: true })
      .limit(5);

    res.json({
      period: {
        month: `${year}-${String(monthNum).padStart(2, '0')}`,
        start: startDate,
        end: endDateStr,
      },
      kpis: {
        revenue: totalRevenue,
        grossMargin: totalGrossMargin,
        salesCount,
        inventorySaleValue,
        inventoryCostValue,
        inventoryCount,
        activeLeadsCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageTicket,
        averageMarginPercentage: Math.round(averageMarginPercentage * 100) / 100,
      },
      monthlyEvolution: monthlyEvolutionData,
      topVehicles: topVehicles || [],
      staleVehicles: staleVehicles || [],
    });
  } catch (error) {
    next(error);
  }
};
