import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getUsers, getUserById } from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - Get all users in tenant
router.get('/', getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

export default router;
