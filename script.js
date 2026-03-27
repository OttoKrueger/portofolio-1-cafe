/* ================================================================
   THE BIRCH & BREW — script.js
   Vanilla JS only — no libraries, no jQuery
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   1. LUCIDE ICONS — initialise all [data-lucide] elements
---------------------------------------------------------------- */
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}


/* ================================================================
   2. NAVBAR — scroll class + active link highlighting
================================================================ */
const navbar   = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link:not(.nav-cta)');
const sections = document.querySelectorAll('section[id]');

function onNavScroll() {
  // Solid background once user leaves hero
  navbar.classList.toggle('scrolled', window.scrollY > 80);

  // Highlight the nav link whose section is in view
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 160) {
      current = sec.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    const href = link.getAttribute('href').slice(1); // strip '#'
    link.classList.toggle('active', href === current);
  });
}

window.addEventListener('scroll', onNavScroll, { passive: true });
onNavScroll(); // run once on load


/* ================================================================
   3. MOBILE MENU — hamburger toggle + close on link click
================================================================ */
const hamburger      = document.getElementById('hamburger');
const mobileOverlay  = document.getElementById('mobileOverlay');
const mobileCloseBtn = document.getElementById('mobileCloseBtn');
const hamburgerLbl   = hamburger.querySelector('.hamburger-label');
const mobileLinks    = document.querySelectorAll('.mobile-link');

function setMenuOpen(open) {
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
  mobileOverlay.classList.toggle('open', open);
  hamburgerLbl.textContent = open ? 'Close' : 'Menu';
  document.body.style.overflow = open ? 'hidden' : '';

  // Move focus into the overlay when opened, back to hamburger when closed
  if (open) {
    mobileCloseBtn && mobileCloseBtn.focus();
  } else {
    hamburger.focus();
  }
}

hamburger.addEventListener('click', () => {
  setMenuOpen(!mobileOverlay.classList.contains('open'));
});

// Dedicated close button inside the overlay
mobileCloseBtn && mobileCloseBtn.addEventListener('click', () => setMenuOpen(false));

mobileLinks.forEach(link => {
  link.addEventListener('click', () => setMenuOpen(false));
});

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobileOverlay.classList.contains('open')) {
    setMenuOpen(false);
  }
});


/* ================================================================
   4. HERO LINE — animated line draws across screen on load
================================================================ */
const heroLine = document.getElementById('heroLine');

// Short delay for a dramatic cinematic feel after fonts load
setTimeout(() => heroLine.classList.add('animate'), 350);


/* ================================================================
   5. REVEAL ANIMATIONS — Intersection Observer (no libraries)
================================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // fire once
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


/* ================================================================
   6. PARALLAX — experience strips (desktop + mobile)

   Strategy:
   - Desktop: CSS `background-attachment: fixed` keeps the image
     viewport-relative; JS drives `backgroundPositionY` for enhanced
     control and cross-browser consistency.
   - Mobile: CSS switches strips to `background-attachment: scroll`
     (required — iOS Safari ignores `fixed` entirely). With `scroll`,
     the background moves with the element by default. The JS then
     continuously offsets `backgroundPositionY` based on the strip's
     position in the viewport, producing the same parallax depth effect.

   Performance:
   - Updates are batched through `requestAnimationFrame` so at most
     one paint-cycle update fires per frame (≤60fps) regardless of
     how often the scroll/touch events fire.
   - Strips fully outside the viewport (+/– 200 px buffer) are skipped
     entirely to avoid unnecessary style recalculations.
   - `will-change: background-position` is set in CSS to allow the
     browser to promote strips to their own compositor layer.
   - On mobile, speed is scaled down to 0.45× for a subtler feel that
     feels comfortable on touch devices without causing motion sickness.
================================================================ */
const parallaxStrips = document.querySelectorAll('.parallax-strip');
let   parallaxRafId  = null;

function updateParallax() {
  const vh          = window.innerHeight;
  // Reduce effect intensity on touch screens for comfort
  const mobileScale = window.innerWidth <= 768 ? 0.45 : 1;

  parallaxStrips.forEach(strip => {
    const rect = strip.getBoundingClientRect();

    // Skip strips that are nowhere near the viewport — saves style recalcs
    if (rect.bottom < -200 || rect.top > vh + 200) return;

    const speed = parseFloat(strip.dataset.speed) || 0.2;
    const mid   = rect.top + rect.height / 2 - vh / 2;
    const shift = mid * speed * mobileScale;
    strip.style.backgroundPositionY = `calc(50% + ${shift}px)`;
  });
}

// Batch scroll/resize through rAF so we update at most once per frame
function scheduleParallax() {
  if (parallaxRafId) return;
  parallaxRafId = requestAnimationFrame(() => {
    updateParallax();
    parallaxRafId = null;
  });
}

window.addEventListener('scroll', scheduleParallax, { passive: true });
window.addEventListener('resize', scheduleParallax, { passive: true });
updateParallax(); // initial position on load


/* ================================================================
   7. MENU — sticky vertical category label
   The label updates as the user scrolls between menu categories
================================================================ */
const menuStickyLabel = document.getElementById('menuStickyLabel');
const menuCategories  = document.querySelectorAll('.menu-category[data-category]');

if (menuStickyLabel && menuCategories.length) {
  const menuObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          menuStickyLabel.textContent = entry.target.dataset.category;
        }
      });
    },
    {
      rootMargin: `-${Math.round(window.innerHeight * 0.2)}px 0px -${Math.round(window.innerHeight * 0.5)}px 0px`,
      threshold: 0,
    }
  );
  menuCategories.forEach(cat => menuObserver.observe(cat));
}


/* ================================================================
   8. GALLERY — lightbox
================================================================ */
const galleryItems  = document.querySelectorAll('.gallery-item');
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxCapt  = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(imgSrc, imgAlt, label) {
  lightboxImg.src = imgSrc;
  lightboxImg.alt = imgAlt;
  lightboxCapt.textContent = label;
  lightbox.classList.add('open');
  lightbox.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

galleryItems.forEach(item => {
  const open = () => {
    const img   = item.querySelector('img');
    const label = item.dataset.label || '';
    openLightbox(img.src, img.alt, label);
  };
  item.addEventListener('click', open);
  // Keyboard accessibility
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
});


/* ================================================================
   9. TESTIMONIALS — auto-scrolling carousel with dot navigation
================================================================ */
const slides         = Array.from(document.querySelectorAll('.testimonial-slide'));
const dotsContainer  = document.getElementById('testimonialDots');
let   currentSlide   = 0;
let   autoTimer      = null;

// Build dot buttons dynamically
slides.forEach((_, i) => {
  const btn = document.createElement('button');
  btn.className = `dot${i === 0 ? ' active' : ''}`;
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-label', `Review ${i + 1}`);
  btn.setAttribute('aria-selected', i === 0);
  btn.addEventListener('click', () => goToSlide(i));
  dotsContainer.appendChild(btn);
});

const dots = Array.from(dotsContainer.querySelectorAll('.dot'));

function goToSlide(next) {
  if (next === currentSlide) return;

  const prev = currentSlide;

  // Exit current
  slides[prev].classList.remove('active');
  slides[prev].classList.add('exit');
  dots[prev].classList.remove('active');
  dots[prev].setAttribute('aria-selected', false);

  // Remove exit class after transition ends
  setTimeout(() => slides[prev].classList.remove('exit'), 700);

  // Enter next
  currentSlide = next;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  dots[currentSlide].setAttribute('aria-selected', true);

  resetTimer();
}

function nextSlide() {
  goToSlide((currentSlide + 1) % slides.length);
}

function resetTimer() {
  clearInterval(autoTimer);
  autoTimer = setInterval(nextSlide, 3500);
}

// Pause autoplay on hover/focus
const testimonialSection = document.querySelector('.testimonials');
testimonialSection.addEventListener('mouseenter', () => clearInterval(autoTimer));
testimonialSection.addEventListener('mouseleave', resetTimer);
testimonialSection.addEventListener('focusin',    () => clearInterval(autoTimer));
testimonialSection.addEventListener('focusout',   resetTimer);

resetTimer();


/* ================================================================
   10. RESERVATIONS — form validation with inline error states
================================================================ */
const reservationForm    = document.getElementById('reservationForm');
const reservationSuccess = document.getElementById('reservationSuccess');

// Validation rules
const validators = {
  resName: {
    errorId: 'nameError',
    validate: val => val.trim().length >= 2 ? null : 'Please enter your full name.',
  },
  resEmail: {
    errorId: 'emailError',
    validate: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ? null : 'Please enter a valid email address.',
  },
  resDate: {
    errorId: 'dateError',
    validate: val => {
      if (!val) return 'Please select a date.';
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return new Date(val) >= today ? null : 'Please select a future date.';
    },
  },
  resTime: {
    errorId: 'timeError',
    validate: val => val ? null : 'Please select a time.',
  },
  resGuests: {
    errorId: 'guestsError',
    validate: val => val ? null : 'Please select the number of guests.',
  },
};

function applyValidation(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(validators[fieldId].errorId);
  const group = input.closest('.form-group');

  if (message) {
    error.textContent = message;
    group.classList.add('has-error');
    return false;
  } else {
    error.textContent = '';
    group.classList.remove('has-error');
    return true;
  }
}

function validateAll() {
  let allValid = true;
  Object.entries(validators).forEach(([fieldId, rule]) => {
    const input   = document.getElementById(fieldId);
    const message = rule.validate(input.value);
    if (!applyValidation(fieldId, message)) allValid = false;
  });
  return allValid;
}

// Live validation on blur (validate as user leaves each field)
Object.keys(validators).forEach(fieldId => {
  const input = document.getElementById(fieldId);
  if (!input) return;
  input.addEventListener('blur', () => {
    const message = validators[fieldId].validate(input.value);
    applyValidation(fieldId, message);
  });
  // Clear error as user types/changes
  input.addEventListener('input', () => {
    const group = input.closest('.form-group');
    if (group.classList.contains('has-error')) {
      const message = validators[fieldId].validate(input.value);
      applyValidation(fieldId, message);
    }
  });
});

reservationForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateAll()) return;

  // Animate form out, success message in
  reservationForm.style.transition = 'opacity 0.5s ease';
  reservationForm.style.opacity = '0';
  reservationForm.style.pointerEvents = 'none';

  setTimeout(() => {
    reservationForm.style.display = 'none';
    reservationSuccess.classList.add('show');
    reservationSuccess.removeAttribute('aria-hidden');
    reservationSuccess.querySelector('h3').focus();
  }, 520);
});


/* ================================================================
   11. SMOOTH SCROLL — override anchor click for offset correction
   (handles the fixed navbar height)
================================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const id     = this.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight;
    window.scrollTo({ top, behavior: 'smooth' });

    // Close mobile menu if open
    if (mobileOverlay.classList.contains('open')) setMenuOpen(false);
  });
});
