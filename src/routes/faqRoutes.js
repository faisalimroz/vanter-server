import express from 'express';
import {
  getPublicFAQs,
  getAdminFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ
} from '../controllers/faqController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/', getPublicFAQs);

// Admin
router.get('/admin', authenticateToken, requireAdmin, getAdminFAQs);
router.post('/', authenticateToken, requireAdmin, createFAQ);
router.put('/:id', authenticateToken, requireAdmin, updateFAQ);
router.delete('/:id', authenticateToken, requireAdmin, deleteFAQ);

export default router;
