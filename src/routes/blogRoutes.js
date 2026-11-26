import express from 'express';
import {
  getPublicBlogs,
  getBlogBySlug,
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blogController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/', getPublicBlogs);
router.get('/post/:slug', getBlogBySlug);
router.get('/:slug', getBlogBySlug);

// Admin
router.get('/admin/all', authenticateToken, requireAdmin, getAdminBlogs);
router.post('/', authenticateToken, requireAdmin, createBlog);
router.put('/:id', authenticateToken, requireAdmin, updateBlog);
router.delete('/:id', authenticateToken, requireAdmin, deleteBlog);

export default router;
