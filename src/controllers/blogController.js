import Blog from '../models/Blog.js';
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

// Public: Get published blogs
export const getPublicBlogs = async (req, res, next) => {
  try {
    const { tag, limit = 12, page = 1 } = req.query;
    const filter = { isPublished: true };

    if (tag) {
      filter.tags = new RegExp(`^${tag.trim()}$`, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Blog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      blogs,
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

// Public: Get single blog by slug
export const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug: slug.toLowerCase().trim() });

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Related blogs (same tags or recent)
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id },
      isPublished: true
    })
      .sort({ publishedAt: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      blog,
      relatedBlogs
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all blogs
export const getAdminBlogs = async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = {};
    if (q) {
      const regex = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ title: regex }, { tags: regex }, { author: regex }];
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      blogs,
      total: blogs.length
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create blog
export const createBlog = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      author,
      tags,
      metaTitle,
      metaDescription,
      isPublished
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const generatedSlug = slug ? slugify(slug) : slugify(title);
    const existing = await Blog.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An article with this URL slug already exists.' });
    }

    const blog = await Blog.create({
      title: title.trim(),
      slug: generatedSlug,
      excerpt: excerpt ? excerpt.trim() : '',
      content,
      coverImage: coverImage || '',
      author: author || 'Vantero Editorial',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      publishedAt: isPublished ? new Date() : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Article created successfully.',
      blog
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update blog
export const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    if (updateData.title) blog.title = updateData.title.trim();
    if (updateData.slug) {
      const newSlug = slugify(updateData.slug);
      const existing = await Blog.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An article with this URL slug already exists.' });
      }
      blog.slug = newSlug;
    }
    if (updateData.excerpt !== undefined) blog.excerpt = updateData.excerpt.trim();
    if (updateData.content !== undefined) blog.content = updateData.content;
    if (updateData.coverImage !== undefined) {
      if (blog.coverImage && blog.coverImage !== updateData.coverImage) {
        await deleteLocalFile(blog.coverImage);
      }
      blog.coverImage = updateData.coverImage;
    }
    if (updateData.author !== undefined) blog.author = updateData.author.trim();
    if (updateData.tags !== undefined) {
      blog.tags = Array.isArray(updateData.tags)
        ? updateData.tags
        : typeof updateData.tags === 'string'
        ? updateData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
    }
    if (updateData.metaTitle !== undefined) blog.metaTitle = updateData.metaTitle.trim();
    if (updateData.metaDescription !== undefined) blog.metaDescription = updateData.metaDescription.trim();
    if (updateData.isPublished !== undefined) {
      const nowPublished = Boolean(updateData.isPublished);
      if (nowPublished && !blog.isPublished) {
        blog.publishedAt = new Date();
      }
      blog.isPublished = nowPublished;
    }

    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Article updated successfully.',
      blog
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete blog
export const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    if (blog.coverImage) {
      await deleteLocalFile(blog.coverImage);
    }

    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
