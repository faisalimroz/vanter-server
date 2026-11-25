import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  recipientName: { type: String, required: true },
  phone: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true }, // e.g. Dhaka, Dhanmondi, Gulshan
  district: { type: String, required: true }, // e.g. Dhaka, Chittagong, Sylhet
  postalCode: { type: String },
  label: { type: String, default: 'Home' }, // Home, Office, etc.
  isDefault: { type: Boolean, default: false }
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: 'Vantero Member'
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  avatar: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    select: false // Only selected when explicitly needed
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
    index: true
  },
  savedAddresses: [addressSchema],
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
