import express from 'express';
import { searchProperties } from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/search -> search properties with optional personalization
router.get('/', optionalAuth, searchProperties);

export default router;
