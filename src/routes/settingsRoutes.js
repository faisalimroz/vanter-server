import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: Fetch site delivery & shipping settings
router.get('/', getSettings);

// Admin: Update site delivery & shipping settings
router.put('/', authenticateToken, requireAdmin, updateSettings);

export default router;
