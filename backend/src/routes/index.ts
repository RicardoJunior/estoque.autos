import { Router } from 'express';
import authRoutes from './authRoutes';
import vehicleRoutes from './vehicleRoutes';
import photoRoutes from './photoRoutes';
import publicRoutes from './publicRoutes';
import tenantRoutes from './tenantRoutes';
import leadRoutes from './leadRoutes';

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
router.use('/public', publicRoutes);
router.use('/tenant', tenantRoutes);
router.use('/leads', leadRoutes);

// TODO: Add route modules here as they are implemented
// router.use('/sales', salesRoutes);

export default router;
