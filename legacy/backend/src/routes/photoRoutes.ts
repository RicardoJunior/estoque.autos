import { Router } from 'express';
import {
  uploadVehiclePhotos,
  deleteVehiclePhoto,
  reorderVehiclePhotos,
  setPrimaryPhoto,
  uploadMiddleware,
} from '../controllers/photoController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/photos/upload
 * Upload photos for a vehicle (owner/manager only)
 * Body (multipart/form-data):
 *   - photos: Array of image files (max 30)
 *   - vehicle_id: UUID of the vehicle
 *   - is_primary: boolean (optional, default false)
 *   - order: number (optional, auto-assigned if not provided)
 */
router.post('/upload', requireRole('owner', 'manager'), uploadMiddleware, uploadVehiclePhotos);

/**
 * DELETE /api/photos/:vehicle_id/:photo_index
 * Delete a specific photo from a vehicle (owner/manager only)
 */
router.delete('/:vehicle_id/:photo_index', requireRole('owner', 'manager'), deleteVehiclePhoto);

/**
 * PATCH /api/photos/:vehicle_id/reorder
 * Reorder photos for a vehicle (owner/manager only)
 * Body:
 *   - photo_orders: Array<{ index: number, new_order: number }>
 */
router.patch('/:vehicle_id/reorder', requireRole('owner', 'manager'), reorderVehiclePhotos);

/**
 * PATCH /api/photos/:vehicle_id/:photo_index/primary
 * Set a photo as primary (owner/manager only)
 */
router.patch('/:vehicle_id/:photo_index/primary', requireRole('owner', 'manager'), setPrimaryPhoto);

export default router;
