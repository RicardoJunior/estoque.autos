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

const marginReportQuerySchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // Format: YYYY-MM-DD
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // Format: YYYY-MM-DD
  sort_by: z.enum(['gross_margin', 'margin_percentage', 'sold_at', 'final_price']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
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

/**
 * GET /api/financial/margin-report
 * Get detailed margin report for all sold vehicles
 */
export const getMarginReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const {
      start_date,
      end_date,
      sort_by = 'sold_at',
      sort_order = 'desc',
    } = marginReportQuerySchema.parse(req.query);

    const tenantId = req.user.tenant_id;

    // Default to last 30 days if no dates provided
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate =
      start_date ||
      (() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
      })();

    // Fetch all sales with vehicle details
    let query = supabaseAdmin
      .from('sales')
      .select(
        `
        id,
        final_price,
        gross_margin,
        sold_at,
        vehicles (
          id,
          brand,
          model,
          version,
          year_model,
          purchase_price,
          expenses,
          photos
        ),
        users!sales_seller_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq('tenant_id', tenantId)
      .gte('sold_at', startDate)
      .lte('sold_at', endDate + 'T23:59:59');

    // Apply sorting
    const sortColumn = sort_by === 'margin_percentage' ? 'gross_margin' : sort_by;
    query = query.order(sortColumn, { ascending: sort_order === 'asc' });

    const { data: salesData, error: salesError } = await query;

    if (salesError) {
      throw new AppError(500, 'Error fetching sales data');
    }

    // Calculate margin percentage and format data
    const salesWithMargin = (salesData || []).map((sale: any) => {
      const vehicle = sale.vehicles;
      const seller = sale.users;

      // Calculate total expenses
      const expenses = (vehicle?.expenses as Array<{ description: string; amount: number }>) || [];
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

      // Calculate margin percentage
      const marginPercentage =
        sale.final_price > 0 ? ((sale.gross_margin || 0) / sale.final_price) * 100 : 0;

      // Calculate cost (purchase price + expenses)
      const totalCost = (vehicle?.purchase_price || 0) + totalExpenses;

      return {
        id: sale.id,
        sold_at: sale.sold_at,
        final_price: sale.final_price,
        gross_margin: sale.gross_margin,
        margin_percentage: Math.round(marginPercentage * 100) / 100,
        total_cost: totalCost,
        vehicle: vehicle
          ? {
              id: vehicle.id,
              brand: vehicle.brand,
              model: vehicle.model,
              version: vehicle.version,
              year_model: vehicle.year_model,
              purchase_price: vehicle.purchase_price,
              total_expenses: totalExpenses,
              photo: (vehicle.photos as any[])?.[0]?.url || null,
            }
          : null,
        seller: seller
          ? {
              id: seller.id,
              name: seller.name,
              email: seller.email,
            }
          : null,
      };
    });

    // Sort by margin percentage if requested (manual sort since it's calculated)
    if (sort_by === 'margin_percentage') {
      salesWithMargin.sort((a, b) => {
        return sort_order === 'asc'
          ? a.margin_percentage - b.margin_percentage
          : b.margin_percentage - a.margin_percentage;
      });
    }

    // Calculate summary statistics
    const totalSales = salesWithMargin.length;
    const totalRevenue = salesWithMargin.reduce((sum, sale) => sum + (sale.final_price || 0), 0);
    const totalMargin = salesWithMargin.reduce((sum, sale) => sum + (sale.gross_margin || 0), 0);
    const totalCost = salesWithMargin.reduce((sum, sale) => sum + (sale.total_cost || 0), 0);
    const averageMargin = totalSales > 0 ? totalMargin / totalSales : 0;
    const averageMarginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

    // Find best and worst margins
    const bestMargin =
      salesWithMargin.length > 0
        ? salesWithMargin.reduce((max, sale) => (sale.gross_margin > max.gross_margin ? sale : max))
        : null;

    const worstMargin =
      salesWithMargin.length > 0
        ? salesWithMargin.reduce((min, sale) => (sale.gross_margin < min.gross_margin ? sale : min))
        : null;

    res.json({
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_margin: totalMargin,
        average_margin: Math.round(averageMargin * 100) / 100,
        average_margin_percentage: Math.round(averageMarginPercentage * 100) / 100,
        best_margin: bestMargin
          ? {
              vehicle: `${bestMargin.vehicle?.brand} ${bestMargin.vehicle?.model}`,
              margin: bestMargin.gross_margin,
              percentage: bestMargin.margin_percentage,
            }
          : null,
        worst_margin: worstMargin
          ? {
              vehicle: `${worstMargin.vehicle?.brand} ${worstMargin.vehicle?.model}`,
              margin: worstMargin.gross_margin,
              percentage: worstMargin.margin_percentage,
            }
          : null,
      },
      sales: salesWithMargin,
    });
  } catch (error) {
    next(error);
  }
};
