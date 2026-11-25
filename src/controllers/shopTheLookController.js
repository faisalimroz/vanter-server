import ShopTheLook from '../models/ShopTheLook.js';
import { deleteLocalFile } from '../utils/fileStorage.js';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const getPublicLooks = async (req, res, next) => {
  try {
    const looks = await ShopTheLook.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate({
        path: 'products.product',
        populate: { path: 'category', select: 'name slug' }
      });

    return res.status(200).json({
      success: true,
      looks
    });
  } catch (error) {
    next(error);
  }
};

export const getLookBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const look = await ShopTheLook.findOne({ slug, isActive: true })
      .populate({
        path: 'products.product',
        populate: { path: 'category', select: 'name slug' }
      });

    if (!look) {
      return res.status(404).json({ success: false, message: 'Lookbook not found.' });
    }

    return res.status(200).json({
      success: true,
      look
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminLooks = async (req, res, next) => {
  try {
    const looks = await ShopTheLook.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate({
        path: 'products.product',
        select: 'title basePrice discount images sku category variants'
      });

    return res.status(200).json({
      success: true,
      looks
    });
  } catch (error) {
    next(error);
  }
};

export const createLook = async (req, res, next) => {
  try {
    const { title, subtitle, slug, description, coverImage, products, displayOrder, isActive } = req.body;

    if (!title || !coverImage?.url) {
      return res.status(400).json({
        success: false,
        message: 'Title and cover image are required for a Shop the Look bundle.'
      });
    }

    if (!Array.isArray(products) || products.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A curated look must contain at least 2 linked products.'
      });
    }

    const generatedSlug = slug ? slugify(slug) : slugify(title);
    const existing = await ShopTheLook.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A lookbook with this slug already exists.' });
    }

    const look = await ShopTheLook.create({
      title: title.trim(),
      subtitle: subtitle || 'Curated Ensemble',
      slug: generatedSlug,
      description: description || '',
      coverImage,
      products,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    const populated = await ShopTheLook.findById(look._id).populate({
      path: 'products.product',
      select: 'title basePrice discount images sku category'
    });

    return res.status(201).json({
      success: true,
      message: 'Shop the Look bundle created successfully.',
      look: populated
    });
  } catch (error) {
    next(error);
  }
};

export const updateLook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, slug, description, coverImage, products, displayOrder, isActive } = req.body;

    const look = await ShopTheLook.findById(id);
    if (!look) {
      return res.status(404).json({ success: false, message: 'Lookbook not found.' });
    }

    if (title) look.title = title.trim();
    if (subtitle !== undefined) look.subtitle = subtitle;
    if (slug) look.slug = slugify(slug);
    if (description !== undefined) look.description = description;

    if (coverImage) {
      if (look.coverImage?.publicId && look.coverImage.publicId !== coverImage.publicId) {
        await deleteLocalFile(look.coverImage.publicId || look.coverImage.url);
      }
      look.coverImage = coverImage;
    }

    if (products) {
      if (!Array.isArray(products) || products.length < 2) {
        return res.status(400).json({ success: false, message: 'A look must contain at least 2 products.' });
      }
      look.products = products;
    }

    if (displayOrder !== undefined) look.displayOrder = Number(displayOrder);
    if (isActive !== undefined) look.isActive = Boolean(isActive);

    await look.save();

    const populated = await ShopTheLook.findById(look._id).populate({
      path: 'products.product',
      select: 'title basePrice discount images sku category'
    });

    return res.status(200).json({
      success: true,
      message: 'Lookbook updated successfully.',
      look: populated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const look = await ShopTheLook.findById(id);
    if (!look) {
      return res.status(404).json({ success: false, message: 'Lookbook not found.' });
    }

    if (look.coverImage?.publicId || look.coverImage?.url) {
      await deleteLocalFile(look.coverImage.publicId || look.coverImage.url);
    }

    await ShopTheLook.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Lookbook removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};
