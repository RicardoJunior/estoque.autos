import { Router } from 'express';

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

// TODO: Add route modules here as they are implemented
// router.use('/auth', authRoutes);
// router.use('/vehicles', vehicleRoutes);
// router.use('/leads', leadRoutes);
// router.use('/sales', salesRoutes);
// router.use('/public', publicRoutes);

export default router;
