import express from 'express';
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: Get reviews
router.get('/', getReviews);

// Protected Admin: Manage reviews
router.post('/', authenticateToken, requireAdmin, createReview);
router.put('/:id', authenticateToken, requireAdmin, updateReview);
router.delete('/:id', authenticateToken, requireAdmin, deleteReview);

export default router;
