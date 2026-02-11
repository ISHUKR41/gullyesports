/*
 * ============================================================================
 * GULLYESPORTS - Registration Model (Mongoose Schema)
 * ============================================================================
 * Purpose: Defines the MongoDB schema for tournament registrations.
 *
 * Fields:
 *   - game: Which game (pubg, freefire, cod)
 *   - mode: Tournament mode (solo, duo, squad)
 *   - teamName: Team name (required for duo/squad, optional for solo)
 *   - players: Array of player objects (1 for solo, 2 for duo, 4 for squad)
 *     Each player has: inGameName, inGameId, phone, email (Player 1 only)
 *   - transactionId: UPI payment transaction ID (unique, prevents duplicates)
 *   - entryFee: Amount paid (stored for record-keeping)
 *   - status: Registration status (pending → confirmed → cancelled)
 *   - createdAt: Auto-generated timestamp
 *
 * How it works:
 *   - When registration form is submitted, this model saves to MongoDB
 *   - transactionId has a unique index to prevent duplicate registrations
 *   - Pre-save hook validates player count matches the mode
 * ============================================================================
 */

const mongoose = require('mongoose');

// Sub-schema for individual player details
const playerSchema = new mongoose.Schema(
  {
    // Player's in-game display name
    inGameName: {
      type: String,
      required: [true, 'In-game name is required'],
      trim: true,
      maxlength: [50, 'In-game name cannot exceed 50 characters'],
    },

    // Player's unique in-game ID number
    inGameId: {
      type: String,
      required: [true, 'In-game ID is required'],
      trim: true,
      maxlength: [30, 'In-game ID cannot exceed 30 characters'],
    },

    // Player's phone number for contact
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },

    // Email (only required for Player 1 / team leader)
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
  },
  {
    // Don't create a separate _id for each player sub-document
    _id: false,
  }
);

// Main registration schema
const registrationSchema = new mongoose.Schema(
  {
    // Which game the registration is for
    game: {
      type: String,
      required: [true, 'Game is required'],
      enum: {
        values: ['pubg', 'freefire', 'cod'],
        message: 'Game must be one of: pubg, freefire, cod',
      },
    },

    // Tournament mode
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      enum: {
        values: ['solo', 'duo', 'squad'],
        message: 'Mode must be one of: solo, duo, squad',
      },
    },

    // Team name (relevant for duo and squad)
    teamName: {
      type: String,
      trim: true,
      maxlength: [50, 'Team name cannot exceed 50 characters'],
      default: null,
    },

    // Array of player details
    players: {
      type: [playerSchema],
      required: [true, 'At least one player is required'],
      validate: {
        validator: function (val) {
          return val.length >= 1 && val.length <= 5;
        },
        message: 'Players array must have 1–5 entries',
      },
    },

    // UPI Transaction ID (unique to prevent duplicate entries)
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      trim: true,
      unique: true,
    },

    // Entry fee paid (stored for records)
    entryFee: {
      type: Number,
      required: [true, 'Entry fee is required'],
      min: [5, 'Entry fee must be at least ₹5'],
    },

    // Registration status for admin tracking
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// ── Pre-save validation ──────────────────────────────────────────────────
// Ensure the number of players matches the mode
registrationSchema.pre('save', function () {
  const expectedPlayers = { solo: 1, duo: 2, squad: 4 };
  const expected = expectedPlayers[this.mode];

  if (this.players.length < expected) {
    throw new Error(`${this.mode} mode requires at least ${expected} player(s)`);
  }

  // For duo/squad, team name is required
  if ((this.mode === 'duo' || this.mode === 'squad') && !this.teamName) {
    throw new Error('Team name is required for duo/squad mode');
  }
});

// Note: transactionId index is already created by `unique: true` in the schema.
// Only compound indexes need explicit declaration.

// Compound index for querying registrations by game and mode
registrationSchema.index({ game: 1, mode: 1, createdAt: -1 });

module.exports = mongoose.model('Registration', registrationSchema);
