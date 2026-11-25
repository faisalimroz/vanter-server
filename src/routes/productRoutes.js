import express from 'express';
import {
  getCatalogProducts,
  getProductBySlug,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public catalog routes
router.get('/', getCatalogProducts);
router.get('/:slug', getProductBySlug);

// Admin product management
router.get('/admin/all', authenticateToken, requireAdmin, getAdminProducts);
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

export default router;
