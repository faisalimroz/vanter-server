import mongoose from 'mongoose';

const policySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['terms-of-service', 'privacy-policy', 'refund-policy'],
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    default: '',
    trim: true
  },
  summary: {
    type: String,
    default: '',
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Policy', policySchema);
