/*
 * ============================================================================
 * GULLYESPORTS - Admin Routes (v1.0)
 * ============================================================================
 * Purpose: API routes for the admin dashboard. ALL routes except /login
 *          are protected by JWT authentication.
 *
 * Endpoints:
 *   POST   /api/v1/admin/login            — Admin login (returns JWT)
 *   GET    /api/v1/admin/me               — Get current admin info
 *   GET    /api/v1/admin/stats            — Dashboard statistics
 *   GET    /api/v1/admin/contacts         — List contact messages
 *   PATCH  /api/v1/admin/contacts/:id     — Update contact status
 *   DELETE /api/v1/admin/contacts/:id     — Delete a contact message
 *   GET    /api/v1/admin/registrations    — List registrations
 *   PATCH  /api/v1/admin/registrations/:id — Update registration status
 *
 * Security:
 *   - JWT token required in Authorization header for all protected routes
 *   - Token format: "Bearer <token>"
 *   - Tokens expire after 7 days
 * ============================================================================
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult, query } = require('express-validator');
const Admin = require('../models/Admin');
const Contact = require('../models/Contact');
const Registration = require('../models/Registration');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Login Rate Limiter ──────────────────────────────────────────────────
// Prevents brute-force attacks on admin login
// Only 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Generate a JWT token for an admin user.
 * Token contains the admin's MongoDB _id and expires in 7 days.
 */
function generateToken(adminId) {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}


/* ========================================================================
   POST /login — Admin Login
   ======================================================================== */

router.post(
  '/login',
  loginLimiter,  // Apply brute-force protection
  [
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      // Check validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { email, password } = req.body;

      // Find admin by email — include password field (normally excluded)
      const admin = await Admin.findOne({ email }).select('+password');

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // Compare password with stored hash
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // Update last login time
      admin.lastLogin = new Date();
      await admin.save();

      // Generate JWT token
      const token = generateToken(admin._id);

      console.log(`🔑 Admin login: ${admin.email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        },
      });
    } catch (error) {
      console.error('🔴 Admin login error:', error.message);
      res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
  }
);


/* ========================================================================
   GET /me — Get Current Admin Info
   ======================================================================== */

router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      lastLogin: req.admin.lastLogin,
    },
  });
});


/* ========================================================================
   GET /stats — Dashboard Statistics
   ======================================================================== */

router.get('/stats', protect, async (req, res) => {
  try {
    // Run all count queries in parallel
    const [
      totalContacts,
      newContacts,
      totalRegistrations,
      pendingRegistrations,
      approvedRegistrations,
      // Game-wise breakdown
      pubgRegistrations,
      freefireRegistrations,
      codRegistrations,
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Registration.countDocuments(),
      Registration.countDocuments({ status: 'pending' }),
      Registration.countDocuments({ status: 'approved' }),
      Registration.countDocuments({ game: 'pubg' }),
      Registration.countDocuments({ game: 'freefire' }),
      Registration.countDocuments({ game: 'cod' }),
    ]);

    // Calculate estimated revenue from approved registrations
    const approvedRegs = await Registration.find({ status: 'approved' }, 'entryFee');
    const totalRevenue = approvedRegs.reduce((sum, r) => sum + (r.entryFee || 0), 0);

    res.json({
      success: true,
      data: {
        contacts: { total: totalContacts, new: newContacts },
        registrations: {
          total: totalRegistrations,
          pending: pendingRegistrations,
          approved: approvedRegistrations,
          byGame: {
            pubg: pubgRegistrations,
            freefire: freefireRegistrations,
            cod: codRegistrations,
          },
        },
        revenue: totalRevenue,
      },
    });
  } catch (error) {
    console.error('🔴 Stats error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
});


/* ========================================================================
   GET /contacts — List Contact Messages
   ======================================================================== */

router.get('/contacts', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (status && ['new', 'read', 'replied'].includes(status)) {
      filter.status = status;
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Contact.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('🔴 Contacts list error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load contacts.' });
  }
});


/* ========================================================================
   PATCH /contacts/:id — Update Contact Status
   ======================================================================== */

router.patch('/contacts/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be: new, read, or replied',
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('🔴 Contact update error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update contact.' });
  }
});


/* ========================================================================
   DELETE /contacts/:id — Delete Contact Message
   ======================================================================== */

router.delete('/contacts/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    res.json({ success: true, message: 'Contact deleted.' });
  } catch (error) {
    console.error('🔴 Contact delete error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete contact.' });
  }
});


/* ========================================================================
   GET /registrations — List Registrations
   ======================================================================== */

router.get('/registrations', protect, async (req, res) => {
  try {
    const { game, mode, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter from query params
    const filter = {};
    if (game && ['pubg', 'freefire', 'cod'].includes(game)) filter.game = game;
    if (mode && ['solo', 'duo', 'squad'].includes(mode)) filter.mode = mode;
    if (status && ['pending', 'approved', 'rejected'].includes(status)) filter.status = status;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Registration.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: registrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('🔴 Registrations list error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load registrations.' });
  }
});


/* ========================================================================
   PATCH /registrations/:id — Update Registration Status
   ======================================================================== */

router.patch('/registrations/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be: pending, approved, or rejected',
      });
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    console.log(`📋 Registration ${registration._id} → ${status}`);
    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('🔴 Registration update error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update registration.' });
  }
});


module.exports = router;
