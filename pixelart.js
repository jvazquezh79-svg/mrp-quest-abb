/* ==========================================================================
   MRP Quest · Motor de pixel art estilo SNES (Final Fantasy VI)
   --------------------------------------------------------------------------
   Todo el arte se define aquí como texto (un carácter = un píxel) y se
   rasteriza a canvas al cargar. No hay imágenes externas: el juego sigue
   siendo un sitio estático sin dependencias.

   Resolución interna: 480×270 px (escala 0.5 sobre el mundo de 1920×1080),
   ampliada por CSS con image-rendering: pixelated. Tile = 16 px = 32 unidades
   de mundo. Sprites de personaje = 16×24 px, como en FF6.
   ========================================================================== */
(function (global) {
  'use strict';

  const K = 0.5;          // unidades de mundo -> píxeles de render
  const TILE = 16;        // píxeles de render por tile
  const RW = 480, RH = 270;

  /* ---------------- utilidades ---------------- */
  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function ctxOf(c) { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return g; }
  function assertRows(rows, w, name) {
    rows.forEach((r, i) => { if (r.length !== w) throw new Error(`PixelArt: "${name}" fila ${i} mide ${r.length}, se esperaban ${w}: "${r}"`); });
  }
  /** Rasteriza filas de texto con una paleta {char: color}. '.' y ' ' = transparente. */
  function raster(rows, palette, name = 'sprite') {
    const w = rows[0].length, h = rows.length; assertRows(rows, w, name);
    const c = makeCanvas(w, h), g = ctxOf(c);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x]; if (ch === '.' || ch === ' ') continue;
      const col = palette[ch]; if (!col) throw new Error(`PixelArt: "${name}" usa el carácter "${ch}" sin color en la paleta`);
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
    return c;
  }
  /** Superpone capas de texto (la última gana) y devuelve filas nuevas. */
  function overlay(base, ...layers) {
    const out = base.map(r => r.split(''));
    layers.forEach(l => { if (!l) return; l.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') out[y][x] = row[x]; }); });
    return out.map(r => r.join(''));
  }
  function flipRows(rows) { return rows.map(r => r.split('').reverse().join('')); }
  function flipCanvas(c) { const o = makeCanvas(c.width, c.height), g = ctxOf(o); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }

  /* ==========================================================================
     FUENTE BITMAP 5×7 (mayúsculas, dígitos, acentos y signos básicos)
     ========================================================================== */
  const GLYPHS = {
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    'C': ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
    'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    'G': ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.####'],
    'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'I': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
    'J': ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    'M': ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    'N': ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    'W': ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
    'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    'Á': ['..#..', '.###.', '#...#', '#####', '#...#', '#...#', '#...#'],
    'É': ['..#..', '#####', '#....', '####.', '#....', '#....', '#####'],
    'Í': ['..#..', '#####', '..#..', '..#..', '..#..', '..#..', '#####'],
    'Ó': ['..#..', '.###.', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'Ú': ['..#..', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'Ñ': ['.#.#.', '#.#..', '#...#', '##..#', '#.#.#', '#..##', '#...#'],
    'Ü': ['.#.#.', '.....', '#...#', '#...#', '#...#', '#...#', '.###.'],
    '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
    ',': ['.....', '.....', '.....', '.....', '.##..', '..#..', '.#...'],
    ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
    '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    '·': ['.....', '.....', '.....', '.##..', '.##..', '.....', '.....'],
    "'": ['.##..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
    '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
    '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
    ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
    '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '#.##.', '#..##'],
    '[': ['.###.', '.#...', '.#...', '.#...', '.#...', '.#...', '.###.'],
    ']': ['.###.', '...#.', '...#.', '...#.', '...#.', '...#.', '.###.'],
    '#': ['.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.....'],
    '&': ['.##..', '#..#.', '.##..', '.#...', '#.#.#', '#..#.', '.##.#'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  };
  const glyphCache = new Map();
  function glyph(ch, color) {
    const key = ch + '|' + color; if (glyphCache.has(key)) return glyphCache.get(key);
    const rows = GLYPHS[ch] || GLYPHS['?'];
    const c = raster(rows, { '#': color }, 'glyph ' + ch); glyphCache.set(key, c); return c;
  }
  function normalizeText(str) {
    return String(str ?? '').toUpperCase().replace(/[ÀÂÄ]/g, 'Á').replace(/[ÈÊË]/g, 'É').replace(/[ÌÎÏ]/g, 'Í').replace(/[ÒÔÖ]/g, 'Ó').replace(/[ÙÛ]/g, 'Ú').replace(/[“”"]/g, "'").replace(/[^A-Z0-9ÁÉÍÓÚÑÜ.,:\/\-·'!?()+%\[\]#& ]/g, '');
  }
  function textWidth(str) { return normalizeText(str).length * 6 - 1; }
  /** Dibuja texto bitmap con sombra de 1 px (estilo FF6). align: left|center|right */
  function drawText(g, str, x, y, color = '#f8f8f8', opts = {}) {
    const s = normalizeText(str), w = s.length * 6 - 1; const align = opts.align || 'left';
    let x0 = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x); const y0 = Math.round(y);
    const shadow = opts.shadow === undefined ? '#101426' : opts.shadow;
    if (shadow) for (let i = 0; i < s.length; i++) g.drawImage(glyph(s[i], shadow), x0 + i * 6 + 1, y0 + 1);
    for (let i = 0; i < s.length; i++) g.drawImage(glyph(s[i], color), x0 + i * 6, y0);
    return w;
  }

  /* ==========================================================================
     PERSONAJES 16×24 · plantilla compartida (FF6 usa el mismo esqueleto)
     Leyenda: o contorno · h/H cabello claro/oscuro · s/S piel/sombra · w/e ojo brillo/pupila
              c/C/l abrigo/oscuro/claro · k cuello · t acento · p/P pantalón · b botas
     ========================================================================== */
  const HEAD_DOWN = [
    '....oooooooo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhHhhhhHhho..',
    '..oHhsssssshHo..',
    '..oHssssssssHo..',
    '..oswessssweso..',
    '..oseesssseeso..',
    '..oSssssssssSo..',
    '...oSSssssSSo...',
    '.....oSSSSo.....',
  ];
  const BODY_DOWN_IDLE = [
    '...ooccccccoo...',
    '..olcccttcccCo..',
    '..olcccttcccCo..',
    '..olccccccccCo..',
    '..osCccccccCso..',
    '...oPppppppPo...',
    '...oPppppppPo...',
    '...oPppooppPo...',
    '...obbboobbbo...',
    '...obbboobbbo...',
    '...oooooooooo...',
  ];
  const BODY_DOWN_WALK = [
    '...ooccccccoo...',
    '..olcccttcccCo..',
    '..olcccttcccCo..',
    '..osccccccccCo..',
    '..oCCccccccCso..',
    '...oPppppppPo...',
    '...oPppppppPo...',
    '...oPppooppPo...',
    '...obbboobbbo...',
    '...obbboooooo...',
    '...ooooo........',
  ];
  const HEAD_SIDE = [
    '....oooooooo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhHsssso..',
    '..ohhhhhssssso..',
    '..ohhhhhssweso..',
    '..ohhhhhsseeso..',
    '..oHhhhhSsssso..',
    '...ohhhSssSo....',
    '.....oSSSSo.....',
  ];
  const BODY_SIDE_IDLE = [
    '....ooccccoo....',
    '...olccccccCo...',
    '...olccccccCo...',
    '...olcccoccCo...',
    '...oCcccoscCo...',
    '....oPpppppo....',
    '....oPpppppo....',
    '....oPpppppo....',
    '....obbobbbo....',
    '....obbobbbo....',
    '....oooooooo....',
  ];
  const BODY_SIDE_WALK_A = [
    '....ooccccoo....',
    '...olccccccCo...',
    '...olcccccoCo...',
    '...olccccosCo...',
    '...oCccccccCo...',
    '....oPpppppo....',
    '....oPpppppo....',
    '...oPpppppppo...',
    '...obbboobbbo...',
    '...obbbo.obbbo..',
    '...ooooo.ooooo..',
  ];
  const BODY_SIDE_WALK_B = [
    '....ooccccoo....',
    '...olccccccCo...',
    '...olccccccCo...',
    '...olcccoccCo...',
    '...oCcccosCCo...',
    '....oPpppppo....',
    '....oPpppppo....',
    '.....oPpppo.....',
    '.....obbbbo.....',
    '.....obbbbo.....',
    '.....oooooo.....',
  ];
  const HEAD_UP = [
    '....oooooooo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..oHhhhhhhhhHo..',
    '..oHhhhhhhhhHo..',
    '..oHHhhhhhhHHo..',
    '...oHHhhhhHHo...',
    '.....oSSSSo.....',
  ];
  const BODY_UP_IDLE = BODY_DOWN_IDLE.map(r => r.replace('tt', 'cc'));
  const BODY_UP_WALK = BODY_DOWN_WALK.map(r => r.replace('tt', 'cc'));

  /* Capas por personaje (accesorios). Se aplican sobre la cabeza (13 filas). */
  const HAT_DOWN = [
    '....oooooooo....',
    '...oyyyyyyyyo...',
    '..oyyyyyyyyyyo..',
    '..oYyyyyyyyyYo..',
    '.oYYYYYYYYYYYYo.',
    '..oooooooooooo..',
  ];
  const HAT_SIDE = HAT_DOWN;
  const HAT_UP = HAT_DOWN;
  const GLASSES_DOWN = [
    '................', '................', '................', '................', '................', '................', '................',
    '...gggg..gggg...',
    '...g..gggg..g...',
    '...g..gggg..g...',
    '...gggg..gggg...',
  ];
  const GLASSES_SIDE = [
    '................', '................', '................', '................', '................', '................', '................',
    '.........gggg...',
    '.........g..g...',
    '.........g..g...',
    '.........gggg...',
  ];
  const HAIR_LONG_DOWN = [
    '................', '................', '................', '................', '................', '................', '................',
    '.oh..........ho.',
    '.oh..........ho.',
    '.oh..........ho.',
    '.oh..........ho.',
    '.oHh........hHo.',
    '..oo........oo..',
  ];
  const HAIR_LONG_SIDE = [
    '................', '................', '................', '................', '................', '................', '................',
    '.ohh............',
    '.ohh............',
    '.ohh............',
    '.ohh............',
    '.oHh............',
    '..oo............',
  ];
  const HAIR_LONG_UP = [
    '................', '................', '................', '................', '................', '................', '................',
    '................', '................', '................', '................', '................',
    '.....ohhhho.....',
  ];
  const HEADBAND = [
    '................', '................', '................', '................', '................',
    '..oWWWWWWWWWWo..',
  ];
  const HEADBAND_UP = [
    '................', '................', '................', '................', '................',
    '..oWWWWWWWWWWo..',
    '..oWWWWWWWWWWo..',
  ];

  const OUTLINE = '#141428';
  const CHAR_PALETTES = {
    guide:    { hair: '#4a5a80', hairD: '#2c3a5c', skin: '#f0c6a0', skinD: '#c48a6a', coat: '#d8343c', coatD: '#8c1c28', coatL: '#f07070', pants: '#3a4a78', pantsD: '#22305a', boots: '#4a3428', accent: '#38d8e0', collar: '#f8f8f8' },
    lia:      { hair: '#8a3a74', hairD: '#5c2050', skin: '#f4bc94', skinD: '#c88060', coat: '#e04050', coatD: '#902030', coatL: '#f89090', pants: '#2c3450', pantsD: '#1c2238', boots: '#282c40', accent: '#f8e0a0', collar: '#f8f8f8' },
    beto:     { hair: '#2c3448', hairD: '#1c2234', skin: '#d09468', skinD: '#a06848', coat: '#8c7ce8', coatD: '#5044a0', coatL: '#c0b4ff', pants: '#40485c', pantsD: '#2c3244', boots: '#282c40', accent: '#f8c840', collar: '#f8f8f8' },
    director: { hair: '#c8ccd8', hairD: '#8c94a8', skin: '#e4a880', skinD: '#b07858', coat: '#c02838', coatD: '#781424', coatL: '#f06878', pants: '#303848', pantsD: '#1c2230', boots: '#1c2030', accent: '#38d8e0', collar: '#f8f8f8' },
    cora:     { hair: '#245058', hairD: '#183840', skin: '#c0805c', skinD: '#8c5840', coat: '#f0b038', coatD: '#a06c18', coatL: '#ffd880', pants: '#3c3850', pantsD: '#282438', boots: '#282c40', accent: '#f8f8f8', collar: '#f8f8f8' },
    /* enemigos del Reactor MRP */
    supplier:   { hair: '#303746', hairD: '#1c2230', skin: '#d49a72', skinD: '#a06c50', coat: '#d9485f', coatD: '#8c2038', coatL: '#f88898', pants: '#2c3040', pantsD: '#1c2030', boots: '#1c2030', accent: '#ffd040', collar: '#f8f8f8' },
    supervisor: { hair: '#263044', hairD: '#181e30', skin: '#cb9068', skinD: '#986048', coat: '#467fb7', coatD: '#284c78', coatL: '#88b8f0', pants: '#404858', pantsD: '#2c3240', boots: '#1c2030', accent: '#f8c840', collar: '#f8f8f8' },
    auditor:    { hair: '#343747', hairD: '#202230', skin: '#c98c67', skinD: '#945c44', coat: '#6f5da8', coatD: '#443870', coatL: '#a898e0', pants: '#2c2c3c', pantsD: '#1c1c28', boots: '#1c2030', accent: '#38d8e0', collar: '#f8f8f8' },
    customer:   { hair: '#493047', hairD: '#2c1c2c', skin: '#d39a72', skinD: '#a06c50', coat: '#2e9b83', coatD: '#1a6454', coatL: '#70d8b8', pants: '#383040', pantsD: '#241c2c', boots: '#1c2030', accent: '#ffd040', collar: '#f8f8f8' },
    buyer:      { hair: '#26384a', hairD: '#182430', skin: '#c98c67', skinD: '#945c44', coat: '#b87b2e', coatD: '#7c4c14', coatL: '#f0b860', pants: '#3c3428', pantsD: '#28221c', boots: '#1c2030', accent: '#38d8e0', collar: '#f8f8f8' },
  };
  const CHAR_LAYERS = {
    guide:    { down: [HEADBAND], side: [HEADBAND], up: [HEADBAND_UP] },
    lia:      { down: [HAIR_LONG_DOWN], side: [HAIR_LONG_SIDE], up: [HAIR_LONG_UP] },
    beto:     { down: [HAT_DOWN], side: [HAT_SIDE], up: [HAT_UP] },
    director: { down: [GLASSES_DOWN], side: [GLASSES_SIDE], up: [] },
    cora:     { down: [GLASSES_DOWN], side: [GLASSES_SIDE], up: [] },
    supplier: { down: [], side: [], up: [] },
    supervisor: { down: [HAT_DOWN], side: [HAT_SIDE], up: [HAT_UP] },
    auditor:  { down: [GLASSES_DOWN], side: [GLASSES_SIDE], up: [] },
    customer: { down: [], side: [], up: [] },
    buyer:    { down: [], side: [], up: [] },
  };
  function charPalette(p, glassColor) {
    return {
      o: OUTLINE, h: p.hair, H: p.hairD, s: p.skin, S: p.skinD, w: '#f8f8f8', e: '#1c1c34',
      c: p.coat, C: p.coatD, l: p.coatL, k: p.collar, t: p.accent, p: p.pants, P: p.pantsD, b: p.boots,
      y: '#f8c840', Y: '#b88818', g: glassColor || '#e8f0ff', W: '#f8f8f8',
    };
  }
  const sheets = new Map();
  /** Devuelve {down:[c0,c1,c2], left:[...], right:[...], up:[...]} de canvases 16×24. */
  function charSheet(type) {
    if (sheets.has(type)) return sheets.get(type);
    const p = CHAR_PALETTES[type] || CHAR_PALETTES.guide, L = CHAR_LAYERS[type] || CHAR_LAYERS.guide;
    const pal = charPalette(p, type === 'cora' || type === 'auditor' ? '#38d8e0' : '#e8f0ff');
    const build = (head, body, layers) => raster(overlay(head.concat(body), ...layers), pal, type);
    const downWalkB = HEAD_DOWN.concat(flipRows(BODY_DOWN_WALK));
    const upWalkB = HEAD_UP.concat(flipRows(BODY_UP_WALK));
    const down = [build(HEAD_DOWN, BODY_DOWN_IDLE, L.down), build(HEAD_DOWN, BODY_DOWN_WALK, L.down), raster(overlay(downWalkB, ...L.down), pal, type)];
    const up = [build(HEAD_UP, BODY_UP_IDLE, L.up), build(HEAD_UP, BODY_UP_WALK, L.up), raster(overlay(upWalkB, ...L.up), pal, type)];
    const right = [build(HEAD_SIDE, BODY_SIDE_IDLE, L.side), build(HEAD_SIDE, BODY_SIDE_WALK_A, L.side), build(HEAD_SIDE, BODY_SIDE_WALK_B, L.side)];
    const left = right.map(flipCanvas);
    const s = { down, up, right, left }; sheets.set(type, s); return s;
  }
  const WALK_SEQ = [0, 1, 0, 2];
  /** Dibuja un personaje con los pies en (x,y) en píxeles de render. step = contador de animación. */
  function drawChar(g, type, x, y, dir = 'down', step = 0, moving = false) {
    const sheet = charSheet(type)[dir] || charSheet(type).down;
    const frame = moving ? sheet[WALK_SEQ[Math.floor(step) % 4]] : sheet[0];
    g.drawImage(frame, Math.round(x - 8), Math.round(y - 24));
  }
  function drawShadow(g, x, y) {
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(Math.round(x - 5), Math.round(y - 2), 10, 2); g.fillRect(Math.round(x - 4), Math.round(y - 3), 8, 1); g.fillRect(Math.round(x - 4), Math.round(y), 8, 1);
  }

  /* ==========================================================================
     RETRATOS 24×24 (cuadro de diálogo)
     ========================================================================== */
  const PORTRAIT_BASE = [
    '......oooooooooooo......',
    '....oohhhhhhhhhhhhoo....',
    '...ohhhhhhhhhhhhhhhho...',
    '...ohhhhhhhhhhhhhhhho...',
    '...ohhhhhhhhhhhhhhhho...',
    '...ohhHhhhhhhhhhhHhho...',
    '...ohHhsssssssssshHho...',
    '...oHhsssssssssssshHo...',
    '...oHssssssssssssssHo...',
    '...oHssWeesssWeesssHo...',
    '...oHsseeessseeesssHo...',
    '...oSssssssssssssssSo...',
    '...oSsssssssSsssssSSo...',
    '...oSSsssssssssssSSSo...',
    '....oSSsssmmmmsssSSo....',
    '.....oSSSssssssSSSo.....',
    '......ooSSSSSSSSoo......',
    '.......ooSSSSSSoo.......',
    '....ooooooSSSSoooooo....',
    '..oocccccckSSkccccccoo..',
    '.occcccccccckkcccccccco.',
    '.olccccccccttccccccccCo.',
    '.olccccccccttccccccccCo.',
    '.olccccccccttccccccccCo.',
  ];
  const P_HAT = [
    '......oooooooooooo......',
    '....ooyyyyyyyyyyyyoo....',
    '...oyyyyyyyyyyyyyyyyo...',
    '...oYyyyyyyyyyyyyyyYo...',
    '..oYYYYYYYYYYYYYYYYYYo..',
    '...oooooooooooooooooo...',
  ];
  const P_GLASSES = [
    '........................', '........................', '........................', '........................',
    '........................', '........................', '........................', '........................',
    '......ggggg.ggggg.......',
    '......g...ggg...g.......',
    '......g...g.g...g.......',
    '......ggggg.ggggg.......',
  ];
  const P_HAIR_LONG = [
    '........................', '........................', '........................', '........................',
    '........................', '........................', '........................',
    '..oh................ho..',
    '..oh................ho..',
    '..oh................ho..',
    '..oh................ho..',
    '..oh................ho..',
    '..oh................ho..',
    '..oh................ho..',
    '..oh................ho..',
    '..ohh..............hho..',
    '...oo..............oo...',
  ];
  const P_ROBOT = [
    '...........oo...........',
    '..........orro..........',
    '...........oo...........',
    '.....oooooooooooooo.....',
    '....oMMMMMMMMMMMMMMo....',
    '....oMmmmmmmmmmmmmMo....',
    '....oMmoooooooooomMo....',
    '....oMmonnnnnnnnomMo....',
    '....oMmongnnnngnomMo....',
    '....oMmonggnnggnomMo....',
    '....oMmonnnnnnnnomMo....',
    '....oMmonggggggnomMo....',
    '....oMmoooooooooomMo....',
    '....oMmmmmmmmmmmmmMo....',
    '....ommmmmmmmmmmmmmo....',
    '.....oooooooooooooo.....',
    '.........oMmMo..........',
    '......oooooooooooo......',
    '.....oMMmmmrrmmmMMo.....',
    '....oMMmmmmrrmmmmMMo....',
    '....oMmmmmmggmmmmmMo....',
    '....oMmmmmmmmmmmmmMo....',
    '....ommmmmmmmmmmmmmo....',
    '....oooooooooooooooo....',
  ];
  const PORTRAIT_LAYERS = { guide: null, lia: [P_HAIR_LONG], beto: [P_HAT], director: [P_GLASSES], cora: [P_GLASSES] };
  const portraits = new Map();
  function portrait(type) {
    if (portraits.has(type)) return portraits.get(type);
    let c;
    if (type === 'guide' || !CHAR_PALETTES[type]) {
      c = raster(P_ROBOT, { o: OUTLINE, r: '#ff3050', M: '#d8e0ec', m: '#98a4b8', n: '#101830', g: '#38d8e0' }, 'portrait robot');
    } else {
      const p = CHAR_PALETTES[type];
      const pal = Object.assign(charPalette(p, type === 'cora' ? '#38d8e0' : '#e8f0ff'), { m: p.skinD, W: '#f8f8f8' });
      c = raster(overlay(PORTRAIT_BASE, ...(PORTRAIT_LAYERS[type] || [])), pal, 'portrait ' + type);
    }
    portraits.set(type, c); return c;
  }
  /** Pinta el retrato en un canvas destino (fondo azul FF6 + marco). */
  function drawPortrait(canvas, type) {
    const g = ctxOf(canvas), w = canvas.width, h = canvas.height;
    g.clearRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, '#2c3c98'); grad.addColorStop(1, '#101c5c');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < h; y += 4) for (let x = (y / 4 % 2) * 4; x < w; x += 8) g.fillRect(x, y, 4, 4);
    const p = portrait(type); g.drawImage(p, Math.round((w - p.width) / 2), Math.round((h - p.height) / 2) + 1);
  }

  /* ==========================================================================
     TILES 16×16 · generados con primitivas (contorno, 3 tonos, remaches)
     ========================================================================== */
  const tileCache = new Map();
  function tile(name, fn) {
    if (tileCache.has(name)) return tileCache.get(name);
    const c = makeCanvas(TILE, TILE), g = ctxOf(c);
    const px = (x, y, w = 1, h = 1, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    fn(px, g); tileCache.set(name, c); return c;
  }
  const HALL = { base: '#3c4458', light: '#4c566c', dark: '#2a3044', seam: '#1c2030', rivet: '#68728c' };
  function hallFloor(v) {
    return tile('hall' + v, px => {
      px(0, 0, 16, 16, HALL.base);
      px(0, 0, 16, 1, HALL.seam); px(0, 0, 1, 16, HALL.seam);
      px(1, 15, 15, 1, HALL.dark); px(15, 1, 1, 15, HALL.dark);
      px(1, 1, 14, 1, HALL.light); px(1, 1, 1, 14, HALL.light);
      if (v === 1) { px(3, 3, 1, 1, HALL.rivet); px(12, 3, 1, 1, HALL.rivet); px(3, 12, 1, 1, HALL.rivet); px(12, 12, 1, 1, HALL.rivet); }
      if (v === 2) { for (let y = 3; y < 14; y += 3) px(3, y, 10, 1, HALL.dark); px(3, 3, 10, 1, HALL.seam); }
      if (v === 3) { px(6, 6, 4, 4, HALL.dark); px(7, 7, 2, 2, HALL.seam); }
    });
  }
  function roomFloor(zoneId, a, b, v) {
    return tile('floor' + zoneId + v, px => {
      px(0, 0, 16, 16, v ? b : a);
      px(0, 0, 16, 1, 'rgba(0,0,0,.18)'); px(0, 0, 1, 16, 'rgba(0,0,0,.18)');
      px(1, 1, 14, 1, 'rgba(255,255,255,.06)');
    });
  }
  const WALL = { top: '#1a1e2e', face: '#5a6280', faceL: '#767e9c', faceD: '#404860', panel: '#4c5474', trim: '#8c94b0' };
  function wallTop() { return tile('wallTop', px => { px(0, 0, 16, 16, WALL.top); px(0, 15, 16, 1, '#0c0e18'); px(0, 0, 16, 1, '#2c3248'); }); }
  function wallFaceUpper(accent) {
    return tile('wallU' + accent, px => {
      px(0, 0, 16, 16, WALL.face); px(0, 0, 16, 2, WALL.faceL); px(0, 2, 16, 1, WALL.trim);
      px(0, 6, 16, 3, accent); px(0, 9, 16, 1, WALL.faceD); px(0, 5, 16, 1, WALL.faceL);
      px(0, 12, 16, 1, WALL.faceD); px(0, 13, 16, 3, WALL.panel);
    });
  }
  function wallFaceLower() {
    return tile('wallL', px => {
      px(0, 0, 16, 16, WALL.panel); px(0, 0, 16, 1, WALL.faceL); px(2, 3, 12, 9, WALL.faceD); px(3, 4, 10, 7, WALL.face); px(3, 4, 10, 1, WALL.faceL);
      px(0, 14, 16, 2, '#2c3248'); px(0, 13, 16, 1, WALL.faceL);
    });
  }
  function wallSide() { return tile('wallSide', px => { px(0, 0, 16, 16, WALL.top); px(0, 0, 16, 1, '#2c3248'); px(4, 0, 1, 16, '#2c3248'); px(11, 0, 1, 16, '#0c0e18'); }); }
  function doorFloor(a) { return tile('door' + a, px => { px(0, 0, 16, 16, a); px(0, 0, 16, 1, 'rgba(0,0,0,.25)'); for (let x = 0; x < 16; x += 4) px(x, 7, 2, 1, 'rgba(255,255,255,.12)'); }); }
  function beltTile(phase) {
    return tile('belt' + phase, px => {
      px(0, 0, 16, 16, '#1c2030'); px(0, 2, 16, 12, '#2c3448'); px(0, 2, 16, 1, '#4c566c'); px(0, 13, 16, 1, '#0c0e18');
      for (let x = -8 + phase; x < 16; x += 8) { px(x, 4, 4, 8, '#58627c'); px(x, 4, 4, 1, '#7a849e'); px(x + 4, 4, 4, 8, '#3c4458'); }
    });
  }
  function beltRail() { return tile('rail', px => { px(0, 0, 16, 16, HALL.base); px(0, 5, 16, 6, '#68728c'); px(0, 5, 16, 1, '#8c96b0'); px(0, 10, 16, 1, '#3c4458'); for (let x = 2; x < 16; x += 6) px(x, 7, 2, 2, '#3c4458'); }); }

  /* Muebles: dibujados como cajas con contorno + cara superior + frente, más detalles */
  const FURN = {
    desk:    { top: '#8c6a48', topL: '#b08a62', front: '#5c4430', frontD: '#3c2c20' },
    console: { top: '#5a6a84', topL: '#7a8aa4', front: '#3c4860', frontD: '#242c40' },
    cabinet: { top: '#7c8498', topL: '#9ca4b8', front: '#585f74', frontD: '#383c4c' },
    bench:   { top: '#6c6088', topL: '#8c80a8', front: '#4a4060', frontD: '#302840' },
    reactor: { top: '#7a5a3c', topL: '#9c7c5c', front: '#4c3424', frontD: '#2c1c14' },
    rack:    { top: '#6c5c44', topL: '#8c7c64', front: '#4c3c2c', frontD: '#2c2018' },
  };
  const DETAIL = {
    monitor: [
      '................',
      '..ooooooooooooo.',
      '..onnnnnnnnnnno.',
      '..ongggnnnnnnno.',
      '..onnnnnnngggno.',
      '..onggnnnnnnnno.',
      '..onnnnnnnnnnno.',
      '..ooooooooooooo.',
      '......oooo......',
      '....oomMMmoo....',
      '....oooooooo....',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
    papers: [
      '................',
      '................',
      '....ooooooo.....',
      '...oWWWWWWWo....',
      '...oWnnnnnWo....',
      '...oWWWWWWWo....',
      '...oWnnnWWWo....',
      '...oWWWWWWWoo...',
      '....ooooooWWo...',
      '.......oWWWWo...',
      '.......oWnnWo...',
      '.......oWWWWo...',
      '.......oooooo...',
      '................',
      '................',
      '................',
    ],
    keyboard: [
      '................', '................', '................', '................', '................', '................',
      '..oooooooooooo..',
      '..oMmMmMmMmMmo..',
      '..omMmMmMmMmMo..',
      '..oMmmmmmmmmMo..',
      '..oooooooooooo..',
      '................', '................', '................', '................', '................',
    ],
    crate: [
      '................',
      '.oooooooooooooo.',
      '.oYyyyyyyyyyyYo.',
      '.oyYyyyyyyyyyyo.',
      '.oyyoooooooyyyo.',
      '.oyyoyyyyyyoyyo.',
      '.oyyoyyyyyyoyyo.',
      '.oyyoooooooyyyo.',
      '.oYyyyyyyyyyyYo.',
      '.oYYYYYYYYYYYYo.',
      '.oooooooooooooo.',
      '................', '................', '................', '................', '................',
    ],
    gear: [
      '................',
      '.....oo..oo.....',
      '....oaaooaao....',
      '...oaaaaaaaao...',
      '..ooaaAAAAaaoo..',
      '.oaaaAooooAaaao.',
      '.oaaAonnnnoAaao.',
      '..oaAonnnnoAao..',
      '..oaAonnnnoAao..',
      '.oaaAonnnnoAaao.',
      '.oaaaAooooAaaao.',
      '..ooaaAAAAaaoo..',
      '...oaaaaaaaao...',
      '....oaaooaao....',
      '.....oo..oo.....',
      '................',
    ],
    lamp: [
      '................', '................',
      '....oooooooo....',
      '....oggggggo....',
      '....oggggggo....',
      '....oooooooo....',
      '.......oo.......',
      '.......oo.......',
      '.......oo.......',
      '......oooo......',
      '................', '................', '................', '................', '................', '................',
    ],
  };
  const detailPal = { o: OUTLINE, n: '#101830', g: '#38d8e0', m: '#98a4b8', M: '#d8e0ec', W: '#f0f0f0', y: '#c89040', Y: '#8c5c1c', a: '#9098ac', A: '#c4ccdc' };
  const detailCache = new Map();
  function detail(name) { if (!detailCache.has(name)) detailCache.set(name, raster(DETAIL[name], detailPal, 'detail ' + name)); return detailCache.get(name); }

  function drawFurniture(g, o) {
    /* o: {x,y,w,h,t} en píxeles de render (múltiplos de 16) */
    const f = FURN[o.t] || FURN.desk, x = o.x, y = o.y, w = o.w, h = o.h;
    const frontH = o.t === 'rack' ? 0 : 6;
    g.fillStyle = OUTLINE; g.fillRect(x, y, w, h);
    g.fillStyle = f.top; g.fillRect(x + 1, y + 1, w - 2, h - 2 - frontH);
    g.fillStyle = f.topL; g.fillRect(x + 1, y + 1, w - 2, 1); g.fillRect(x + 1, y + 1, 1, h - 2 - frontH);
    if (frontH) { g.fillStyle = f.front; g.fillRect(x + 1, y + h - 1 - frontH, w - 2, frontH); g.fillStyle = f.frontD; g.fillRect(x + 1, y + h - 2, w - 2, 1); g.fillStyle = f.topL; g.fillRect(x + 1, y + h - 1 - frontH, w - 2, 1); }
    if (o.t === 'desk') { g.drawImage(detail('papers'), x + 4, y - 2); if (w >= 64) g.drawImage(detail('lamp'), x + w - 20, y - 4); if (w >= 96) g.drawImage(detail('monitor'), x + w / 2 - 8, y - 4); }
    if (o.t === 'console') { for (let cx = x + 2; cx + 16 <= x + w - 2; cx += 24) { g.drawImage(detail('monitor'), cx, y - 6); } g.drawImage(detail('keyboard'), x + w / 2 - 8, y + h - 18); }
    if (o.t === 'cabinet') { g.fillStyle = f.frontD; for (let dy = y + 3; dy < y + h - frontH - 3; dy += 5) g.fillRect(x + 3, dy, w - 6, 1); g.fillStyle = '#d8e0ec'; for (let dy = y + 4; dy < y + h - frontH - 3; dy += 5) g.fillRect(x + w / 2 - 2, dy, 4, 1); }
    if (o.t === 'bench') { for (let cx = x + 3; cx + 16 <= x + w - 3; cx += 20) { g.drawImage(detail('gear'), cx, y - 1); } }
    if (o.t === 'reactor') {
      g.fillStyle = '#2c3448'; g.fillRect(x + 4, y + 4, w - 8, h - 8 - frontH);
      for (let cx = x + 8; cx + 16 <= x + w - 8; cx += 24) g.drawImage(detail('gear'), cx, y + 2);
      g.fillStyle = '#ffbd3f'; for (let cx = x + 6; cx < x + w - 6; cx += 8) g.fillRect(cx, y + h - frontH - 3, 4, 1);
    }
    if (o.t === 'rack') {
      g.fillStyle = f.top; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      for (let sy = y + 3; sy + 14 < y + h; sy += 16) { g.fillStyle = f.frontD; g.fillRect(x + 2, sy + 13, w - 4, 2); for (let cx = x + 2; cx + 16 <= x + w - 2; cx += 16) g.drawImage(detail('crate'), cx, sy - 1); }
      g.fillStyle = f.topL; g.fillRect(x + 1, y + 1, 1, h - 2); g.fillRect(x + w - 2, y + 1, 1, h - 2);
    }
  }

  /* ==========================================================================
     OBJETOS: power-ups 16×16, terminales 24×24, flecha 8×8
     ========================================================================== */
  const ITEMS = {
    crystal: [
      '.......o........',
      '......ogo.......',
      '.....ogWgo......',
      '....ogWgggo.....',
      '...ogWgggggo....',
      '..ogWgggggGgo...',
      '.ogWggggggGGgo..',
      'ogggggggggGGGgo.',
      '.ogggggggGGGgo..',
      '..oggggggGGgo...',
      '...ogggggGgo....',
      '....ogggGgo.....',
      '.....ogGgo......',
      '......ogo.......',
      '.......o........',
      '................',
    ],
    shield: [
      '................',
      '.oooooooooooooo.',
      '.ovVVVVVVVVVVvo.',
      '.ovVVooooooVVvo.',
      '.ovVVoWWWWoVVvo.',
      '.ovVVoWvvWoVVvo.',
      '.ovVVoWvvWoVVvo.',
      '.ovVVoWWWWoVVvo.',
      '..ovVVooooVVvo..',
      '..ovVVVVVVVVvo..',
      '...ovVVVVVVvo...',
      '....ovVVVVvo....',
      '.....ovVVvo.....',
      '......ovvo......',
      '.......oo.......',
      '................',
    ],
    coffee: [
      '................',
      '.....W..W.......',
      '....W..W........',
      '.....W..W.......',
      '................',
      '..oooooooooo....',
      '..oWWWWWWWWoo...',
      '..oyyyyyyyyoyo..',
      '..oyyyYyyyyoyo..',
      '..oyyyyyyyyoyo..',
      '..oYyyyyyyYoo...',
      '..oYYyyyyYYo....',
      '...oYYYYYYo.....',
      '....oooooo......',
      '................',
      '................',
    ],
  };
  const itemPal = { o: OUTLINE, g: '#38d8e0', G: '#1c98a8', W: '#e8fcff', v: '#28a058', V: '#4ade80', y: '#ffbd3f', Y: '#b87c14' };
  const itemCache = new Map();
  function item(name) { if (!itemCache.has(name)) itemCache.set(name, raster(ITEMS[name], itemPal, 'item ' + name)); return itemCache.get(name); }

  const TERMINALS = {
    calendar: [
      '......oooooooooooo......',
      '.....oMMMMMMMMMMMMo.....',
      '....oMmmmmmmmmmmmmMo....',
      '....oMmoooooooooomMo....',
      '....oMmonnnnnnnnomMo....',
      '....oMmonggggggnomMo....',
      '....oMmonnnnnnnnomMo....',
      '....oMmongngngngomMo....',
      '....oMmonnnnnnnnomMo....',
      '....oMmongngnrngomMo....',
      '....oMmonnnnnnnnomMo....',
      '....oMmoooooooooomMo....',
      '....oMmmmmmmmmmmmmMo....',
      '....oMmMmMmMmMmMmmMo....',
      '....oMmmmmmmmmmmmmMo....',
      '....oooooooooooooooo....',
      '.......oMmmmmmmmo.......',
      '.......oMmmmmmmmo.......',
      '......ooooooooooooo.....',
      '.....oMMMMMMMMMMMMMo....',
      '.....ommmmmmmmmmmmmo....',
      '.....oooooooooooooo.....',
      '........................',
      '........................',
    ],
    gear: [
      '........oooooooo........',
      '.......oMMMMMMMMo.......',
      '......oMmmmmmmmmmMo.....',
      '.....oMmoooooooommMo....',
      '.....oMmoyyyyyyoommo....',
      '.....oMmoyrrrryoommo....',
      '.....oMmoyrnnryoommo....',
      '.....oMmoyrnnryoommo....',
      '.....oMmoyrrrryoommo....',
      '.....oMmoyyyyyyoommo....',
      '.....oMmoooooooommMo....',
      '.....oMmmmmmmmmmmmMo....',
      '....oooooooooooooooooo..',
      '...oMMMMMMMMMMMMMMMMMMo.',
      '...oMmmmmmmmmmmmmmmmmmo.',
      '...oMmggmmggmmggmmggmmo.',
      '...oMmmmmmmmmmmmmmmmmmo.',
      '...oMmnnnnnnnnnnnnnnmmo.',
      '...oMmnggggggggggggnmmo.',
      '...oMmnnnnnnnnnnnnnnmmo.',
      '...oMmmmmmmmmmmmmmmmmmo.',
      '...oooooooooooooooooooo.',
      '........................',
      '........................',
    ],
  };
  const termPal = { o: OUTLINE, M: '#d8e0ec', m: '#98a4b8', n: '#101830', g: '#38d8e0', r: '#ff3050', y: '#ffbd3f' };
  const termCache = new Map();
  function terminal(icon, active) {
    const key = icon + (active ? 'A' : '');
    if (!termCache.has(key)) { const pal = Object.assign({}, termPal, active ? { g: '#ff7890', n: '#301020' } : {}); termCache.set(key, raster(TERMINALS[icon] || TERMINALS.gear, pal, 'terminal ' + icon)); }
    return termCache.get(key);
  }
  const ARROW = ['oooooooo', 'orrrrrro', 'oRrrrrRo', '.oRrrRo.', '.oRrrRo.', '..oRRo..', '..oRRo..', '...oo...'];
  let arrowCanvas = null;
  function arrow() { if (!arrowCanvas) arrowCanvas = raster(ARROW, { o: OUTLINE, r: '#ff3050', R: '#b01030' }, 'arrow'); return arrowCanvas; }

  /* ==========================================================================
     VENTANA FF6 (para HUD en canvas): degradado azul + marco blanco
     ========================================================================== */
  function drawWindow(g, x, y, w, h) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const grad = g.createLinearGradient(0, y, 0, y + h); grad.addColorStop(0, '#2c3c98'); grad.addColorStop(1, '#101c5c');
    g.fillStyle = '#101426'; g.fillRect(x, y, w, h);
    g.fillStyle = '#f0f0f0'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = '#8890a8'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle = grad; g.fillRect(x + 3, y + 3, w - 6, h - 6);
    g.clearRect(x, y, 1, 1); g.clearRect(x + w - 1, y, 1, 1); g.clearRect(x, y + h - 1, 1, 1); g.clearRect(x + w - 1, y + h - 1, 1, 1);
  }

  /* ==========================================================================
     CAPA ESTÁTICA DEL MUNDO
     zones: [{id,x,y,w,h,label,floor:[a,b],accent,door:'bottom'|'top'}] en unidades de mundo
     obstacles: [{x,y,w,h,t}] en unidades de mundo (t = tipo de mueble; 'wall' se ignora)
     ========================================================================== */
  function buildWorld(spec) {
    const { zones, obstacles, world, translate } = spec;
    const W = Math.ceil(world.w * K / TILE) * TILE, H = Math.ceil(world.h * K / TILE) * TILE;
    const c = makeCanvas(W, H), g = ctxOf(c);
    const cols = W / TILE, rows = H / TILE;
    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const n = (tx * 7 + ty * 13) % 11; g.drawImage(hallFloor(n === 0 ? 1 : n === 5 ? 2 : n === 8 ? 3 : 0), tx * TILE, ty * TILE);
    }
    /* corredor de suministro (banda transportadora) */
    if (spec.belt) { const b = spec.belt; const by = Math.round(b.y * K / TILE), bh = Math.round(b.h * K / TILE); for (let tx = 0; tx < cols; tx++) { g.drawImage(beltRail(), tx * TILE, (by - 1) * TILE); g.drawImage(beltRail(), tx * TILE, (by + bh) * TILE); } }
    zones.forEach(z => {
      const zx = Math.round(z.x * K / TILE), zy = Math.round(z.y * K / TILE), zw = Math.round(z.w * K / TILE), zh = Math.round(z.h * K / TILE);
      const doorW = 4, doorX = zx + Math.floor((zw - doorW) / 2);
      for (let ty = zy; ty < zy + zh; ty++) for (let tx = zx; tx < zx + zw; tx++) {
        const inDoor = tx >= doorX && tx < doorX + doorW;
        let t;
        if (ty === zy) t = z.door === 'top' && inDoor ? doorFloor(z.floor[0]) : wallTop();
        else if (ty === zy + 1) t = z.door === 'top' && inDoor ? doorFloor(z.floor[0]) : (tx === zx || tx === zx + zw - 1) ? wallSide() : wallFaceUpper(z.accent);
        else if (ty === zy + 2) t = z.door === 'top' && inDoor ? doorFloor(z.floor[0]) : (tx === zx || tx === zx + zw - 1) ? wallSide() : wallFaceLower();
        else if (ty === zy + zh - 1) t = z.door === 'bottom' && inDoor ? doorFloor(z.floor[0]) : wallTop();
        else if (tx === zx || tx === zx + zw - 1) t = wallSide();
        else t = roomFloor(z.id, z.floor[0], z.floor[1], (tx + ty) % 2);
        g.drawImage(t, tx * TILE, ty * TILE);
      }
      /* marco de la puerta: dos postes metálicos */
      const dr0 = z.door === 'top' ? zy : zy + zh - 1, dr1 = z.door === 'top' ? zy + 2 : zy + zh - 1;
      const dy0 = dr0 * TILE, dh = (dr1 + 1) * TILE - dy0, dxL = doorX * TILE, dxR = (doorX + doorW) * TILE;
      g.fillStyle = OUTLINE; g.fillRect(dxL - 3, dy0, 3, dh); g.fillRect(dxR, dy0, 3, dh);
      g.fillStyle = WALL.trim; g.fillRect(dxL - 2, dy0, 1, dh); g.fillRect(dxR + 1, dy0, 1, dh);
      g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(dxL, dy0 + dh - 2, dxR - dxL, 1);
      /* letrero de la sala sobre la pared */
      const label = translate ? translate(z.label) : z.label, tw = textWidth(label);
      const sx = zx * TILE + Math.round((zw * TILE - tw) / 2) - 5, sy = zy * TILE + 18;
      g.fillStyle = OUTLINE; g.fillRect(sx - 1, sy - 3, tw + 12, 13);
      g.fillStyle = '#2c3448'; g.fillRect(sx, sy - 2, tw + 10, 11);
      g.fillStyle = z.accent; g.fillRect(sx, sy - 2, tw + 10, 1);
      drawText(g, label, sx + 5, sy, '#f8f8f8');
    });
    obstacles.filter(o => o.t && o.t !== 'wall').forEach(o => drawFurniture(g, { x: Math.round(o.x * K), y: Math.round(o.y * K), w: Math.round(o.w * K), h: Math.round(o.h * K), t: o.t }));
    if (spec.signs) spec.signs.forEach(s => drawText(g, translate ? translate(s.text) : s.text, s.x * K, s.y * K, s.color || '#c8d0e0', { align: s.align || 'left' }));
    return c;
  }
  function drawBelt(g, belt, camX, camY, time) {
    const phase = Math.floor(time / 90) % 8;
    const by = Math.round(belt.y * K / TILE), bh = Math.round(belt.h * K / TILE);
    const x0 = Math.floor(camX / TILE), x1 = Math.ceil((camX + RW) / TILE);
    for (let ty = by; ty < by + bh; ty++) for (let tx = x0; tx <= x1; tx++) g.drawImage(beltTile(phase), tx * TILE - camX, ty * TILE - camY);
  }

  /* ==========================================================================
     ESCENA DE ENCUENTRO (Reactor MRP): fondo de batalla + enemigo 2× + prop
     ========================================================================== */
  const PROPS = {
    box: DETAIL.crate,
    clipboard: [
      '....oooooooo....',
      '....oWWWWWWo....',
      '....oWnnnnWo....',
      '....oWWWWWWo....',
      '....oWnnnWWo....',
      '....oWWWWWWo....',
      '....oWnnnnWo....',
      '....oWWWWWWo....',
      '....oWnnWWWo....',
      '....oWWWWWWo....',
      '....oooooooo....',
      '................', '................', '................', '................', '................',
    ],
    lens: [
      '................',
      '....oooooo......',
      '...ogggggggo....',
      '..ogWWggggggo...',
      '..ogWgggggggo...',
      '..ogggggggggo...',
      '..ogggggggggo...',
      '...oggggggggo...',
      '....ooooooooo...',
      '..........oGGo..',
      '...........oGGo.',
      '............oGGo',
      '.............oo.',
      '................', '................', '................',
    ],
    phone: [
      '................', '................',
      '.....oooooo.....',
      '.....oMMMMo.....',
      '.....onnnno.....',
      '.....ongggo.....',
      '.....onnnno.....',
      '.....ongngo.....',
      '.....onnnno.....',
      '.....oMMMMo.....',
      '.....oooooo.....',
      '................', '................', '................', '................', '................',
    ],
  };
  const propPal = Object.assign({}, detailPal, { G: '#8c94a8' });
  const propCache = new Map();
  function prop(name) { if (!propCache.has(name)) propCache.set(name, raster(PROPS[name], propPal, 'prop ' + name)); return propCache.get(name); }
  const ENEMY_PROPS = { supplier: ['box', 'box'], supervisor: ['clipboard'], auditor: ['lens'], customer: ['phone'], buyer: ['box', 'clipboard'] };
  function drawEncounter(canvas, type, time) {
    const g = ctxOf(canvas), w = canvas.width, h = canvas.height;
    /* fondo: piso industrial en perspectiva, cielo oscuro */
    g.fillStyle = '#0c1020'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h * .55; y += 2) { g.fillStyle = y % 8 < 4 ? '#141a30' : '#101628'; g.fillRect(0, y, w, 2); }
    const horizon = Math.round(h * .55);
    const bands = ['#3c4458', '#343c50', '#2c3448', '#262e40', '#202838'];
    for (let i = 0; i < 5; i++) { g.fillStyle = bands[i]; g.fillRect(0, horizon + i * Math.ceil((h - horizon) / 5), w, Math.ceil((h - horizon) / 5)); }
    g.fillStyle = '#4c566c'; g.fillRect(0, horizon, w, 1);
    for (let x = -w; x < w * 2; x += 24) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x + Math.round((x - w / 2) * .15), horizon + 8, 1, h - horizon); }
    /* enemigo (sprite 2×) con balanceo */
    const bob = Math.round(Math.sin(time / 260) * 1.5);
    const sheet = charSheet(CHAR_PALETTES[type] ? type : 'supplier');
    const frame = sheet.down[0], ex = Math.round(w / 2 - 16), ey = Math.round(h * .78) - 48 + bob;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(ex + 4, ey + 46, 24, 3);
    g.drawImage(frame, 0, 0, 16, 24, ex, ey, 32, 48);
    const props = ENEMY_PROPS[type] || [];
    props.forEach((p, i) => { const pc = prop(p); const px = i === 0 ? ex - 30 : ex + 40, py = Math.round(h * .78) - 26 + (i === 0 ? 0 : 2) - Math.round(Math.sin(time / 260 + 1.5) * 1.5); g.drawImage(pc, 0, 0, 16, 16, px, py, 32, 32); });
  }

  global.PixelArt = { K, TILE, RW, RH, raster, drawText, textWidth, charSheet, drawChar, drawShadow, drawPortrait, buildWorld, drawBelt, drawFurniture, item, terminal, arrow, drawWindow, drawEncounter, makeCanvas, ctxOf };
})(window);
