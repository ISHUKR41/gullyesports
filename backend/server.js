/*
 * ============================================================================
 * GULLYESPORTS - Backend Server Entry Point
 * ============================================================================
 * Purpose: Main Express.js server that handles:
 *   1. Contact form submissions (save to DB + send email)
 *   2. Tournament registrations (save to DB)
 *
 * How it works:
 *   - Loads environment variables from .env file
 *   - Connects to MongoDB via Mongoose
 *   - Sets up security middleware (Helmet, CORS, rate limiting)
 *   - Mounts API routes under /api/v1
 *   - Starts listening on configured port (default: 5000)
 *
 * Environment Variables Required (see .env.example):
 *   PORT, MONGO_URI, EMAIL_USER, EMAIL_PASS, EMAIL_TO
 * ============================================================================
 */

// ── Load environment variables FIRST (before anything else) ──────────────
require('dotenv').config();

// ── Import dependencies ──────────────────────────────────────────────────
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// ── Custom NoSQL Injection Sanitizer (Express 5 compatible) ──────────
// express-mongo-sanitize is NOT compatible with Express 5 (req.query is read-only)
// This custom middleware sanitizes req.body in-place to strip MongoDB operators
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key of Object.keys(obj)) {
    // Remove keys that start with $ (MongoDB operators like $gt, $ne, $regex)
    if (key.startsWith('$')) {
      console.warn(`⚠️ Sanitized NoSQL injection attempt: key "${key}" removed`);
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]); // Recursively sanitize nested objects
    }
  }
  return obj;
}

// ── Import route modules ────────────────────────────────────────────────
const contactRoutes = require('./routes/contactRoutes');
const registerRoutes = require('./routes/registerRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ── Initialize Express app ──────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

/* ========================================================================
   MIDDLEWARE SETUP
   ======================================================================== */

// --- Security Headers via Helmet ---
// Adds various HTTP headers for security (XSS filter, no-sniff, etc.)
app.use(helmet());

// --- CORS (Cross-Origin Resource Sharing) ---
// Allows frontend (localhost:5173) to talk to backend (localhost:5000)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- Parse JSON request bodies ---
// Limit to 10MB to prevent large payload attacks
app.use(express.json({ limit: '10mb' }));

// --- Parse URL-encoded form data ---
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- NoSQL Injection Prevention (Express 5 compatible) ---
// Sanitizes req.body to strip MongoDB operators ($gt, $ne, etc.)
// NOTE: express-mongo-sanitize is not used because it tries to set
//       req.query which is read-only in Express 5
app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  next();
});

// --- Rate Limiting ---
// Prevent abuse by limiting requests per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window per IP
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

/* ========================================================================
   API ROUTES
   ======================================================================== */

// Health check endpoint — useful for monitoring and debugging
app.get('/api/v1/health', (req, res) => {
  // Mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    message: 'GULLYESPORTS API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
    services: {
      database: dbStates[mongoose.connection.readyState] || 'unknown',
      email: process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_gmail_app_password_here' ? 'configured' : 'not_configured',
    },
  });
});

// Mount contact routes: POST /api/v1/contact
app.use('/api/v1/contact', contactRoutes);

// Mount registration routes: POST /api/v1/register
app.use('/api/v1/register', registerRoutes);

// Mount admin routes: /api/v1/admin/*
app.use('/api/v1/admin', adminRoutes);

/* ========================================================================
   ERROR HANDLING
   ======================================================================== */

// --- 404 Handler: Route not found ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// --- Global error handler ---
// Catches any unhandled errors in route handlers
app.use((err, req, res, next) => {
  console.error('🔴 Server Error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error. Please try again later.',
  });
});

/* ========================================================================
   DATABASE CONNECTION + SERVER START
   ======================================================================== */

/**
 * Connect to MongoDB and start the Express server.
 * If MongoDB connection fails, the server still starts so the health
 * endpoint remains reachable — but DB-dependent routes will return errors.
 */
async function startServer() {
  let dbConnected = false;

  try {
    // ── Attempt MongoDB connection ──
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gullyesports';

    await mongoose.connect(mongoUri);
    dbConnected = true;
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('🔴 Failed to connect to MongoDB:', err.message);
    console.warn('⚠️ Server will start without database — DB features will fail.');
  }

  // ── Always start Express regardless of DB status ──
  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║         🚀 GULLYESPORTS Backend Started         ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`  URL:       http://localhost:${PORT}`);
    console.log(`  Health:    http://localhost:${PORT}/api/v1/health`);
    console.log(`  CORS:      ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    console.log(`  ENV:       ${process.env.NODE_ENV || 'not set'}`);
    console.log('');
    console.log('  ── Service Status ──');
    console.log(`  MongoDB:   ${dbConnected ? '✅ Connected' : '❌ Not Connected'}`);
    console.log(`  Email:     ${process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_gmail_app_password_here' ? '✅ Configured' : '⚠️ App Password not set (emails will fail)'}`);
    console.log(`  JWT:       ${process.env.JWT_SECRET ? '✅ Secret set' : '⚠️ JWT_SECRET missing (admin auth will fail)'}`);
    console.log(`  Security:  ✅ Helmet, CORS, Rate Limit, Mongo Sanitize`);
    console.log('');
  });
}

// --- Handle unhandled promise rejections ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 Unhandled Promise Rejection:', reason);
});

// --- Handle uncaught exceptions ---
process.on('uncaughtException', (error) => {
  console.error('🔴 Uncaught Exception:', error);
  process.exit(1);
});

// Start the server!
startServer();
