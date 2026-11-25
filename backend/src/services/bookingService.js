import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import RoomUnit from '../models/RoomUnit.js';
import User from '../models/User.js';
import { createBookingWithLock, checkUnitAvailability } from './availabilityService.js';
import { calculateBookingPrice } from './pricingService.js';
import { verifyPaymentSignature, processRefund } from './paymentService.js';
import { sendBookingConfirmation, sendBookingCancellation } from './emailService.js';

/**
 * @module bookingService
 * Complete lifecycle service for reservations: quote calculation, temporary hold with TTL,
 * payment confirmation, cancellation policy evaluation, refunds, and query endpoints.
 */

/**
 * Cancellation policy definitions
 */
export const CANCELLATION_POLICIES = {
  flexible: {
    name: 'Flexible',
    description: 'Full refund if cancelled 24+ hours before check-in',
    rules: [
      { hoursBeforeCheckIn: 24, refundPercentage: 100 },
      { hoursBeforeCheckIn: 0, refundPercentage: 50 },
    ],
  },
  moderate: {
    name: 'Moderate',
    description: 'Full refund if cancelled 5+ days before check-in; 50% refund 1-5 days before',
    rules: [
      { hoursBeforeCheckIn: 120, refundPercentage: 100 }, // 5 days = 120h
      { hoursBeforeCheckIn: 24, refundPercentage: 50 },
      { hoursBeforeCheckIn: 0, refundPercentage: 0 },
    ],
  },
  strict: {
    name: 'Strict',
    description: '50% refund if cancelled 14+ days before check-in; no refund otherwise',
    rules: [
      { hoursBeforeCheckIn: 336, refundPercentage: 50 }, // 14 days = 336h
      { hoursBeforeCheckIn: 0, refundPercentage: 0 },
    ],
  },
};

/**
 * Get a price quote for a stay
 * @param {string} unitId
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @param {number} [guests=1]
 * @returns {Promise<Object>}
 */
export const getBookingQuote = async (unitId, checkIn, checkOut, guests = 1) => {
  const unit = await RoomUnit.findById(unitId).populate('propertyId');
  if (!unit || !unit.isActive) {
    const error = new Error('Room unit not found or inactive');
    error.statusCode = 404;
    throw error;
  }

  if (unit.capacity < guests) {
    const error = new Error(`Unit capacity of ${unit.capacity} is less than requested ${guests} guests`);
    error.statusCode = 400;
    throw error;
  }

  const { available, remainingCount } = await checkUnitAvailability(unitId, checkIn, checkOut);
  const quote = await calculateBookingPrice(unit, checkIn, checkOut, guests);

  return {
    unit: {
      _id: unit._id,
      name: unit.name,
      basePrice: unit.basePrice,
      capacity: unit.capacity,
    },
    property: {
      _id: unit.propertyId._id,
      title: unit.propertyId.title,
      cancellationPolicy: unit.propertyId.policies?.cancellation || 'moderate',
    },
    checkIn,
    checkOut,
    guests,
    nights: quote.nights,
    priceBreakdown: quote.priceBreakdown,
    totalAmount: quote.totalAmount,
    isAvailable: available,
    remainingInventory: remainingCount,
  };
};

/**
 * Create a temporary booking hold with TTL expiry (15 minutes).
 *
 * @param {string} userId
 * @param {Object} holdData - { unitId, checkIn, checkOut, guests }
 * @returns {Promise<Booking>}
 */
export const createBookingHold = async (userId, { unitId, checkIn, checkOut, guests = 1 }) => {
  const unit = await RoomUnit.findById(unitId);
  if (!unit || !unit.isActive) {
    const error = new Error('Unit not found or inactive');
    error.statusCode = 404;
    throw error;
  }

  if (unit.capacity < guests) {
    const error = new Error(`Unit max capacity is ${unit.capacity} guests`);
    error.statusCode = 400;
    throw error;
  }

  const quote = await calculateBookingPrice(unit, checkIn, checkOut, guests);

  // 15-minute hold TTL
  const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const bookingData = {
    unitId: unit._id,
    propertyId: unit.propertyId,
    userId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    guests,
    nights: quote.nights,
    priceBreakdown: quote.priceBreakdown,
    totalAmount: quote.totalAmount,
    status: 'held',
    holdExpiresAt,
  };

  const booking = await createBookingWithLock(bookingData);
  return booking;
};

/**
 * Confirm a booking after payment verification.
 *
 * @param {string} bookingId
 * @param {Object} paymentData - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @param {string} [userId]
 * @returns {Promise<Booking>}
 */
export const confirmBooking = async (bookingId, paymentData = {}, userId = null) => {
  const booking = await Booking.findById(bookingId)
    .populate('propertyId')
    .populate('unitId')
    .populate('userId');

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (userId && booking.userId._id.toString() !== userId.toString()) {
    const error = new Error('Unauthorized to confirm this booking');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'confirmed') {
    return booking; // Idempotent
  }

  if (booking.status === 'cancelled') {
    const error = new Error('Cannot confirm a cancelled booking');
    error.statusCode = 400;
    throw error;
  }

  // If signature verification details provided, verify (allow mock signature in non-production dev/test mode)
  const isMockDevSignature =
    process.env.NODE_ENV !== 'production' &&
    paymentData.razorpay_signature === 'sig_mock_verified';

  if (paymentData.razorpay_signature && !isMockDevSignature) {
    const isValid = verifyPaymentSignature(paymentData);
    if (!isValid) {
      const error = new Error('Invalid payment signature verification');
      error.statusCode = 400;
      throw error;
    }
  }

  booking.status = 'confirmed';
  booking.holdExpiresAt = null; // Clear TTL so document persists
  booking.razorpayOrderId = paymentData.razorpay_order_id || booking.razorpayOrderId;
  booking.razorpayPaymentId = paymentData.razorpay_payment_id || booking.razorpayPaymentId;
  await booking.save();

  // Trigger confirmation email
  sendBookingConfirmation(booking, booking.userId, booking.propertyId, booking.unitId).catch((err) => {
    console.error('Failed to send confirmation email:', err);
  });

  return booking;
};

/**
 * Calculate refund amount based on cancellation policy and check-in date
 *
 * @param {Booking} booking
 * @param {Property} property
 * @returns {{ refundPercentage: number, refundAmount: number, hoursBeforeCheckIn: number, policyName: string }}
 */
export const calculateRefund = (booking, property) => {
  const policyType = property?.policies?.cancellation || 'moderate';
  const policy = CANCELLATION_POLICIES[policyType] || CANCELLATION_POLICIES.moderate;

  const now = new Date();
  const checkIn = new Date(booking.checkIn);
  const diffMs = checkIn.getTime() - now.getTime();
  const hoursBeforeCheckIn = Math.max(0, diffMs / (1000 * 60 * 60));

  let refundPercentage = 0;
  for (const rule of policy.rules) {
    if (hoursBeforeCheckIn >= rule.hoursBeforeCheckIn) {
      refundPercentage = rule.refundPercentage;
      break;
    }
  }

  const refundAmount = Math.round((booking.totalAmount * refundPercentage) / 100);

  return {
    refundPercentage,
    refundAmount,
    hoursBeforeCheckIn: Math.round(hoursBeforeCheckIn),
    policyName: policy.name,
  };
};

/**
 * Preview refund amount for a booking without cancelling.
 *
 * @param {string} bookingId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export const getRefundPreview = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate('propertyId');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.userId.toString() !== userId.toString()) {
    const error = new Error('Unauthorized to preview refund for this booking');
    error.statusCode = 403;
    throw error;
  }

  return calculateRefund(booking, booking.propertyId);
};

/**
 * Cancel an existing booking with policy-driven refund processing.
 *
 * @param {string} bookingId
 * @param {string} userId
 * @param {string} [reason='']
 * @returns {Promise<Booking>}
 */
export const cancelBooking = async (bookingId, userId, reason = '') => {
  const booking = await Booking.findById(bookingId)
    .populate('propertyId')
    .populate('unitId')
    .populate('userId');

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.userId._id.toString() !== userId.toString()) {
    const error = new Error('Unauthorized to cancel this booking');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'cancelled') {
    const error = new Error('Booking is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  let refundAmount = 0;
  let refundId = null;

  if (booking.status === 'confirmed') {
    const refundDetails = calculateRefund(booking, booking.propertyId);
    refundAmount = refundDetails.refundAmount;

    if (refundAmount > 0 && booking.razorpayPaymentId) {
      const refundResult = await processRefund(booking.razorpayPaymentId, refundAmount, {
        bookingId: booking._id.toString(),
        reason,
      });
      refundId = refundResult?.id || `rfnd_${Date.now()}`;
    }
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason || '';
  booking.refundAmount = refundAmount;
  booking.refundId = refundId;
  booking.holdExpiresAt = null;
  await booking.save();

  // Send cancellation email
  sendBookingCancellation(booking, booking.userId, booking.propertyId, booking.unitId).catch((err) => {
    console.error('Failed to send cancellation email:', err);
  });

  return booking;
};

/**
 * Get paginated bookings for a guest
 *
 * @param {string} userId
 * @param {Object} queryParams - { status, page, limit }
 * @returns {Promise<{ bookings: Array, total: number, page: number, totalPages: number }>}
 */
export const getUserBookings = async (userId, queryParams = {}) => {
  const { status, page = 1, limit = 10 } = queryParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const currentLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

  const filter = { userId };
  if (status && status !== 'all') {
    filter.status = status;
  }

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate({
      path: 'propertyId',
      select: 'title type location images policies rating',
    })
    .populate({
      path: 'unitId',
      select: 'name capacity basePrice images',
    })
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * currentLimit)
    .limit(currentLimit)
    .lean();

  return {
    bookings,
    total,
    page: currentPage,
    totalPages: Math.ceil(total / currentLimit) || 1,
  };
};

/**
 * Get paginated bookings for properties owned by an owner
 *
 * @param {string} ownerId
 * @param {Object} queryParams - { propertyId, status, page, limit }
 * @returns {Promise<{ bookings: Array, total: number, page: number, totalPages: number }>}
 */
export const getOwnerBookings = async (ownerId, queryParams = {}) => {
  const { propertyId, status, page = 1, limit = 10 } = queryParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const currentLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

  // Find all properties owned by this owner
  const properties = await Property.find({ ownerId }).select('_id').lean();
  const propertyIds = properties.map((p) => p._id);

  const filter = {
    propertyId: { $in: propertyIds },
  };

  if (propertyId) {
    filter.propertyId = propertyId;
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate({
      path: 'propertyId',
      select: 'title location images',
    })
    .populate({
      path: 'unitId',
      select: 'name basePrice',
    })
    .populate({
      path: 'userId',
      select: 'name email phone',
    })
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * currentLimit)
    .limit(currentLimit)
    .lean();

  return {
    bookings,
    total,
    page: currentPage,
    totalPages: Math.ceil(total / currentLimit) || 1,
  };
};

export default {
  getBookingQuote,
  createBookingHold,
  confirmBooking,
  calculateRefund,
  getRefundPreview,
  cancelBooking,
  getUserBookings,
  getOwnerBookings,
};
