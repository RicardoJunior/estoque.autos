import { Router } from 'express';
import authRoutes from './authRoutes';
import vehicleRoutes from './vehicleRoutes';
import photoRoutes from './photoRoutes';

const router = Router();

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API version info
router.get('/', (req, res) => {
  res.json({
    name: 'Estoque.autos API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Route modules
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/photos', photoRoutes);

// TODO: Add route modules here as they are implemented
// router.use('/leads', leadRoutes);
// router.use('/sales', salesRoutes);
// router.use('/public', publicRoutes);

export default router;
