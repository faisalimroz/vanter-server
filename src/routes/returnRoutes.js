import express from 'express';
import {
  createCustomerReturn,
  getOrderReturn,
  getAdminReturns,
  getAdminReturnById,
  updateReturnStatus,
  getReturnsAnalytics
} from '../controllers/returnController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Customer Endpoints (Order Return Request)
const ensureReturnFolder = (req, res, next) => {
  req.query.folder = req.query.folder || 'returns';
  next();
};

router.post(
  '/orders/:orderNumber/return',
  authenticateToken,
  ensureReturnFolder,
  upload.array('proofImages', 4),
  createCustomerReturn
);
router.get('/orders/:orderNumber/return', authenticateToken, getOrderReturn);

// Admin Return Queue & Management Endpoints
router.get('/admin/analytics', authenticateToken, requireAdmin, getReturnsAnalytics);
router.get('/admin/all', authenticateToken, requireAdmin, getAdminReturns);
router.get('/admin/:id', authenticateToken, requireAdmin, getAdminReturnById);
router.patch('/admin/:id/status', authenticateToken, requireAdmin, updateReturnStatus);

export default router;
