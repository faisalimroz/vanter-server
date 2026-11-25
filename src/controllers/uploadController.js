import path from 'path';
import { deleteLocalFile } from '../utils/fileStorage.js';

export const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file uploaded.' });
    }

    const folder = req.file.targetFolder || 'misc';
    const filename = req.file.filename;
    const relativeUrl = `/uploads/${folder}/${filename}`;
    const publicId = `${folder}/${filename}`;

    const ext = path.extname(filename).toLowerCase();
    const isVideo =
      req.file.mimetype?.startsWith('video/') ||
      ['.mp4', '.webm', '.mov'].includes(ext);

    const mediaType = isVideo ? 'video' : 'image';

    // Enforce 5MB limit on still images
    if (!isVideo && req.file.size > 5 * 1024 * 1024) {
      await deleteLocalFile(publicId);
      return res.status(400).json({
        success: false,
        message: 'Image file size exceeds the 5MB maximum limit.'
      });
    }

    // Enforce 50MB limit on video clips
    if (isVideo && req.file.size > 50 * 1024 * 1024) {
      await deleteLocalFile(publicId);
      return res.status(400).json({
        success: false,
        message: 'Video file size exceeds the 50MB maximum limit.'
      });
    }

    const mediaObject = {
      url: relativeUrl,
      publicId: publicId,
      type: mediaType,
      filename: filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    return res.status(200).json({
      success: true,
      mediaType,
      // Backward-compatible image key
      image: {
        url: relativeUrl,
        publicId: publicId,
        type: mediaType
      },
      // New media key for product multi-gallery
      media: {
        url: relativeUrl,
        publicId: publicId,
        type: mediaType
      },
      file: mediaObject
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No media files uploaded.' });
    }

    const items = req.files.map((file) => {
      const folder = file.targetFolder || 'misc';
      const ext = path.extname(file.filename).toLowerCase();
      const isVideo =
        file.mimetype?.startsWith('video/') ||
        ['.mp4', '.webm', '.mov'].includes(ext);

      return {
        url: `/uploads/${folder}/${file.filename}`,
        publicId: `${folder}/${file.filename}`,
        type: isVideo ? 'video' : 'image'
      };
    });

    return res.status(200).json({
      success: true,
      images: items,
      media: items
    });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const { publicId, url } = req.body;
    const target = publicId || url;
    if (!target) {
      return res.status(400).json({ success: false, message: 'Media publicId or url is required.' });
    }

    const deleted = await deleteLocalFile(target);

    return res.status(200).json({
      success: true,
      message: deleted ? 'Local media file deleted successfully.' : 'File not found or already removed.'
    });
  } catch (error) {
    next(error);
  }
};
