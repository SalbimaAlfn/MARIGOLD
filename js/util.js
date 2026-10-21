/* MARIGOLD — small helpers + the bitmap text renderer. */

const U = {
  clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; },
  lerp(a, b, t) { return a + (b - a) * t; },

  approach(v, target, delta) {
    if (v < target) return Math.min(v + delta, target);
    if (v > target) return Math.max(v - delta, target);
    return v;
  },

  sign(v) { return v > 0 ? 1 : v < 0 ? -1 : 0; },

  /* deterministic hash for tiny procedural details */
  hash(n) {
    n = (n * 9301 + 49297) % 233280;
    return n / 233280;
  },

  /* mulberry32 seeded rng */
  rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  pointIn(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  },

  easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
  easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },

  /* pixel circle (no anti-aliasing) */
  pixelCircle(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.floor(Math.sqrt(r * r - dy * dy));
      ctx.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
    }
  }
};

/* ---------- bitmap text ---------- */

function glyphOf(ch) { return FONT[ch] || null; }

function textWidth(str, scale) {
  scale = scale || 1;
  str = String(str).toUpperCase();
  if (!str.length) return 0;
  return str.length * 6 * scale - scale;
}

function glyphRows(ch) {
  const g = glyphOf(ch);
  return g ? g.split(' ') : null;
}

function drawGlyphs(ctx, str, x, y, scale, color) {
  ctx.fillStyle = color;
  let gx = x;
  for (let i = 0; i < str.length; i++) {
    const rows = glyphRows(str[i]);
    if (rows) {
      for (let ry = 0; ry < rows.length; ry++) {
        const bits = rows[ry];
        for (let rx = 0; rx < bits.length; rx++) {
          if (bits[rx] === '1') ctx.fillRect(gx + rx * scale, y + ry * scale, scale, scale);
        }
      }
    }
    gx += 6 * scale;
  }
}

/* opts: {scale, color, align:'left'|'center'|'right', shadow, shadowOffset} */
function drawText(ctx, str, x, y, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const color = opts.color || PAL.cream;
  const align = opts.align || 'left';
  str = String(str).toUpperCase();

  const w = textWidth(str, scale);
  let sx = x;
  if (align === 'center') sx = Math.round(x - w / 2);
  else if (align === 'right') sx = Math.round(x - w);

  if (opts.shadow) {
    const so = (opts.shadowOffset || 1) * scale;
    drawGlyphs(ctx, str, sx + so, y + so, scale, opts.shadow);
  }
  drawGlyphs(ctx, str, sx, y, scale, color);
  return w;
}

/* word-wrapped paragraph; returns total height drawn */
function drawParagraph(ctx, text, x, y, maxWidth, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const lineH = opts.lineHeight || 9 * scale;
  const lines = wrapText(text, maxWidth, scale);
  for (let i = 0; i < lines.length; i++) {
    drawText(ctx, lines[i], x, y + i * lineH, opts);
  }
  return lines.length * lineH;
}

function wrapText(text, maxWidth, scale) {
  const words = String(text).toUpperCase().split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const probe = line ? line + ' ' + word : word;
    if (textWidth(probe, scale) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}
