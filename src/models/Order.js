import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: { type: String, required: true },
  image: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true }, // computed price at time of order
  originalPrice: { type: Number, required: true }, // base price
  sku: { type: String }
}, { _id: true });

const timelineEntrySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  },
  title: { type: String, required: true },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'System' }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true
  },
  isGuest: {
    type: Boolean,
    default: false,
    index: true
  },
  guestInfo: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  items: [orderItemSchema],
  shippingAddress: {
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: { type: String, default: '' }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryArea: {
    type: String,
    enum: ['inside_dhaka', 'outside_dhaka'],
    default: 'inside_dhaka'
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['COD'],
    default: 'COD',
    required: true // Strictly Cash on Delivery only
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  courier: {
    name: { type: String, default: '' }, // e.g. Steadfast, Pathao, RedX, Paperfly
    trackingCode: { type: String, default: '' },
    trackingUrl: { type: String, default: '' }
  },
  customerNotes: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },
  hasReturnRequest: {
    type: Boolean,
    default: false,
    index: true
  },
  returnStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'in_transit', 'completed', 'rejected'],
    default: 'none'
  },
  returnRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReturnRequest'
  },
  deliveredAt: {
    type: Date
  },
  trackingTimeline: [timelineEntrySchema]
}, {
  timestamps: true
});

// Compound indexes
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
