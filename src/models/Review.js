import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  customerLocation: {
    type: String,
    default: '',
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 5
  },
  title: {
    type: String,
    default: '',
    trim: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    default: '',
    trim: true
  },
  categoryLabel: {
    type: String,
    default: '',
    trim: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  avatarPublicId: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0,
    index: true
  }
}, {
  timestamps: true
});

reviewSchema.index({ isPublished: 1, sortOrder: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
