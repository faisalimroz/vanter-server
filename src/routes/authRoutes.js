import express from 'express';
import {
  adminLogin,
  googleAuth,
  getMe,
  logout,
  updateProfile,
  addAddress,
  deleteAddress
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/admin-login', adminLogin);
router.post('/google', googleAuth);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.patch('/profile', authenticateToken, updateProfile);
router.post('/addresses', authenticateToken, addAddress);
router.delete('/addresses/:id', authenticateToken, deleteAddress);

export default router;
