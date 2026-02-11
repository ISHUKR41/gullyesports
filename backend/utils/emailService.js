/*
 * ============================================================================
 * GULLYESPORTS - Email Utility (Nodemailer) — v2.0
 * ============================================================================
 * Purpose: Sends email notifications using Gmail SMTP for:
 *   1. Contact form submissions  → sendContactEmail()
 *   2. Tournament registrations  → sendRegistrationEmail()
 *
 * How it works:
 *   1. Creates a Nodemailer transporter using Gmail SMTP settings
 *   2. Uses EMAIL_USER and EMAIL_PASS from .env for authentication
 *   3. EMAIL_PASS must be a Gmail "App Password" (not regular password)
 *   4. Sends formatted HTML emails with the submission data
 *
 * Gmail App Password Setup:
 *   1. Enable 2-Step Verification on your Google account
 *   2. Go to https://myaccount.google.com/apppasswords
 *   3. Generate a new App Password for "Mail"
 *   4. Put the 16-char password in .env as EMAIL_PASS
 *
 * Dependencies: nodemailer
 * ============================================================================
 */

const nodemailer = require('nodemailer');

/**
 * Create a reusable email transporter using Gmail SMTP.
 * This transporter is created once and reused for all emails.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Verify transporter on startup ────────────────────────────────────────
// Checks if email credentials are valid (non-blocking)
if (process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_gmail_app_password_here') {
  transporter.verify()
    .then(() => console.log('✅ Email transporter verified — SMTP connection OK'))
    .catch(err => console.warn('⚠️ Email transporter verification failed:', err.message));
} else {
  console.warn('⚠️ EMAIL_PASS not set — email features disabled. Set a Gmail App Password in .env');
}

// ── Subject category labels for readable emails ──────────────────────────
const subjectLabels = {
  tournament: '🏆 Tournament Query',
  registration: '📝 Registration Help',
  payment: '💰 Payment / Payout Issue',
  report: '⚠️ Report a Player',
  partnership: '🤝 Partnership / Sponsorship',
  feedback: '💬 Feedback / Suggestion',
  other: '📋 Other',
};

// ── Game display names ───────────────────────────────────────────────────
const gameNames = {
  pubg: 'PUBG (BGMI)',
  freefire: 'Free Fire',
  cod: 'Call of Duty Mobile',
};


/**
 * Send a contact form notification email.
 *
 * @param {Object} contactData - The contact form submission
 * @param {string} contactData.name - Sender's name
 * @param {string} contactData.email - Sender's email
 * @param {string} contactData.phone - Sender's phone (optional)
 * @param {string} contactData.subject - Message subject/category
 * @param {string} contactData.message - Message body
 *
 * @returns {Promise<boolean>} - true if email sent, false if failed
 *
 * Note: If email sending fails, the contact is still saved to DB.
 *       Email failure should NOT block the user's form submission.
 */
async function sendContactEmail(contactData) {
  try {
    const { name, email, phone, subject, message } = contactData;

    const mailOptions = {
      from: `"GULLYESPORTS Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || 'ishukriitpatna@gmail.com',
      replyTo: email, // So admin can reply directly to the sender
      subject: `[GULLYESPORTS] New Contact: ${subjectLabels[subject] || subject}`,

      // Plain text version (fallback for email clients that don't render HTML)
      text: `
New Contact Form Submission
============================
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Subject: ${subjectLabels[subject] || subject}
Message:
${message}
============================
Sent from GULLYESPORTS Contact Form
      `,

      // HTML version (rich formatted email)
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f1f5f9; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.1em;">GULLYESPORTS</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.8;">New Contact Form Submission</p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8; width: 120px;">Name</td>
                <td style="padding: 12px; border-bottom: 1px solid #1e1e32; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">Email</td>
                <td style="padding: 12px; border-bottom: 1px solid #1e1e32;">
                  <a href="mailto:${email}" style="color: #818cf8;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">Phone</td>
                <td style="padding: 12px; border-bottom: 1px solid #1e1e32;">${phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">Subject</td>
                <td style="padding: 12px; border-bottom: 1px solid #1e1e32;">${subjectLabels[subject] || subject}</td>
              </tr>
            </table>

            <!-- Message -->
            <div style="margin-top: 20px; padding: 16px; background: #12121a; border-radius: 8px; border-left: 4px solid #6366f1;">
              <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 8px;">Message</p>
              <p style="margin: 0; line-height: 1.7; white-space: pre-wrap;">${message}</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; border-top: 1px solid #1e1e32; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              This email was sent from the GULLYESPORTS contact form.
              <br/>Reply directly to respond to ${name}.
            </p>
          </div>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`📧 Contact email sent successfully for: ${name} (${email})`);
    return true;
  } catch (error) {
    console.error('🔴 Failed to send contact email:', error.message);
    // Return false — email failure should not block form submission
    return false;
  }
}


/**
 * Send a registration confirmation email to admin.
 *
 * @param {Object} regData - The registration data
 * @param {string} regData.game - Game key (pubg, freefire, cod)
 * @param {string} regData.mode - Mode (solo, duo, squad)
 * @param {string} regData.teamName - Team name (may be null)
 * @param {Array}  regData.players - Array of player objects
 * @param {string} regData.transactionId - UPI transaction ID
 * @param {number} regData.entryFee - Calculated entry fee
 * @param {string} regData.registrationId - MongoDB _id
 *
 * @returns {Promise<boolean>} - true if email sent, false if failed
 */
async function sendRegistrationEmail(regData) {
  try {
    const { game, mode, teamName, players, transactionId, entryFee, registrationId } = regData;
    const gameName = gameNames[game] || game;
    const modeCap = mode.charAt(0).toUpperCase() + mode.slice(1);
    const leadPlayer = players[0];

    // Build players table rows
    const playerRows = players.map((p, i) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">${i + 1}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1e1e32;">${p.inGameName}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">${p.inGameId}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">${p.phone}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"GULLYESPORTS Registrations" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || 'ishukriitpatna@gmail.com',
      replyTo: leadPlayer.email || undefined,
      subject: `[GULLYESPORTS] New Registration: ${gameName} ${modeCap} — ₹${entryFee}`,

      text: `
New Tournament Registration
============================
Registration ID: ${registrationId}
Game: ${gameName}
Mode: ${modeCap}
Team Name: ${teamName || 'N/A'}
Entry Fee: ₹${entryFee}
Transaction ID: ${transactionId}

Players:
${players.map((p, i) => `  ${i + 1}. ${p.inGameName} (ID: ${p.inGameId}) — Phone: ${p.phone}`).join('\n')}
============================
      `,

      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f1f5f9; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.1em;">🎮 GULLYESPORTS</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.8;">New Tournament Registration</p>
          </div>

          <!-- Summary -->
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8; width: 140px;">Registration ID</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; font-family: monospace; font-size: 12px;">${registrationId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">Game</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; font-weight: 600;">${gameName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">Mode</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32;">${modeCap}</td>
              </tr>
              ${teamName ? `<tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">Team Name</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; font-weight: 600;">${teamName}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">Entry Fee</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; color: #10b981; font-weight: 700; font-size: 16px;">₹${entryFee}</td>
              </tr>
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; color: #94a3b8;">Transaction ID</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #1e1e32; font-family: monospace;">${transactionId}</td>
              </tr>
            </table>

            <!-- Players Table -->
            <h3 style="margin: 24px 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Players</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #12121a;">
                <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b;">#</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b;">IGN</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b;">Game ID</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b;">Phone</th>
              </tr>
              ${playerRows}
            </table>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; border-top: 1px solid #1e1e32; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              Registration received. Please verify the UPI payment before confirming.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Registration email sent for: ${gameName} ${modeCap} — Transaction: ${transactionId}`);
    return true;
  } catch (error) {
    console.error('🔴 Failed to send registration email:', error.message);
    return false;
  }
}


module.exports = { sendContactEmail, sendRegistrationEmail };
