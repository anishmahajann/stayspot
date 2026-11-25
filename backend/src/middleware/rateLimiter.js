import rateLimit from 'express-rate-limit';

/**
 * General application-wide rate limiter: 100 requests per 15 minutes.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Strict authentication rate limiter: 10 attempts per 15 minutes (protects login/register/password brute force).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
});

/**
 * Booking rate limiter: 20 reservation or hold operations per 15 minutes.
 */
export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many booking requests from this IP, please try again after 15 minutes.',
  },
});

// Alias for flexibility
export const bookingRateLimiter = bookingLimiter;

export default { generalLimiter, authLimiter, bookingLimiter, bookingRateLimiter };
