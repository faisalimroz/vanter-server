import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
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

export const extractYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return '';
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.trim().match(regExp);
  return match && match[1] ? match[1] : '';
};

export const getCatalogProducts = async (req, res, next) => {
  try {
    const {
      category,
      subCategory,
      minPrice,
      maxPrice,
      size,
      color,
      discountOnly,
      inStock,
      sort,
      q,
      page = 1,
      limit = 12
    } = req.query;

    const filter = { isActive: true };

    // Category filter by slug or ID
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category.toLowerCase().trim() });
        if (cat) filter.category = cat._id;
        else filter.category = null; // No match
      }
    }

    // Subcategory filter by slug or ID
    if (subCategory) {
      if (subCategory.match(/^[0-9a-fA-F]{24}$/)) {
        filter.subCategory = subCategory;
      } else {
        const sub = await SubCategory.findOne({ slug: subCategory.toLowerCase().trim() });
        if (sub) filter.subCategory = sub._id;
        else filter.subCategory = null;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    // Variant size/color filters
    if (size) {
      filter['variants.size'] = new RegExp(`^${size.trim()}$`, 'i');
    }
    if (color) {
      filter['variants.color'] = new RegExp(color.trim(), 'i');
    }

    // Discount only filter
    if (discountOnly === 'true' || discountOnly === true) {
      filter['discount.discountType'] = { $in: ['percentage', 'flat'] };
      filter['discount.discountValue'] = { $gt: 0 };
    }

    // In Stock filter
    if (inStock === 'true' || inStock === true) {
      filter['variants.stock'] = { $gt: 0 };
    }

    // Search query
    if (q) {
      const searchRegex = new RegExp(String(q).trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { sku: searchRegex }
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { basePrice: 1 };
    else if (sort === 'price_desc') sortOptions = { basePrice: -1 };
    else if (sort === 'newest') sortOptions = { createdAt: -1 };
    else if (sort === 'bestselling') sortOptions = { salesCount: -1 };
    else if (sort === 'featured') sortOptions = { isFeatured: -1, createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug'),
      Product.countDocuments(filter)
    ]);

    // Available filter facets for rich UI chips, counters, and price sliders
    const [availableSizes, availableColors, priceStats] = await Promise.all([
      Product.distinct('variants.size', { isActive: true }),
      Product.distinct('variants.color', { isActive: true }),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$basePrice' },
            maxPrice: { $max: '$basePrice' }
          }
        }
      ])
    ]);

    const catalogMinPrice = priceStats[0]?.minPrice ?? 0;
    const catalogMaxPrice = priceStats[0]?.maxPrice ?? 50000;

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        total: totalCount,
        page: Number(page),
        pages: Math.ceil(totalCount / Number(limit)),
        limit: Number(limit)
      },
      facets: {
        sizes: availableSizes.filter(Boolean),
        colors: availableColors.filter(Boolean),
        minPrice: catalogMinPrice,
        maxPrice: catalogMaxPrice
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Find related products in same category
    const relatedProducts = await Product.find({
      category: product.category?._id,
      _id: { $ne: product._id },
      isActive: true
    })
      .limit(4)
      .populate('category', 'name slug');

    return res.status(200).json({
      success: true,
      product,
      relatedProducts
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, category } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (q) {
      const regex = new RegExp(String(q).trim(), 'i');
      const matchingCats = await Category.find({ name: regex }).select('_id');
      const catIds = matchingCats.map((c) => c._id);

      filter.$or = [
        { title: regex },
        { sku: regex },
        { slug: regex },
        ...(catIds.length > 0 ? [{ category: { $in: catIds } }] : [])
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug'),
      Product.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      sku,
      category,
      subCategory,
      description,
      details,
      images,
      media,
      variants,
      basePrice,
      discount,
      isFeatured,
      isActive,
      tags,
      youtubeUrl
    } = req.body;

    if (!title || !category || !basePrice) {
      return res.status(400).json({
        success: false,
        message: 'Product title, category, and base price are required.'
      });
    }

    const generatedSlug = slug ? slugify(slug) : slugify(title);
    const existingSlug = await Product.findOne({ slug: generatedSlug });
    if (existingSlug) {
      return res.status(409).json({ success: false, message: 'A product with this slug already exists.' });
    }

    const generatedSku = sku ? sku.trim().toUpperCase() : `VT-${Date.now().toString().slice(-6)}`;
    const existingSku = await Product.findOne({ sku: generatedSku });
    if (existingSku) {
      return res.status(409).json({ success: false, message: 'SKU must be unique.' });
    }

    const product = await Product.create({
      title: title.trim(),
      slug: generatedSlug,
      sku: generatedSku,
      category,
      subCategory: subCategory || null,
      description: description || '',
      details: Array.isArray(details) ? details : [],
      media: Array.isArray(media) ? media.slice(0, 5) : [],
      images: Array.isArray(images) ? images : [],
      variants: Array.isArray(variants) ? variants : [],
      basePrice: Number(basePrice),
      discount: discount || { discountType: 'none', discountValue: 0 },
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      tags: Array.isArray(tags) ? tags : [],
      youtubeUrl: youtubeUrl ? String(youtubeUrl).trim() : '',
      youtubeVideoId: extractYouTubeVideoId(youtubeUrl)
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (updateData.title) product.title = updateData.title.trim();
    if (updateData.slug) product.slug = slugify(updateData.slug);
    if (updateData.sku) product.sku = updateData.sku.trim().toUpperCase();
    if (updateData.category) product.category = updateData.category;
    if (updateData.subCategory !== undefined) product.subCategory = updateData.subCategory || null;
    if (updateData.description !== undefined) product.description = updateData.description;
    if (updateData.details) product.details = updateData.details;

    // Handle media updates with local file unlink for removed items
    if (updateData.media !== undefined) {
      const newUrls = new Set((updateData.media || []).map((m) => m.url));
      const removed = (product.media || []).filter((m) => m.url && !newUrls.has(m.url));
      for (const item of removed) {
        if (item.publicId || item.url) {
          await deleteLocalFile(item.publicId || item.url);
        }
      }
      product.media = Array.isArray(updateData.media) ? updateData.media.slice(0, 5) : [];
    }

    if (updateData.images) product.images = updateData.images;
    if (updateData.variants) product.variants = updateData.variants;
    if (updateData.basePrice !== undefined) product.basePrice = Number(updateData.basePrice);
    if (updateData.discount) product.discount = updateData.discount;
    if (updateData.isFeatured !== undefined) product.isFeatured = Boolean(updateData.isFeatured);
    if (updateData.isActive !== undefined) product.isActive = Boolean(updateData.isActive);
    if (updateData.tags) product.tags = updateData.tags;
    if (updateData.youtubeUrl !== undefined) {
      product.youtubeUrl = String(updateData.youtubeUrl || '').trim();
      product.youtubeVideoId = extractYouTubeVideoId(product.youtubeUrl);
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Clean up all images and videos from local disk
    const allMedia = [...(product.media || []), ...(product.images || [])];
    const seenFiles = new Set();
    for (const item of allMedia) {
      const fileKey = item.publicId || item.url;
      if (fileKey && !seenFiles.has(fileKey)) {
        seenFiles.add(fileKey);
        await deleteLocalFile(fileKey);
      }
    }

    await Product.findByIdAndDelete(id);
    await ShopTheLook.updateMany({}, { $pull: { products: { product: id } } });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
