import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

/**
 * Middleware to authenticate requests using JWT Access Token from Authorization header.
 * Attaches decoded payload `{ id, role, email }` to `req.user`.
 */
export const authenticateToken = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in to continue.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = {
      id: decoded.id,
      _id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory to authorize access based on user roles.
 * 
 * @param  {...string} roles Allowed roles (e.g. 'owner', 'admin')
 * @returns Express middleware function
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

/**
 * Optional authentication middleware.
 * If a valid Bearer token is present, sets `req.user`. Otherwise sets `req.user = null` without failing.
 */
export const optionalAuth = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = {
      id: decoded.id,
      _id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
  } catch (error) {
    req.user = null;
  }

  next();
};

export default { authenticateToken, authorizeRoles, optionalAuth };
