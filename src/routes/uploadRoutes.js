import express from 'express';
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage
} from '../controllers/uploadController.js';
import { upload } from '../middleware/upload.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * Flexible middleware that accepts a single uploaded file under common field names:
 * 'file', 'image', or 'media'.
 */
const flexibleSingleUpload = (req, res, next) => {
  const handler = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'media', maxCount: 1 }
  ]);

  handler(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      req.file =
        req.files.file?.[0] ||
        req.files.image?.[0] ||
        req.files.media?.[0];
    }
    next();
  });
};

// Protected admin upload routes:
// POST /api/upload?folder=products
router.post('/', authenticateToken, requireAdmin, flexibleSingleUpload, uploadSingleImage);

// POST /api/upload/single?folder=products
router.post('/single', authenticateToken, requireAdmin, flexibleSingleUpload, uploadSingleImage);

// POST /api/upload/multiple
router.post('/multiple', authenticateToken, requireAdmin, upload.array('images', 8), uploadMultipleImages);

// DELETE /api/upload
router.delete('/', authenticateToken, requireAdmin, deleteImage);

export default router;
