'use strict';

(function MapModule() {

  /* ============================================================
     js/map.js
     ZERO DRIFT — Ghost Encoding Lens

     Feature 9 — The Velthan Coastal Array Map

     A pure SVG map of the Velthan coastline drawn entirely
     in JavaScript. No image files. No external assets.

     Locations on the map:
       1. The Coastal Array (Thren's lab)
       2. Velthan City Center
       3. Industrial Harbor
       4. The Shelf (cliff path)
       5. Harbor District Facility
       6. Cold Review Division
       7. Signal Origin Point (open sea)
       8. The Meridian Cell (redacted)

     Hovering/tapping a location reveals its dossier
     in the info panel below the map.
  ============================================================ */

  let isOpen = false;

  /* ──────────────────────────────────────────────────────────
     LOCATION DATA
     x, y = percentage coordinates within the SVG viewBox
     status: readable | redacted | classified
  ────────────────────────────────────────────────────────── */

  const LOCATIONS = [
    {
      id:     'array',
      label:  'COASTAL_ARRAY',
      x:      18,
      y:      32,
      status: 'readable',
      type:   'primary',
      info: [
        '// VELTHAN_COASTAL_ARRAY',
        'Classification: Research facility',
        'Operator: E. Thren (deceased)',
        '         N. Osei (current)',
        'Status: ACTIVE — research ongoing',
        '─────────────────────',
        'The array sits on a wedge of rock',
        '3km north of the industrial harbor.',
        'Built over 7 years. Invisible to',
        'institutional radar. That was the point.',
        '─────────────────────',
        'The broadcast originated here.',
        'The ghost signal is archived here.',
        'The work continues here.',
      ]
    },
    {
      id:     'city',
      label:  'VELTHAN_CITY',
      x:      62,
      y:      48,
      status: 'readable',
      type:   'secondary',
      info: [
        '// VELTHAN_CITY_CENTER',
        'Population: ~2.1 million (2051)',
        'Administrative center: N district',
        'Cold Review Division: N wing, dept bldg',
        '─────────────────────',
        'The city the Meridian managed for 30 years.',
        'The city that did not know it was managed.',
        'The city that is now learning.',
        '─────────────────────',
        'Prosecutor office: ACTIVE — subpoenas filed',
        'Professional Standards: REVIEW ONGOING',
        'Commissioner Wald: INSTITUTIONAL ACCOUNTABILITY',
      ]
    },
    {
      id:     'harbor',
      label:  'INDUSTRIAL_HARBOR',
      x:      52,
      y:      68,
      status: 'readable',
      type:   'secondary',
      info: [
        '// INDUSTRIAL_HARBOR — VELTHAN',
        'Function: Commercial logistics hub',
        'Meridian use: Cover infrastructure',
        'Shell company registered: Varren Analytical',
        '─────────────────────',
        'The harbor district facility operated',
        'for 7 years under commercial cover.',
        'Deregistered following investigation.',
        'Evidence: INTACT and in formal record.',
        '─────────────────────',
        'Harbor district facility: DISSOLVED',
        'Varren Analytical Services: DEREGISTERED',
      ]
    },
    {
      id:     'shelf',
      label:  'THE_SHELF',
      x:      14,
      y:      45,
      status: 'readable',
      type:   'tertiary',
      info: [
        '// THE_SHELF — COASTAL_OUTCROP',
        'Location: Below array station, seaward',
        'Access: Below-grade store, seaward door',
        '─────────────────────',
        'The overhang where Sable watched the water.',
        'Where Calder ran the perimeter at 5am.',
        'Where they stood with tea in the early morning',
        'and looked at the navigational buoy.',
        '─────────────────────',
        'The bottleneck: service road above.',
        'Rook pre-staged on the cliff path below.',
        '73 seconds. Then he withdrew.',
        'The shelf held.',
      ]
    },
    {
      id:     'harbor-facility',
      label:  'HARBOR_FACILITY',
      x:      48,
      y:      72,
      status: 'redacted',
      type:   'warning',
      info: [
        '// HARBOR_DISTRICT_FACILITY',
        'Classification: [REDACTED]',
        'Operator: [REDACTED]',
        'Status: DISSOLVED — evidence intact',
        '─────────────────────',
        'Communication relay: confirmed automated',
        'Last cycle: final before power-down',
        'That last cycle produced the review',
        'that validated the investigation.',
        '─────────────────────',
        'The system did what it was built to do.',
        'Past the point where doing it correctly',
        'was still doing it right.',
      ]
    },
    {
      id:     'cold-review',
      label:  'COLD_REVIEW_DIV',
      x:      68,
      y:      40,
      status: 'readable',
      type:   'tertiary',
      info: [
        '// COLD REVIEW DIVISION',
        'Department: Velthan PD, N wing',
        'Function: Reopening stalled cases',
        'Staffing: Small. Underfunded.',
        '─────────────────────',
        'A cold case in Cold Review',
        'was assigned through standard process',
        'to the available detective.',
        '─────────────────────',
        'The Meridian did not model this.',
        'They managed the commissioner.',
        'They transferred Morse to Selvarth.',
        'They did not account for Cold Review.',
        'They did not account for Voss.',
      ]
    },
    {
      id:     'signal-origin',
      label:  'SIGNAL_ORIGIN',
      x:      8,
      y:      18,
      status: 'classified',
      type:   'signal',
      info: [
        '// SIGNAL_ORIGIN — OPEN_SEA',
        'Classification: ABOVE THIS TERMINAL',
        '─────────────────────',
        'The transmissions originate from',
        'approximately 80 years forward.',
        'The carrier wave propagates backward',
        'through the gravitational medium.',
        '─────────────────────',
        'The array receives.',
        'The array received.',
        'The broadcast sent forward.',
        '─────────────────────',
        'Past Neptune now.',
        'Moving at the speed of light.',
        'It will arrive.',
      ]
    },
    {
      id:     'meridian-cell',
      label:  'MERIDIAN_CELL',
      x:      72,
      y:      62,
      status: 'redacted',
      type:   'warning',
      info: [
        '// MERIDIAN_CELL — VELTHAN',
        'Location: [REDACTED]',
        'Personnel: [REDACTED]',
        'Status: DISSOLVED',
        '─────────────────────',
        '████████████████████████',
        '████ RECORDS SEALED ████',
        '████████████████████████',
        '─────────────────────',
        'The deliberation records exist.',
        'The prosecutor has them.',
        'All 63 tier-four authorizations.',
        'The full anatomy of how it was decided.',
      ]
    },
  ];


  /* ──────────────────────────────────────────────────────────
     SVG BUILDER
     Constructs the map SVG entirely from JavaScript.
     No SVG markup in the HTML.
  ────────────────────────────────────────────────────────── */

  function buildSVG() {
    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');

    svg.setAttribute('viewBox',     '0 0 100 80');
    svg.setAttribute('xmlns',       ns);
    svg.setAttribute('class',       'map-svg');
    svg.setAttribute('aria-label',  'Velthan coastal map');
    svg.setAttribute('role',        'img');

    /* ── Sea background ── */
    const sea = document.createElementNS(ns, 'rect');
    sea.setAttribute('x',      '0');
    sea.setAttribute('y',      '0');
    sea.setAttribute('width',  '100');
    sea.setAttribute('height', '80');
    sea.setAttribute('fill',   'rgba(8, 16, 14, 0.95)');
    svg.appendChild(sea);

    /* ── Grid overlay ── */
    const defs = document.createElementNS(ns, 'defs');

    const pattern = document.createElementNS(ns, 'pattern');
    pattern.setAttribute('id',           'mapGrid');
    pattern.setAttribute('width',        '10');
    pattern.setAttribute('height',       '10');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');

    const gridLineH = document.createElementNS(ns, 'path');
    gridLineH.setAttribute('d',       'M 10 0 L 0 0 0 10');
    gridLineH.setAttribute('fill',    'none');
    gridLineH.setAttribute('stroke',  'rgba(30, 55, 35, 0.18)');
    gridLineH.setAttribute('stroke-width', '0.2');
    pattern.appendChild(gridLineH);
    defs.appendChild(pattern);
    svg.appendChild(defs);

    const gridRect = document.createElementNS(ns, 'rect');
    gridRect.setAttribute('width',  '100');
    gridRect.setAttribute('height', '80');
    gridRect.setAttribute('fill',   'url(#mapGrid)');
    svg.appendChild(gridRect);

    /* ── Coastline path ──
       An abstract geometric coastline — not geographically
       accurate, deliberately stylized and brutalist.
    ── */
    const coast = document.createElementNS(ns, 'path');
    coast.setAttribute('d', [
      'M 0 0',
      'L 100 0',
      'L 100 80',
      'L 65 80',
      'L 60 72',
      'L 55 70',
      'L 45 74',
      'L 38 70',
      'L 35 65',
      'L 28 62',
      'L 22 58',
      'L 20 52',
      'L 16 48',
      'L 12 42',
      'L 10 36',
      'L 8  28',
      'L 6  20',
      'L 0  15',
      'Z'
    ].join(' '));

    coast.setAttribute('fill',         'rgba(12, 20, 15, 0.85)');
    coast.setAttribute('stroke',       'rgba(45, 90, 55, 0.45)');
    coast.setAttribute('stroke-width', '0.4');
    svg.appendChild(coast);

    /* ── Land label ── */
    const landLabel = document.createElementNS(ns, 'text');
    landLabel.setAttribute('x',           '70');
    landLabel.setAttribute('y',           '25');
    landLabel.setAttribute('font-size',   '2.8');
    landLabel.setAttribute('fill',        'rgba(45, 74, 51, 0.30)');
    landLabel.setAttribute('font-family', 'monospace');
    landLabel.setAttribute('letter-spacing', '0.3');
    landLabel.textContent = 'VELTHAN';
    svg.appendChild(landLabel);

    /* ── Sea label ── */
    const seaLabel = document.createElementNS(ns, 'text');
    seaLabel.setAttribute('x',           '3');
    seaLabel.setAttribute('y',           '72');
    seaLabel.setAttribute('font-size',   '2.2');
    seaLabel.setAttribute('fill',        'rgba(30, 60, 45, 0.25)');
    seaLabel.setAttribute('font-family', 'monospace');
    seaLabel.setAttribute('letter-spacing', '0.2');
    seaLabel.textContent = 'NORTH ATLANTIC';
    svg.appendChild(seaLabel);

    /* ── Wave rings emanating from signal origin ── */
    [14, 20, 26].forEach((r, i) => {
      const ring = document.createElementNS(ns, 'circle');
      ring.setAttribute('cx',             '8');
      ring.setAttribute('cy',             '18');
      ring.setAttribute('r',              String(r));
      ring.setAttribute('fill',           'none');
      ring.setAttribute('stroke',         'rgba(45, 120, 60, 0.07)');
      ring.setAttribute('stroke-width',   '0.3');
      ring.setAttribute('class',          'map-wave-ring');
      ring.style.animationDelay          = (i * 0.8) + 's';
      svg.appendChild(ring);
    });

    /* ── Location markers ── */
    LOCATIONS.forEach(loc => {
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('class',          'map-location map-location--' + loc.type);
      g.setAttribute('data-id',        loc.id);
      g.setAttribute('tabindex',       '0');
      g.setAttribute('role',           'button');
      g.setAttribute('aria-label',     loc.label);
      g.style.cursor = 'pointer';

      /* Outer pulse ring */
      const pulse = document.createElementNS(ns, 'circle');
      pulse.setAttribute('cx',           String(loc.x));
      pulse.setAttribute('cy',           String(loc.y));
      pulse.setAttribute('r',            '3.5');
      pulse.setAttribute('fill',         'none');
      pulse.setAttribute('class',        'map-pulse');

      /* Main dot */
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx',   String(loc.x));
      dot.setAttribute('cy',   String(loc.y));
      dot.setAttribute('r',    loc.type === 'primary' ? '1.8' : '1.2');
      dot.setAttribute('class', 'map-dot');

      /* Crosshair lines */
      const crossH = document.createElementNS(ns, 'line');
      crossH.setAttribute('x1',           String(loc.x - 3));
      crossH.setAttribute('y1',           String(loc.y));
      crossH.setAttribute('x2',           String(loc.x + 3));
      crossH.setAttribute('y2',           String(loc.y));
      crossH.setAttribute('class',        'map-cross');

      const crossV = document.createElementNS(ns, 'line');
      crossV.setAttribute('x1',           String(loc.x));
      crossV.setAttribute('y1',           String(loc.y - 3));
      crossV.setAttribute('x2',           String(loc.x));
      crossV.setAttribute('y2',           String(loc.y + 3));
      crossV.setAttribute('class',        'map-cross');

      /* Label */
      const label = document.createElementNS(ns, 'text');
      const labelX = loc.x > 50 ? loc.x - 2 : loc.x + 2;
      const anchor = loc.x > 50 ? 'end' : 'start';
      label.setAttribute('x',            String(labelX));
      label.setAttribute('y',            String(loc.y - 2.5));
      label.setAttribute('font-size',    '2');
      label.setAttribute('font-family',  'monospace');
      label.setAttribute('text-anchor',  anchor);
      label.setAttribute('class',        'map-label');
      label.textContent = loc.label;

      /* Status indicator */
      if (loc.status === 'redacted') {
        label.setAttribute('class', 'map-label map-label--redacted');
      } else if (loc.status === 'classified') {
        label.setAttribute('class', 'map-label map-label--classified');
        label.textContent = '[CLASSIFIED]';
      }

      g.appendChild(pulse);
      g.appendChild(crossH);
      g.appendChild(crossV);
      g.appendChild(dot);
      g.appendChild(label);

      /* Interaction — click/tap only, no hover */
      g.addEventListener('click',     () => showInfo(loc));
      g.addEventListener('keydown',   e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showInfo(loc);
        }
      });

      svg.appendChild(g);
    });

    return svg;
  }


  /* ──────────────────────────────────────────────────────────
     INFO PANEL
  ────────────────────────────────────────────────────────── */

  let activeLocation = null;

  function showInfo(loc) {
    activeLocation = loc;
    const label    = document.getElementById('mapInfoText');
    if (!label) return;

    /* Clear previous */
    label.innerHTML = '';

    loc.info.forEach((line, i) => {
      setTimeout(() => {
        const span = document.createElement('span');
        span.className = 'map-info-line';

        if (line.startsWith('//')) {
          span.classList.add('map-info-comment');
        } else if (line.startsWith('█')) {
          span.classList.add('map-info-redacted');
        } else if (line.startsWith('─')) {
          span.classList.add('map-info-rule');
        }

        span.textContent = line;
        label.appendChild(span);
        label.appendChild(document.createElement('br'));
      }, i * 35);
    });

    /* Update active marker */
    document.querySelectorAll('.map-location').forEach(el => {
      el.classList.toggle('map-location--active', el.dataset.id === loc.id);
    });
  }


  /* ──────────────────────────────────────────────────────────
     OPEN / CLOSE
  ────────────────────────────────────────────────────────── */

  function createBackdrop() {
    let backdrop = document.getElementById('mapBackdrop');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.id        = 'mapBackdrop';
    backdrop.className = 'map-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    /* Clicking backdrop closes the map */
    backdrop.addEventListener('click', close);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function open() {
    if (isOpen) return;
    isOpen = true;

    const panel    = document.getElementById('mapPanel');
    const backdrop = createBackdrop();
    if (!panel) return;

    backdrop.style.display = '';
    panel.removeAttribute('hidden');
    panel.setAttribute('aria-hidden', 'false');
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    const panel    = document.getElementById('mapPanel');
    const backdrop = document.getElementById('mapBackdrop');
    if (!panel) return;

    if (backdrop) backdrop.style.display = 'none';
    panel.setAttribute('hidden', '');
    panel.setAttribute('aria-hidden', 'true');
  }

  function toggle() { isOpen ? close() : open(); }


  /* ──────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────── */

  function init() {
    const canvas  = document.getElementById('mapCanvas');
    const mapBtn  = document.getElementById('mapBtn');
    const closeBtn = document.getElementById('mapClose');

    if (!canvas) return;

    /* Build and inject the SVG */
    const svg = buildSVG();
    canvas.appendChild(svg);

    /* Show first location info by default */
    showInfo(LOCATIONS[0]);

    /* Button handlers */
    if (mapBtn)   mapBtn.addEventListener('click',   toggle);
    if (closeBtn) closeBtn.addEventListener('click',  close);

    /* Escape closes map */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) close();
    });
  }


  window.MapModule = {
    init:   init,
    open:   open,
    close:  close,
    toggle: toggle,
  };

})();