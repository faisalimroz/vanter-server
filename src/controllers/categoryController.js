import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Product from '../models/Product.js';
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

export const getPublicCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .populate({
        path: 'subCategories',
        match: { isActive: true },
        options: { sort: { displayOrder: 1, name: 1 } }
      });

    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate({
        path: 'subCategories',
        options: { sort: { displayOrder: 1, name: 1 } }
      });

    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug, isActive: true })
      .populate({
        path: 'subCategories',
        match: { isActive: true },
        options: { sort: { displayOrder: 1 } }
      });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const productCount = await Product.countDocuments({ category: category._id, isActive: true });

    return res.status(200).json({
      success: true,
      category,
      productCount
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image, featured, isActive, displayOrder } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const generatedSlug = slug ? slugify(slug) : slugify(name);
    const existing = await Category.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category with this slug already exists.' });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: generatedSlug,
      description: description || '',
      image: image || { url: '', publicId: '' },
      featured: Boolean(featured),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      displayOrder: displayOrder || 0
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, featured, isActive, displayOrder } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name) category.name = name.trim();
    if (slug) category.slug = slugify(slug);
    if (description !== undefined) category.description = description;
    if (image) {
      if (category.image?.publicId && category.image.publicId !== image.publicId) {
        await deleteLocalFile(category.image.publicId || category.image.url);
      }
      category.image = image;
    }
    if (featured !== undefined) category.featured = Boolean(featured);
    if (isActive !== undefined) category.isActive = Boolean(isActive);
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Check if products exist in category
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category containing ${productCount} active products. Reassign or delete products first.`
      });
    }

    // Clean up image
    if (category.image?.publicId || category.image?.url) {
      await deleteLocalFile(category.image.publicId || category.image.url);
    }

    // Delete subcategories and category
    await SubCategory.deleteMany({ category: id });
    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Category and its subcategories removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const createSubCategory = async (req, res, next) => {
  try {
    const { id: categoryId } = req.params;
    const { name, slug, description, image, isActive, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Subcategory name is required.' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Parent category not found.' });
    }

    const generatedSlug = slug ? slugify(slug) : slugify(name);
    const existing = await SubCategory.findOne({ category: categoryId, slug: generatedSlug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Subcategory slug already exists under this category.' });
    }

    const subCategory = await SubCategory.create({
      name: name.trim(),
      slug: generatedSlug,
      category: categoryId,
      description: description || '',
      image: image || { url: '', publicId: '' },
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      displayOrder: displayOrder || 0
    });

    return res.status(201).json({
      success: true,
      message: 'Subcategory created successfully.',
      subCategory
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubCategory = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const { name, slug, description, image, isActive, displayOrder } = req.body;

    const sub = await SubCategory.findById(subId);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subcategory not found.' });
    }

    if (name) sub.name = name.trim();
    if (slug) sub.slug = slugify(slug);
    if (description !== undefined) sub.description = description;
    if (image) {
      if (sub.image?.publicId && sub.image.publicId !== image.publicId) {
        await deleteLocalFile(sub.image.publicId || sub.image.url);
      }
      sub.image = image;
    }
    if (isActive !== undefined) sub.isActive = Boolean(isActive);
    if (displayOrder !== undefined) sub.displayOrder = Number(displayOrder);

    await sub.save();

    return res.status(200).json({
      success: true,
      message: 'Subcategory updated successfully.',
      subCategory: sub
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubCategory = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const sub = await SubCategory.findById(subId);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subcategory not found.' });
    }

    const productCount = await Product.countDocuments({ subCategory: subId });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subcategory containing ${productCount} products.`
      });
    }

    if (sub.image?.publicId || sub.image?.url) {
      await deleteLocalFile(sub.image.publicId || sub.image.url);
    }

    await SubCategory.findByIdAndDelete(subId);

    return res.status(200).json({
      success: true,
      message: 'Subcategory removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};
