import express from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Webhook endpoint (unauthenticated, requires raw body for HMAC signature verification)
router.post(
  '/webhook',
  express.raw({ type: '*/*' }),
  handleWebhook
);

// Protected payment endpoints
router.post('/create-order', authenticateToken, createOrder);
router.post('/verify', authenticateToken, verifyPayment);

export default router;
