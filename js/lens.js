/* ============================================================
   js/lens.js
   ZERO DRIFT — Ghost Encoding Lens

   Owns the decryption lens mechanic entirely.
   Nothing else writes to --cx, --cy, or --radius.

   Contents:
   1.  Device detection
   2.  CSS variable writers (the core mechanic)
   3.  Mouse tracking
   4.  Idle timer
   5.  Lens radius slider
   6.  Mobile — tap to reveal
   7.  Mobile — gyroscope fallback
   8.  Public API
   ============================================================ */

'use strict';

(function Lens() {

  /* ──────────────────────────────────────────────────────────
     PRIVATE STATE
  ────────────────────────────────────────────────────────── */

  /* Cached DOM references — set in init() */
  let overlay  = null;   /* .lens-overlay */
  let slider   = null;   /* #lensSlider   */
  let readout  = null;   /* #lensReadout  */
  let root     = null;   /* <html>        */

  /* Current lens radius in px */
  let radius = 180;

  /* Idle timer handle */
  let idleTimer = null;

  /* Whether we are on a touch device */
  let isTouch = false;

  /* Whether gyroscope is active */
  let gyroActive = false;

  /* Smoothed gyroscope coordinates */
  let gyroX = 0;
  let gyroY = 0;


  /* ──────────────────────────────────────────────────────────
     CONSTANTS
  ────────────────────────────────────────────────────────── */

  const IDLE_DELAY   = 3000;   /* ms before idle state triggers */
  const GYRO_SMOOTH  = 0.08;   /* lerp factor — lower = smoother */

  /* Initial lens position — center of screen */
  const INIT_X = '50%';
  const INIT_Y = '50%';


  /* ──────────────────────────────────────────────────────────
     1. DEVICE DETECTION
  ────────────────────────────────────────────────────────── */

  function detectTouch() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches
    );
  }


  /* ──────────────────────────────────────────────────────────
     2. CSS VARIABLE WRITERS
     These are the core of the mechanic.
     setPosition() is called on every mousemove and every
     gyroscope update — kept as lean as possible.
  ────────────────────────────────────────────────────────── */

  /* Write cursor position to CSS custom properties.
     x and y can be pixel strings ('320px') or percentages ('50%'). */
  function setPosition(x, y) {
    root.style.setProperty('--cx', x);
    root.style.setProperty('--cy', y);
  }

  /* Write lens radius to CSS custom property */
  function setRadius(px) {
    radius = px;
    root.style.setProperty('--radius', px + 'px');
  }

  /* Initialize both to safe defaults */
  function initCSSVars() {
    setPosition(INIT_X, INIT_Y);
    setRadius(radius);
  }


  /* ──────────────────────────────────────────────────────────
     3. MOUSE TRACKING
     Runs on desktop only (touch devices skip this).
     Updates --cx and --cy on every mousemove event.
  ────────────────────────────────────────────────────────── */

  function onMouseMove(e) {
    /* Write pixel coordinates directly — no rounding needed,
       the browser handles sub-pixel CSS transitions */
    setPosition(e.clientX + 'px', e.clientY + 'px');

    /* Mark the overlay as active (adds lens rim via CSS) */
    overlay.classList.add('active');
    overlay.classList.remove('idle');

    /* Reset idle timer on every movement */
    resetIdleTimer();
  }

  /* When cursor leaves the viewport, center the lens.
     Prevents the screen going fully dark when mouse exits. */
  function onMouseLeave() {
    setPosition(INIT_X, INIT_Y);
    overlay.classList.remove('active');
    clearIdleTimer();
  }

  function initMouseTracking() {
    document.addEventListener('mousemove',  onMouseMove,  { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });
  }


  /* ──────────────────────────────────────────────────────────
     4. IDLE TIMER
     After IDLE_DELAY ms without cursor movement, the lens
     contracts to a smaller radius (CSS .idle state).
     Resets immediately on any mouse movement.
  ────────────────────────────────────────────────────────── */

  function resetIdleTimer() {
    clearIdleTimer();
    idleTimer = setTimeout(triggerIdle, IDLE_DELAY);
  }

  function clearIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function triggerIdle() {
    overlay.classList.add('idle');
    overlay.classList.remove('active');
  }


  /* ──────────────────────────────────────────────────────────
     5. LENS RADIUS SLIDER
     The range input in the sidebar.
     Updates --radius and the readout display.
  ────────────────────────────────────────────────────────── */

  function onSliderInput() {
    const val = parseInt(slider.value, 10);
    setRadius(val);
    readout.textContent = val + 'px';

    /* If in full-reveal mode, exit it when slider is used */
    if (root.classList.contains('full-reveal')) {
      exitFullReveal();
    }
  }

  function initSlider() {
    if (!slider) return;
    slider.value = radius;
    slider.addEventListener('input', onSliderInput);
  }


  /* ──────────────────────────────────────────────────────────
     6. MOBILE — SCROLL TO REVEAL
     On touch devices the lens overlay is hidden (CSS).
     Instead, paragraphs reveal automatically as the reader
     scrolls them into view — no tapping required.

     Behavior:
     - All <p> inside .novel-text start at opacity 0 (CSS)
     - An IntersectionObserver watches every paragraph
     - When a paragraph reaches 15% into the viewport,
       it fades in with the .revealed class
     - First two paragraphs auto-reveal on chapter load
       so the reader is never greeted with a blank screen
  ────────────────────────────────────────────────────────── */

  let scrollObserver = null;

  /* Called by js/chapters.js after every chapter render */
  function initTapReveal() {
    if (!isTouch) return;

    const novelText = document.getElementById('novelText');
    if (!novelText) return;

    const paragraphs = Array.from(novelText.querySelectorAll('p'));
    if (!paragraphs.length) return;

    /* Auto-reveal first two paragraphs immediately */
    paragraphs.forEach((p, i) => {
      if (i < 2) {
        setTimeout(() => {
          p.classList.add('revealed', 'auto-revealed');
        }, 150 + i * 200);
      }
    });

    /* Disconnect any leftover observer from the previous chapter */
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }

    /* Reveal each paragraph when it scrolls 15% into the viewport.
       rootMargin bottom offset keeps text from revealing too early —
       it decrypts as the reader reaches it, not before. */
    scrollObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          scrollObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold:  0.15,
      rootMargin: '0px 0px -40px 0px',
    });

    /* Observe all paragraphs past the first two */
    paragraphs.forEach((p, i) => {
      if (i >= 2) scrollObserver.observe(p);
    });
  }

  /* Clean up observer before re-render.
     Called by js/chapters.js before loading a new chapter. */
  function cleanupTapReveal() {
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }

    /* Also clean up any legacy tap handlers from old renders */
    const novelText = document.getElementById('novelText');
    if (!novelText) return;
    novelText.querySelectorAll('p').forEach(p => {
      if (p._tapHandler) {
        p.removeEventListener('click', p._tapHandler);
        delete p._tapHandler;
      }
    });
  }


  /* ──────────────────────────────────────────────────────────
     7. MOBILE — GYROSCOPE FALLBACK
     On supported devices, tilting the phone moves the lens.
     Uses smooth interpolation to prevent jittery movement.

     requestPermission() is required on iOS 13+.
     Must be called inside a user gesture — the intro
     enter button click provides this.
  ────────────────────────────────────────────────────────── */

  /* Smooth interpolation loop — runs on rAF when gyro is active */
  function gyroLoop() {
    if (!gyroActive) return;

    /* Read current CSS var values */
    const currentX = parseFloat(root.style.getPropertyValue('--cx')) || window.innerWidth  / 2;
    const currentY = parseFloat(root.style.getPropertyValue('--cy')) || window.innerHeight / 2;

    /* Lerp toward target */
    const newX = currentX + (gyroX - currentX) * GYRO_SMOOTH;
    const newY = currentY + (gyroY - currentY) * GYRO_SMOOTH;

    setPosition(newX + 'px', newY + 'px');

    requestAnimationFrame(gyroLoop);
  }

  /* Map device orientation angles to screen coordinates */
  function onDeviceOrientation(e) {
    const gamma = e.gamma || 0;   /* Left-right tilt: -90 to 90  */
    const beta  = e.beta  || 0;   /* Front-back tilt: -180 to 180 */

    const hw = window.innerWidth  / 2;
    const hh = window.innerHeight / 2;

    /* Map gamma (-45 to 45 comfortable range) to screen X */
    gyroX = hw + (gamma / 45) * hw * 0.75;

    /* Map beta (15 to 75 comfortable portrait hold range) to screen Y */
    gyroY = hh + ((beta - 45) / 45) * hh * 0.65;

    /* Clamp to viewport */
    gyroX = Math.max(0, Math.min(window.innerWidth,  gyroX));
    gyroY = Math.max(0, Math.min(window.innerHeight, gyroY));
  }

  function startGyroscope() {
    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });

    /* Initialize target to current center */
    gyroX = window.innerWidth  / 2;
    gyroY = window.innerHeight / 2;

    gyroActive = true;

    /* Show indicator badge */
    showGyroIndicator();

    /* Start smooth update loop */
    requestAnimationFrame(gyroLoop);
  }

  /* Called from js/app.js inside the intro enter button handler */
  function requestGyroscope() {
    if (!isTouch) return;
    if (!window.DeviceOrientationEvent) return;

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      /* iOS 13+ — explicit permission required */
      DeviceOrientationEvent.requestPermission()
        .then(state => {
          if (state === 'granted') startGyroscope();
        })
        .catch(() => {
          /* Permission denied — tap reveal is already active, no action needed */
        });
    } else {
      /* Android and older iOS — no permission dialog */
      startGyroscope();
    }
  }

  /* ── Gyroscope indicator badge ──────────────────────────── */

  function showGyroIndicator() {
    let indicator = document.querySelector('.gyro-indicator');

    /* Create it if it does not exist */
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className     = 'gyro-indicator';
      indicator.textContent   = '// GYRO_ACTIVE';
      indicator.setAttribute('aria-hidden', 'true');
      document.body.appendChild(indicator);
    }

    /* Brief appearance then fade */
    requestAnimationFrame(() => {
      indicator.classList.add('visible');
      setTimeout(() => {
        indicator.classList.remove('visible');
      }, 2800);
    });
  }


  /* ──────────────────────────────────────────────────────────
     FULL REVEAL MODE (Konami easter egg)
     Called by js/app.js when the code is entered.
     Expands the lens to cover the whole screen.
  ────────────────────────────────────────────────────────── */

  function enterFullReveal() {
    root.classList.add('full-reveal');
    setRadius(1800);

    /* Update slider UI to reflect the change */
    if (slider)  slider.value       = slider.max;
    if (readout) readout.textContent = 'UNLOCKED';
  }

  function exitFullReveal() {
    root.classList.remove('full-reveal');
    /* Restore slider value */
    const val = parseInt(slider ? slider.value : 180, 10);
    setRadius(val);
    if (readout) readout.textContent = val + 'px';
  }


  /* ──────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────── */

  function init() {
    root    = document.documentElement;
    overlay = document.getElementById('lensOverlay');
    slider  = document.getElementById('lensSlider');
    readout = document.getElementById('lensReadout');

    isTouch = detectTouch();

    /* Set initial CSS variable values */
    initCSSVars();

    if (!isTouch) {
      /* Desktop — cursor tracking + idle timer */
      initMouseTracking();
    }

    /* Slider works on both desktop and mobile */
    initSlider();
  }


  /* ──────────────────────────────────────────────────────────
     PUBLIC API
     Only what other modules need to call.
  ────────────────────────────────────────────────────────── */

  window.Lens = {
    init:             init,
    initTapReveal:    initTapReveal,
    cleanupTapReveal: cleanupTapReveal,
    requestGyroscope: requestGyroscope,
    enterFullReveal:  enterFullReveal,
    exitFullReveal:   exitFullReveal,
    isTouch:          function () { return isTouch; },
  };

})();