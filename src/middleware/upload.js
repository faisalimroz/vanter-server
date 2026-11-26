import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust root uploads directory
export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

export const ALLOWED_FOLDERS = [
  'hero',
  'categories',
  'products',
  'shop-the-look',
  'returns',
  'cms',
  'misc'
];

/**
 * Determine the destination subfolder reliably before writing file stream.
 * Inspects query params, custom header, or multipart body fields.
 */
export const getSafeFolder = (req) => {
  const requested = String(
    req.query?.folder ||
    req.headers?.['x-upload-folder'] ||
    req.body?.folder ||
    'misc'
  ).toLowerCase().trim();

  return ALLOWED_FOLDERS.includes(requested) ? requested : 'misc';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getSafeFolder(req);
    const uploadDir = path.join(UPLOADS_ROOT, folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Attach targetFolder to file so controllers know exact relative path written
    file.targetFolder = folder;
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'];

    let safeExt = '.jpg';
    if (validExtensions.includes(ext)) {
      safeExt = ext === '.jpeg' ? '.jpg' : ext;
    } else if (file.mimetype?.startsWith('video/')) {
      safeExt = '.mp4';
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${safeExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const folder = getSafeFolder(req);

  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideoMimes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const isImageMime = allowedImageMimes.includes(file.mimetype);
  const isVideoMime = allowedVideoMimes.includes(file.mimetype) || ['.mp4', '.webm', '.mov'].includes(ext);

  // Products and Hero folders support both high-res still images and videos
  if (folder === 'products' || folder === 'hero') {
    if (isImageMime || isVideoMime) {
      return cb(null, true);
    }
    return cb(
      new Error(
        'Invalid media format. Please upload JPEG, PNG, WebP images or MP4, WebM, MOV videos.'
      ),
      false
    );
  }

  // All other folders (categories, returns, etc.) accept images only
  if (isImageMime) {
    return cb(null, true);
  }

  if (isVideoMime) {
    return cb(
      new Error('Video uploads are only permitted for product catalog and hero carousel media.'),
      false
    );
  }

  return cb(
    new Error('Invalid image format. Only JPEG, PNG, and WebP images are permitted.'),
    false
  );
};

export const upload = multer({
  storage,
  limits: {
    // 50MB ceiling to accommodate product showcase video clips
    fileSize: 50 * 1024 * 1024
  },
  fileFilter
});
