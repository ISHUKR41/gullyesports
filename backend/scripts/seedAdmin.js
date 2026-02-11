/*
 * ============================================================================
 * GULLYESPORTS - Seed Admin Script
 * ============================================================================
 * Purpose: Creates the initial admin user in the database.
 *
 * Usage:
 *   node scripts/seedAdmin.js
 *
 * What it does:
 *   1. Connects to MongoDB using MONGO_URI from .env
 *   2. Checks if admin already exists
 *   3. If not, creates admin with:
 *      - Email: ishukriitpatna@gmail.com
 *      - Password: ISHUkr75@ (auto-hashed by the Admin model)
 *   4. Disconnects from database
 *
 * Security:
 *   - Password is automatically hashed via the Admin model's pre-save hook
 *   - Plain text password is NEVER stored in the database
 *
 * Note: Run this script ONCE after setting up the database.
 *       Running it again will skip if admin already exists.
 * ============================================================================
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// Admin credentials
const ADMIN_EMAIL = 'ishukriitpatna@gmail.com';
const ADMIN_PASSWORD = 'ISHUkr75@';
const ADMIN_NAME = 'GULLYESPORTS Admin';

async function seedAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gullyesports';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(`⚠️ Admin already exists: ${ADMIN_EMAIL}`);
      console.log('   Skipping seed. Delete the admin manually if you want to recreate.');
    } else {
      // Create new admin — password is auto-hashed by pre-save hook
      const admin = new Admin({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
        role: 'superadmin',
      });

      await admin.save();
      console.log(`🎉 Admin created successfully!`);
      console.log(`   Email:    ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`   Role:     superadmin`);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('🔴 Seed error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
