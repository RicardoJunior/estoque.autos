/**
 * Marketplace Routes
 *
 * Routes for marketplace integration configuration and vehicle publishing.
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getMarketplaceConfigs,
  getAvailablePlatforms,
  saveMarketplaceConfig,
  testConnection,
  publishVehicle,
  unpublishVehicle,
  syncVehicleStatus,
  getVehicleLogs,
} from '../controllers/marketplaceController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all marketplace configurations
router.get('/configs', getMarketplaceConfigs);

// Get available marketplace platforms
router.get('/platforms', getAvailablePlatforms);

// Save marketplace configuration (owner/manager only)
router.post('/configs', requireRole('owner', 'manager'), saveMarketplaceConfig);

// Test marketplace connection
router.post('/test-connection', requireRole('owner', 'manager'), testConnection);

// Publish vehicle to marketplaces (owner/manager only)
router.post('/publish', requireRole('owner', 'manager'), publishVehicle);

// Unpublish vehicle from marketplace (owner/manager only)
router.delete('/unpublish/:vehicleId/:platform', requireRole('owner', 'manager'), unpublishVehicle);

// Sync vehicle status across marketplaces (owner/manager only)
router.post('/sync-status', requireRole('owner', 'manager'), syncVehicleStatus);

// Get marketplace logs for a vehicle
router.get('/logs/:vehicleId', getVehicleLogs);

export default router;
