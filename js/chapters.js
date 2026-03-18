'use strict';

(function Chapters() {

  let current = 0;
  const dom = {};
  let sidebarOpen = false;

  /* ── Visited chapters for breadcrumb trail ── */
  const visited = new Set();

  /* ── POV color tokens (feature 5) ── */
  const POV_COLORS = {
    calder:   { rim: 'rgba(160, 200, 220, 0.18)', label: 'VOSS_POV',     class: 'pov-calder'   },
    nara:     { rim: 'rgba(58,  160,  80, 0.22)', label: 'OSEI_POV',     class: 'pov-nara'     },
    sable:    { rim: 'rgba(184, 120,  64, 0.22)', label: 'MORROW_POV',   class: 'pov-sable'    },
    juni:     { rim: 'rgba(160, 120, 200, 0.20)', label: 'CROSS_POV',    class: 'pov-juni'     },
    ensemble: { rim: 'rgba(100, 140, 110, 0.16)', label: 'MULTI_POV',    class: 'pov-ensemble' },
  };

  /* ── Ghost signal chapter triggers (feature 12) ── */
  const GHOST_CHAPTERS = new Set([7, 16, 21]);


  /* ============================================================
     TEXT PARSER
  ============================================================ */

  function parseText(raw) {
    if (!raw || !raw.trim()) return '<p>// NO_SIGNAL_DETECTED</p>';

    let text = raw.trim();
    text = text.replace(/^\*?end of chapter[^\n]*\*?$/gim, '');
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const blocks = text.split(/\n{2,}/);
    const html   = [];

    blocks.forEach(block => {
      const trimmed = block.trim();
      if (!trimmed) return;

      if (/^---+$/.test(trimmed)) {
        html.push('<div class="break"></div>');
        return;
      }

      const joined = trimmed
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .join(' ');

      if (!joined) return;

      let p = joined.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      p = p.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
      html.push('<p>' + p + '</p>');
    });

    if (!html.length) return '<p>// SIGNAL_EMPTY</p>';
    return html.join('\n');
  }


  /* ============================================================
     SIGNAL CORRUPTION (feature 2)
     Applies character-level corruption based on chapter's
     signal field (0–100). Lower signal = more corruption.
  ============================================================ */

  const CORRUPT_CHARS = '█▓▒░╳╫┼±∂∇≠≈▪▫';

  function applyCorruption(html, signalLevel) {
    /* 100 = clean, 0 = heavily corrupted */
    if (signalLevel >= 95) return html;

    /* Corruption probability per character */
    const corruptRate = (100 - signalLevel) / 100 * 0.04;

    /* Only corrupt text nodes inside <p> — not tags themselves */
    return html.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/g, (match, open, content, close) => {
      const corrupted = content.split('').map(char => {
        if (char === ' ' || char === '\n') return char;
        if (Math.random() < corruptRate) {
          return CORRUPT_CHARS[Math.floor(Math.random() * CORRUPT_CHARS.length)];
        }
        return char;
      }).join('');
      return open + corrupted + close;
    });
  }


  /* ============================================================
     JUNI STATIC GLITCH (feature 6)
     Adds faint glitch spans to Juni POV chapters.
  ============================================================ */

  function applyJuniGlitch(html) {
    /* Randomly wrap ~3% of words in a glitch span */
    return html.replace(/\b(\w{4,})\b/g, word => {
      if (Math.random() < 0.03) {
        return '<span class="juni-glitch">' + word + '</span>';
      }
      return word;
    });
  }


  /* ============================================================
     POV LENS COLOR (feature 5)
     Updates the CSS custom property that lens.css reads
     for the lens rim color.
  ============================================================ */

  function applyPOVLens(pov) {
    const config = POV_COLORS[pov] || POV_COLORS.ensemble;
    document.documentElement.style.setProperty('--c-lens-rim', config.rim);

    /* Update POV label in header */
    if (dom.povLabel) dom.povLabel.textContent = '// ' + config.label;

    /* Remove all pov classes, add current */
    document.body.classList.remove(
      'pov-calder', 'pov-nara', 'pov-sable', 'pov-juni', 'pov-ensemble'
    );
    document.body.classList.add(config.class);
  }


  /* ============================================================
     SIGNAL BAR (feature 3 partial — header display)
  ============================================================ */

  function updateSignalBar(signalLevel) {
    if (!dom.signalBar) return;
    const filled = Math.round(signalLevel / 100 * 6);
    const bar    = '█'.repeat(filled) + '░'.repeat(6 - filled);
    dom.signalBar.textContent = 'SIGNAL: ' + bar + ' ' + signalLevel + '%';
  }


  /* ============================================================
     WAVEFORM PROGRESS (feature 3)
     Tells effects.js how far through the story we are.
     effects.js reads window.READING_PROGRESS (0–1).
  ============================================================ */

  function updateWaveformProgress(index) {
    window.READING_PROGRESS = index / (CHAPTERS.length - 1);
  }


  /* ============================================================
     BREADCRUMB TRAIL (feature 15)
     Marks visited chapters in the sidebar list.
  ============================================================ */

  function updateBreadcrumb(index) {
    visited.add(index);

    dom.chapterList.querySelectorAll('.chapter-item').forEach((item, i) => {
      item.classList.toggle('visited', visited.has(i));
      item.classList.toggle('active',  i === index);
    });
  }


  /* ============================================================
     GHOST SIGNAL TRIGGER (feature 12)
     Fires window.GhostSignal.trigger() if available
     and this chapter is a ghost chapter.
  ============================================================ */

  function maybeFireGhost(chapterId) {
  if (!GHOST_CHAPTERS.has(chapterId)) return;
  if (window.GhostSignal && typeof window.GhostSignal.trigger === 'function') {
    window.GHOST_CHAPTER_ID = chapterId;
    setTimeout(() => window.GhostSignal.trigger(), 1800);
  }
}


  /* ============================================================
     MAIN RENDER
  ============================================================ */

  function render(index) {
    if (index < 0 || index >= CHAPTERS.length) return;

    const chapter = CHAPTERS[index];
    current = index;

    Lens.cleanupTapReveal();

    /* ── Header ── */
    dom.fragment.textContent = '// ' + chapter.fragment;
    dom.title.textContent    = chapter.title;

    /* ── Matters block ── */
    if (chapter.matters && chapter.matters.trim()) {
      dom.mattersText.textContent = chapter.matters;
      dom.mattersBlock.removeAttribute('hidden');
    } else {
      dom.mattersBlock.setAttribute('hidden', '');
    }

    /* ── Parse + process text ── */
    const signalLevel = chapter.signal !== undefined ? chapter.signal : 90;
    const pov         = chapter.pov    || 'ensemble';

    let html = parseText(chapter.text);
    html = applyCorruption(html, signalLevel);
    if (pov === 'juni') html = applyJuniGlitch(html);

    /* ── Render with fade re-trigger ── */
    dom.novelText.style.animation = 'none';
    void dom.novelText.offsetHeight;
    dom.novelText.style.animation = '';
    dom.novelText.innerHTML = html;

    /* ── Apply POV system ── */
    applyPOVLens(pov);

    /* Coffee maker chapter-30 class */
    document.body.classList.toggle('chapter-30', chapter.id === 30);

    updateSignalBar(signalLevel);

    /* Signal animations (signal.js) */
    if (window.Signal) {
      const povConfig = POV_COLORS[pov] || POV_COLORS.ensemble;
      Signal.setLevel(signalLevel, povConfig.label);
    }

    /* ── Navigation ── */
    dom.prevBtn.disabled      = (index === 0);
    dom.nextBtn.disabled      = (index === CHAPTERS.length - 1);
    dom.navCounter.textContent =
      String(index + 1).padStart(2, '0') + ' / ' +
      String(CHAPTERS.length).padStart(2, '0');

    /* ── Waveform progress ── */
    updateWaveformProgress(index);

    /* ── Breadcrumb ── */
    updateBreadcrumb(index);

    /* ── Ghost signal ── */
    maybeFireGhost(chapter.id);

    /* ── Scroll ── */
    window.scrollTo({ top: 0, behavior: 'smooth' });
    Lens.initTapReveal();

    if (window.innerWidth < 768) closeSidebar();
  }


  /* ============================================================
     TIMELINE SIDEBAR BUILDER (feature 14)
     Replaces the flat chapter list with an act-structured
     timeline. Each act has a header and signal-spike markers.
  ============================================================ */

  const ACT_BREAKS = {
    0:  { label: 'ACT I',   sub: 'THE_SIGNAL_IN_THE_NOISE' },
    8:  { label: 'ACT II',  sub: 'DRIFT_ACCUMULATION'       },
    24: { label: 'ACT III', sub: 'CHOSEN_DRIFT'             },
  };

  /* Key events shown as spike markers on the timeline */
  const KEY_EVENTS = {
    2:  '// EQUIPMENT_LOGS',
    6:  '// COMPOUND_B',
    7:  '// FIRST_FRAGMENT',
    13: '// CARRIER_DETECTED',
    15: '// ROOK',
    16: '// WREN_MIDPOINT',
    17: '// PASSENGER',
    21: '// WREN_SPEAKS',
    25: '// ZERO_HOUR',
    28: '// BROADCAST',
    30: '// AFTERIMAGE',
  };

  function buildSidebar() {
    if (!CHAPTERS || !CHAPTERS.length) {
      dom.chapterList.innerHTML =
        '<li style="padding:1rem;font-size:0.6rem;color:#3a4a3c">// NO_CHAPTERS_LOADED</li>';
      return;
    }

    const frag = document.createDocumentFragment();

    CHAPTERS.forEach((chapter, index) => {

      /* Act header */
      if (ACT_BREAKS[index]) {
        const actLi = document.createElement('li');
        actLi.className = 'act-header';
        actLi.innerHTML =
          '<span class="act-label">' + ACT_BREAKS[index].label + '</span>' +
          '<span class="act-sub">'   + ACT_BREAKS[index].sub   + '</span>';
        frag.appendChild(actLi);
      }

      /* Chapter item */
      const li = document.createElement('li');
      li.className = 'chapter-item';
      li.setAttribute('role',       'button');
      li.setAttribute('tabindex',   '0');
      li.setAttribute('aria-label', 'Chapter ' + chapter.id + ': ' + chapter.title);
      li.dataset.index = index;

      /* Signal spike indicator */
      const signalLevel = chapter.signal !== undefined ? chapter.signal : 90;
      const spikeHeight = Math.round((100 - signalLevel) / 100 * 18) + 4;

      /* Key event tag */
      const eventTag = KEY_EVENTS[chapter.id]
        ? '<span class="chapter-event">' + KEY_EVENTS[chapter.id] + '</span>'
        : '';

      /* POV dot */
      const pov = chapter.pov || 'ensemble';

      li.innerHTML =
        '<div class="chapter-item-row">' +
          '<span class="pov-dot pov-dot--' + pov + '"></span>' +
          '<span class="chapter-item-num">// ' + chapter.fragment + '</span>' +
          '<span class="chapter-spike" style="height:' + spikeHeight + 'px"></span>' +
        '</div>' +
        '<span class="chapter-item-title">' + chapter.title + '</span>' +
        eventTag;

      li.addEventListener('click',   () => render(index));
      li.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          render(index);
        }
      });

      frag.appendChild(li);
    });

    dom.chapterList.appendChild(frag);
  }


  /* ============================================================
     NAVIGATION
  ============================================================ */

  function goNext() { if (current < CHAPTERS.length - 1) render(current + 1); }
  function goPrev() { if (current > 0) render(current - 1); }

  function initNavigation() {
    dom.prevBtn.addEventListener('click', goPrev);
    dom.nextBtn.addEventListener('click', goNext);

    document.addEventListener('keydown', e => {
      if (sidebarOpen)                  return;
      if (e.target.tagName === 'INPUT') return;

      const intro = document.getElementById('introScreen');
      if (intro && !intro.classList.contains('dismissed')) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault(); goNext(); break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault(); goPrev(); break;
        case 'j': goNext(); break;
        case 'k': goPrev(); break;
      }
    });
  }


  /* ============================================================
     SIDEBAR
  ============================================================ */

  function openSidebar()  {
    sidebarOpen = true;
    dom.sidebar.classList.add('open');
    dom.sidebarTab.setAttribute('aria-expanded', 'true');
    dom.sidebarClose.focus();
  }

  function closeSidebar() {
    sidebarOpen = false;
    dom.sidebar.classList.remove('open');
    dom.sidebarTab.setAttribute('aria-expanded', 'false');
  }

  function toggleSidebar() { sidebarOpen ? closeSidebar() : openSidebar(); }

  function initSidebar() {
    dom.sidebarTab.addEventListener('click', toggleSidebar);
    dom.sidebarClose.addEventListener('click', closeSidebar);

    document.addEventListener('click', e => {
      if (!sidebarOpen)                      return;
      if (dom.sidebar.contains(e.target))    return;
      if (dom.sidebarTab.contains(e.target)) return;
      closeSidebar();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sidebarOpen) {
        closeSidebar();
        dom.sidebarTab.focus();
      }
    });
  }


  /* ============================================================
     CASE FILE MODE TOGGLE (feature 10)
     Toggled by a button added in index.html.
  ============================================================ */

  function initCaseFileToggle() {
    const btn = document.getElementById('caseFileBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const active = document.body.classList.toggle('case-file-mode');
      btn.textContent = active ? '// EXIT_CASE_FILE' : '// CASE_FILE_MODE';
      btn.classList.toggle('active', active);
    });
  }


  /* ============================================================
     DOM CACHE
  ============================================================ */

  function cacheDom() {
    dom.fragment     = document.getElementById('chapterFragment');
    dom.title        = document.getElementById('chapterTitle');
    dom.mattersBlock = document.getElementById('mattersBlock');
    dom.mattersText  = document.getElementById('mattersText');
    dom.novelText    = document.getElementById('novelText');
    dom.prevBtn      = document.getElementById('prevBtn');
    dom.nextBtn      = document.getElementById('nextBtn');
    dom.navCounter   = document.getElementById('navCounter');
    dom.chapterList  = document.getElementById('chapterList');
    dom.sidebar      = document.getElementById('sidebar');
    dom.sidebarTab   = document.getElementById('sidebarTab');
    dom.sidebarClose = document.getElementById('sidebarClose');
    dom.signalBar    = document.getElementById('chapterSignalBar');
    dom.povLabel     = document.getElementById('povLabel');
  }


  /* ============================================================
     INIT
  ============================================================ */

  function init() {
    cacheDom();

    if (!window.CHAPTERS || !window.CHAPTERS.length) {
      console.warn('ZERO DRIFT: No chapter data found.');
      return;
    }

    buildSidebar();
    initNavigation();
    initSidebar();
    initCaseFileToggle();
    render(0);
  }


  /* ============================================================
     PUBLIC API
  ============================================================ */

  window.Chapters = {
    init:    init,
    render:  render,
    next:    goNext,
    prev:    goPrev,
    current: () => current,
  };

})();