import express from 'express';
import { getPropertyReviews } from '../controllers/propertyController.js';

const router = express.Router();

// GET /api/reviews/property/:propertyId -> Get reviews for a property
router.get('/property/:propertyId', getPropertyReviews);
router.get('/:propertyId', getPropertyReviews);

export default router;
