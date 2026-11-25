import express from 'express';
import {
  getQuote,
  createHold,
  confirmBooking,
  cancelBooking,
  getRefundPreview,
  getMyBookings,
  getBookingById,
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';
import { bookingRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../validators/authValidator.js';
import { holdSchema, cancelSchema } from '../validators/bookingValidator.js';

const router = express.Router();

// POST /api/bookings/quote -> Server-calculated price quote with dynamic pricing
router.post('/quote', getQuote);

// All subsequent booking operations require authentication
router.use(authenticateToken);

// POST /api/bookings/hold -> Create temporary 15-minute booking hold with lock
router.post('/hold', bookingRateLimiter, validate(holdSchema), createHold);

// GET /api/bookings/my -> Get logged-in user's bookings
router.get('/my', getMyBookings);
router.get('/my-bookings', getMyBookings);

// GET /api/bookings/:id -> Get single booking details
router.get('/:id', getBookingById);

// GET /api/bookings/:id/refund-preview -> Preview policy-based refund amount
router.get('/:id/refund-preview', getRefundPreview);

// POST /api/bookings/:id/confirm -> Confirm reservation after payment
router.post('/:id/confirm', confirmBooking);

// PATCH/POST /api/bookings/:id/cancel -> Cancel reservation with refund calculation
router.patch('/:id/cancel', validate(cancelSchema), cancelBooking);
router.post('/:id/cancel', validate(cancelSchema), cancelBooking);

export default router;
