/*
 * ============================================================================
 * GULLYESPORTS - Admin Model (Mongoose Schema)
 * ============================================================================
 * Purpose: Defines the database schema for platform administrators.
 *
 * How it works:
 *   1. Stores admin credentials (email, hashed password) in MongoDB
 *   2. Uses bcrypt to automatically hash passwords before saving
 *   3. Provides a comparePassword() method for login verification
 *   4. Admins are NOT regular users — this is a separate collection
 *
 * Fields:
 *   - email: Admin login email (unique)
 *   - password: Hashed password (never stored as plain text)
 *   - name: Display name for the dashboard
 *   - role: admin | superadmin (for future role expansion)
 *   - lastLogin: Tracks when admin last logged in
 *
 * Security:
 *   - Passwords are hashed with bcrypt (12 salt rounds)
 *   - Plain text password is NEVER stored in the database
 *   - The password field is excluded from queries by default (select: false)
 * ============================================================================
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    // Admin email — used for login
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Hashed password — never stored as plain text
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Exclude from queries by default (security)
    },

    // Display name for dashboard
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Role for access control (future expansion)
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },

    // Track last login time
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

/**
 * Pre-save hook: Hash the password before saving to database.
 * Only runs if the password field was actually modified (not on every save).
 */
adminSchema.pre('save', async function () {
  // Skip if password wasn't changed
  if (!this.isModified('password')) return;

  // Hash password with 12 salt rounds
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare a plain-text password with the stored hashed password.
 * Used during login to verify credentials.
 *
 * @param {string} candidatePassword - The plain-text password to check
 * @returns {Promise<boolean>} - true if password matches, false otherwise
 */
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
