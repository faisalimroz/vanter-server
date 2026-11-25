import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  image: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique on category + slug
subCategorySchema.index({ category: 1, slug: 1 }, { unique: true });

export default mongoose.model('SubCategory', subCategorySchema);
