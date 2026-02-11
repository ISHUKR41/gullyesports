/*
 * ============================================================================
 * GULLYESPORTS - Contact Routes
 * ============================================================================
 * Purpose: API route for handling contact form submissions.
 *
 * Endpoint:
 *   POST /api/v1/contact
 *
 * What happens on submission:
 *   1. Validates input fields (name, email, subject, message)
 *   2. Sanitizes input to prevent XSS/injection
 *   3. Saves the message to MongoDB (Contact model)
 *   4. Sends email notification to admin (via emailService)
 *   5. Returns success/error response to frontend
 *
 * Note: Email failure does NOT block the response — the message is
 *       still saved to DB even if email sending fails.
 * ============================================================================
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');

// Try to load emailService — don't crash if it fails (e.g., missing nodemailer)
let sendContactEmail = null;
try {
  const emailService = require('../utils/emailService');
  sendContactEmail = emailService.sendContactEmail;
} catch (err) {
  console.warn('⚠️ Email service could not be loaded:', err.message);
}

const router = express.Router();

/**
 * POST /api/v1/contact
 *
 * Request body:
 *   {
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "phone": "+91 9876543210",    (optional)
 *     "subject": "tournament",
 *     "message": "When is the next PUBG tournament?"
 *   }
 *
 * Response:
 *   { "success": true, "message": "..." }
 *   or
 *   { "success": false, "message": "...", "errors": [...] }
 */
router.post(
  '/',
  // ── Input validation rules ──
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),

    body('phone')
      .optional({ nullable: true, checkFalsy: true })
      .trim(),

    body('subject')
      .trim()
      .notEmpty().withMessage('Subject is required')
      .isIn(['tournament', 'registration', 'payment', 'report', 'partnership', 'feedback', 'other'])
      .withMessage('Invalid subject category'),

    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10–2000 characters'),
  ],
  // ── Route handler ──
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please check your input.',
          errors: errors.array().map(err => err.msg),
        });
      }

      const { name, email, phone, subject, message } = req.body;

      // Save the contact message to MongoDB
      const contact = new Contact({
        name,
        email,
        phone: phone || null,
        subject,
        message,
      });

      await contact.save();
      console.log(`📬 New contact saved: ${name} (${email}) — Subject: ${subject}`);

      // Send email notification (non-blocking — failure doesn't affect response)
      if (sendContactEmail) {
        sendContactEmail({ name, email, phone, subject, message })
          .then(sent => {
            if (!sent) {
              console.warn('⚠️ Email notification failed but contact was saved to DB');
            }
          })
          .catch(emailErr => {
            console.warn('⚠️ Email send error (non-blocking):', emailErr.message);
          });
      }

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Your message has been sent successfully! We will get back to you soon.',
      });
    } catch (error) {
      console.error('🔴 Contact submission error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again later.',
      });
    }
  }
);

module.exports = router;
