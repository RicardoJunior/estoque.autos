import { Router } from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
} from '../controllers/vehicleController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All vehicle routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/vehicles
 * @desc    Create a new vehicle
 * @access  Owner, Manager
 */
router.post('/', requireRole('owner', 'manager'), createVehicle);

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with filters and pagination
 * @access  Owner, Manager, Seller
 */
router.get('/', getVehicles);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get a single vehicle by ID
 * @access  Owner, Manager, Seller
 */
router.get('/:id', getVehicleById);

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update a vehicle
 * @access  Owner, Manager
 */
router.put('/:id', requireRole('owner', 'manager'), updateVehicle);

/**
 * @route   PATCH /api/vehicles/:id/status
 * @desc    Update vehicle status
 * @access  Owner, Manager
 */
router.patch('/:id/status', requireRole('owner', 'manager'), updateVehicleStatus);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete a vehicle (soft delete)
 * @access  Owner, Manager
 */
router.delete('/:id', requireRole('owner', 'manager'), deleteVehicle);

export default router;
