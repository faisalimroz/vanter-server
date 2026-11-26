import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import shopTheLookRoutes from './routes/shopTheLookRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import faqRoutes from './routes/faqRoutes.js';

import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { UPLOADS_ROOT } from './utils/fileStorage.js';

dotenv.config();

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static serving for local image and video uploads
app.use('/uploads', express.static(UPLOADS_ROOT));

// Cross-folder fallback to prevent 404s for records created across alternative subfolders (e.g. returns <-> misc)
app.use('/uploads/:folder/:filename', (req, res, next) => {
  const { folder, filename } = req.params;
  const candidateFolders = ['returns', 'misc', 'products', 'categories', 'hero', 'shop-the-look', 'cms'];
  for (const alt of candidateFolders) {
    if (alt !== folder) {
      const candidatePath = path.join(UPLOADS_ROOT, alt, filename);
      if (fs.existsSync(candidatePath)) {
        return res.sendFile(candidatePath);
      }
    }
  }
  next();
});

// General rate limiter on API
app.use('/api', generalLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Vantero Luxury E-Commerce API',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shop-the-look', shopTheLookRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/faqs', faqRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Central error handler
app.use(errorHandler);

export default app;
