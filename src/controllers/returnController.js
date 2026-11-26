import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';

// Status human readable titles
const RETURN_STATUS_TITLES = {
  pending: 'Return Request Under Review',
  approved: 'Return Approved (Pickup Scheduled)',
  in_transit: 'Parcel In Transit to Concierge Center',
  completed: 'Return Received & Settled',
  rejected: 'Return Request Declined'
};

/**
 * Customer: Submit a new return request for a delivered order
 */
export const createCustomerReturn = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { items, customerReason, customerNotes } = req.body;
    const user = req.user;

    const order = await Order.findOne({ orderNumber, customer: user._id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to your account.'
      });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Returns are only eligible for delivered orders.'
      });
    }

    if (order.hasReturnRequest) {
      return res.status(400).json({
        success: false,
        message: 'A return request is already open or processed for this order.'
      });
    }

    // 7-day post-delivery return window validation
    const deliveredDate = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveredDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return res.status(400).json({
        success: false,
        message: `The 7-day return window for this order expired ${Math.floor(daysSinceDelivery)} days ago.`
      });
    }

    // Parse items if submitted as stringified JSON from multipart form
    let parsedItems = items;
    if (typeof items === 'string') {
      try {
        parsedItems = JSON.parse(items);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid items format.' });
      }
    }

    if (!parsedItems || !Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one delivered item to return.'
      });
    }

    // Validate returned items against order items
    let totalReturnQuantity = 0;
    let totalReturnAmount = 0;
    const validatedReturnItems = [];

    for (const retItem of parsedItems) {
      const orderItem = order.items.find(
        (oi) =>
          String(oi.product) === String(retItem.productId || retItem.product) &&
          oi.size === retItem.size
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Item (${retItem.title || retItem.size}) was not found in this order.`
        });
      }

      const requestedQty = Math.max(1, Number(retItem.quantity) || 1);
      if (requestedQty > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Return quantity (${requestedQty}) exceeds ordered quantity (${orderItem.quantity}) for ${orderItem.title}.`
        });
      }

      const itemRefund = orderItem.unitPrice * requestedQty;
      totalReturnQuantity += requestedQty;
      totalReturnAmount += itemRefund;

      validatedReturnItems.push({
        product: orderItem.product,
        title: orderItem.title,
        image: orderItem.image || '',
        size: orderItem.size,
        color: orderItem.color || '',
        quantity: requestedQty,
        unitPrice: orderItem.unitPrice,
        totalRefund: itemRefund,
        reason: retItem.reason || customerReason || 'size_fit_issue'
      });
    }

    // Handle uploaded proof photos via Multer diskStorage
    const proofImages = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const folder = file.targetFolder || 'returns';
        proofImages.push({
          url: `/uploads/${folder}/${file.filename}`,
          publicId: `${folder}/${file.filename}`
        });
      }
    }

    const returnNumber = `RET-${order.orderNumber}-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialTimeline = [
      {
        status: 'pending',
        title: RETURN_STATUS_TITLES.pending,
        note: customerNotes || 'Return request registered by customer and awaiting concierge approval.',
        timestamp: new Date(),
        updatedBy: user.name || 'Customer'
      }
    ];

    const returnDoc = await ReturnRequest.create({
      returnNumber,
      order: order._id,
      orderNumber: order.orderNumber,
      customer: user._id,
      items: validatedReturnItems,
      totalReturnQuantity,
      totalReturnAmount,
      customerReason: customerReason || 'size_fit_issue',
      customerNotes: customerNotes || '',
      proofImages,
      status: 'pending',
      timeline: initialTimeline
    });

    // Update Order with return references
    order.hasReturnRequest = true;
    order.returnStatus = 'pending';
    order.returnRequest = returnDoc._id;
    await order.save();

    // Trigger Admin Notification for Return Delivery / Request
    try {
      await Notification.create({
        type: 'RETURN_DELIVERY',
        title: `Return Requested: #${order.orderNumber}`,
        message: `${user.name || 'Customer'} requested a return for Order #${order.orderNumber}. Reason: ${customerReason || 'Size/Fit'}. Amount: ৳${totalReturnAmount.toLocaleString()}.`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        isRead: false
      });
    } catch (notifErr) {
      console.error('[Notification Error]:', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Return request submitted successfully. Our team will review within 24 hours.',
      returnRequest: returnDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer / Public tracking for a specific order's return
 */
export const getOrderReturn = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const returnDoc = await ReturnRequest.findOne({ orderNumber })
      .populate('customer', 'name phone')
      .populate('items.product', 'title slug images');

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: 'No return request found for this order.'
      });
    }

    return res.status(200).json({
      success: true,
      returnRequest: returnDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: List and filter returns queue
 */
export const getAdminReturns = async (req, res, next) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (q) {
      const searchRegex = new RegExp(String(q).trim(), 'i');
      filter.$or = [
        { returnNumber: searchRegex },
        { orderNumber: searchRegex },
        { customerReason: searchRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [returns, total] = await Promise.all([
      ReturnRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('customer', 'name phone email')
        .populate('order', 'orderNumber totalAmount paymentMethod deliveredAt'),
      ReturnRequest.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      returns,
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

/**
 * Admin: Get single return request detail
 */
export const getAdminReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const returnDoc = await ReturnRequest.findById(id)
      .populate('customer', 'name phone email savedAddresses')
      .populate('order')
      .populate('items.product', 'title slug sku variants images');

    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return request not found.' });
    }

    return res.status(200).json({
      success: true,
      returnRequest: returnDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update return status (Approve, Reject, In Transit, Complete with Restock)
 */
export const updateReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      note,
      rejectionReason,
      courierName,
      trackingCode,
      restockItems
    } = req.body;

    const validStatuses = ['pending', 'approved', 'in_transit', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid return status.' });
    }

    const returnDoc = await ReturnRequest.findById(id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return request not found.' });
    }

    if (status === 'rejected' && !rejectionReason && !note) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason note is required when rejecting a return.'
      });
    }

    returnDoc.status = status;

    if (rejectionReason) returnDoc.rejectionReason = rejectionReason;
    if (note) returnDoc.adminNotes = note;

    if (courierName) returnDoc.pickupCourier.name = courierName;
    if (trackingCode) returnDoc.pickupCourier.trackingCode = trackingCode;

    // Handle Completion and Variant Restocking
    if (status === 'completed') {
      returnDoc.settlementStatus = 'settled';
      returnDoc.settledAmount = returnDoc.totalReturnAmount;
      returnDoc.settledAt = new Date();

      // If admin explicitly checked restockItems and items haven't been restocked yet
      if (restockItems === true && !returnDoc.isRestocked) {
        for (const item of returnDoc.items) {
          try {
            const product = await Product.findById(item.product);
            if (product) {
              const variant = product.variants.find((v) => v.size === item.size);
              if (variant) {
                variant.stock += item.quantity;
              }
              product.salesCount = Math.max(0, (product.salesCount || 0) - item.quantity);
              await product.save();
              item.restocked = true;
            }
          } catch (restockErr) {
            console.error(`Failed to restock product ${item.product}:`, restockErr.message);
          }
        }
        returnDoc.isRestocked = true;
      }
    } else if (status === 'rejected') {
      returnDoc.settlementStatus = 'rejected';
    }

    // Append to timeline
    returnDoc.timeline.push({
      status,
      title: RETURN_STATUS_TITLES[status] || status,
      note: note || rejectionReason || `Return status updated to ${status}.`,
      timestamp: new Date(),
      updatedBy: req.user.name || 'Admin'
    });

    await returnDoc.save();

    // Sync order return status
    await Order.findByIdAndUpdate(returnDoc.order, {
      returnStatus: status
    });

    return res.status(200).json({
      success: true,
      message: `Return request status updated to '${status}'.`,
      returnRequest: returnDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Aggregate Return Analytics and Metrics
 */
export const getReturnsAnalytics = async (req, res, next) => {
  try {
    const [
      totalReturnsCount,
      pendingCount,
      approvedCount,
      inTransitCount,
      completedCount,
      rejectedCount
    ] = await Promise.all([
      ReturnRequest.countDocuments(),
      ReturnRequest.countDocuments({ status: 'pending' }),
      ReturnRequest.countDocuments({ status: 'approved' }),
      ReturnRequest.countDocuments({ status: 'in_transit' }),
      ReturnRequest.countDocuments({ status: 'completed' }),
      ReturnRequest.countDocuments({ status: 'rejected' })
    ]);

    // Financial calculations: total refunded / settled amount and total units
    const [financialStats] = await ReturnRequest.aggregate([
      {
        $facet: {
          allReturns: [
            {
              $group: {
                _id: null,
                totalUnits: { $sum: '$totalReturnQuantity' },
                totalAmount: { $sum: '$totalReturnAmount' }
              }
            }
          ],
          completedReturns: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: null,
                completedUnits: { $sum: '$totalReturnQuantity' },
                settledAmount: { $sum: '$settledAmount' }
              }
            }
          ],
          byReason: [
            {
              $group: {
                _id: '$customerReason',
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalReturnAmount' }
              }
            },
            { $sort: { count: -1 } }
          ]
        }
      }
    ]);

    // Delivered orders count to compute Return Rate (%)
    const deliveredOrdersCount = await Order.countDocuments({ orderStatus: 'delivered' });
    const totalOrdersCount = await Order.countDocuments();

    const totalUnits = financialStats.allReturns[0]?.totalUnits || 0;
    const totalAmount = financialStats.allReturns[0]?.totalAmount || 0;
    const settledAmount = financialStats.completedReturns[0]?.settledAmount || 0;
    const completedUnits = financialStats.completedReturns[0]?.completedUnits || 0;

    // Return Rate: percentage of delivered orders that requested a return
    const returnRateOrders = deliveredOrdersCount > 0
      ? Number(((totalReturnsCount / deliveredOrdersCount) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      analytics: {
        totalReturnsCount,
        pendingCount,
        approvedCount,
        inTransitCount,
        completedCount,
        rejectedCount,
        totalUnits,
        totalAmount,
        settledAmount,
        completedUnits,
        deliveredOrdersCount,
        totalOrdersCount,
        returnRateOrders,
        reasonBreakdown: financialStats.byReason.map((r) => ({
          reason: r._id,
          count: r.count,
          totalAmount: r.totalAmount
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
