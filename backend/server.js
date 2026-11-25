import dotenv from 'dotenv';
// Load environment variables before importing modules that depend on them
dotenv.config();

// Handle uncaught exceptions synchronously
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception thrown:', err);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { connectDB } from './src/config/db.js';
import { errorHandler, AppError } from './src/middleware/errorHandler.js';
import { generalLimiter } from './src/middleware/rateLimiter.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import searchRoutes from './src/routes/searchRoutes.js';
import propertyRoutes from './src/routes/propertyRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import ownerRoutes from './src/routes/ownerRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature'],
  })
);

// General rate limiter for all API requests
app.use('/api', generalLimiter);

// Note: Payment webhook needs raw body for signature verification before json parsing
// So paymentRoutes handles /webhook using express.raw internally
app.use('/api/payments', paymentRoutes);

// Body parsers for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for reading refresh tokens
app.use(cookieParser());

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount active application routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/reviews', reviewRoutes);

// Handle unhandled route 404s
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(errorHandler);

// Connect database and launch server
const PORT = parseInt(process.env.PORT, 10) || 5000;

let server;
const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`[Server] Hotel & Event Booking API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error(`[Server] Failed to connect to database: ${error.message}`);
    // In dev mode, allow starting server so API endpoints can be tested/developed
    if (process.env.NODE_ENV === 'development') {
      server = app.listen(PORT, () => {
        console.warn(`[Server] Server started on port ${PORT} without active database connection.`);
      });
    } else {
      process.exit(1);
    }
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[FATAL] Unhandled Rejection detected:', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Gracefully shutting down...');
  if (server) {
    server.close(() => {
      console.log('[Server] Process terminated.');
    });
  }
});

export default app;
