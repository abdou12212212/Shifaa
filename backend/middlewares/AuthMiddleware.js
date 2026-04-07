const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Middleware to authenticate JWT token
 * Verifies token and attaches user info to request
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('AUTH_MIDDLEWARE', 'Access attempted without token', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.error('AUTH_MIDDLEWARE', 'Invalid token verification', err, {
          ip: req.ip,
          path: req.path
        });
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      // Attach user info to request
      req.user = user;

      logger.debug('AUTH_MIDDLEWARE', 'Token verified successfully', {
        userId: user.id,
        userType: user.userType
      });

      next();
    });
  } catch (error) {
    logger.error('AUTH_MIDDLEWARE', 'Unexpected error in token authentication', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware to verify user is an Admin
 * Must be used after authenticateToken middleware
 */
const requireAdmin = (req, res, next) => {
  try {
    // Check if user info exists (from authenticateToken middleware)
    if (!req.user) {
      logger.error('ADMIN_MIDDLEWARE', 'requireAdmin called without authenticateToken', null, {
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user type is Admin
    if (req.user.userType !== 'Admin') {
      logger.warn('ADMIN_MIDDLEWARE', 'Non-admin user attempted to access admin route', {
        userId: req.user.id,
        userType: req.user.userType,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    logger.debug('ADMIN_MIDDLEWARE', 'Admin access granted', {
      userId: req.user.id,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('ADMIN_MIDDLEWARE', 'Unexpected error in admin verification', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authorization'
    });
  }
};

/**
 * Combined middleware for admin routes
 * Authenticates token and verifies admin role in one step
 */
const authenticateAdmin = [authenticateToken, requireAdmin];

module.exports = {
  authenticateToken,
  requireAdmin,
  authenticateAdmin
};
