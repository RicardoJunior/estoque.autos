import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listLeads,
  getLeadById,
  updateLeadStatus,
  assignLead,
  addLeadInteraction,
} from '../controllers/leadController';

const router = Router();

/**
 * All routes require authentication
 */

// GET /api/leads - List leads with filters
router.get('/', authenticate, listLeads);

// GET /api/leads/:id - Get lead details
router.get('/:id', authenticate, getLeadById);

// PATCH /api/leads/:id/status - Update lead status
router.patch('/:id/status', authenticate, updateLeadStatus);

// PATCH /api/leads/:id/assign - Assign lead to user
router.patch('/:id/assign', authenticate, assignLead);

// POST /api/leads/:id/interactions - Add interaction to lead
router.post('/:id/interactions', authenticate, addLeadInteraction);

export default router;
