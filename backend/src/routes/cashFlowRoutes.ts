import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  createCashFlowEntry,
  listCashFlowEntries,
  getCashFlowEntry,
  deleteCashFlowEntry,
  getCashFlowSummary,
} from '../controllers/cashFlowController';

const router = Router();

/**
 * All cash flow routes require authentication and owner/manager role
 */

// Summary endpoint
router.get('/summary', authenticate, requireRole('owner', 'manager'), getCashFlowSummary);

// CRUD endpoints
router.post('/', authenticate, requireRole('owner', 'manager'), createCashFlowEntry);
router.get('/', authenticate, requireRole('owner', 'manager'), listCashFlowEntries);
router.get('/:id', authenticate, requireRole('owner', 'manager'), getCashFlowEntry);
router.delete('/:id', authenticate, requireRole('owner', 'manager'), deleteCashFlowEntry);

export default router;
