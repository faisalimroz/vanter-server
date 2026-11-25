import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import ReturnRequest from '../models/ReturnRequest.js';

export const getExecutiveAnalytics = async (dateRange = 'this_month') => {
  const now = new Date();
  let startDate = new Date();

  // Date range determination
  if (dateRange === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (dateRange === 'last_7_days') {
    startDate.setDate(now.getDate() - 7);
  } else if (dateRange === 'this_year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    // Default 'this_month'
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Overall KPIs aggregation via $facet
  const [kpiResults] = await Order.aggregate([
    {
      $facet: {
        totalRevenue: [
          { $match: { orderStatus: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ],
        monthlyRevenue: [
          { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ],
        yearlyRevenue: [
          { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: startOfYear } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ],
        totalOrders: [
          { $count: 'count' }
        ],
        monthlyOrders: [
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $count: 'count' }
        ],
        yearlyOrders: [
          { $match: { createdAt: { $gte: startOfYear } } },
          { $count: 'count' }
        ],
        pendingCodOrders: [
          { $match: { orderStatus: 'pending' } },
          { $count: 'count' }
        ],
        deliveredOrders: [
          { $match: { orderStatus: 'delivered' } },
          { $count: 'count' }
        ],
        statusDistribution: [
          { $group: { _id: '$orderStatus', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
        ]
      }
    }
  ]);

  const [returnStats] = await ReturnRequest.aggregate([
    {
      $facet: {
        allReturns: [
          {
            $group: {
              _id: null,
              totalUnits: { $sum: '$totalReturnQuantity' },
              totalAmount: { $sum: '$totalReturnAmount' },
              count: { $sum: 1 }
            }
          }
        ],
        completedReturns: [
          { $match: { status: 'completed' } },
          {
            $group: {
              _id: null,
              completedUnits: { $sum: '$totalReturnQuantity' },
              settledAmount: { $sum: '$settledAmount' },
              count: { $sum: 1 }
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

  const totalCustomers = await User.countDocuments({ role: 'customer' });

  // Return calculations
  const grossRevenue = kpiResults.totalRevenue[0]?.total || 0;
  const totalReturnsCount = returnStats.allReturns[0]?.count || 0;
  const totalReturnedUnits = returnStats.allReturns[0]?.totalUnits || 0;
  const totalReturnAmount = returnStats.allReturns[0]?.totalAmount || 0;
  const completedReturnsAmount = returnStats.completedReturns[0]?.settledAmount || 0;
  const completedReturnsUnits = returnStats.completedReturns[0]?.completedUnits || 0;
  const netRevenue = Math.max(0, grossRevenue - completedReturnsAmount);
  const deliveredOrdersCount = kpiResults.deliveredOrders[0]?.count || 0;
  const returnRatePercent = deliveredOrdersCount > 0
    ? Number(((totalReturnsCount / deliveredOrdersCount) * 100).toFixed(1))
    : 0;

  // Monthly Revenue & Order Volume (last 12 months)
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const monthlyTrends = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo },
        orderStatus: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedTrends = monthlyTrends.map(item => ({
    name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
    revenue: item.revenue,
    orders: item.orders
  }));

  // Top Selling Products
  const topProducts = await Product.find({ isActive: true })
    .sort({ salesCount: -1 })
    .limit(5)
    .populate('category', 'name')
    .select('title sku basePrice salesCount images category');

  return {
    kpis: {
      totalRevenue: grossRevenue,
      netRevenue,
      monthlyRevenue: kpiResults.monthlyRevenue[0]?.total || 0,
      yearlyRevenue: kpiResults.yearlyRevenue[0]?.total || 0,
      totalOrders: kpiResults.totalOrders[0]?.count || 0,
      monthlyOrders: kpiResults.monthlyOrders[0]?.count || 0,
      yearlyOrders: kpiResults.yearlyOrders[0]?.count || 0,
      pendingCodOrders: kpiResults.pendingCodOrders[0]?.count || 0,
      deliveredOrders: deliveredOrdersCount,
      totalCustomers,
      totalReturns: totalReturnsCount,
      returnedUnits: totalReturnedUnits,
      returnValue: totalReturnAmount,
      completedReturnValue: completedReturnsAmount,
      completedReturnedUnits: completedReturnsUnits,
      returnRate: returnRatePercent
    },
    statusDistribution: kpiResults.statusDistribution.map(s => ({
      status: s._id,
      count: s.count,
      totalAmount: s.totalAmount
    })),
    returnReasonBreakdown: returnStats.byReason.map(r => ({
      reason: r._id,
      count: r.count,
      totalAmount: r.totalAmount
    })),
    monthlyTrends: formattedTrends,
    topProducts
  };
};
