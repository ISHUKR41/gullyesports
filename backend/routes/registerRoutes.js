/*
 * ============================================================================
 * GULLYESPORTS - Registration Routes (v2.1 — Debugged & Hardened)
 * ============================================================================
 * Purpose: API route for handling tournament registrations.
 *
 * Endpoint:
 *   POST /api/v1/register
 *
 * What happens on submission:
 *   1. Validates input (game, mode, players, transactionId)
 *   2. Auto-calculates entry fee from mode (server-authoritative)
 *   3. Checks for duplicate transaction ID (prevents double registration)
 *   4. Validates player count matches the mode
 *   5. Saves registration to MongoDB
 *   6. Sends confirmation email to admin (non-blocking)
 *   7. Returns success/error response
 *
 * Business Logic:
 *   - Solo: 1 player, ₹5 entry
 *   - Duo: 2 players, ₹10 entry, team name required
 *   - Squad: 4 players, ₹20 entry, team name required
 * ============================================================================
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Registration = require('../models/Registration');

// Try to load emailService — don't crash if it fails
let sendRegistrationEmail = null;
try {
  const emailService = require('../utils/emailService');
  sendRegistrationEmail = emailService.sendRegistrationEmail;
} catch (err) {
  console.warn('⚠️ Email service could not be loaded:', err.message);
}

const router = express.Router();

// Server-authoritative fee table — never trust the client
const FEE_TABLE = { solo: 5, duo: 10, squad: 20 };
const PLAYER_COUNT = { solo: 1, duo: 2, squad: 4 };

/**
 * POST /api/v1/register
 *
 * Request body:
 *   {
 *     "game": "pubg",
 *     "mode": "solo",
 *     "teamName": null,                (required for duo/squad)
 *     "players": [
 *       {
 *         "inGameName": "ProPlayer",
 *         "inGameId": "1234567890",
 *         "phone": "+91 9876543210",
 *         "email": "player@email.com"  (optional)
 *       }
 *     ],
 *     "transactionId": "UPI123456789"
 *   }
 */
router.post(
  '/',
  // ── Input validation rules ──
  [
    body('game')
      .trim()
      .notEmpty().withMessage('Game is required')
      .isIn(['pubg', 'freefire', 'cod']).withMessage('Invalid game selection'),

    body('mode')
      .trim()
      .notEmpty().withMessage('Mode is required')
      .isIn(['solo', 'duo', 'squad']).withMessage('Invalid mode selection'),

    body('teamName')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 50 }).withMessage('Team name cannot exceed 50 characters'),

    body('players')
      .isArray({ min: 1, max: 5 }).withMessage('Players array is required (1–5 players)'),

    body('players.*.inGameName')
      .trim()
      .notEmpty().withMessage('In-game name is required for all players'),

    body('players.*.inGameId')
      .trim()
      .notEmpty().withMessage('In-game ID is required for all players'),

    body('players.*.phone')
      .trim()
      .notEmpty().withMessage('Phone number is required for all players'),

    body('transactionId')
      .trim()
      .notEmpty().withMessage('Transaction ID is required')
      .isLength({ min: 5 }).withMessage('Transaction ID must be at least 5 characters'),
  ],
  // ── Route handler ──
  async (req, res) => {
    console.log('📝 Registration handler reached for:', req.body?.game, req.body?.mode);
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

      const { game, mode, teamName, players, transactionId } = req.body;

      // ── Server-authoritative entry fee (never trust client) ──
      const entryFee = FEE_TABLE[mode];

      // ── Check for duplicate transaction ID ──
      const existingRegistration = await Registration.findOne({ transactionId });
      if (existingRegistration) {
        return res.status(409).json({
          success: false,
          message: 'This transaction ID has already been used. Each registration requires a unique payment.',
        });
      }

      // ── Validate player count matches mode ──
      const expectedPlayers = PLAYER_COUNT[mode];
      if (players.length < expectedPlayers) {
        return res.status(400).json({
          success: false,
          message: `${mode} mode requires at least ${expectedPlayers} player(s). You provided ${players.length}.`,
        });
      }

      // ── Validate team name for duo/squad ──
      if ((mode === 'duo' || mode === 'squad') && !teamName) {
        return res.status(400).json({
          success: false,
          message: 'Team name is required for duo and squad modes.',
        });
      }

      // ── Save registration to MongoDB ──
      const registration = new Registration({
        game,
        mode,
        teamName: teamName || null,
        players,
        transactionId,
        entryFee,
        status: 'pending',
      });

      await registration.save();
      console.log(`🎮 New registration: ${game} ${mode} — Fee: ₹${entryFee} — Transaction: ${transactionId}`);

      // ── Send registration confirmation email (non-blocking) ──
      if (sendRegistrationEmail) {
        sendRegistrationEmail({
          game, mode, teamName, players, transactionId, entryFee,
          registrationId: registration._id,
        }).then(sent => {
          if (!sent) {
            console.warn('⚠️ Registration email failed but data was saved to DB');
          }
        }).catch(emailErr => {
          console.warn('⚠️ Email send error (non-blocking):', emailErr.message);
        });
      }

      // Return success
      return res.status(201).json({
        success: true,
        message: 'Registration successful! You will receive match details via WhatsApp/call before the tournament.',
        data: {
          registrationId: registration._id,
          game,
          mode,
          teamName: teamName || null,
          playerCount: players.length,
          entryFee,
          status: 'pending',
        },
      });
    } catch (error) {
      console.error('🔴 Registration error:', error.message);
      console.error('🔴 Registration stack:', error.stack);

      // Handle Mongoose duplicate key error (unique transactionId)
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'This transaction ID has already been used for another registration.',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Registration failed: ' + (error.message || 'Unknown error'),
      });
    }
  }
);

module.exports = router;
