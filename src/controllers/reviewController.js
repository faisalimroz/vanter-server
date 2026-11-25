import Review from '../models/Review.js';
import { deleteLocalFile } from '../utils/fileStorage.js';

/**
 * Public & Admin: Fetch reviews
 * By default returns published reviews. If ?all=true is passed, returns all reviews.
 */
export const getReviews = async (req, res, next) => {
  try {
    const { all } = req.query;
    const filter = {};

    if (all !== 'true' && all !== true) {
      filter.isPublished = true;
    }

    const reviews = await Review.find(filter).sort({ sortOrder: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Create a new customer review
 */
export const createReview = async (req, res, next) => {
  try {
    const {
      customerName,
      customerLocation,
      rating,
      title,
      comment,
      productName,
      categoryLabel,
      avatarUrl,
      avatarPublicId,
      isPublished,
      sortOrder
    } = req.body;

    if (!customerName || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and review comment are required.'
      });
    }

    const parsedRating = Math.min(5, Math.max(1, Number(rating) || 5));

    const review = await Review.create({
      customerName: customerName.trim(),
      customerLocation: customerLocation ? customerLocation.trim() : '',
      rating: parsedRating,
      title: title ? title.trim() : '',
      comment: comment.trim(),
      productName: productName ? productName.trim() : '',
      categoryLabel: categoryLabel ? categoryLabel.trim() : '',
      avatarUrl: avatarUrl || '',
      avatarPublicId: avatarPublicId || '',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      sortOrder: Number(sortOrder) || 0
    });

    return res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update an existing customer review
 */
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    if (updateData.customerName !== undefined) review.customerName = updateData.customerName.trim();
    if (updateData.customerLocation !== undefined) review.customerLocation = updateData.customerLocation.trim();
    if (updateData.rating !== undefined) {
      review.rating = Math.min(5, Math.max(1, Number(updateData.rating) || 5));
    }
    if (updateData.title !== undefined) review.title = updateData.title.trim();
    if (updateData.comment !== undefined) review.comment = updateData.comment.trim();
    if (updateData.productName !== undefined) review.productName = updateData.productName.trim();
    if (updateData.categoryLabel !== undefined) review.categoryLabel = updateData.categoryLabel.trim();

    // If avatar changed or removed, clean up old file
    if (updateData.avatarUrl !== undefined && updateData.avatarUrl !== review.avatarUrl) {
      if (review.avatarPublicId || review.avatarUrl) {
        await deleteLocalFile(review.avatarPublicId || review.avatarUrl);
      }
      review.avatarUrl = updateData.avatarUrl;
      review.avatarPublicId = updateData.avatarPublicId || '';
    }

    if (updateData.isPublished !== undefined) review.isPublished = Boolean(updateData.isPublished);
    if (updateData.sortOrder !== undefined) review.sortOrder = Number(updateData.sortOrder) || 0;

    await review.save();

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Delete a customer review
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    // Clean up local avatar file if exists
    if (review.avatarPublicId || review.avatarUrl) {
      await deleteLocalFile(review.avatarPublicId || review.avatarUrl);
    }

    await Review.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
