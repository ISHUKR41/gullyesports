/*
 * ============================================================================
 * GULLYESPORTS - Contact Form Controller (v2.0 — Premium Edition)
 * ============================================================================
 * Purpose: Handles the contact form logic:
 *   1. Real-time field validation with visual feedback
 *   2. Character counter on the message textarea
 *   3. Honeypot spam check
 *   4. Form submission to backend API
 *   5. Loading state and success/error toast notifications
 *
 * Dependencies:
 *   - main.js (must be loaded first for showToast, isValidEmail, etc.)
 *   - contact.html form structure
 *
 * API Endpoint: POST /api/v1/contact
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const charCounter = document.getElementById('charCounter');
  const messageInput = document.getElementById('message');

  // ── Character counter for message textarea ──────────────────────
  if (messageInput && charCounter) {
    messageInput.addEventListener('input', () => {
      const len = messageInput.value.length;
      const max = parseInt(messageInput.getAttribute('maxlength') || '1000', 10);
      charCounter.textContent = `${len} / ${max}`;

      // Color feedback: warning at 80%, danger at 90%
      charCounter.classList.remove('warning', 'danger');
      if (len > max * 0.9) {
        charCounter.classList.add('danger');
      } else if (len > max * 0.8) {
        charCounter.classList.add('warning');
      }
    });
  }

  // ── Real-time validation on blur ────────────────────────────────
  const fields = {
    name:    { el: document.getElementById('name'),    validate: v => v.trim().length >= 2, msg: 'Name must be at least 2 characters' },
    email:   { el: document.getElementById('email'),   validate: v => isValidEmail(v),      msg: 'Please enter a valid email address' },
    phone:   { el: document.getElementById('phone'),   validate: v => !v || isValidPhone(v), msg: 'Please enter a valid phone number' },
    subject: { el: document.getElementById('subject'), validate: v => !!v,                   msg: 'Please select a subject' },
    message: { el: document.getElementById('message'), validate: v => v.trim().length >= 10, msg: 'Message must be at least 10 characters' },
  };

  // Attach blur event to each field for real-time feedback
  Object.values(fields).forEach(f => {
    if (!f.el) return;
    f.el.addEventListener('blur', () => {
      const value = f.el.value;
      if (value === '' && !f.el.required) {
        clearFieldError(f.el);
        return;
      }
      if (f.validate(value)) {
        showFieldSuccess(f.el);
      } else {
        showFieldError(f.el, f.msg);
      }
    });

    // Clear error on input (so red border goes away as user types)
    f.el.addEventListener('input', () => {
      if (f.el.classList.contains('error')) {
        clearFieldError(f.el);
      }
    });
  });

  // ── Form submission ─────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Honeypot check — if filled, it's a bot
    const honeypot = document.getElementById('hp_website');
    if (honeypot && honeypot.value) {
      showToast('Submission blocked.', 'error');
      return;
    }

    // 2. Validate all required fields
    let isValid = true;
    Object.entries(fields).forEach(([key, f]) => {
      if (!f.el) return;
      const value = f.el.value;

      // Skip optional fields that are empty
      if (!f.el.required && value === '') return;

      if (!f.validate(value)) {
        showFieldError(f.el, f.msg);
        isValid = false;
      }
    });

    if (!isValid) {
      showToast('Please fix the errors in the form.', 'error');
      // Scroll to the first error
      const firstError = form.querySelector('.form-input.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 3. Prepare data
    const data = {
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      phone: fields.phone.el?.value.trim() || '',
      subject: fields.subject.el.value,
      message: fields.message.el.value.trim(),
    };

    // 4. Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Sending...';

    try {
      // 5. Send to API
      const result = await apiRequest('/api/v1/contact', 'POST', data);

      // 6. Handle response
      if (result.success) {
        showToast('Message sent successfully! We\'ll respond within 12–24 hours.', 'success');
        form.reset();
        charCounter.textContent = '0 / 1000';
        charCounter.classList.remove('warning', 'danger');
        clearAllErrors(form);
      } else {
        showToast(result.message || 'Failed to send message. Please try again.', 'error');
      }
    } catch (err) {
      // Catch any unexpected errors (network timeout, JSON parse failure, etc.)
      console.error('Contact form submission error:', err);
      showToast('Something went wrong. Please check your connection and try again.', 'error');
    } finally {
      // Always reset button — prevents permanently stuck loading state
      submitBtn.disabled = false;
      submitBtn.innerHTML = '📩 Send Message';
    }
  });
});
