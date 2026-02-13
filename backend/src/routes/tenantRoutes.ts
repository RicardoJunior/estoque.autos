import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getTenantSettings,
  updateTenantSettings,
  updateTenantLogo,
} from '../controllers/tenantController';

const router = Router();

// All tenant routes require authentication
router.use(authenticate);

/**
 * GET /api/tenant/settings
 * Get tenant settings (all authenticated users can view)
 */
router.get('/settings', getTenantSettings);

/**
 * PATCH /api/tenant/settings
 * Update tenant settings (owner and manager only)
 */
router.patch('/settings', requireRole('owner', 'manager'), updateTenantSettings);

/**
 * PATCH /api/tenant/logo
 * Update tenant logo (owner and manager only)
 */
router.patch('/logo', requireRole('owner', 'manager'), updateTenantLogo);

export default router;
