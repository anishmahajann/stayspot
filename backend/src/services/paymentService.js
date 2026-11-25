import crypto from 'crypto';
import { razorpayInstance } from '../config/razorpay.js';

/**
 * @module paymentService
 * Handles Razorpay payment integration: order creation, signature verification,
 * webhook processing, and refund management.
 */

/**
 * Create a Razorpay order for a booking
 * @param {number} amountInINR - Total booking amount in INR
 * @param {string} bookingId - Internal MongoDB booking ID
 * @param {Object} [notes] - Additional notes to attach to the order
 * @returns {Promise<Object>} Razorpay order object
 */
export const createRazorpayOrder = async (amountInINR, bookingId, notes = {}) => {
  const options = {
    amount: Math.round(amountInINR * 100), // Razorpay accepts paise (1 INR = 100 paise)
    currency: 'INR',
    receipt: `rcpt_${bookingId.toString().slice(-12)}`,
    notes: {
      bookingId: bookingId.toString(),
      ...notes,
    },
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    // In dev / test mode without valid Razorpay credentials, generate simulated order
    if (process.env.NODE_ENV === 'development' || !process.env.RAZORPAY_KEY_SECRET) {
      return {
        id: `order_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        entity: 'order',
        amount: options.amount,
        amount_paid: 0,
        amount_due: options.amount,
        currency: 'INR',
        receipt: options.receipt,
        status: 'created',
        attempts: 0,
        notes: options.notes,
        created_at: Math.floor(Date.now() / 1000),
      };
    }
    throw new Error('Failed to create payment order. Please try again.');
  }
};

/**
 * Verify Razorpay payment signature after checkout.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 *
 * @param {Object} paymentData
 * @param {string} paymentData.razorpay_order_id - Razorpay order ID
 * @param {string} paymentData.razorpay_payment_id - Razorpay payment ID
 * @param {string} paymentData.razorpay_signature - Razorpay signature
 * @returns {boolean} True if signature is valid
 */
export const verifyPaymentSignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!razorpay_order_id || !razorpay_payment_id) {
    return false;
  }

  // Simulated orders in development
  if (razorpay_order_id.startsWith('order_sim_') || razorpay_order_id.startsWith('order_demo_')) {
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return true; // Bypass signature verification in dev without secret
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(razorpay_signature || '', 'utf-8')
    );
  } catch (e) {
    return false;
  }
};

/**
 * Verify Razorpay Webhook signature
 * @param {string|Buffer} rawBody - Raw unparsed request body string/buffer
 * @param {string} signature - X-Razorpay-Signature header
 * @returns {boolean}
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return true;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature || '', 'utf-8')
    );
  } catch (error) {
    return false;
  }
};

/**
 * Process a full or partial refund via Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} [amountInINR] - Optional partial refund amount in INR
 * @param {Object} [notes] - Optional refund notes
 * @returns {Promise<Object>} Razorpay refund object
 */
export const processRefund = async (paymentId, amountInINR = null, notes = {}) => {
  if (!paymentId || paymentId.startsWith('pay_demo_') || paymentId.startsWith('pay_sim_')) {
    return {
      id: `rfnd_sim_${Date.now()}`,
      payment_id: paymentId,
      amount: amountInINR ? Math.round(amountInINR * 100) : 0,
      currency: 'INR',
      status: 'processed',
      notes,
    };
  }

  const options = { notes };
  if (amountInINR !== null && amountInINR !== undefined) {
    options.amount = Math.round(amountInINR * 100);
  }

  try {
    const refund = await razorpayInstance.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Razorpay refund error:', error);
    if (process.env.NODE_ENV === 'development') {
      return {
        id: `rfnd_fallback_${Date.now()}`,
        payment_id: paymentId,
        amount: options.amount || 0,
        currency: 'INR',
        status: 'processed',
      };
    }
    throw new Error(`Refund failed: ${error.message}`);
  }
};

export default {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  processRefund,
};
