/* ============================================================
   js/app.js
   ZERO DRIFT — Ghost Encoding Lens

   The entry point. Runs after all other scripts have loaded.

   Contents:
   1.  Boot sequence messages
   2.  Boot sequence runner
   3.  Intro screen — show enter button
   4.  Intro screen — dismiss on click
   5.  Konami code easter egg
   6.  Keyboard shortcut hint (desktop)
   7.  Init — single DOMContentLoaded entry point
   ============================================================ */

'use strict';

(function App() {

  /* ──────────────────────────────────────────────────────────
     1. BOOT SEQUENCE MESSAGES
     Edit these freely — they are purely atmospheric.
     Each string appears as one line in the intro terminal.
     Keep them short — they need to fit on one line at
     the smallest supported screen width (320px).
  ────────────────────────────────────────────────────────── */

  const BOOT_MESSAGES = [
    '> SYSTEM_INIT...',
    '> LOADING GHOST_ENCODING_LENS v1.0',
    '> ARRAY_SOURCE: VELTHAN_COASTAL_STATION',
    '> CARRIER_WAVE_STATUS: DETECTED',
    '> GRAVITATIONAL_SIGNATURE: ANOMALOUS',
    '> SCANNING FREQUENCY_RANGE...',
    '> DATA_FRAGMENTS: ' + (window.CHAPTERS ? window.CHAPTERS.length : 0) + ' INDEXED',
    '> DECRYPTION_PROTOCOL: STANDBY',
    '> LENS_CALIBRATION: COMPLETE',
    '> AWAITING OPERATOR.',
  ];

  /* Delay between each line appearing, in milliseconds */
  const LINE_DELAY = 160;

  /* Delay between boot complete and enter button appearing */
  const ENTER_DELAY = 400;


  /* ──────────────────────────────────────────────────────────
     2. BOOT SEQUENCE RUNNER
     Types out BOOT_MESSAGES one line at a time.
     Each line fades in via the .visible class (intro.css).
     Returns a Promise that resolves when all lines are shown.
  ────────────────────────────────────────────────────────── */

  function runBoot() {
    return new Promise(resolve => {

      const container = document.getElementById('introBoot');
      if (!container) {
        resolve();
        return;
      }

      let index = 0;

      function showNextLine() {
        if (index >= BOOT_MESSAGES.length) {
          /* Mark container complete — stops cursor blink (CSS) */
          container.classList.add('complete');
          resolve();
          return;
        }

        /* Create line element */
        const line = document.createElement('div');
        line.className   = 'boot-line';
        line.textContent = BOOT_MESSAGES[index];
        container.appendChild(line);

        /* Force reflow so transition fires */
        void line.offsetHeight;
        line.classList.add('visible');

        index++;

        /* Schedule next line */
        setTimeout(showNextLine, LINE_DELAY);
      }

      showNextLine();
    });
  }


  /* ──────────────────────────────────────────────────────────
     3. INTRO SCREEN — SHOW ENTER BUTTON
     Called after boot sequence completes.
     Reveals the enter button by adding .visible (intro.css).
  ────────────────────────────────────────────────────────── */

  function showEnterButton() {
    const btn = document.getElementById('introEnter');
    if (!btn) return;

    setTimeout(() => {
      btn.classList.add('visible');
      /* Move focus to the button for keyboard users */
      btn.focus();
    }, ENTER_DELAY);
  }


  /* ──────────────────────────────────────────────────────────
     4. INTRO SCREEN — DISMISS
     Sequence on click:
       1. Brief visual flash (.flash class — intro.css)
       2. Intro fades out (.dismissed class — intro.css)
       3. On mobile: request gyroscope permission
       4. On desktop: show keyboard shortcut hint
  ────────────────────────────────────────────────────────── */

  function initIntro() {
    const screen = document.getElementById('introScreen');
    const btn    = document.getElementById('introEnter');
    if (!screen || !btn) return;

    /* Also allow pressing Enter key to dismiss */
    function onEnterKey(e) {
      if (e.key === 'Enter' && !screen.classList.contains('dismissed')) {
        dismissIntro();
        document.removeEventListener('keydown', onEnterKey);
      }
    }

    function dismissIntro() {
      /* 1 — flash */
      screen.classList.add('flash');

      /* 2 — after flash settles, fade out */
      setTimeout(() => {
        screen.classList.add('dismissed');
      }, 200);

      /* 3 — request gyroscope on mobile (must be in user gesture) */
      Lens.requestGyroscope();

      /* 4 — show hint on desktop */
      if (!Lens.isTouch()) {
        setTimeout(showShortcutHint, 800);
      }

      /* Show mobile hint on touch devices */
      if (Lens.isTouch()) {
        showMobileHint();
      }
    }

    btn.addEventListener('click', dismissIntro);
    document.addEventListener('keydown', onEnterKey);
  }


  /* ──────────────────────────────────────────────────────────
     5. KONAMI CODE EASTER EGG
     ↑ ↑ ↓ ↓ ← → ← → B A
     Expands the lens to fill the screen — "full decrypt" mode.
     Sequence resets on any wrong key.
  ────────────────────────────────────────────────────────── */

  function initKonami() {

    const SEQUENCE = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a',
    ];

    let position = 0;

    document.addEventListener('keydown', e => {

      /* Check against expected key at current position */
      if (e.key === SEQUENCE[position]) {
        position++;

        if (position === SEQUENCE.length) {
          /* Sequence complete */
          position = 0;
          activateFullReveal();
        }
      } else {
        /* Wrong key — reset */
        position = 0;

        /* Check if this wrong key is actually the first
           key of the sequence — avoids missing a sequence
           that starts immediately after a failed attempt */
        if (e.key === SEQUENCE[0]) position = 1;
      }
    });
  }

  function activateFullReveal() {
    /* Expand lens */
    Lens.enterFullReveal();

    /* Show confirmation message */
    showToast('// CARRIER_WAVE_DECRYPTED — FULL_SIGNAL_ACCESS');

    /* Auto-exit full reveal after 12 seconds */
    setTimeout(() => {
      Lens.exitFullReveal();
    }, 12000);
  }


  /* ──────────────────────────────────────────────────────────
     6. KEYBOARD SHORTCUT HINT
     Shown briefly on first desktop load after intro dismissal.
     Created in JS — no HTML element needed.
  ────────────────────────────────────────────────────────── */

  function showShortcutHint() {
    const lines = [
      '// CONTROLS',
      'MOVE CURSOR   → decrypt',
      '◈ FRAGMENTS   → chapters',
      '← →  ARROWS   → navigate',
      'SLIDER        → lens size',
      'ESC           → close menu',
    ];

    showToast(lines.join('\n'), 5500);
  }


  /* ──────────────────────────────────────────────────────────
     MOBILE HINT
     Shown briefly after intro dismissal on touch devices.
  ────────────────────────────────────────────────────────── */

  function showMobileHint() {
    const hint = document.getElementById('mobileHint');
    if (!hint) return;

    /* Already shown via CSS display:flex on touch devices.
       Auto-hide after 5 seconds. */
    setTimeout(() => {
      hint.style.transition = 'opacity 0.6s ease';
      hint.style.opacity    = '0';
      setTimeout(() => {
        hint.style.display = 'none';
      }, 650);
    }, 5000);
  }


  /* ──────────────────────────────────────────────────────────
     TOAST NOTIFICATION
     Generic brief message — used by Konami and hint.
     Creates, appends, shows, then removes itself.

     msg     — string, may contain \n for line breaks
     duration — ms before auto-dismiss (default 4000)
  ────────────────────────────────────────────────────────── */

  function showToast(msg, duration) {
    duration = duration || 4000;

    const toast = document.createElement('div');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');

    /* Inline styles — toast is entirely self-contained,
       no CSS class needed, no risk of style conflicts */
    Object.assign(toast.style, {
      position:      'fixed',
      bottom:        '2rem',
      right:         '2rem',
      zIndex:        '999',
      background:    'rgba(7, 10, 8, 0.97)',
      border:        '1px solid rgba(45, 74, 51, 0.35)',
      padding:       '0.9rem 1.1rem',
      fontFamily:    'inherit',
      fontSize:      '0.58rem',
      color:         'rgba(74, 104, 80, 0.75)',
      lineHeight:    '1.9',
      letterSpacing: '0.06em',
      whiteSpace:    'pre',
      pointerEvents: 'none',
      opacity:       '0',
      transition:    'opacity 0.35s ease',
      maxWidth:      '280px',
    });

    toast.textContent = msg;
    document.body.appendChild(toast);

    /* Fade in */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
      });
    });

    /* Fade out and remove */
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, duration);
  }


  /* ──────────────────────────────────────────────────────────
     7. INIT
     Single entry point. Called once on DOMContentLoaded.
     Order matters — Effects and Lens before Chapters,
     Chapters before the boot sequence runs.
  ────────────────────────────────────────────────────────── */

  function init() {

    /* 1 — Canvas atmosphere (grain + waveform) */
    Effects.init();

    /* 2 — Lens mechanic (cursor tracking / touch) */
    Lens.init();
    
    /* 2.5 — Signal quality system */
    if (window.Signal) Signal.init();
    /* Terminal */
    if (window.Terminal) Terminal.init();
    /* Map */
    if (window.MapModule) MapModule.init();
    /* Ghost signal */
    if (window.GhostSignal) GhostSignal.init();

    /* 3 — Chapter system (build sidebar, render ch.1) */
    Chapters.init();

    /* 4 — Intro screen setup */
    initIntro();

    /* 5 — Konami easter egg */
    initKonami();

    /* 6 — Run boot sequence, then show enter button */
    runBoot().then(showEnterButton);
  }


  /* ──────────────────────────────────────────────────────────
     ENTRY POINT
  ────────────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', init);

})();
