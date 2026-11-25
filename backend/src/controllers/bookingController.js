import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import {
  getBookingQuote,
  createBookingHold,
  confirmBooking as confirmBookingService,
  cancelBooking as cancelBookingService,
  getRefundPreview as getRefundPreviewService,
  getUserBookings,
} from '../services/bookingService.js';

/**
 * @controller bookingController
 * Handles reservations, price quotes, temporary holds, confirmations, cancellations, and user bookings.
 */

/**
 * Generate a dynamic server-side price quote for a room unit and dates.
 * POST /api/bookings/quote
 */
export const getQuote = catchAsync(async (req, res, next) => {
  const { unitId, checkIn, checkOut, guests = 1 } = req.body;

  if (!unitId || !checkIn || !checkOut) {
    return next(new AppError('unitId, checkIn, and checkOut dates are required', 400));
  }

  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    return next(new AppError('Invalid unit ID format', 400));
  }

  const quote = await getBookingQuote(
    unitId,
    checkIn,
    checkOut,
    parseInt(guests, 10) || 1
  );

  res.status(200).json({
    status: 'success',
    quote,
    data: quote,
  });
});

/**
 * Create a temporary booking hold with a 15-minute TTL lock.
 * POST /api/bookings/hold
 */
export const createHold = catchAsync(async (req, res, next) => {
  const { unitId, checkIn, checkOut, guests = 1 } = req.body;
  const userId = req.user.id || req.user._id;

  if (!unitId || !checkIn || !checkOut) {
    return next(new AppError('unitId, checkIn, and checkOut dates are required', 400));
  }

  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    return next(new AppError('Invalid unit ID format', 400));
  }

  const booking = await createBookingHold(userId, {
    unitId,
    checkIn,
    checkOut,
    guests: parseInt(guests, 10) || 1,
  });

  res.status(201).json({
    status: 'success',
    message: 'Booking hold reserved successfully. Please complete checkout before hold expires.',
    booking,
    data: booking,
    holdExpiresAt: booking.holdExpiresAt,
  });
});

/**
 * Confirm a booking after payment completion or verification.
 * POST /api/bookings/:id/confirm
 */
export const confirmBooking = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = req.body;
  const userId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid booking ID format', 400));
  }

  const booking = await confirmBookingService(
    id,
    {
      razorpay_order_id: razorpay_order_id || razorpayOrderId,
      razorpay_payment_id: razorpay_payment_id || razorpayPaymentId,
      razorpay_signature: razorpay_signature || razorpaySignature,
    },
    userId
  );

  res.status(200).json({
    status: 'success',
    message: 'Reservation confirmed! A voucher and receipt have been emailed to you.',
    booking,
    data: booking,
  });
});

/**
 * Cancel an existing reservation with policy-driven refund calculation.
 * PATCH /api/bookings/:id/cancel
 */
export const cancelBooking = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid booking ID format', 400));
  }

  const booking = await cancelBookingService(id, userId, reason);

  res.status(200).json({
    status: 'success',
    message: 'Reservation cancelled successfully.',
    booking,
    data: booking,
    refundAmount: booking.refundAmount,
  });
});

/**
 * Preview refund amount and policy breakdown before user confirms cancellation.
 * GET /api/bookings/:id/refund-preview
 */
export const getRefundPreview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid booking ID format', 400));
  }

  const refundPreview = await getRefundPreviewService(id, userId);

  res.status(200).json({
    status: 'success',
    refundPreview,
    data: refundPreview,
  });
});

/**
 * List reservations made by current logged-in guest.
 * GET /api/bookings/my
 */
export const getMyBookings = catchAsync(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const { status, page, limit } = req.query;

  const result = await getUserBookings(userId, {
    status,
    page,
    limit,
  });

  res.status(200).json({
    status: 'success',
    results: result.bookings.length,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    bookings: result.bookings,
    data: result.bookings,
  });
});

/**
 * Get a single booking by ID (guest or property owner).
 * GET /api/bookings/:id
 */
export const getBookingById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid booking ID format', 400));
  }

  const booking = await Booking.findById(id)
    .populate({
      path: 'propertyId',
      select: 'title type location images policies rating ownerId',
    })
    .populate({
      path: 'unitId',
      select: 'name capacity basePrice images',
    })
    .populate({
      path: 'userId',
      select: 'name email phone',
    })
    .lean();

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  const isGuest = booking.userId?._id?.toString() === userId.toString();
  const isOwner = booking.propertyId?.ownerId?.toString() === userId.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isGuest && !isOwner && !isAdmin) {
    return next(new AppError('Unauthorized to view this booking', 403));
  }

  res.status(200).json({
    status: 'success',
    booking,
    data: booking,
  });
});

export default {
  getQuote,
  createHold,
  confirmBooking,
  cancelBooking,
  getRefundPreview,
  getMyBookings,
  getBookingById,
};
