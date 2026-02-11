/*
 * ============================================================================
 * GULLYESPORTS - Registration Form Controller (v2.0 — Premium Edition)
 * ============================================================================
 * Purpose: Handles the tournament registration form logic:
 *   1. Read game/mode from URL parameters (?game=pubg&mode=solo)
 *   2. Dynamically show/hide player fields based on mode
 *   3. Update hero text and info bar with game/mode details
 *   4. Real-time validation on all fields
 *   5. Honeypot spam detection
 *   6. Form submission to backend API
 *   7. Step indicator progress
 *
 * Dependencies:
 *   - main.js (must be loaded first for showToast, validation helpers)
 *   - register.html form structure
 *
 * API Endpoint: POST /api/v1/register
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');

  // ── Game/Mode config ────────────────────────────────────────────
  const gameConfig = {
    pubg:     { name: 'PUBG (BGMI)',       emoji: '🎯', color: '#2a475e' },
    freefire: { name: 'Free Fire',          emoji: '🔥', color: '#5c3d2e' },
    cod:      { name: 'Call of Duty Mobile', emoji: '⚔️', color: '#3d3d1a' },
  };

  const modeConfig = {
    solo:  { players: 1, fee: '₹5',  feeNum: 5,  showTeam: false },
    duo:   { players: 2, fee: '₹10', feeNum: 10, showTeam: true  },
    squad: { players: 4, fee: '₹20', feeNum: 20, showTeam: true  },
  };

  // ── Read URL parameters ─────────────────────────────────────────
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game') || 'pubg';
  const mode = params.get('mode') || 'solo';

  const gameInfo = gameConfig[game] || gameConfig.pubg;
  const modeInfo = modeConfig[mode] || modeConfig.solo;

  // ── Update hero text ────────────────────────────────────────────
  const heroBadge = document.getElementById('heroBadge');
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');

  if (heroBadge) heroBadge.textContent = `${gameInfo.emoji} ${gameInfo.name} — ${capitalize(mode)}`;
  if (heroTitle) heroTitle.innerHTML = `Register for <span class="gradient-text">${capitalize(mode)}</span>`;
  if (heroSubtitle) heroSubtitle.textContent = `${modeInfo.players} player${modeInfo.players > 1 ? 's' : ''}. Entry fee: ${modeInfo.fee}. Winner gets ₹500 + ₹10/kill.`;

  // ── Update hero background color ────────────────────────────────
  const heroSection = document.getElementById('registerHero');
  if (heroSection) {
    const heroBg = heroSection.querySelector('.hero-bg div');
    if (heroBg) {
      heroBg.style.background = `linear-gradient(135deg, #0a0a0f 0%, ${gameInfo.color} 100%)`;
    }
  }

  // ── Update info bar ─────────────────────────────────────────────
  const infoGame = document.getElementById('infoGame');
  const infoMode = document.getElementById('infoMode');
  const infoFee = document.getElementById('infoFee');
  const feeDisplay = document.getElementById('feeDisplay');

  if (infoGame) infoGame.textContent = gameInfo.name;
  if (infoMode) infoMode.textContent = capitalize(mode);
  if (infoFee) infoFee.textContent = modeInfo.fee;
  if (feeDisplay) feeDisplay.textContent = modeInfo.fee;

  // ── Show/hide player sections and team name ─────────────────────
  const teamNameSection = document.getElementById('teamNameSection');
  if (teamNameSection) {
    teamNameSection.style.display = modeInfo.showTeam ? 'block' : 'none';
    if (modeInfo.showTeam) {
      teamNameSection.querySelector('input').required = true;
    }
  }

  // Show player sections based on player count
  for (let i = 2; i <= 4; i++) {
    const section = document.getElementById(`player${i}Section`);
    if (section) {
      const isVisible = i <= modeInfo.players;
      section.style.display = isVisible ? 'block' : 'none';
      // Set required on visible player inputs
      section.querySelectorAll('.form-input').forEach(input => {
        input.required = isVisible;
      });
    }
  }

  // ── Real-time blur validation ───────────────────────────────────
  form.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('blur', () => {
      if (!input.required && input.value === '') {
        clearFieldError(input);
        return;
      }
      validateField(input);
    });

    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        clearFieldError(input);
      }
    });
  });

  // ── Step indicator progress ─────────────────────────────────────
  // Highlight step 2 when user reaches payment section
  const transactionInput = document.getElementById('transactionId');
  if (transactionInput) {
    transactionInput.addEventListener('focus', () => {
      const step2 = document.getElementById('step2');
      const connectors = document.querySelectorAll('.step-connector');
      if (step2) step2.classList.add('active');
      if (connectors[0]) connectors[0].classList.add('active');
    });
  }

  // ── Form submission ─────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Honeypot check
    const honeypot = document.getElementById('hp_site');
    if (honeypot && honeypot.value) {
      showToast('Submission blocked.', 'error');
      return;
    }

    // 2. Validate all visible required fields
    let isValid = true;
    form.querySelectorAll('.form-input[required]').forEach(input => {
      // Only validate visible inputs
      if (input.closest('[style*="display: none"]') || input.closest('[style*="display:none"]')) return;
      if (!validateField(input)) {
        isValid = false;
      }
    });

    // Check the agreement checkbox
    const agreeCheckbox = document.getElementById('agreeRules');
    if (agreeCheckbox && !agreeCheckbox.checked) {
      showToast('Please agree to the tournament rules.', 'error');
      isValid = false;
    }

    if (!isValid) {
      showToast('Please fix the errors in the form.', 'error');
      const firstError = form.querySelector('.form-input.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 3. Build registration data
    const players = [];
    for (let i = 1; i <= modeInfo.players; i++) {
      players.push({
        inGameName: document.getElementById(`p${i}Name`)?.value.trim(),
        inGameId:   document.getElementById(`p${i}Id`)?.value.trim(),
        phone:      document.getElementById(`p${i}Phone`)?.value.trim(),
        email:      document.getElementById(`p${i}Email`)?.value.trim(),
      });
    }

    const data = {
      game: game,
      mode: mode,
      teamName: modeInfo.showTeam ? document.getElementById('teamName')?.value.trim() : undefined,
      players: players,
      transactionId: document.getElementById('transactionId').value.trim(),
    };

    // 4. Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Registering...';

    try {
      // 5. Send to API
      const result = await apiRequest('/api/v1/register', 'POST', data);

      // 6. Handle response
      if (result.success) {
        showToast('Registration successful! You\'ll receive match details soon. 🎮', 'success');

        // Activate step 3
        const step3 = document.getElementById('step3');
        const connectors = document.querySelectorAll('.step-connector');
        if (step3) step3.classList.add('active');
        if (connectors[1]) connectors[1].classList.add('active');

        // Mark step 2 completed
        const step2 = document.getElementById('step2');
        if (step2) { step2.classList.remove('active'); step2.classList.add('completed'); }

        // Disable form
        form.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
        submitBtn.innerHTML = '✅ Registration Complete!';
      } else {
        showToast(result.message || 'Registration failed. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🏆 Complete Registration';
      }
    } catch (err) {
      // Catch any unexpected errors (network timeout, JSON parse failure, etc.)
      console.error('Registration submission error:', err);
      showToast('Something went wrong. Please check your connection and try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🏆 Complete Registration';
    }
  });

  // ── Helper: Validate a single field ─────────────────────────────
  function validateField(input) {
    const value = input.value.trim();
    const type = input.type;
    const id = input.id;

    // Empty required field
    if (input.required && value === '') {
      showFieldError(input, 'This field is required');
      return false;
    }

    // Email validation
    if (type === 'email' && value && !isValidEmail(value)) {
      showFieldError(input, 'Please enter a valid email address');
      return false;
    }

    // Phone validation
    if (type === 'tel' && value && !isValidPhone(value)) {
      showFieldError(input, 'Please enter a valid phone number');
      return false;
    }

    // Transaction ID — must be at least 5 characters
    if (id === 'transactionId' && value.length < 5) {
      showFieldError(input, 'Transaction ID must be at least 5 characters');
      return false;
    }

    // Min length check
    const minLength = input.getAttribute('minlength');
    if (minLength && value.length < parseInt(minLength)) {
      showFieldError(input, `Must be at least ${minLength} characters`);
      return false;
    }

    showFieldSuccess(input);
    return true;
  }

  // ── Helper: Capitalize first letter ─────────────────────────────
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
