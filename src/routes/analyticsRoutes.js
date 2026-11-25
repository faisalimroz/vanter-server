import express from 'express';
import { getDashboardStats } from '../controllers/analyticsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, requireAdmin, getDashboardStats);

export default router;
