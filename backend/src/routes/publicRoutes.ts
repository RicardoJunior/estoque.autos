import { Router } from 'express';
import { getPublicVehicles, getPublicVehicleById } from '../controllers/publicVehicleController';

const router = Router();

/**
 * Public routes - no authentication required
 * Base path: /api/public
 */

// GET /api/public/:slug/vehicles - List all available vehicles for a store
router.get('/:slug/vehicles', getPublicVehicles);

// GET /api/public/:slug/vehicles/:id - Get vehicle details
router.get('/:slug/vehicles/:id', getPublicVehicleById);

// Note: Lead creation endpoint will be added in Bloco 4
// POST /api/public/:slug/leads - Create a lead (with rate limiting)

export default router;
