import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/paymentService.js';
import { confirmBooking } from '../services/bookingService.js';

/**
 * @controller paymentController
 * Handles payment order generation, client signature verification, and Razorpay webhook events.
 */

/**
 * Create a Razorpay order for an existing booking.
 * POST /api/payments/create-order
 */
export const createOrder = catchAsync(async (req, res, next) => {
  const { bookingId } = req.body;
  const userId = req.user.id || req.user._id;

  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return next(new AppError('A valid bookingId is required', 400));
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.userId.toString() !== userId.toString()) {
    return next(new AppError('Unauthorized to create payment for this booking', 403));
  }

  if (booking.status === 'confirmed') {
    return next(new AppError('This booking has already been confirmed and paid', 400));
  }

  if (booking.status === 'cancelled') {
    return next(new AppError('Cannot initiate payment for a cancelled booking', 400));
  }

  // Create order via paymentService
  const order = await createRazorpayOrder(booking.totalAmount, booking._id, {
    propertyId: booking.propertyId.toString(),
    userId: booking.userId.toString(),
  });

  // Store razorpayOrderId on booking
  booking.razorpayOrderId = order.id;
  await booking.save();

  res.status(200).json({
    status: 'success',
    order,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    bookingId: booking._id,
    amount: order.amount,
    currency: order.currency,
  });
});

/**
 * Verify Razorpay payment signature and confirm the reservation.
 * POST /api/payments/verify
 */
export const verifyPayment = catchAsync(async (req, res, next) => {
  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;
  const userId = req.user.id || req.user._id;

  if (!bookingId || !razorpay_order_id || !razorpay_payment_id) {
    return next(
      new AppError('bookingId, razorpay_order_id, and razorpay_payment_id are required', 400)
    );
  }

  const isValid = verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!isValid) {
    return next(new AppError('Payment signature verification failed', 400));
  }

  // Confirm booking
  const booking = await confirmBooking(
    bookingId,
    {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    },
    userId
  );

  res.status(200).json({
    status: 'success',
    message: 'Payment verified successfully and booking confirmed',
    booking,
  });
});

/**
 * Handle incoming Razorpay webhooks (payment.captured, payment.failed, refund.processed)
 * POST /api/payments/webhook
 */
export const handleWebhook = catchAsync(async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body;

  // Verify webhook signature
  const isSignatureValid = verifyWebhookSignature(rawBody, signature);
  if (!isSignatureValid) {
    console.warn('[Webhook] Invalid Razorpay webhook signature');
    return res.status(400).json({ status: 'fail', message: 'Invalid webhook signature' });
  }

  // Parse payload (rawBody is Buffer from express.raw)
  let eventPayload;
  try {
    eventPayload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf-8'));
  } catch (err) {
    eventPayload = req.body;
  }

  const { event, payload } = eventPayload;
  console.log(`[Webhook] Razorpay event received: ${event}`);

  switch (event) {
    case 'payment.captured': {
      const payment = payload?.payment?.entity;
      const orderId = payment?.order_id;
      const paymentId = payment?.id;

      if (orderId) {
        const booking = await Booking.findOne({ razorpayOrderId: orderId });
        if (booking && booking.status !== 'confirmed') {
          await confirmBooking(booking._id, {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
          });
          console.log(`[Webhook] Confirmed booking ${booking._id} via payment.captured webhook`);
        }
      }
      break;
    }

    case 'payment.failed': {
      const payment = payload?.payment?.entity;
      const orderId = payment?.order_id;
      console.warn(`[Webhook] Payment failed for order ${orderId}: ${payment?.error_description}`);
      break;
    }

    case 'refund.processed': {
      const refund = payload?.refund?.entity;
      const paymentId = refund?.payment_id;
      if (paymentId) {
        const booking = await Booking.findOne({ razorpayPaymentId: paymentId });
        if (booking) {
          booking.refundId = refund.id;
          booking.refundAmount = refund.amount / 100;
          await booking.save();
          console.log(`[Webhook] Refund processed for booking ${booking._id}`);
        }
      }
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event: ${event}`);
      break;
  }

  // Return 200 to acknowledge webhook receipt
  res.status(200).json({ status: 'ok', received: true });
});

export default {
  createOrder,
  verifyPayment,
  handleWebhook,
};
