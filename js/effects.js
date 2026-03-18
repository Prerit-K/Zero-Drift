'use strict';

(function Effects() {

  let canvas  = null;
  let ctx     = null;
  let w       = 0;
  let h       = 0;
  let dpr     = 1;
  let frameId = null;
  let waveTime     = 0;
  let grainDensity = 0;
  let running      = false;

  const GRAIN = {
    density:    0.0015,
    densityLow: 0.0008,
    alphaMin:   0.018,
    alphaMax:   0.055,
    size:       1,
  };

  const WAVE = {
    baselineY:  0.82,
    amplitude:  22,
    speed:      0.0004,
    color:      'rgba(58, 160, 80, 0.28)',
    lineWidth:  1,
    step:       3,
  };

  const WAVE_LAYERS = [
    [ 1.000, 1.00, 0.000 ],
    [ 2.317, 0.38, 1.047 ],
    [ 0.583, 0.22, 2.618 ],
    [ 4.100, 0.12, 0.785 ],
  ];


  /* ── Init ── */

  function init() {
    canvas = document.getElementById('atmoCanvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    grainDensity = dpr >= 2 ? GRAIN.density : GRAIN.densityLow;

    resize();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });

    start();
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width        = Math.round(w * dpr);
    canvas.height       = Math.round(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function start() {
    if (running) return;
    running = true;
    frameId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  }


  /* ── Main loop ── */

  function loop() {
    if (!running) return;
    waveTime += WAVE.speed;
    ctx.clearRect(0, 0, w, h);
    drawGrain();
    drawWaveform();
    frameId = requestAnimationFrame(loop);
  }


  /* ── Grain ── */

  function drawGrain() {
    ctx.save();
    const dotCount = Math.floor(w * h * grainDensity);

    for (let i = 0; i < dotCount; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const a = GRAIN.alphaMin + Math.random() * (GRAIN.alphaMax - GRAIN.alphaMin);
      ctx.fillStyle = Math.random() > 0.72
        ? `rgba(58, 160, 80, ${a})`
        : `rgba(180, 200, 185, ${a * 0.6})`;
      ctx.fillRect(x, y, GRAIN.size, GRAIN.size);
    }
    ctx.restore();
  }


  /* ── Waveform with progress fill (feature 3) ──
     
     READING_PROGRESS is a value 0–1 set by chapters.js.
     The waveform renders in two segments:
       LEFT  of the progress cutoff — bright, fully visible
       RIGHT of the progress cutoff — dim, "undecrypted"
     
     This creates the effect of the waveform being
     "decoded" as the reader progresses through the story.
  ── */

  function drawWaveform() {
    ctx.save();

    const baseline = h * WAVE.baselineY;
    const progress = typeof window.READING_PROGRESS === 'number'
      ? window.READING_PROGRESS
      : 0;

    /* Cutoff x position — left of this is "read" */
    const cutoff = Math.round(progress * w);

    /* ── Baseline reference ── */
    ctx.beginPath();
    ctx.moveTo(0, baseline);
    ctx.lineTo(w, baseline);
    ctx.strokeStyle = 'rgba(30, 70, 40, 0.12)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    /* ── Build full waveform path ── */
    const freqBase = (Math.PI * 2) / (w * 0.38);
    const points   = [];

    for (let x = 0; x <= w; x += WAVE.step) {
      let y = 0;
      for (let l = 0; l < WAVE_LAYERS.length; l++) {
        const [fm, am, ph] = WAVE_LAYERS[l];
        y += Math.sin(x * freqBase * fm + waveTime * (1 + l * 0.3) + ph) * WAVE.amplitude * am;
      }
      const spike = window.GHOST_SPIKE || 0;
y *= (0.85 + Math.sin(waveTime * 0.7) * 0.15) * (1 + spike * 3.5);
      points.push({ x, y });
    }

    /* ── Helper: build Path2D from points array ── */
    function buildPath(pts) {
      const p = new Path2D();
      pts.forEach((pt, i) => {
        i === 0 ? p.moveTo(pt.x, baseline + pt.y)
                : p.lineTo(pt.x, baseline + pt.y);
      });
      return p;
    }

    /* ── Segment 1: DECODED (left of cutoff) — bright ── */
    if (cutoff > 0) {
      const decodedPts = points.filter(pt => pt.x <= cutoff);
      const decodedPath = buildPath(decodedPts);

      /* Glow */
      ctx.save();
      ctx.filter      = 'blur(3px)';
      ctx.strokeStyle = 'rgba(58, 160, 80, 0.22)';
      ctx.lineWidth   = 3;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';
      ctx.stroke(decodedPath);
      ctx.restore();

      /* Main line */
      ctx.strokeStyle = 'rgba(58, 160, 80, 0.55)';
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';
      ctx.stroke(decodedPath);
    }

    /* ── Segment 2: UNDECODED (right of cutoff) — dim ── */
    if (cutoff < w) {
      const undecodedPts = points.filter(pt => pt.x >= cutoff);
      const undecodedPath = buildPath(undecodedPts);

      ctx.strokeStyle = 'rgba(30, 70, 40, 0.18)';
      ctx.lineWidth   = 1;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';
      ctx.stroke(undecodedPath);
    }

    /* ── Progress cursor — vertical line at cutoff ── */
    if (cutoff > 0 && cutoff < w) {
      ctx.beginPath();
      ctx.moveTo(cutoff, baseline - 28);
      ctx.lineTo(cutoff, baseline + 28);
      ctx.strokeStyle = 'rgba(58, 160, 80, 0.35)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      /* Small diamond at cursor */
      ctx.beginPath();
      ctx.moveTo(cutoff,     baseline - 5);
      ctx.lineTo(cutoff + 4, baseline);
      ctx.lineTo(cutoff,     baseline + 5);
      ctx.lineTo(cutoff - 4, baseline);
      ctx.closePath();
      ctx.fillStyle = 'rgba(58, 160, 80, 0.5)';
      ctx.fill();
    }

    ctx.restore();
  }


  /* ── Reduced motion ── */

  function checkReducedMotion() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      stop();
      ctx.clearRect(0, 0, w, h);
      drawGrain();
      const baseline = h * WAVE.baselineY;
      ctx.beginPath();
      ctx.moveTo(0, baseline);
      ctx.lineTo(w, baseline);
      ctx.strokeStyle = 'rgba(30, 70, 40, 0.10)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
    mq.addEventListener('change', e => e.matches ? checkReducedMotion() : start());
  }


  /* ── Public API ── */

  window.Effects = {
    init: function () { init(); checkReducedMotion(); }
  };

})();