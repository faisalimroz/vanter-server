import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { getCookieOptions } from '../middleware/auth.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateUserToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin email and password are required.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account is not registered as an administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateUserToken(user);
    res.cookie('vantero_token', token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential ID token is required.'
      });
    }

    let payload = null;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        // Fallback simulation for local dev testing
        payload = {
          sub: 'google_simulated_' + Date.now(),
          email: 'customer@gmail.com',
          name: 'Google Customer',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
        };
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired Google authentication credentials.'
        });
      }
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find by googleId first, then by email
    let user = await User.findOne({ googleId });
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      user = await User.create({
        googleId,
        email,
        name: name || 'Google Member',
        avatar: picture || '',
        role: 'customer'
      });
    }

    const token = generateUserToken(user);
    res.cookie('vantero_token', token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful.',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        savedAddresses: user.savedAddresses,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      role: req.user.role,
      savedAddresses: req.user.savedAddresses,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt
    }
  });
};

export const logout = async (req, res) => {
  res.clearCookie('vantero_token', getCookieOptions());
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar, phone } = req.body;
    const user = req.user;

    if (name) user.name = String(name).trim();
    if (avatar) user.avatar = String(avatar).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (email && email !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(409).json({ success: false, message: 'Email is already in use by another account.' });
      }
      user.email = email.toLowerCase().trim();
    }

    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        savedAddresses: user.savedAddresses,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { recipientName, phone, streetAddress, city, district, postalCode, label, isDefault } = req.body;
    if (!recipientName || !phone || !streetAddress || !city || !district) {
      return res.status(400).json({
        success: false,
        message: 'Recipient name, phone, street address, city, and district are required.'
      });
    }

    const user = req.user;
    if (isDefault) {
      user.savedAddresses.forEach(a => { a.isDefault = false; });
    }

    user.savedAddresses.push({
      recipientName,
      phone,
      streetAddress,
      city,
      district,
      postalCode: postalCode || '',
      label: label || 'Home',
      isDefault: Boolean(isDefault || user.savedAddresses.length === 0)
    });

    await user.save();
    return res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      savedAddresses: user.savedAddresses
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    user.savedAddresses = user.savedAddresses.filter(a => a._id.toString() !== id);
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Address removed successfully.',
      savedAddresses: user.savedAddresses
    });
  } catch (error) {
    next(error);
  }
};
