/*
 * ============================================================================
 * GULLYESPORTS - Main Application JavaScript (v2.0 — Premium Edition)
 * ============================================================================
 * Purpose: Shared functionality used across ALL pages:
 *   1. Navbar scroll effect (transparent → solid)
 *   2. Mobile menu toggle (hamburger open/close)
 *   3. Scroll-based reveal animations (Intersection Observer)
 *   4. Toast notification system (success/error/info)
 *   5. Smooth scroll for anchor links
 *   6. ✨ NEW: Particle canvas background on hero sections
 *   7. ✨ NEW: Animated counter (counts up from 0)
 *   8. ✨ NEW: Typed text effect (typewriter cycle through phrases)
 *   9. ✨ NEW: Scroll progress bar (thin bar at top of page)
 *  10. ✨ NEW: FAQ accordion toggle
 *  11. ✨ NEW: Page entrance animation
 *
 * How it works:
 *   - This file runs on every page via <script> tag
 *   - Uses vanilla JS — no frameworks needed
 *   - Intersection Observer watches `.animate-on-scroll` elements
 *   - When an element enters the viewport, class `visible` is added
 *   - The CSS transitions in design-system.css handle the animation
 * ============================================================================
 */

// ── Wait for DOM to fully load ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initNavbar();
  initScrollAnimations();
  initSmoothScroll();
  initParticleCanvas();
  initCounterAnimation();
  initTypedText();
  initAccordion();
  initPageEntrance();
});

/* ========================================================================
   1. NAVBAR — Scroll Effect + Mobile Menu
   ======================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.navbar-toggle');
  const menu = document.querySelector('.navbar-menu');
  const overlay = document.querySelector('.mobile-overlay');

  if (!navbar) return;

  // --- Scroll effect: add "scrolled" class when user scrolls down ---
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Trigger on load too (in case page loads already scrolled)
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  }

  // --- Mobile hamburger menu toggle ---
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active');
      document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking overlay
    if (overlay) {
      overlay.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    // Close menu when clicking a nav link (mobile)
    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ========================================================================
   2. SCROLL ANIMATIONS — Intersection Observer
   ======================================================================== */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  if (animatedElements.length === 0) return;

  // Respect user preference — skip animations if reduced-motion is on
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Immediately show all elements without animation
    animatedElements.forEach(el => el.classList.add('visible'));
    return;
  }

  // Create an observer that watches when elements enter the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Once animated, stop watching (performance)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      // Trigger when 10% of the element is visible (earlier reveal)
      threshold: 0.1,
      // Start animation 30px before element enters viewport for smoother flow
      rootMargin: '0px 0px -30px 0px',
    }
  );

  animatedElements.forEach(el => observer.observe(el));
}

/* ========================================================================
   3. SMOOTH SCROLL — For anchor links
   ======================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
}

/* ========================================================================
   4. TOAST NOTIFICATION SYSTEM (Enhanced with progress bar)
   ======================================================================== */

/**
 * Show a toast notification message.
 * Types: 'success', 'error', 'info'
 *
 * Usage:
 *   showToast('Your message was sent!', 'success');
 *   showToast('Something went wrong.', 'error');
 *
 * The toast auto-dismisses after 5 seconds with a visible progress bar.
 */
function showToast(message, type = 'info') {
  // Find or create the toast container
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Icon based on type — using text symbols for clean look
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 18px; font-weight: bold;">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after 5 seconds (matches CSS progress bar animation)
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/* ========================================================================
   5. FORM VALIDATION HELPERS
   ======================================================================== */

/**
 * Validate an email address format.
 * Returns true if valid, false otherwise.
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate an Indian phone number (10 digits, optionally starting with +91)
 */
function isValidPhone(phone) {
  const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Show error state on a form field
 * Adds red border and shows error message below the input
 */
function showFieldError(input, message) {
  input.classList.add('error');
  input.classList.remove('success');
  const errorEl = input.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

/**
 * Show success state on a form field (green border + checkmark)
 */
function showFieldSuccess(input) {
  input.classList.remove('error');
  input.classList.add('success');
  const errorEl = input.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}

/**
 * Clear error state on a form field
 */
function clearFieldError(input) {
  input.classList.remove('error');
  input.classList.remove('success');
  const errorEl = input.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}

/**
 * Clear all errors in a form
 */
function clearAllErrors(form) {
  form.querySelectorAll('.form-input.error, .form-input.success').forEach(input => {
    clearFieldError(input);
  });
}

/* ========================================================================
   6. API HELPER — Send data to backend
   ======================================================================== */

/**
 * Send data to backend API and return parsed response.
 * Handles JSON and FormData.
 *
 * Example:
 *   const result = await apiRequest('/api/v1/contact', 'POST', { name: 'John' });
 */
async function apiRequest(url, method = 'POST', data = null) {
  // Determine the base URL based on environment
  const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000'
    : 'https://gullyesports-backend.onrender.com'; // Production: Render backend
  
  const fullUrl = url.startsWith('/') ? baseUrl + url : url;

  const options = {
    method,
    headers: {},
  };

  if (data instanceof FormData) {
    // FormData — don't set Content-Type (browser sets boundary automatically)
    options.body = data;
  } else if (data) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(fullUrl, options);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
}

/* ========================================================================
   7. ✨ PARTICLE CANVAS — Lightweight animated particles on hero sections
   ======================================================================== */

/**
 * Creates a floating particle animation on any <canvas> with
 * class "particle-canvas". Particles drift slowly, creating
 * a premium ambient background effect.
 *
 * Particles are small semi-transparent dots that float and
 * connect with faint lines when near each other.
 */
function initParticleCanvas() {
  const canvases = document.querySelectorAll('.particle-canvas');
  if (canvases.length === 0) return;

  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match parent container
    function resize() {
      const parent = canvas.parentElement;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particle array — keep count low for smooth performance
    const particleCount = Math.min(50, Math.floor(canvas.width / 25));
    const particles = [];

    // Each particle has position, velocity, size, and opacity
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    // Animation loop — runs continuously
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen edges (seamless loop)
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();

        // Draw connecting lines between close particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    }

    animate();
  });
}

/* ========================================================================
   8. ✨ COUNTER ANIMATION — Numbers count up from 0 to target value
   ======================================================================== */

/**
 * Finds elements with class "counter-value" and data-count attribute.
 * When the element scrolls into view, animates the number from 0 to
 * the target value over 2 seconds using easeOutExpo for natural feel.
 *
 * Usage in HTML:
 *   <span class="counter-value" data-count="500">0</span>
 */
function initCounterAnimation() {
  const counters = document.querySelectorAll('.counter-value[data-count]');
  if (counters.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(counter => observer.observe(counter));
}

/**
 * Animate a single counter element from 0 to its data-count value.
 * Uses easeOutExpo for a "fast start, slow finish" natural feel.
 */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-count'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const prefix = el.getAttribute('data-prefix') || '';
  const duration = 2000; // 2 seconds
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // easeOutExpo: fast at the start, slows down at end
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const currentValue = Math.round(eased * target);

    el.textContent = prefix + currentValue.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ========================================================================
   9. ✨ TYPED TEXT — Typewriter effect cycling through phrases
   ======================================================================== */

/**
 * Creates a typewriter effect on elements with class "typed-text".
 * The element should have data-phrases as a JSON array of strings.
 *
 * Usage in HTML:
 *   <span class="typed-text" data-phrases='["Compete.","Dominate.","Win."]'></span>
 *
 * The effect types each phrase letter by letter, pauses, then deletes
 * and types the next phrase. Loops indefinitely.
 */
function initTypedText() {
  const elements = document.querySelectorAll('.typed-text');
  if (elements.length === 0) return;

  elements.forEach(el => {
    const phrases = JSON.parse(el.getAttribute('data-phrases') || '[]');
    if (phrases.length === 0) return;

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    // Add cursor element after the typed text
    const cursor = document.createElement('span');
    cursor.className = 'typed-cursor';
    cursor.textContent = '';
    el.parentElement.insertBefore(cursor, el.nextSibling);

    function type() {
      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        // Remove one character
        charIndex--;
        el.textContent = currentPhrase.substring(0, charIndex);
      } else {
        // Add one character
        charIndex++;
        el.textContent = currentPhrase.substring(0, charIndex);
      }

      // Calculate typing speed (faster when deleting)
      let delay = isDeleting ? 40 : 80;

      if (!isDeleting && charIndex === currentPhrase.length) {
        // Finished typing — pause before deleting
        delay = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        // Finished deleting — move to next phrase
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = 500;
      }

      setTimeout(type, delay);
    }

    // Start typing after a short delay
    setTimeout(type, 1000);
  });
}

/* ========================================================================
   10. ✨ SCROLL PROGRESS BAR — Shows how far user has scrolled
   ======================================================================== */

/**
 * Creates a thin gradient progress bar at the very top of the page.
 * The bar fills from left to right as the user scrolls down.
 * Auto-creates the DOM element if not present.
 */
function initScrollProgress() {
  // Create the progress bar element
  let progressBar = document.querySelector('.scroll-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.prepend(progressBar);
  }

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = scrollPercent + '%';
  });
}

/* ========================================================================
   11. ✨ FAQ ACCORDION — Click to expand/collapse question cards
   ======================================================================== */

/**
 * Toggles accordion items open/closed when clicking the header.
 * Only one item can be open at a time (auto-closes others).
 */
function initAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  if (accordionHeaders.length === 0) return;

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isActive = item.classList.contains('active');

      // Close all other accordion items first
      item.parentElement.querySelectorAll('.accordion-item.active').forEach(openItem => {
        openItem.classList.remove('active');
      });

      // Toggle clicked item (if it was closed, open it)
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* ========================================================================
   12. ✨ PAGE ENTRANCE ANIMATION — Smooth fade-in on page load
   ======================================================================== */

/**
 * Adds a quick fade-in animation to the page body on load.
 * This prevents the "flash" of unstyled content and gives
 * a premium feel to page transitions.
 */
function initPageEntrance() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';

  // Use requestAnimationFrame to ensure styles are applied first
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });
}
