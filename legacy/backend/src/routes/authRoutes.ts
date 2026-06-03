import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { signup, login, refresh, me, createTenant, logout } from '../controllers/authController';

const router = Router();

// Public routes (with rate limiting)
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);

// Protected routes
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);
router.post('/onboarding/tenant', authenticate, createTenant);

export default router;
