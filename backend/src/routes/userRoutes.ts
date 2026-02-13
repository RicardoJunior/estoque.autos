import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  updateUserCommission,
} from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - Get all users in tenant
router.get('/', getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /api/users - Create new user (owner/manager only)
router.post('/', requireRole('owner', 'manager'), createUser);

// PUT /api/users/:id - Update user (owner/manager only)
router.put('/:id', requireRole('owner', 'manager'), updateUser);

// PATCH /api/users/:id/toggle-status - Activate/deactivate user (owner/manager only)
router.patch('/:id/toggle-status', requireRole('owner', 'manager'), toggleUserStatus);

// PATCH /api/users/:id/commission - Update user commission (owner/manager only)
router.patch('/:id/commission', requireRole('owner', 'manager'), updateUserCommission);

export default router;
