'use strict';

(function Terminal() {

  /* ============================================================
     js/terminal.js
     ZERO DRIFT — Ghost Encoding Lens

     Feature 7 — The Meridian Terminal

     Activation: type anywhere on the page (not in an input):
       CONNECT MERIDIAN   — opens the terminal
       or press  Ctrl + `  (backtick) as a shortcut

     Once open, type commands at the > prompt.
     The terminal responds with lore, redacted documents,
     transmission logs, and system messages.

     All responses are fictional. None are real Meridian data.
     That is the point.
  ============================================================ */

  let isOpen        = false;
  let inputBuffer   = '';
  let historyIndex  = -1;
  const cmdHistory  = [];


  /* ──────────────────────────────────────────────────────────
     COMMAND DATABASE
     Each entry: { response: string | string[], delay: number }
     delay = ms before response appears (simulates processing)
     Use \n for line breaks within a response string.
     Arrays are printed line by line with staggered timing.
  ────────────────────────────────────────────────────────── */

  const COMMANDS = {

    /* ── Navigation ── */
    help: {
      delay: 200,
      response: [
        '// AVAILABLE_COMMANDS',
        '─────────────────────────────────────',
        'help              — this list',
        'status            — system status',
        'whoami            — operator identity',
        'ls                — list available files',
        'cat [filename]    — read a file',
        'transmit          — view transmission log',
        'meridian          — organization overview',
        'array             — array technical specs',
        'targets           — [REDACTED]',
        'wren              — [CLASSIFIED]',
        'calder            — subject file',
        'thren             — subject file',
        'nara              — subject file',
        'sable             — subject file',
        'clear             — clear terminal',
        'disconnect        — close terminal',
        '─────────────────────────────────────',
        '// TYPE COMMAND AND PRESS ENTER',
      ]
    },

    status: {
      delay: 380,
      response: [
        '// SYSTEM_STATUS — ' + new Date().toISOString().slice(0, 10),
        '─────────────────────────────────────',
        'ARRAY_STATUS:          OFFLINE',
        'CARRIER_WAVE:          LAST_DETECTED T-6M',
        'BROADCAST_CHANNEL:     CLOSED_PERMANENT',
        'TRANSMISSION_QUEUE:    EMPTY',
        'ACTIVE_CELLS:          0',
        'CELL_VELTHAN:          DISSOLVED',
        'CELL_HARBOR:           DISSOLVED',
        'DIRECTOR_HAEL:         UNDER_REVIEW',
        'RELAY_INFRASTRUCTURE:  DECOMMISSIONED',
        '─────────────────────────────────────',
        'NOTE: This terminal is a legacy endpoint.',
        'The organization it served no longer operates.',
        'You are reading a ghost.',
      ]
    },

    whoami: {
      delay: 600,
      response: [
        '// OPERATOR_IDENTIFICATION',
        '─────────────────────────────────────',
        'SCANNING...',
        'SCANNING...',
        'IDENTITY: UNREGISTERED',
        'CLEARANCE: NONE',
        'THREAT_LEVEL: NEGLIGIBLE',
        '─────────────────────────────────────',
        'The Meridian no longer assigns threat levels.',
        'The Meridian no longer assigns anything.',
        'You found this terminal because someone',
        'left the door open on purpose.',
        'Consider why.',
      ]
    },

    ls: {
      delay: 300,
      response: [
        '// FILE_INDEX — PUBLIC_ARCHIVE',
        '─────────────────────────────────────',
        'thren_e_profile.txt          [READABLE]',
        'voss_c_profile.txt           [READABLE]',
        'osei_n_profile.txt           [READABLE]',
        'morrow_s_profile.txt         [READABLE]',
        'array_technical.txt          [READABLE]',
        'meridian_overview.txt        [READABLE]',
        'transmission_log.txt         [READABLE]',
        'tier_four_auth.txt           [REDACTED]',
        'self_causation_analysis.txt  [REDACTED]',
        'wren_identity.txt            [CLASSIFIED]',
        'broadcast_contents.txt       [INACCESSIBLE]',
        '─────────────────────────────────────',
        'Use: cat [filename without .txt]',
      ]
    },

    transmit: {
      delay: 800,
      response: [
        '// TRANSMISSION_LOG — VELTHAN_ARRAY',
        '─────────────────────────────────────',
        'T-847d  SIGNAL_RECEIVED        FRAGMENT_001',
        'T-831d  SIGNAL_RECEIVED        FRAGMENT_002',
        'T-814d  SIGNAL_RECEIVED        FRAGMENT_003',
        'T-799d  DECODE_ATTEMPT         FAILED',
        'T-788d  SIGNAL_RECEIVED        FRAGMENT_004',
        'T-760d  DECODE_ATTEMPT         PARTIAL',
        'T-744d  ARRAY_DAMAGE_DETECTED  MODULE_07',
        'T-731d  SIGNAL_RECEIVED        FRAGMENT_005',
        'T-714d  OPERATOR_DEATH         E_THREN',
        'T-714d  DEADMAN_TRIGGERED      RECORDING',
        'T-714d  GHOST_ENCODING_EVENT   DETECTED',
        'T-188d  NEW_OPERATOR           C_VOSS',
        'T-174d  FULL_DECODE            FRAGMENT_001-018',
        'T-171d  BROADCAST_INITIATED    —',
        'T-171d  CHANNEL_CLOSED         PERMANENT',
        '─────────────────────────────────────',
        'END OF LOG',
      ]
    },

    meridian: {
      delay: 500,
      response: [
        '// THE_MERIDIAN — ORGANIZATIONAL_OVERVIEW',
        '─────────────────────────────────────',
        'Founded:       Approximately 30 years prior',
        'Purpose:       Prevention of civilizational cascade',
        'Method:        Timeline intervention and correction',
        'Doctrine:      Zero Drift — elimination of variance',
        'Infrastructure: Global. Compartmentalized. Deniable.',
        'Personnel:     [REDACTED]',
        'Director:      Hael [SURNAME REDACTED]',
        '─────────────────────────────────────',
        'INTERNAL NOTE — SELF-CAUSATION ANALYSIS:',
        'Meridian interventions increased severity',
        'of target cascade by approximately 30%.',
        'Analysis commissioned by Director Hael.',
        'Analysis buried by Director Hael.',
        'Analysis recovered from broadcast package.',
        '─────────────────────────────────────',
        'The organization that built this terminal',
        'is the reason this terminal exists.',
      ]
    },

    array: {
      delay: 450,
      response: [
        '// VELTHAN_COASTAL_ARRAY — TECHNICAL_OVERVIEW',
        '─────────────────────────────────────',
        'Type:          Gravitational wave detection array',
        'Location:      Velthan coastal station, N47.3',
        'Builder:       E. Thren (independent)',
        'Construction:  7 years',
        'Sensitivity:   Beyond institutional benchmark x12',
        'Components:    Sourced 4 countries, 3 continents',
        'Power:         Independent — not grid-connected',
        'Broadcast cap: Yes — unique. No other array matches.',
        '─────────────────────────────────────',
        'RECEPTION CAPACITY: 40% (battle damage, repaired)',
        'BROADCAST STAGE:    DEACTIVATED (permanent)',
        'MODULATOR:          INTACT (shim installed)',
        'GHOST_SIGNAL:       ARCHIVED — 18/21 seconds',
        '─────────────────────────────────────',
        'Current custodian: N. Osei',
        'Research status:   ACTIVE',
      ]
    },

    thren: {
      delay: 420,
      response: [
        '// SUBJECT_FILE — THREN, ELIAS',
        '─────────────────────────────────────',
        'Age at death:  57',
        'Occupation:    Independent researcher',
        'Affiliation:   None (formerly 3 universities)',
        'Funding:       Private endowment',
        'Cover:         Advanced environmental monitoring',
        'Status:        DECEASED — T-714d',
        'Cause:         Compound B administration',
        '               [synthetic, purpose-designed]',
        '─────────────────────────────────────',
        'Threat assessment: TIER ONE (posthumous)',
        'Array status:      OPERATIONAL (his design)',
        'Ghost signal:      PRESENT IN ARCHIVE',
        '─────────────────────────────────────',
        'He built the deadman mechanism himself.',
        'He knew they were coming.',
        'He prepared for it anyway.',
        'That is the most important thing in this file.',
      ]
    },

    calder: {
      delay: 380,
      response: [
        '// SUBJECT_FILE — VOSS, CALDER',
        '─────────────────────────────────────',
        'Age:           38',
        'Occupation:    Detective, Cold Review Division',
        'Placement:     [SEE NOTE]',
        'Status:        ACTIVE — OUTSIDE MERIDIAN SCOPE',
        '─────────────────────────────────────',
        'NOTE: Voss placement in Cold Review was',
        'facilitated via anonymous tip to Commissioner Wald.',
        'Voss was not aware of this.',
        'Voss was the unmodeled variable.',
        'Voss was the thing the system could not predict',
        'because the system put him exactly where',
        'he needed to be and did not account for',
        'what he would do when he got there.',
        '─────────────────────────────────────',
        'Threat assessment: NOT APPLICABLE',
        'The Meridian does not assess threats anymore.',
      ]
    },

    nara: {
      delay: 400,
      response: [
        '// SUBJECT_FILE — OSEI, NARA',
        '─────────────────────────────────────',
        'Age:           26',
        'Occupation:    Signals engineer / researcher',
        'Affiliation:   Thren lab (inherited)',
        'Status:        ACTIVE',
        '─────────────────────────────────────',
        'Relationship to Thren: Student, then colleague.',
        'Time at station: 4 years alongside Thren.',
        '                 6 months alone after his death.',
        '─────────────────────────────────────',
        'She decoded 18 of 21 seconds of ghost signal.',
        'The last 3 seconds are below resolution threshold.',
        'She knows this. She carries it.',
        'She is continuing the work.',
        '─────────────────────────────────────',
        'Passive resonance framework: IN PROGRESS',
        'Framework paper: PUBLISHED',
        'Array custodian: CONFIRMED',
      ]
    },

    sable: {
      delay: 420,
      response: [
        '// SUBJECT_FILE — MORROW, SABLE',
        '─────────────────────────────────────',
        'Age:           34',
        'Former role:   Meridian operative',
        'Years active:  9',
        'Defection:     T-243d',
        'Status:        COOPERATING — FORMAL PROCESS',
        '─────────────────────────────────────',
        'Defection classified as:',
        '"Third error of a nine-year career."',
        'This assessment was wrong.',
        'It was not an error.',
        '─────────────────────────────────────',
        'Drive contents: 2 years operational documentation',
        'Formal statement: COMPLETE',
        'Consultative role: ACTIVE',
        'Legal position: PENDING — LIKELY FAVORABLE',
        '─────────────────────────────────────',
        'Western district. Third floor. East-facing.',
        'She stopped being in transit.',
        'That is not in any official file.',
        'It is the most important thing about her.',
      ]
    },

    wren: {
      delay: 1200,
      response: [
        '// WREN — [CLASSIFICATION: ABOVE THIS TERMINAL]',
        '─────────────────────────────────────',
        'SCANNING...',
        'SCANNING...',
        'ACCESS LEVEL: INSUFFICIENT',
        '─────────────────────────────────────',
        'What is accessible:',
        'Designation: Councillor Vael',
        'Position: Meridian Directorate, Seat 7',
        'Tenure: 15 years',
        'Status: [INACCESSIBLE]',
        '─────────────────────────────────────',
        'She built the resistance inside the organization.',
        'She used the system to dismantle the system.',
        'She transmitted backward for months',
        'through unauthorized windows.',
        'She found the secondary channel',
        'because someone unplanned was listening.',
        '─────────────────────────────────────',
        'The rest is 80 years from now.',
        'This terminal cannot reach that far.',
        'The broadcast can.',
        'The broadcast already did.',
      ]
    },

    targets: {
      delay: 700,
      response: [
        '// TIER_FOUR_AUTHORIZATIONS — [REDACTED]',
        '─────────────────────────────────────',
        '████████████████████████████████████',
        '████ AUTHORIZATION_001 ████████████',
        '████████████████████████████████████',
        '████ AUTHORIZATION_002 ████████████',
        '████████████████████████████████████',
        '████ AUTHORIZATION_003 ████████████',
        '████████████████████████████████████',
        '[63 RECORDS TOTAL — ALL REDACTED]',
        '─────────────────────────────────────',
        'These records are in the institutional archive.',
        'They were placed there by someone',
        'who used the system one last time',
        'before it stopped running.',
        '─────────────────────────────────────',
        'The deliberation record exists.',
        'The prosecutor has it.',
        'This terminal cannot give it to you.',
        'It was never meant to.',
      ]
    },

    clear: {
      delay: 0,
      response: '__CLEAR__',
    },

    disconnect: {
      delay: 300,
      response: [
        '// DISCONNECTING...',
        'CARRIER_WAVE: SILENT',
        'TERMINAL: CLOSING',
      ]
    },

  };

  /* Aliases */
  COMMANDS['cat thren_e_profile']   = COMMANDS.thren;
  COMMANDS['cat voss_c_profile']    = COMMANDS.calder;
  COMMANDS['cat osei_n_profile']    = COMMANDS.nara;
  COMMANDS['cat morrow_s_profile']  = COMMANDS.sable;
  COMMANDS['cat array_technical']   = COMMANDS.array;
  COMMANDS['cat meridian_overview'] = COMMANDS.meridian;
  COMMANDS['cat transmission_log']  = COMMANDS.transmit;


  /* ──────────────────────────────────────────────────────────
     DOM REFERENCES
  ────────────────────────────────────────────────────────── */

  let panel  = null;
  let output = null;
  let input  = null;


  /* ──────────────────────────────────────────────────────────
     OPEN / CLOSE
  ────────────────────────────────────────────────────────── */

  function open() {
    if (isOpen) return;
    isOpen = true;

    panel.removeAttribute('hidden');
    panel.setAttribute('aria-hidden', 'false');

    /* Small delay then focus input */
    setTimeout(() => input && input.focus(), 80);

    /* Print welcome message */
    printLines([
      '// MERIDIAN_TERMINAL — LEGACY_ENDPOINT',
      '// CONNECTION: ESTABLISHED',
      '// TYPE "help" FOR AVAILABLE COMMANDS',
      '─────────────────────────────────────',
    ], 0, 60);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    panel.setAttribute('hidden', '');
    panel.setAttribute('aria-hidden', 'true');
    input.value  = '';
    inputBuffer  = '';
  }

  function toggle() { isOpen ? close() : open(); }


  /* ──────────────────────────────────────────────────────────
     OUTPUT RENDERING
     Prints lines with staggered timing.
  ────────────────────────────────────────────────────────── */

  function printLine(text, className) {
    const line = document.createElement('div');
    line.className = 'terminal-line' + (className ? ' ' + className : '');
    line.textContent = text;
    output.appendChild(line);

    /* Scroll to bottom */
    output.scrollTop = output.scrollHeight;
    return line;
  }

  function printLines(lines, startDelay, lineDelay) {
    startDelay = startDelay || 0;
    lineDelay  = lineDelay  || 45;

    lines.forEach((line, i) => {
      setTimeout(() => {
        if (line === '__CLEAR__') {
          output.innerHTML = '';
          return;
        }
        const cls = line.startsWith('//') ? 'terminal-comment'
                  : line.startsWith('██') ? 'terminal-redacted'
                  : line.startsWith('─')  ? 'terminal-rule'
                  : '';
        printLine(line, cls);
        output.scrollTop = output.scrollHeight;
      }, startDelay + i * lineDelay);
    });

    return startDelay + lines.length * lineDelay;
  }

  function printCommand(cmd) {
    printLine('> ' + cmd, 'terminal-input-echo');
  }

  function printError(cmd) {
    setTimeout(() => {
      printLine('> ' + cmd, 'terminal-input-echo');
      setTimeout(() => {
        printLine('// COMMAND_NOT_RECOGNIZED: ' + cmd.toUpperCase(), 'terminal-error');
        printLine('// TYPE "help" FOR AVAILABLE COMMANDS', 'terminal-comment');
      }, 200);
    }, 0);
  }


  /* ──────────────────────────────────────────────────────────
     COMMAND PROCESSING
  ────────────────────────────────────────────────────────── */

  function processCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    /* Add to history */
    cmdHistory.unshift(cmd);
    if (cmdHistory.length > 50) cmdHistory.pop();
    historyIndex = -1;

    /* Look up command */
    const entry = COMMANDS[cmd];

    if (!entry) {
      printError(cmd);
      return;
    }

    printCommand(cmd);

    if (entry.response === '__CLEAR__') {
      setTimeout(() => { output.innerHTML = ''; }, entry.delay);
      return;
    }

    if (cmd === 'disconnect') {
      const lines = Array.isArray(entry.response)
        ? entry.response
        : [entry.response];
      setTimeout(() => {
        printLines(lines, 0, 60);
        setTimeout(close, lines.length * 60 + 500);
      }, entry.delay);
      return;
    }

    const lines = Array.isArray(entry.response)
      ? entry.response
      : [entry.response];

    setTimeout(() => {
      printLines(lines, 0, 45);
    }, entry.delay);
  }


  /* ──────────────────────────────────────────────────────────
     KEYBOARD — GLOBAL ACTIVATION
     Typing "CONNECT MERIDIAN" anywhere (not in an input)
     opens the terminal.
  ────────────────────────────────────────────────────────── */

  const ACTIVATION_PHRASE = 'connect meridian';

  function initGlobalTyping() {
    document.addEventListener('keydown', e => {
      /* Ignore if focus is in any input */
      const tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      /* Ctrl + backtick shortcut */
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        toggle();
        return;
      }

      /* Build typed buffer */
      if (e.key.length === 1) {
        inputBuffer = (inputBuffer + e.key.toLowerCase()).slice(-ACTIVATION_PHRASE.length);
        if (inputBuffer === ACTIVATION_PHRASE) {
          inputBuffer = '';
          open();
        }
      }
    });
  }


  /* ──────────────────────────────────────────────────────────
     KEYBOARD — TERMINAL INPUT
  ────────────────────────────────────────────────────────── */

  function initInputHandlers() {
    input.addEventListener('keydown', e => {

      if (e.key === 'Enter') {
        e.preventDefault();
        const val = input.value;
        input.value = '';
        processCommand(val);
        return;
      }

      /* History navigation */
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        historyIndex = Math.min(historyIndex + 1, cmdHistory.length - 1);
        if (cmdHistory[historyIndex]) input.value = cmdHistory[historyIndex];
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        historyIndex = Math.max(historyIndex - 1, -1);
        input.value = historyIndex >= 0 ? cmdHistory[historyIndex] : '';
        return;
      }

      /* Escape closes terminal */
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      /* Tab autocomplete */
      if (e.key === 'Tab') {
        e.preventDefault();
        const partial = input.value.toLowerCase().trim();
        if (!partial) return;

        const matches = Object.keys(COMMANDS).filter(k => k.startsWith(partial));
        if (matches.length === 1) {
          input.value = matches[0];
        } else if (matches.length > 1) {
          printLine('> ' + partial, 'terminal-input-echo');
          printLine(matches.join('   '), 'terminal-comment');
        }
      }
    });
  }


  /* ──────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────── */

  function init() {
    panel  = document.getElementById('terminalPanel');
    output = document.getElementById('terminalOutput');
    input  = document.getElementById('terminalInput');

    if (!panel || !output || !input) return;

    /* Close button */
    const closeBtn = document.getElementById('terminalClose');
    if (closeBtn) closeBtn.addEventListener('click', close);

    initGlobalTyping();
    initInputHandlers();
  }


  window.Terminal = {
    init:   init,
    open:   open,
    close:  close,
    toggle: toggle,
  };

})();