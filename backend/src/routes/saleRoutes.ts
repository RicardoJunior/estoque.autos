import { Router } from 'express';
import { createSale, listSales, getSale } from '../controllers/saleController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/sales
 * Create a new sale (all authenticated users)
 */
router.post('/', authenticate, createSale);

/**
 * GET /api/sales
 * List all sales (owner, manager, seller - sellers only see their own)
 */
router.get('/', authenticate, listSales);

/**
 * GET /api/sales/:id
 * Get sale details (owner, manager, seller - sellers only see their own)
 */
router.get('/:id', authenticate, getSale);

export default router;
