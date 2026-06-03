import { Router } from 'express';
import {
  getDashboard,
  getMarginReport,
  getTurnoverReport,
} from '../controllers/financialController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

/**
 * All financial routes require authentication
 * Dashboard is restricted to owner and manager only
 */

// GET /api/financial/dashboard - Get financial dashboard KPIs
router.get('/dashboard', authenticate, requireRole('owner', 'manager'), getDashboard);

// GET /api/financial/margin-report - Get detailed margin report
router.get('/margin-report', authenticate, requireRole('owner', 'manager'), getMarginReport);

// GET /api/financial/turnover-report - Get inventory turnover report
router.get('/turnover-report', authenticate, requireRole('owner', 'manager'), getTurnoverReport);

export default router;
