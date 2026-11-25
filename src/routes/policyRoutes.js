import express from 'express';
import {
  getAllPolicies,
  getPolicyByKey,
  updatePolicy
} from '../controllers/policyController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: Get all or single policy
router.get('/', getAllPolicies);
router.get('/:key', getPolicyByKey);

// Protected Admin: Update policy
router.put('/:key', authenticateToken, requireAdmin, updatePolicy);

export default router;
