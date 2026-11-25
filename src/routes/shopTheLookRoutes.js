import express from 'express';
import {
  getPublicLooks,
  getLookBySlug,
  getAdminLooks,
  createLook,
  updateLook,
  deleteLook
} from '../controllers/shopTheLookController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPublicLooks);
router.get('/:slug', getLookBySlug);

// Admin Only
router.get('/admin/all', authenticateToken, requireAdmin, getAdminLooks);
router.post('/', authenticateToken, requireAdmin, createLook);
router.put('/:id', authenticateToken, requireAdmin, updateLook);
router.delete('/:id', authenticateToken, requireAdmin, deleteLook);

export default router;
