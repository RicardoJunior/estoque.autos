import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getTenantSettings,
  updateTenantSettings,
  updateTenantLogo,
} from '../controllers/tenantController';
import {
  uploadLogoMiddleware,
  uploadTenantLogo,
  deleteTenantLogo,
} from '../controllers/logoController';

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
 * Update tenant logo URL (owner and manager only)
 */
router.patch('/logo', requireRole('owner', 'manager'), updateTenantLogo);

/**
 * POST /api/tenant/logo/upload
 * Upload and crop tenant logo (owner and manager only)
 */
router.post(
  '/logo/upload',
  requireRole('owner', 'manager'),
  uploadLogoMiddleware,
  uploadTenantLogo
);

/**
 * DELETE /api/tenant/logo
 * Delete tenant logo (owner and manager only)
 */
router.delete('/logo', requireRole('owner', 'manager'), deleteTenantLogo);

export default router;
