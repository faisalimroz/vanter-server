import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: { type: String, required: true },
  image: { type: String, default: '' },
  size: { type: String, required: true },
  color: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true }, // price paid per unit
  totalRefund: { type: Number, required: true }, // unitPrice * quantity
  reason: {
    type: String,
    required: true,
    enum: [
      'size_fit_issue',
      'damaged_defective',
      'wrong_item_delivered',
      'not_as_described',
      'quality_dissatisfaction',
      'other'
    ]
  },
  restocked: { type: Boolean, default: false }
}, { _id: true });

const returnTimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'in_transit', 'completed', 'rejected']
  },
  title: { type: String, required: true },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'Customer' }
}, { _id: true });

const returnRequestSchema = new mongoose.Schema({
  returnNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  }, // e.g. RET-VT-20261125-1234
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true
  },
  items: [returnItemSchema],
  totalReturnQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  totalReturnAmount: {
    type: Number,
    required: true,
    default: 0
  },
  customerReason: {
    type: String,
    required: true
  },
  customerNotes: {
    type: String,
    default: ''
  },
  proofImages: [{
    url: { type: String, required: true },
    publicId: { type: String, default: '' }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'in_transit', 'completed', 'rejected'],
    default: 'pending',
    index: true
  },
  adminNotes: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  pickupCourier: {
    name: { type: String, default: '' },
    trackingCode: { type: String, default: '' },
    scheduledDate: { type: Date }
  },
  isRestocked: {
    type: Boolean,
    default: false
  },
  settlementStatus: {
    type: String,
    enum: ['pending', 'settled', 'rejected'],
    default: 'pending'
  },
  settledAmount: {
    type: Number,
    default: 0
  },
  settledAt: {
    type: Date
  },
  timeline: [returnTimelineSchema]
}, {
  timestamps: true
});

returnRequestSchema.index({ customer: 1, createdAt: -1 });
returnRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ReturnRequest', returnRequestSchema);
