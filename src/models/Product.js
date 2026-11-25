import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true }, // e.g. "EU 41", "M", "100ml"
  color: { type: String, default: '' }, // e.g. "Chalk / Gum", "Charcoal"
  sku: { type: String, trim: true },
  stock: { type: Number, required: true, default: 0, min: 0 },
  additionalPrice: { type: Number, default: 0 }
}, { _id: true });

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: { type: String, default: '' },
  isPrimary: { type: Boolean, default: false }
}, { _id: true });

const mediaItemSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: {
    type: String,
    enum: ['image', 'video'],
    default: 'image',
    required: true
  },
  order: { type: Number, default: 0 },
  publicId: { type: String, default: '' },
  alt: { type: String, default: '' }
}, { _id: true });

const productSchema = new mongoose.Schema({
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
    index: true,
    lowercase: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    index: true
  },
  description: {
    type: String,
    required: true,
    default: ''
  },
  details: [{
    type: String // Key bullet points or material info
  }],
  images: [imageSchema],
  media: [mediaItemSchema],
  variants: [variantSchema],
  basePrice: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  discount: {
    discountType: {
      type: String,
      enum: ['none', 'percentage', 'flat'],
      default: 'none'
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0
    },
    discountStart: {
      type: Date
    },
    discountEnd: {
      type: Date
    }
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  salesCount: {
    type: Number,
    default: 0,
    index: true
  },
  rating: {
    average: { type: Number, default: 5.0 },
    count: { type: Number, default: 12 }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      // Normalize legacy products without media array
      if (!ret.media || ret.media.length === 0) {
        if (ret.images && ret.images.length > 0) {
          ret.media = ret.images.slice(0, 5).map((img, idx) => ({
            url: typeof img === 'string' ? img : img.url,
            type: 'image',
            order: idx,
            publicId: img.publicId || '',
            alt: img.alt || ''
          }));
        } else {
          ret.media = [];
        }
      }
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      if (!ret.media || ret.media.length === 0) {
        if (ret.images && ret.images.length > 0) {
          ret.media = ret.images.slice(0, 5).map((img, idx) => ({
            url: typeof img === 'string' ? img : img.url,
            type: 'image',
            order: idx,
            publicId: img.publicId || '',
            alt: img.alt || ''
          }));
        } else {
          ret.media = [];
        }
      }
      return ret;
    }
  }
});

// Pre-save normalization: enforce 5 media items and sync primary image
productSchema.pre('save', function (next) {
  if (this.media && this.media.length > 0) {
    // Max 5 media items
    this.media = this.media.slice(0, 5);

    // Sync images: extract all image items from media
    const imageItems = this.media.filter((m) => m.type === 'image');
    if (imageItems.length > 0) {
      this.images = imageItems.map((img, idx) => ({
        url: img.url,
        publicId: img.publicId || `products/${Date.now()}-${idx}`,
        alt: img.alt || '',
        isPrimary: idx === 0
      }));
    }
  } else if ((!this.media || this.media.length === 0) && this.images && this.images.length > 0) {
    this.media = this.images.slice(0, 5).map((img, idx) => ({
      url: typeof img === 'string' ? img : img.url,
      type: 'image',
      order: idx,
      publicId: img.publicId || '',
      alt: img.alt || ''
    }));
  }
  next();
});

// Dynamic virtual for effective price and discount badge
productSchema.virtual('priceCalculation').get(function () {
  const now = new Date();
  const base = this.basePrice || 0;
  let finalPrice = base;
  let hasDiscount = false;
  let discountBadge = '';
  let discountAmount = 0;

  if (this.discount && this.discount.discountType !== 'none' && this.discount.discountValue > 0) {
    const isStarted = !this.discount.discountStart || new Date(this.discount.discountStart) <= now;
    const isNotExpired = !this.discount.discountEnd || new Date(this.discount.discountEnd) >= now;

    if (isStarted && isNotExpired) {
      if (this.discount.discountType === 'percentage') {
        const pct = Math.min(this.discount.discountValue, 100);
        discountAmount = Math.round((base * pct) / 100);
        finalPrice = Math.max(0, base - discountAmount);
        hasDiscount = true;
        discountBadge = `-${pct}%`;
      } else if (this.discount.discountType === 'flat') {
        discountAmount = Math.min(this.discount.discountValue, base);
        finalPrice = Math.max(0, base - discountAmount);
        hasDiscount = true;
        discountBadge = `৳${discountAmount.toLocaleString()} OFF`;
      }
    }
  }

  // Total stock across variants
  const totalStock = (this.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);

  return {
    basePrice: base,
    finalPrice,
    hasDiscount,
    discountAmount,
    discountBadge,
    totalStock,
    inStock: totalStock > 0
  };
});

// Compound indexes for catalog search & smooth filtering
productSchema.index({ category: 1, basePrice: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.model('Product', productSchema);
