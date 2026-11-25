import express from 'express';
import {
  register,
  login,
  googleLogin,
  refreshToken,
  getMe,
  updateProfile,
  logout,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  validate,
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google', authLimiter, googleLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

router.use(authenticateToken);
router.get('/me', getMe);
router.patch('/profile', validate(updateProfileSchema), updateProfile);

export default router;
