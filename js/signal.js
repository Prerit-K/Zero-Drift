'use strict';

(function Signal() {

  /* ============================================================
     js/signal.js
     ZERO DRIFT — Ghost Encoding Lens

     Owns the signal quality system (feature 2).

     What this file does:
     - Watches for chapter changes via window.SIGNAL_LEVEL
     - Animates the signal bar in the header with a
       scanning sweep effect when a new chapter loads
     - Provides a live "interference burst" that briefly
       spikes corruption visually on chapter transition
     - Exposes Signal.setLevel() for chapters.js to call

     The actual character corruption is handled inside
     chapters.js → applyCorruption(). This file handles
     the ambient visual signal quality display layer —
     the scanning animation and interference bursts.
  ============================================================ */

  let currentLevel  = 90;
  let animatingBars = false;
  let burstTimer    = null;


  /* ──────────────────────────────────────────────────────────
     SIGNAL BAR SCAN ANIMATION
     When a new chapter loads, the signal bar runs a brief
     "scanning" animation — bars fill from 0 upward to the
     chapter's actual signal level.
  ────────────────────────────────────────────────────────── */

  function animateScan(targetLevel) {
    if (animatingBars) return;
    animatingBars = true;

    const bar      = document.getElementById('chapterSignalBar');
    if (!bar) { animatingBars = false; return; }

    let scanLevel  = 0;
    const step     = Math.max(2, Math.round(targetLevel / 20));
    const interval = setInterval(() => {

      scanLevel = Math.min(scanLevel + step, targetLevel);

      const filled = Math.round(scanLevel / 100 * 6);
      const chars  = '█'.repeat(filled) + '░'.repeat(6 - filled);
      bar.textContent = 'SIGNAL: ' + chars + ' ' + scanLevel + '%';

      if (scanLevel >= targetLevel) {
        clearInterval(interval);
        animatingBars = false;

        /* Final settled state */
        const f = Math.round(targetLevel / 100 * 6);
        bar.textContent =
          'SIGNAL: ' + '█'.repeat(f) + '░'.repeat(6 - f) + ' ' + targetLevel + '%';
      }
    }, 40);
  }


  /* ──────────────────────────────────────────────────────────
     INTERFERENCE BURST
     On chapter load, briefly flicker the signal bar to
     simulate a transmission interruption before settling.
     More severe on low-signal chapters.
  ────────────────────────────────────────────────────────── */

  const NOISE_CHARS = '▓▒░╳◈≠≈';

  function triggerBurst(signalLevel) {
    const bar = document.getElementById('chapterSignalBar');
    if (!bar) return;

    /* High signal chapters get a short clean burst */
    /* Low signal chapters get a longer noisy burst  */
    const burstDuration = signalLevel > 70
      ? 280
      : signalLevel > 45
        ? 520
        : 820;

    const burstFrames = Math.round(burstDuration / 55);
    let   frame       = 0;

    if (burstTimer) clearInterval(burstTimer);

    burstTimer = setInterval(() => {
      frame++;

      if (frame >= burstFrames) {
        clearInterval(burstTimer);
        burstTimer = null;
        /* Hand off to scan animation */
        animateScan(signalLevel);
        return;
      }

      /* Generate noisy bar string */
      const noiseBar = Array.from({ length: 6 }, () => {
        return NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)];
      }).join('');

      /* Random noise percentage */
      const noisePct = Math.floor(Math.random() * 100);
      bar.textContent = 'SIGNAL: ' + noiseBar + ' ' + noisePct + '%';

    }, 55);
  }


  /* ──────────────────────────────────────────────────────────
     AMBIENT SIGNAL DRIFT
     Very subtle — every 8–14 seconds, the displayed
     signal level drifts ±2 points to suggest a live feed.
     Only active when not in a transition burst.
  ────────────────────────────────────────────────────────── */

  function startAmbientDrift() {
    function drift() {
      /* Do not drift during burst or scan */
      if (burstTimer || animatingBars) {
        scheduleDrift();
        return;
      }

      const bar = document.getElementById('chapterSignalBar');
      if (!bar) { scheduleDrift(); return; }

      /* ±2 drift around current level, clamped to 5–100 */
      const delta    = Math.random() > 0.5 ? 1 : -1;
      const drifted  = Math.max(5, Math.min(100, currentLevel + delta));
      const filled   = Math.round(drifted / 100 * 6);
      const chars    = '█'.repeat(filled) + '░'.repeat(6 - filled);
      bar.textContent = 'SIGNAL: ' + chars + ' ' + drifted + '%';

      scheduleDrift();
    }

    function scheduleDrift() {
      const delay = 8000 + Math.random() * 6000;
      setTimeout(drift, delay);
    }

    scheduleDrift();
  }


  /* ──────────────────────────────────────────────────────────
     POV LABEL FLICKER
     When the POV changes between chapters, the POV label
     briefly flickers through other POV names before
     settling on the correct one.
  ────────────────────────────────────────────────────────── */

  const POV_LABELS = [
    'VOSS_POV', 'OSEI_POV', 'MORROW_POV', 'CROSS_POV', 'MULTI_POV'
  ];

  function flickerPOVLabel(finalLabel) {
    const el = document.getElementById('povLabel');
    if (!el) return;

    let flickers = 0;
    const maxFlickers = 5;

    const interval = setInterval(() => {
      flickers++;

      if (flickers >= maxFlickers) {
        clearInterval(interval);
        el.textContent = '// ' + finalLabel;
        el.style.opacity = '0.7';
        return;
      }

      /* Random label from the pool */
      const random = POV_LABELS[Math.floor(Math.random() * POV_LABELS.length)];
      el.textContent = '// ' + random;
      el.style.opacity = String(0.3 + Math.random() * 0.5);

    }, 80);
  }


  /* ──────────────────────────────────────────────────────────
     CHAPTER TRANSITION OVERLAY
     A very brief full-screen signal flash on chapter load.
     Intensity scales with how different the new signal
     level is from the previous one.
  ────────────────────────────────────────────────────────── */

  function triggerTransitionFlash(newLevel) {
    const diff = Math.abs(newLevel - currentLevel);
    if (diff < 8) return; /* Too similar — no flash needed */

    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');

    const intensity = Math.min(diff / 100, 0.06);

    Object.assign(overlay.style, {
      position:       'fixed',
      inset:          '0',
      zIndex:         '99',
      pointerEvents:  'none',
      background:     'rgba(58, 160, 80, ' + intensity + ')',
      opacity:        '1',
      transition:     'opacity 0.35s ease',
    });

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 380);
      });
    });
  }


  /* ──────────────────────────────────────────────────────────
     PUBLIC API
     Called by chapters.js on every chapter render.
  ────────────────────────────────────────────────────────── */

  function setLevel(newLevel, povLabel) {
    triggerTransitionFlash(newLevel);
    triggerBurst(newLevel);
    if (povLabel) flickerPOVLabel(povLabel);
    currentLevel = newLevel;
  }


  /* ──────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────── */

  function init() {
    startAmbientDrift();
  }


  window.Signal = {
    init:     init,
    setLevel: setLevel,
  };

})();