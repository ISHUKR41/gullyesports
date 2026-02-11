/*
 * ============================================================================
 * GULLYESPORTS - JWT Authentication Middleware
 * ============================================================================
 * Purpose: Protects admin routes by verifying JWT tokens.
 *
 * How it works:
 *   1. Extracts the JWT token from the Authorization header
 *   2. Verifies the token using JWT_SECRET from environment
 *   3. Looks up the admin user from the database
 *   4. Attaches the admin object to req.admin for use in route handlers
 *   5. If token is invalid/missing/expired → returns 401 Unauthorized
 *
 * Usage in routes:
 *   const { protect } = require('../middleware/authMiddleware');
 *   router.get('/protected-route', protect, handlerFunction);
 *
 * Token format (Authorization header):
 *   "Bearer eyJhbGciOiJIUzI1NiIs..."
 * ============================================================================
 */

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Middleware to protect routes — only authenticated admins can access.
 *
 * Steps:
 *   1. Check for Authorization header with "Bearer <token>"
 *   2. Verify the JWT token
 *   3. Find the admin in database
 *   4. Attach admin to request object
 */
async function protect(req, res, next) {
  try {
    let token;

    // Extract token from "Bearer <token>" header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // No token found → unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.',
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find admin by ID from token payload
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found.',
      });
    }

    // Attach admin to request for use in route handlers
    req.admin = admin;
    next();
  } catch (error) {
    // Token expired or invalid
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }

    console.error('🔴 Auth middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
}

module.exports = { protect };
