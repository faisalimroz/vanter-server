import express from 'express';
import {
  getPublicSections,
  getAdminSections,
  getSectionByKey,
  updateSectionByKey,
  createSection,
  reorderSections,
  deleteSection
} from '../controllers/cmsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/sections', getPublicSections);
router.get('/sections/:sectionKey', getSectionByKey);

// Admin Only
router.get('/admin/sections', authenticateToken, requireAdmin, getAdminSections);
router.post('/sections', authenticateToken, requireAdmin, createSection);
router.put('/sections/:sectionKey', authenticateToken, requireAdmin, updateSectionByKey);
router.patch('/reorder', authenticateToken, requireAdmin, reorderSections);
router.delete('/sections/:id', authenticateToken, requireAdmin, deleteSection);

export default router;
