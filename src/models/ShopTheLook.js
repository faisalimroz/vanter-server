import mongoose from 'mongoose';

const linkedProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  // Coordinates for interactive hotspot markers on the look image (% from top and left)
  hotspot: {
    top: { type: Number, default: 50 }, // percentage 0-100
    left: { type: Number, default: 50 } // percentage 0-100
  },
  customNote: {
    type: String,
    default: ''
  }
}, { _id: true });

const shopTheLookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    default: 'Curated Ensemble'
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  coverImage: {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },
  products: [linkedProductSchema],
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

export default mongoose.model('ShopTheLook', shopTheLookSchema);
