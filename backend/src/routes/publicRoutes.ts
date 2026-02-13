import { Router } from 'express';
import { getPublicVehicles, getPublicVehicleById } from '../controllers/publicVehicleController';
import { createPublicLead } from '../controllers/publicLeadController';
import { publicLeadLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Public routes - no authentication required
 * Base path: /api/public
 */

// GET /api/public/:slug/vehicles - List all available vehicles for a store
router.get('/:slug/vehicles', getPublicVehicles);

// GET /api/public/:slug/vehicles/:id - Get vehicle details
router.get('/:slug/vehicles/:id', getPublicVehicleById);

// POST /api/public/:slug/leads - Create a lead (with rate limiting)
router.post('/:slug/leads', publicLeadLimiter, createPublicLead);

export default router;
