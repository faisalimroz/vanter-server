import mongoose from 'mongoose';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  excerpt: {
    type: String,
    default: '',
    trim: true
  },
  content: {
    type: String,
    required: true,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: 'Vantero Editorial',
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  metaTitle: {
    type: String,
    default: '',
    trim: true
  },
  metaDescription: {
    type: String,
    default: '',
    trim: true
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

blogSchema.pre('validate', function(next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    if (!this.slug) {
      this.slug = slugify(this.title);
    }
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
