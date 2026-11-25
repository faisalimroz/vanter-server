import mongoose from 'mongoose';

const pageSectionSchema = new mongoose.Schema({
  sectionKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true // e.g. 'top_bar', 'hero', 'trust_strip', 'featured_categories', 'new_arrivals', 'collectors_edit', 'shop_the_look', 'footwear_shelf', 'fragrance_feature', 'lifestyle_boys_split', 'reviews', 'newsletter', 'footer'
  },
  sectionName: {
    type: String,
    required: true, // Human readable admin label, e.g. "Hero Showcase"
    trim: true
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  badgeText: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  ctaText: {
    type: String,
    default: ''
  },
  ctaLink: {
    type: String,
    default: ''
  },
  secondaryCtaText: {
    type: String,
    default: ''
  },
  secondaryCtaLink: {
    type: String,
    default: ''
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    alt: { type: String, default: '' },
    label: { type: String, default: '' } // e.g. "Desktop Hero", "Mobile Hero"
  }],
  contentData: {
    type: mongoose.Schema.Types.Mixed,
    default: {} // Flexible storage for items like trust badges, review lists, etc.
  },
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

export default mongoose.model('PageSection', pageSectionSchema);
