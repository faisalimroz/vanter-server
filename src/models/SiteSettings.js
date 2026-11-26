import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
  freeDeliveryThreshold: {
    type: Number,
    default: 5000,
    min: 0
  },
  insideDhakaCharge: {
    type: Number,
    default: 100,
    min: 0
  },
  outsideDhakaCharge: {
    type: Number,
    default: 150,
    min: 0
  },
  freeDeliveryMessage: {
    type: String,
    default: 'Add ৳5,000 more for Free Delivery in Dhaka',
    trim: true
  }
}, {
  timestamps: true
});

// Singleton helper: guarantees one settings document exists
siteSettingsSchema.statics.getSingleton = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      freeDeliveryThreshold: 5000,
      insideDhakaCharge: 100,
      outsideDhakaCharge: 150,
      freeDeliveryMessage: 'Add ৳5,000 more for Free Delivery in Dhaka'
    });
  }
  return settings;
};

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;
