import express from 'express';
import {
  getProperties,
  getProperty,
  getPropertyAvailability,
  getPropertyReviews,
  createReview,
} from '../controllers/propertyController.js';
import { searchProperties } from '../controllers/searchController.js';
import { authenticateToken, authorizeRoles, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/properties -> List active properties
router.get('/', getProperties);

// Fallback search route if called under /api/properties/search
router.get('/search', optionalAuth, searchProperties);

// GET /api/properties/:id -> Get property details and active units
router.get('/:id', getProperty);

// GET /api/properties/:id/availability -> Monthly availability calendar
router.get('/:id/availability', getPropertyAvailability);

// GET /api/properties/:id/reviews -> Paginated reviews for property
router.get('/:id/reviews', getPropertyReviews);

// POST /api/properties/:id/reviews -> Create review for completed booking (auth required)
router.post(
  '/:id/reviews',
  authenticateToken,
  authorizeRoles('guest', 'admin'),
  createReview
);

export default router;
