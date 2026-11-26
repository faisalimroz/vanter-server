import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
});

/**
 * Authenticate incoming request using HttpOnly cookie or Authorization header
 */
export const authenticateToken = async (req, res, next) => {
  try {
    let token = req.cookies?.vantero_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to proceed.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.clearCookie('vantero_token', getCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'User session no longer valid. Please log in again.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.clearCookie('vantero_token', getCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid or forged authentication token.'
    });
  }
};

/**
 * Ensure authenticated user has 'admin' role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to Vantero Administrators only.'
    });
  }
  next();
};

/**
 * Optional authentication: attaches user if token valid, does not reject if absent
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.vantero_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        return next();
      }
    }
  } catch (_) {
    // Silently continue for optional auth
  }
  req.user = null;
  next();
};
