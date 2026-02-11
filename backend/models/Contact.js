/*
 * ============================================================================
 * GULLYESPORTS - Contact Message Model (Mongoose Schema)
 * ============================================================================
 * Purpose: Defines the MongoDB schema for contact form messages.
 *
 * Fields:
 *   - name: Sender's full name (required, 2–100 chars)
 *   - email: Sender's email (required, validated)
 *   - phone: Sender's phone (optional)
 *   - subject: Topic category (required, from predefined list)
 *   - message: The actual message body (required, 10–2000 chars)
 *   - status: Whether the message has been read/replied (default: "new")
 *   - createdAt: Auto-generated timestamp
 *
 * How it works:
 *   - When a contact form is submitted, this model saves data to MongoDB
 *   - The "contacts" collection stores all messages
 *   - Admin can later query by status to find unread messages
 * ============================================================================
 */

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    // Sender's full name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Sender's email address
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    // Phone number (optional)
    phone: {
      type: String,
      trim: true,
      default: null,
    },

    // Subject category
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: {
        values: ['tournament', 'registration', 'payment', 'report', 'partnership', 'feedback', 'other'],
        message: 'Subject must be one of: tournament, registration, payment, report, partnership, feedback, other',
      },
    },

    // Message body
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },

    // Message status for admin tracking
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new',
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create and export the model
// Mongoose will create a "contacts" collection in MongoDB
module.exports = mongoose.model('Contact', contactSchema);
