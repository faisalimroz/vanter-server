import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderTrackingByNumber,
  getAdminOrders,
  updateOrderStatus
} from '../controllers/orderController.js';
import {
  createCustomerReturn,
  getOrderReturn
} from '../controllers/returnController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { orderLimiter } from '../middleware/rateLimiter.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public / Customer
router.get('/track/:orderNumber', getOrderTrackingByNumber);

// Customer return request
const ensureReturnFolder = (req, res, next) => {
  req.query.folder = req.query.folder || 'returns';
  next();
};

// Mandatory Login Protected
router.post('/', authenticateToken, orderLimiter, createOrder);
router.get('/my-orders', authenticateToken, getMyOrders);
router.post('/:orderNumber/return', authenticateToken, ensureReturnFolder, upload.array('proofImages', 4), createCustomerReturn);
router.get('/:orderNumber/return', authenticateToken, getOrderReturn);

// Admin Only
router.get('/admin/all', authenticateToken, requireAdmin, getAdminOrders);
router.patch('/admin/:id/status', authenticateToken, requireAdmin, updateOrderStatus);

export default router;
