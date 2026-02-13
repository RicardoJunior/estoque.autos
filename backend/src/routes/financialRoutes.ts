import { Router } from 'express';
import { getDashboard } from '../controllers/financialController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

/**
 * All financial routes require authentication
 * Dashboard is restricted to owner and manager only
 */

// GET /api/financial/dashboard - Get financial dashboard KPIs
router.get('/dashboard', authenticate, requireRole('owner', 'manager'), getDashboard);

export default router;
