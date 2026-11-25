import express from 'express';
import {
  getPublicCategories,
  getAdminCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory
} from '../controllers/categoryController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/', getPublicCategories);
router.get('/:slug', getCategoryBySlug);

// Admin Only
router.get('/admin/all', authenticateToken, requireAdmin, getAdminCategories);
router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

// Subcategories
router.post('/:id/subcategories', authenticateToken, requireAdmin, createSubCategory);
router.put('/subcategories/:subId', authenticateToken, requireAdmin, updateSubCategory);
router.delete('/subcategories/:subId', authenticateToken, requireAdmin, deleteSubCategory);

export default router;
