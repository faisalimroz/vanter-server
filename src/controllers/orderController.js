import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Order number generator: VT-YYYYMMDD-XXXX
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `VT-${dateStr}-${randomStr}`;
};

export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, customerNotes } = req.body;
    const user = req.user;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required to place an order.' });
    }

    if (!shippingAddress || !shippingAddress.recipientName || !shippingAddress.phone || !shippingAddress.streetAddress || !shippingAddress.city || !shippingAddress.district) {
      return res.status(400).json({ success: false, message: 'Complete shipping address in Bangladesh is required.' });
    }

    let subtotal = 0;
    const validatedItems = [];

    // Verify each item against real product catalog and stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product '${item.title || 'Unknown'}' is no longer available.`
        });
      }

      // Compute dynamic discount price
      const priceCalc = product.priceCalculation;
      const effectiveUnitPrice = priceCalc.finalPrice;

      // Check variant stock
      const variant = product.variants.find(v => v.size === item.size && (!item.color || v.color === item.color));
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Selected size '${item.size}' is not available for ${product.title}.`
        });
      }

      const requestedQty = Math.max(1, Number(item.quantity) || 1);
      if (variant.stock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title} (${item.size}). Only ${variant.stock} item(s) left.`
        });
      }

      // Decrement variant stock & increment sales count
      variant.stock -= requestedQty;
      product.salesCount = (product.salesCount || 0) + requestedQty;
      await product.save();

      const itemTotal = effectiveUnitPrice * requestedQty;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        title: product.title,
        image: product.images?.[0]?.url || item.image || '',
        size: item.size,
        color: item.color || variant.color || '',
        quantity: requestedQty,
        unitPrice: effectiveUnitPrice,
        originalPrice: product.basePrice,
        sku: variant.sku || product.sku
      });
    }

    // Delivery fee rule: Free delivery in Dhaka over ৳5,000.
    // Standard rates: Inside Dhaka = ৳80, Outside Dhaka = ৳150.
    const isDhaka = shippingAddress.district?.toLowerCase().includes('dhaka') || shippingAddress.city?.toLowerCase().includes('dhaka');
    let deliveryFee = isDhaka ? 80 : 150;
    if (isDhaka && subtotal >= 5000) {
      deliveryFee = 0; // Free delivery in Dhaka over ৳5,000 per Figma promise
    }

    const totalAmount = subtotal + deliveryFee;
    const orderNumber = generateOrderNumber();

    // Initial timeline entry
    const initialTimeline = [
      {
        status: 'pending',
        title: 'Order Placed (Pending Confirmation)',
        note: 'Thank you for choosing Vantero. Our concierge team is reviewing your order.',
        timestamp: new Date(),
        updatedBy: 'System'
      }
    ];

    const order = await Order.create({
      orderNumber,
      customer: user._id,
      items: validatedItems,
      shippingAddress,
      subtotal,
      deliveryFee,
      discountAmount: 0,
      totalAmount,
      paymentMethod: 'COD', // Strictly COD only
      paymentStatus: 'pending',
      orderStatus: 'pending',
      customerNotes: customerNotes || '',
      trackingTimeline: initialTimeline
    });

    // Save address to user's profile if default or first
    if (user.savedAddresses.length === 0) {
      user.savedAddresses.push({
        ...shippingAddress,
        isDefault: true,
        label: 'Home'
      });
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully with Cash on Delivery.',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        itemsCount: validatedItems.length,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'title slug images')
      .populate('returnRequest');

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderTrackingByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ orderNumber })
      .populate('items.product', 'title slug images')
      .populate('customer', 'name phone')
      .populate('returnRequest');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        items: order.items,
        courier: order.courier,
        trackingTimeline: order.trackingTimeline,
        hasReturnRequest: order.hasReturnRequest,
        returnStatus: order.returnStatus,
        returnRequest: order.returnRequest,
        deliveredAt: order.deliveredAt,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    if (q) {
      const searchRegex = new RegExp(String(q).trim(), 'i');
      filter.$or = [
        { orderNumber: searchRegex },
        { 'shippingAddress.recipientName': searchRegex },
        { 'shippingAddress.phone': searchRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('customer', 'name phone email'),
      Order.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, courierName, trackingCode, trackingUrl } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.orderStatus = status;

    if (status === 'delivered') {
      order.paymentStatus = 'paid'; // Cash on Delivery paid on delivery
      if (!order.deliveredAt) {
        order.deliveredAt = new Date();
      }
    }

    if (courierName) order.courier.name = courierName;
    if (trackingCode) order.courier.trackingCode = trackingCode;
    if (trackingUrl) order.courier.trackingUrl = trackingUrl;

    // Timeline title mapping
    const titleMap = {
      pending: 'Order Under Review',
      confirmed: 'Order Confirmed',
      processing: 'Packed & Ready for Courier Dispatch',
      shipped: 'Handed to Courier (Out for Delivery)',
      delivered: 'Delivered & Payment Received',
      cancelled: 'Order Cancelled'
    };

    order.trackingTimeline.push({
      status,
      title: titleMap[status] || status,
      note: note || `Order status updated to ${status}.`,
      timestamp: new Date(),
      updatedBy: req.user.name || 'Admin'
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order
    });
  } catch (error) {
    next(error);
  }
};
