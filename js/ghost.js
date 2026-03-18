'use strict';

(function GhostSignal() {

  /* ============================================================
     js/ghost.js
     ZERO DRIFT — Ghost Encoding Lens

     Feature 12 — Ghost Signal Moments

     Triggers on chapters 7, 16, and 21.
     (Set in chapters.js → GHOST_CHAPTERS)

     What happens:
     1. The screen develops a faint double-image offset —
        a ghost of the current page appears shifted behind it
     2. A brief signal fragment line types across the screen
     3. The waveform on the canvas spikes sharply once
     4. Everything fades back to normal over 3 seconds

     The three trigger chapters and their fragments:
       Ch 7  — First decoded fragment. "CORRECTION WINDOW."
       Ch 16 — Wren revealed. "THE ANALYSIS WAS BURIED."
       Ch 21 — Wren speaks through Juni.
                "TELL THEM. HOWEVER YOU HAVE TO TELL THEM."

     No chapter numbers are hard-coded here —
     chapters.js decides when to call trigger().
     The fragment text is passed via window.GHOST_FRAGMENT
     set in chapters.js before the trigger fires,
     OR falls back to a generic signal fragment.
  ============================================================ */

  let isActive = false;

  /* ──────────────────────────────────────────────────────────
     SIGNAL FRAGMENTS
     One per ghost chapter, keyed by chapter id.
     chapters.js sets window.GHOST_CHAPTER_ID before trigger.
  ────────────────────────────────────────────────────────── */

  const FRAGMENTS = {
    7:  [
      '// INCOMING_TRANSMISSION',
      'CORRECTION_WINDOW: T+14 DAYS',
      'ARRAY_CONFIRMED: RECEIVING',
      'DO NOT LET THEM BURY THE SIGNAL.',
    ],
    16: [
      '// ANOMALOUS_SIGNAL_DETECTED',
      'SELF_CAUSATION_CONFIRMED: +30% CASCADE',
      'THE ANALYSIS WAS BURIED.',
      'THE ANALYSIS IS IN THE BROADCAST.',
    ],
    21: [
      '// SECONDARY_CHANNEL: ACTIVE',
      'SOURCE: UNREGISTERED_RECEIVER',
      'TELL THEM.',
      'HOWEVER YOU HAVE TO TELL THEM.',
      'TELL THEM.',
    ],
  };

  const FALLBACK_FRAGMENT = [
    '// SIGNAL_DETECTED',
    'GHOST_ENCODING: PRESENT',
    'THREE SECONDS BELOW RESOLUTION THRESHOLD.',
    'PRESENT EVERYWHERE THE PHYSICS REACHES.',
  ];


  /* ──────────────────────────────────────────────────────────
     GHOST OVERLAY
     A fixed div that duplicates the reading area visually
     via a CSS filter offset — creates the double-image effect.
  ────────────────────────────────────────────────────────── */

  function createGhostOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ghostOverlay';
    overlay.setAttribute('aria-hidden', 'true');

    Object.assign(overlay.style, {
      position:       'fixed',
      inset:          '0',
      zIndex:         '98',
      pointerEvents:  'none',
      opacity:        '0',
      transition:     'opacity 0.4s ease',
    });

    /* Inner — the ghost image layer */
    const ghost = document.createElement('div');
    ghost.id = 'ghostInner';
    Object.assign(ghost.style, {
      position:   'absolute',
      inset:      '0',
      background: 'transparent',
      /* Offset and tint — the ghost of the page */
      transform:  'translate(3px, 2px)',
      filter:     'blur(0.6px) brightness(0.35) hue-rotate(15deg)',
      /* Clone reading area appearance via mix-blend */
      mixBlendMode: 'screen',
    });

    /* Ghost text lines container */
    const textLayer = document.createElement('div');
    textLayer.id = 'ghostTextLayer';
    Object.assign(textLayer.style, {
      position:   'absolute',
      top:        '50%',
      left:       '50%',
      transform:  'translate(-50%, -50%)',
      textAlign:  'center',
      fontFamily: 'var(--font-mono)',
      zIndex:     '99',
    });

    overlay.appendChild(ghost);
    overlay.appendChild(textLayer);
    document.body.appendChild(overlay);

    return { overlay, textLayer };
  }


  /* ──────────────────────────────────────────────────────────
     FRAGMENT TYPER
     Types fragment lines one at a time across the screen.
  ────────────────────────────────────────────────────────── */

  function typeFragment(container, lines, onComplete) {
    container.innerHTML = '';
    let lineIndex = 0;

    function typeLine() {
      if (lineIndex >= lines.length) {
        if (onComplete) onComplete();
        return;
      }

      const line     = lines[lineIndex];
      const lineEl   = document.createElement('div');
      lineIndex++;

      Object.assign(lineEl.style, {
        fontSize:      'var(--text-sm)',
        letterSpacing: '0.14em',
        color:         lineIndex === 1
          ? 'rgba(58, 160, 80, 0.60)'
          : 'rgba(130, 200, 140, 0.75)',
        marginBottom:  '0.4rem',
        opacity:       '0',
        transition:    'opacity 0.3s ease',
        whiteSpace:    'nowrap',
      });

      /* First line dimmer — system header */
      if (lineIndex === 1) {
        lineEl.style.color = 'rgba(45, 90, 52, 0.50)';
        lineEl.style.fontSize = 'var(--text-xs)';
      }

      /* Last line brighter — the message */
      if (lineIndex === lines.length) {
        lineEl.style.color  = 'rgba(160, 230, 170, 0.85)';
        lineEl.style.fontWeight = '500';
      }

      lineEl.textContent = line;
      container.appendChild(lineEl);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          lineEl.style.opacity = '1';
        });
      });

      setTimeout(typeLine, 420);
    }

    typeLine();
  }


  /* ──────────────────────────────────────────────────────────
     WAVEFORM SPIKE
     Temporarily boosts window.GHOST_SPIKE which effects.js
     reads to add amplitude to the waveform draw.
  ────────────────────────────────────────────────────────── */

  function triggerWaveformSpike() {
    window.GHOST_SPIKE = 1.0;

    /* Decay the spike over 2.5 seconds */
    const start    = performance.now();
    const duration = 2500;

    function decay(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      window.GHOST_SPIKE = 1.0 - progress;
      if (progress < 1) requestAnimationFrame(decay);
      else window.GHOST_SPIKE = 0;
    }

    requestAnimationFrame(decay);
  }


  /* ──────────────────────────────────────────────────────────
     SCREEN SHAKE
     Very subtle — one single pixel displacement.
     Communicates physical disturbance.
  ────────────────────────────────────────────────────────── */

  function screenShake() {
    const reading = document.getElementById('readingArea');
    if (!reading) return;

    reading.style.transition = 'transform 0.08s ease';
    reading.style.transform  = 'translate(2px, 1px)';

    setTimeout(() => {
      reading.style.transform = 'translate(-1px, -1px)';
      setTimeout(() => {
        reading.style.transform = 'none';
        setTimeout(() => {
          reading.style.transition = '';
        }, 100);
      }, 80);
    }, 80);
  }


  /* ──────────────────────────────────────────────────────────
     LENS FLICKER
     Briefly corrupts the lens overlay — the "hole" in the
     mask shrinks and shifts for a moment.
  ────────────────────────────────────────────────────────── */

  function lensFlicker() {
    const root = document.documentElement;
    const originalRadius = getComputedStyle(root)
      .getPropertyValue('--radius').trim();

    /* Shrink */
    root.style.setProperty('--radius', '60px');

    setTimeout(() => {
      root.style.setProperty('--radius', '220px');
      setTimeout(() => {
        root.style.setProperty('--radius', originalRadius || '180px');
      }, 180);
    }, 120);
  }


  /* ──────────────────────────────────────────────────────────
     MAIN TRIGGER
     Called by chapters.js → maybeFireGhost()
  ────────────────────────────────────────────────────────── */

  function trigger() {
    if (isActive) return;
    isActive = true;

    /* Get fragment for this chapter */
    const chapterId = window.GHOST_CHAPTER_ID || 0;
    const lines     = FRAGMENTS[chapterId] || FALLBACK_FRAGMENT;

    /* Build overlay */
    const existing = document.getElementById('ghostOverlay');
    if (existing) existing.parentNode.removeChild(existing);

    const { overlay, textLayer } = createGhostOverlay();

    /* Phase 1 — screen shake (immediate) */
    screenShake();

    /* Phase 2 — lens flicker (100ms) */
    setTimeout(lensFlicker, 100);

    /* Phase 3 — waveform spike (200ms) */
    setTimeout(triggerWaveformSpike, 200);

    /* Phase 4 — ghost overlay fades in (300ms) */
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 300);

    /* Phase 5 — fragment text types in (500ms) */
    setTimeout(() => {
      typeFragment(textLayer, lines, () => {
        /* Phase 6 — hold for a moment then fade out */
        setTimeout(() => {
          overlay.style.transition = 'opacity 1.8s ease';
          overlay.style.opacity    = '0';

          setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            isActive = false;
            window.GHOST_CHAPTER_ID = null;
          }, 1900);
        }, 1200);
      });
    }, 500);
  }


  /* ──────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────── */

  function init() {
    /* Integrate with effects.js waveform spike */
    /* effects.js checks window.GHOST_SPIKE in drawWaveform */
    window.GHOST_SPIKE = 0;
  }


  window.GhostSignal = {
    init:    init,
    trigger: trigger,
  };

})();