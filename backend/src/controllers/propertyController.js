import mongoose from 'mongoose';
import Property from '../models/Property.js';
import RoomUnit from '../models/RoomUnit.js';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { getMonthlyAvailability } from '../services/availabilityService.js';

/**
 * @controller propertyController
 * Handles public and guest property endpoints: details, units, availability calendars, and reviews.
 */

/**
 * List active properties with lowest unit price (for HomePage featured & listings).
 * GET /api/properties
 */
export const getProperties = catchAsync(async (req, res, next) => {
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 12));
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const skip = (page - 1) * limit;

  const filter = { isActive: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.city) filter['location.city'] = { $regex: new RegExp(req.query.city, 'i') };

  const total = await Property.countDocuments(filter);
  const properties = await Property.find(filter)
    .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const propertyIds = properties.map((p) => p._id);
  const units = await RoomUnit.find({ propertyId: { $in: propertyIds }, isActive: true }).lean();

  const unitsByProp = {};
  for (const unit of units) {
    const key = unit.propertyId.toString();
    if (!unitsByProp[key]) unitsByProp[key] = [];
    unitsByProp[key].push(unit);
  }

  const enriched = properties.map((prop) => {
    const propUnits = unitsByProp[prop._id.toString()] || [];
    const prices = propUnits.map((u) => u.basePrice).filter((p) => p != null);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    return {
      ...prop,
      units: propUnits,
      minPrice,
      pricePerNight: minPrice,
    };
  });

  res.status(200).json({
    status: 'success',
    results: enriched.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    properties: enriched,
    data: enriched,
  });
});

/**
 * Fetch a single property by ID with populated active room units.
 * GET /api/properties/:id
 */
export const getProperty = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid property ID format', 400));
  }

  const property = await Property.findById(id).populate({
    path: 'ownerId',
    select: 'name email phone avatar',
  });

  if (!property || !property.isActive) {
    return next(new AppError('Property not found', 404));
  }

  const units = await RoomUnit.find({ propertyId: property._id, isActive: true }).lean();

  res.status(200).json({
    status: 'success',
    property: {
      ...property.toObject(),
      units,
    },
    data: {
      ...property.toObject(),
      units,
    },
  });
});

/**
 * Get monthly availability calendar for all units of a property.
 * GET /api/properties/:id/availability?month=&year=
 */
export const getPropertyAvailability = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { month, year } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid property ID format', 400));
  }

  const property = await Property.findById(id).select('_id isActive');
  if (!property || !property.isActive) {
    return next(new AppError('Property not found', 404));
  }

  const availabilityData = await getMonthlyAvailability(id, month, year);

  res.status(200).json({
    status: 'success',
    availability: availabilityData,
    data: availabilityData,
  });
});

/**
 * Get paginated reviews for a property with reviewer details.
 * GET /api/properties/:id/reviews?page=&limit=
 */
export const getPropertyReviews = catchAsync(async (req, res, next) => {
  const { id, propertyId } = req.params;
  const targetId = id || propertyId;

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return next(new AppError('Invalid property ID format', 400));
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));

  const total = await Review.countDocuments({ propertyId: targetId });
  const reviews = await Review.find({ propertyId: targetId })
    .populate({
      path: 'userId',
      select: 'name avatar',
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    reviews,
    data: reviews,
  });
});

/**
 * Create a review for a completed stay.
 * POST /api/properties/:id/reviews
 */
export const createReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { bookingId, rating, title, comment } = req.body;
  const userId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid property ID format', 400));
  }

  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return next(new AppError('Valid bookingId is required to leave a review', 400));
  }

  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError('Rating must be between 1 and 5', 400));
  }

  if (!comment || comment.trim() === '') {
    return next(new AppError('Review comment cannot be empty', 400));
  }

  // Verify booking exists, is completed or confirmed past check-in, belongs to this user and property
  const booking = await Booking.findOne({
    _id: bookingId,
    userId,
    propertyId: id,
  });

  if (!booking) {
    return next(
      new AppError('No matching booking found for this property under your account', 404)
    );
  }

  if (booking.status !== 'completed' && booking.status !== 'confirmed') {
    return next(
      new AppError('Reviews can only be submitted for confirmed or completed bookings', 400)
    );
  }

  // Ensure only one review per booking
  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) {
    return next(new AppError('You have already submitted a review for this reservation', 409));
  }

  const review = await Review.create({
    propertyId: id,
    userId,
    bookingId,
    rating: Number(rating),
    title: title ? title.trim() : '',
    comment: comment.trim(),
  });

  const populatedReview = await Review.findById(review._id).populate({
    path: 'userId',
    select: 'name avatar',
  });

  res.status(201).json({
    status: 'success',
    message: 'Thank you for your feedback! Your review has been published.',
    review: populatedReview,
    data: populatedReview,
  });
});

export default {
  getProperty,
  getPropertyAvailability,
  getPropertyReviews,
  createReview,
};
