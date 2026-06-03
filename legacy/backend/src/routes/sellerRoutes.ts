import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getSellerDashboard } from '../controllers/sellerDashboardController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/seller/dashboard
 * Get seller-specific dashboard with personal KPIs
 */
router.get('/dashboard', getSellerDashboard);

export default router;
