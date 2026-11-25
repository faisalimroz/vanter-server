import { getExecutiveAnalytics } from '../services/analyticsService.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const { range } = req.query;
    const stats = await getExecutiveAnalytics(range);
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};
