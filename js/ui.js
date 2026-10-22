/* MARIGOLD — all screen furniture: HUD, menus, cards, cutscenes.
   Every pixel is drawn with the 5x7 font or hand-placed rects. */

/* the twelve lines of the letter, in order. the sign-off is separate. */
const LETTER_LINES = [
  'letter.1', 'letter.2', 'letter.3', 'letter.4',
  'letter.5', 'letter.6', 'letter.7', 'letter.8',
  'letter.9', 'letter.10', 'letter.11', 'letter.12'
];

/* the width of the writing on the page, and the paper itself */
const LETTER_TEXT_W = 336;
const LETTER_PAGE = { x: 16, y: 8, w: 368, h: 208 };

/* the letter as it is laid out on the paper: every line wrapped to the
   width of the page. both languages use the same routine. */
function letterBlock() {
  const out = [];
  for (const key of LETTER_LINES) {
    const raw = L(key);
    if (!raw) continue;
    const parts = wrapMixed(raw, LETTER_TEXT_W, 1);
    for (const p of parts) out.push(p);
  }
  return out;
}

/* how many characters the whole letter takes to type out */
function letterChars() {
  let n = 0;
  for (const line of letterBlock()) n += line.length;
  return n;
}

/* the name the letter is signed with */
function letterName() {
  return Save.keeperName('SNOOZYPAW');
}

const UI = {
  rects: {},

  /* ---------- shared pieces ---------- */

  /* wrapped text, centred on a column; returns how many lines it used */
  wrapCenter(ctx, text, cx, y, maxW, opts, maxLines) {
    opts = opts || {};
    const lines = wrapText(text, maxW, opts.scale || 1);
    const shown = maxLines ? Math.min(lines.length, maxLines) : lines.length;
    for (let i = 0; i < shown; i++) {
      drawText(ctx, lines[i], cx, y + i * (opts.lineHeight || 9), opts);
    }
    return shown;
  },

  panel(ctx, x, y, w, h, fill) {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill || PAL.inkSoft;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
    ctx.fillRect(x + 2, y + 2, 1, h - 4);
    ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
    /* corner nicks */
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(x + 2, y + 2, 3, 1);
    ctx.fillRect(x + 2, y + 2, 1, 3);
    ctx.fillRect(x + w - 5, y + h - 3, 3, 1);
    ctx.fillRect(x + w - 3, y + h - 5, 1, 3);
  },

  heart(ctx, x, y, full) {
    const rows = [
      '.xxx.xxx.',
      'xRRRxRRRx',
      'xRRRRRRRx',
      'xRRRRRRRx',
      '.xRRRRRx.',
      '..xRRRx..',
      '...xRx...',
      '....x....'
    ];
    for (let ry = 0; ry < rows.length; ry++) {
      for (let rx = 0; rx < 9; rx++) {
        const c = rows[ry][rx];
        if (c === 'x') ctx.fillStyle = PAL.ink;
        else if (c === 'R') ctx.fillStyle = full ? PAL.rose : PAL.shadow;
        else continue;
        ctx.fillRect(x + rx, y + ry, 1, 1);
      }
    }
  },

  logo(ctx, str, cx, y, scale, base, accent) {
    drawText(ctx, str, cx - 2, y, { scale, color: PAL.ink, align: 'center' });
    drawText(ctx, str, cx + 2, y, { scale, color: PAL.ink, align: 'center' });
    drawText(ctx, str, cx, y - 2, { scale, color: PAL.ink, align: 'center' });
    drawText(ctx, str, cx, y + 2, { scale, color: PAL.ink, align: 'center' });
    drawText(ctx, str, cx, y + scale, { scale, color: accent || PAL.rust, align: 'center' });
    drawText(ctx, str, cx, y, { scale, color: base || PAL.cream, align: 'center' });
  },

  button(ctx, label, x, y, w, h, selected, disabled) {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = disabled ? '#2a2538' : (selected ? PAL.gold : PAL.inkSoft);
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    if (selected && !disabled) {
      ctx.fillStyle = PAL.goldLight;
      ctx.fillRect(x + 2, y + 2, w - 4, 1);
      ctx.fillStyle = PAL.ink;
      drawText(ctx, '>', x + 6, y + Math.floor((h - 7) / 2), { color: PAL.ink });
    }
    drawText(ctx, label, x + w / 2 + (selected && !disabled ? 4 : 0), y + Math.floor((h - 7) / 2), {
      align: 'center',
      color: disabled ? PAL.stoneDark : (selected ? PAL.ink : PAL.cream)
    });
  },

  /* ---------- HUD ---------- */

  hud(ctx, game) {
    /* hearts */
    for (let i = 0; i < game.maxHearts; i++) {
      this.heart(ctx, 8 + i * 12, 7, i < game.hearts);
    }

    /* marigolds gathered this stage */
    ctx.drawImage(Sprites.marigold, 8, 19);
    drawText(ctx, 'x' + String(game.stageFlowers).padStart(2, '0') + '/' + String(game.level.totalFlowers).padStart(2, '0'),
      21, 21, { color: PAL.cream, shadow: PAL.ink });

    /* the keeper's warmth: three pips she spends on flowers */
    if (game.warmth !== null && game.warmth !== undefined) {
      const px = 8 + game.maxHearts * 12 + 4;
      for (let i = 0; i < 3; i++) {
        const on = i < game.warmth;
        const x = px + i * 10;
        ctx.fillStyle = PAL.ink;
        ctx.fillRect(x - 1, 7, 9, 9);
        ctx.fillStyle = on ? PAL.marigold : PAL.shadow;
        ctx.fillRect(x, 8, 7, 7);
        if (on) {
          ctx.fillStyle = PAL.goldLight;
          ctx.fillRect(x + 1, 9, 5, 3);
          ctx.fillStyle = PAL.white;
          ctx.fillRect(x + 2, 9, 2, 1);
        }
      }
    }

    /* the second player's hearts, in co-op */
    if (game.player2) {
      for (let i = 0; i < game.maxHearts; i++) {
        this.heart(ctx, 8 + i * 12, 30, i < game.player2.hearts);
      }
      drawText(ctx, L('hud.p2'), 8 + game.maxHearts * 12 + 4, 31, { color: PAL.cream2, shadow: PAL.ink });
    }

    /* chapter name, right */
    const def = game.campaignDef();
    drawText(ctx, L(def.nameKey), 368, 8, { align: 'right', color: PAL.cream, shadow: PAL.ink });
    const num = def.number || L('chapter.coop.name');
    const total = game.campaign().length;
    drawText(ctx, L('hud.chapter', [game.stageIndex + 1, total]), 368, 18, { align: 'right', color: PAL.cream2, shadow: PAL.ink });

    /* pause button (also tappable) */
    this.rects.pause = { x: 376, y: 6, w: 18, h: 18 };
    const r = this.rects.pause;
    const hover = game.pointerInPause;
    ctx.fillStyle = hover ? PAL.gold : 'rgba(22,19,31,0.75)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = hover ? PAL.ink : PAL.cream;
    ctx.fillRect(r.x + 5, r.y + 4, 3, 10);
    ctx.fillRect(r.x + 10, r.y + 4, 3, 10);
  },

  subtitle(ctx, game) {
    if (!game.msg || game.msg.t <= 0) return;
    const text = game.msg.text;
    const lines = wrapText(text, 340, 1);
    const w = 360;
    const h = 8 + lines.length * 9;
    const x = 20;
    const y = 224 - h - 8;
    const a = Math.min(1, game.msg.t * 3);
    ctx.globalAlpha = a;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    for (let i = 0; i < lines.length; i++) {
      drawText(ctx, lines[i], x + w / 2, y + 5 + i * 9, { align: 'center', color: PAL.cream });
    }
    ctx.globalAlpha = 1;
  },

  /* first-run control reminder */
  hint(ctx, game) {
    if (game.hintT <= 0) return;
    const a = Math.min(1, game.hintT * 1.5);
    ctx.globalAlpha = a;
    const y = 168;
    ctx.fillStyle = 'rgba(22,19,31,0.8)';
    ctx.fillRect(44, y, 312, 34);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(44, y, 312, 1);
    ctx.fillRect(44, y + 33, 312, 1);
    drawText(ctx, L('hint.move'), 200, y + 7, { align: 'center', color: PAL.cream });
    drawText(ctx, L('hint.actions'), 200, y + 19, { align: 'center', color: PAL.cream2 });
    ctx.globalAlpha = 1;
  },

  /* ---------- title ---------- */

  title(ctx, game) {
    const cam = 40 + Math.sin(game.time * 0.12) * 40;
    Backgrounds.draw(ctx, 'day', cam, 0, game.time);
    const lvl = game.titleLevel;
    ctx.save();
    ctx.translate(-Math.round(cam), 0);
    Tiles.draw(ctx, lvl, cam, 0, game.time);
    Tiles.drawDecor(ctx, lvl, cam, 0, game.time);
    ctx.restore();

    ctx.fillStyle = 'rgba(11,9,18,0.45)';
    ctx.fillRect(0, 0, 400, 224);

    /* the keeper, and Finn, standing on the title ground */
    ctx.drawImage(Sprites.keeper.idle.r, 44, 182);
    ctx.drawImage(Sprites.facing(Sprites.hero.idle, 1), 64, 188);
    ctx.drawImage(Sprites.marigold, 300, 198);
    ctx.drawImage(Sprites.marigold, 318, 199);
    ctx.drawImage(Sprites.marigold, 334, 197);

    this.logo(ctx, 'MARIGOLD', 200, 40, 4, PAL.cream, PAL.rust);
    drawText(ctx, L('title.tagline'), 200, 92, { align: 'center', color: PAL.gold, shadow: PAL.ink, scale: 1 });
    drawText(ctx, L('title.counts', STAGES.length), 200, 106,
      { align: 'center', color: PAL.cream2, shadow: PAL.ink });

    const blink = Math.floor(game.time * 2) % 2 === 0;
    if (blink) {
      drawText(ctx, L('title.begin'), 200, 134, { align: 'center', color: PAL.white, shadow: PAL.ink });
    }

    /* the prologue can be watched again once it has been seen */
    if (Save.data.prologueSeen || Save.data.keepPrologueSeen) {
      drawText(ctx, L('title.replay'), 200, 152, { align: 'center', color: PAL.stone, shadow: PAL.ink });
    }

    /* two little doors out of the title */
    this.smallButton(ctx, L('title.settings'), 96, 172, game.pointerOver === 'titleSettings');
    this.smallButton(ctx, L('title.memento'), 212, 172, game.pointerOver === 'titleMemento');

    drawText(ctx, L('title.footer'), 200, 215,
      { align: 'center', color: PAL.cream2, shadow: PAL.ink });

    this.rects.titleStart = { x: 100, y: 124, w: 200, h: 26 };
    this.rects.titleSettings = { x: 96, y: 172, w: 92, h: 18 };
    this.rects.titleMemento = { x: 212, y: 172, w: 92, h: 18 };
  },

  /* a small framed button, for the corners of the title */
  smallButton(ctx, label, x, y, hover) {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x, y, 92, 18);
    ctx.fillStyle = hover ? PAL.gold : PAL.inkSoft;
    ctx.fillRect(x + 2, y + 2, 88, 14);
    drawText(ctx, label, x + 46, y + 5, { align: 'center', color: hover ? PAL.ink : PAL.cream });
  },

  /* ---------- stage select ---------- */

  select(ctx, game) {
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);
    /* faint checker so the screen is not a void */
    ctx.fillStyle = '#131019';
    for (let y = 0; y < 224; y += 8) {
      for (let x = ((y / 8) % 2) * 8; x < 400; x += 16) ctx.fillRect(x, y, 8, 8);
    }

    this.logo(ctx, L('select.title'), 200, 16, 2, PAL.cream, PAL.rust);
    drawText(ctx, L('select.heading'), 200, 38, { align: 'center', color: PAL.cream2 });

    const camp = game.campaign();
    const best = (game.road === 'keep') ? Save.data.keepBest : Save.data.best;
    const unlocked = game.unlockedCount();
    const cardW = 75, cardH = 122, gap = 4;
    const n = camp.length;
    const total = cardW * n + gap * (n - 1);
    const x0 = Math.floor((400 - total) / 2);
    const y = 56;
    this.rects.cards = [];

    for (let i = 0; i < n; i++) {
      const def = camp[i];
      const x = x0 + i * (cardW + gap);
      const locked = i + 1 > unlocked;
      const sel = game.selectSel === i;
      this.rects.cards.push({ x, y, w: cardW, h: cardH, i });

      ctx.fillStyle = PAL.ink;
      ctx.fillRect(x, y, cardW, cardH);
      ctx.fillStyle = sel ? PAL.gold : PAL.shadow;
      ctx.fillRect(x + 2, y + 2, cardW - 4, cardH - 4);

      /* preview window */
      const px = x + 4, py = y + 4, pw = cardW - 8, ph = 52;
      this.preview(ctx, def.theme, px, py, pw, ph, i);

      if (locked) {
        ctx.fillStyle = 'rgba(11,9,18,0.72)';
        ctx.fillRect(px, py, pw, ph);
        /* padlock */
        ctx.fillStyle = PAL.cream2;
        ctx.fillRect(px + pw / 2 - 7, py + ph / 2 - 2, 14, 11);
        ctx.fillStyle = PAL.inkSoft;
        ctx.fillRect(px + pw / 2 - 5, py + ph / 2, 10, 7);
        ctx.fillStyle = PAL.cream2;
        ctx.fillRect(px + pw / 2 - 5, py + ph / 2 - 9, 10, 7);
        ctx.fillStyle = PAL.inkSoft;
        ctx.fillRect(px + pw / 2 - 3, py + ph / 2 - 7, 6, 5);
      }

      drawText(ctx, L('stage.num', i + 1), x + cardW / 2, py + ph + 6, { align: 'center', color: locked ? PAL.stone : PAL.gold });
      this.wrapCenter(ctx, L(def.nameKey), x + cardW / 2, py + ph + 17, cardW - 8,
        { align: 'center', color: locked ? PAL.stoneDark : PAL.cream, lineHeight: 9 }, 2);

      const got = best[i] || 0;
      drawText(ctx, locked ? L('select.locked') : L('select.flowers', String(got).padStart(2, '0')),
        x + cardW / 2, y + cardH - 14, { align: 'center', color: locked ? PAL.stoneDark : PAL.cream2 });

      if (sel && !locked) {
        ctx.fillStyle = PAL.goldLight;
        ctx.fillRect(x + 2, y + 2, cardW - 4, 1);
        ctx.fillRect(x + 2, y + cardH - 3, cardW - 4, 1);
        /* arrow over the card */
        drawText(ctx, '^', x + cardW / 2, y - 10, { align: 'center', color: PAL.gold });
      }
    }

    const hint = (game.selectSel + 1 > unlocked) ? L('select.barred') : L('intro.ride');
    drawText(ctx, hint, 200, 196, { align: 'center', color: PAL.cream, shadow: PAL.ink });
    drawText(ctx, L('select.controls'), 200, 210, { align: 'center', color: PAL.cream2, shadow: PAL.ink });
  },

  preview(ctx, theme, x, y, w, h, seed) {
    let sky, hill, ground;
    if (theme === 'day') { sky = PAL.skyMid; hill = PAL.leaf; ground = PAL.leafDark; }
    else if (theme === 'dusk') { sky = PAL.duskMid; hill = '#7a5a5f'; ground = '#3d2f4a'; }
    else if (theme === 'woods') { sky = '#2a452d'; hill = '#1d3626'; ground = '#16281b'; }
    else if (theme === 'marsh') { sky = '#313248'; hill = '#2b2c3c'; ground = '#1c1d28'; }
    else { sky = PAL.nightSoft; hill = '#1f2740'; ground = '#141a2e'; }
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = hill;
    for (let i = 0; i < w; i += 3) {
      const top = y + h - 22 + Math.floor(Math.sin(i * 0.3 + seed * 2) * 4);
      ctx.fillRect(x + i, top, 3, y + h - top);
    }
    ctx.fillStyle = ground;
    ctx.fillRect(x, y + h - 12, w, 12);
    ctx.fillStyle = theme === 'keep' ? PAL.stoneDark : (theme === 'marsh' ? '#4c4533' : PAL.dirt);
    ctx.fillRect(x, y + h - 10, w, 10);
    /* door silhouette */
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x + w - 26, y + h - 26, 14, 16);
    ctx.fillStyle = theme === 'keep' ? PAL.rust : PAL.wood;
    ctx.fillRect(x + w - 24, y + h - 24, 10, 14);
    if (theme === 'night') {
      ctx.fillStyle = PAL.moon;
      ctx.fillRect(x + 16, y + 8, 7, 7);
      ctx.fillStyle = sky;
      ctx.fillRect(x + 16, y + 8, 3, 3);
      ctx.fillStyle = PAL.cream;
      ctx.fillRect(x + 30, y + 6, 1, 1);
      ctx.fillRect(x + 44, y + 14, 1, 1);
    }
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
  },

  /* ---------- in-game overlays ---------- */

  intro(ctx, game) {
    const def = game.campaignDef();
    const t = game.introT;
    const a = t < 0.3 ? t / 0.3 : (t > 2.0 ? Math.max(0, 1 - (t - 2.0) / 0.3) : 1);
    ctx.globalAlpha = a;

    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);

    /* theme stripe */
    const stripe = def.theme === 'day' ? PAL.leaf
      : def.theme === 'dusk' ? '#7a5a5f'
        : def.theme === 'woods' ? '#355738'
          : def.theme === 'marsh' ? '#413d52'
            : PAL.nightSoft;
    ctx.fillStyle = stripe;
    ctx.fillRect(0, 62, 400, 3);
    ctx.fillRect(0, 156, 400, 3);

    drawText(ctx, L('stage.num', game.stageIndex + 1), 200, 78, { align: 'center', color: PAL.gold, scale: 1 });
    this.logo(ctx, L(def.nameKey), 200, 94, 2, PAL.cream, PAL.rust);
    drawParagraph(ctx, game.stageBlurb || '', 200, 128, 340, { align: 'center', color: PAL.cream2 });

    ctx.drawImage(Sprites.marigold, 178, 142);
    ctx.drawImage(Sprites.marigold, 212, 142);

    if (Math.floor(game.time * 3) % 2 === 0) {
      drawText(ctx, L('intro.ride'), 200, 172, { align: 'center', color: PAL.white, shadow: PAL.ink });
    }
    ctx.globalAlpha = 1;
  },

  paused(ctx, game) {
    ctx.fillStyle = 'rgba(11,9,18,0.72)';
    ctx.fillRect(0, 0, 400, 224);
    this.panel(ctx, 72, 8, 256, 206);
    this.logo(ctx, L('menu.paused'), 200, 16, 2, PAL.cream, PAL.rust);

    const items = Game.pauseItems();
    this.rects.menu = [];
    for (let i = 0; i < items.length; i++) {
      const r = { x: 82, y: 40 + i * 18, w: 236, h: 16, i };
      this.rects.menu.push(r);
      this.button(ctx, items[i].label, r.x, r.y, r.w, r.h, game.pausedSel === i, false);
    }
    drawText(ctx, L('menu.resumeHint'), 200, 202, { align: 'center', color: PAL.cream2 });
  },

  dead(ctx, game) {
    ctx.fillStyle = 'rgba(60,10,20,0.55)';
    ctx.fillRect(0, 0, 400, 224);
    const t = game.deadT;
    const a = Math.min(1, t * 2);
    ctx.globalAlpha = a;
    this.logo(ctx, L('dead.title'), 200, 74, 3, PAL.cream, PAL.inkDeep);
    drawText(ctx, L('dead.line'), 200, 116, { align: 'center', color: PAL.cream2, shadow: PAL.ink });
    if (Math.floor(game.time * 3) % 2 === 0) {
      drawText(ctx, L('dead.hint'), 200, 140, { align: 'center', color: PAL.gold, shadow: PAL.ink });
    }
    ctx.globalAlpha = 1;
  },

  /* ---------- prologue: the story before the road ---------- */

  prologue(ctx, game) {
    const pro = game.prologueDef || PROLOGUE;
    const t = game.prologueT;
    if (t < pro.crawlDur) {
      this.crawl(ctx, t, pro);
      return;
    }
    const cur = pro.sceneAt(t - pro.crawlDur);
    const draw = SCENE_DRAW[cur.id];
    if (draw) draw.call(this, ctx, game, cur.local);

    /* black seam between panels: fade up at the start, down at the end.
       the last panel never fades down - it waits for the player there. */
    const isLast = cur.i === pro.scenes.length - 1;
    const fadeIn = U.clamp(cur.local / 0.4, 0, 1);
    const fadeOut = isLast ? 1 : U.clamp((cur.dur - cur.local) / 0.4, 0, 1);
    const a = Math.min(fadeIn, fadeOut);
    if (a < 1) {
      ctx.globalAlpha = 1 - a;
      ctx.fillStyle = PAL.inkDeep;
      ctx.fillRect(0, 0, 400, 224);
      ctx.globalAlpha = 1;
    }

    /* where we are in the story */
    const dots = pro.scenes.length;
    for (let i = 0; i < dots; i++) {
      const x = 200 - (dots - 1) * 5 + i * 10;
      ctx.fillStyle = i === cur.i ? PAL.gold : PAL.shadow;
      ctx.fillRect(x - 2, 212, 4, 4);
    }
  },

  /* the crawl: gold text receding to a vanishing point over a starfield */
  crawl(ctx, t, pro) {
    ctx.fillStyle = '#04050b';
    ctx.fillRect(0, 0, 400, 224);

    for (const s of PROLOGUE_STARS) {
      const y = (s.y + t * s.s) % 224;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.6 + s.p));
      ctx.globalAlpha = tw * s.b;
      ctx.fillStyle = s.c;
      ctx.fillRect(Math.round(s.x), Math.round(y), s.l, s.l);
    }
    ctx.globalAlpha = 1;

    const lines = crawlLines(pro);
    if (!PROLOGUE_BAKED.length) {
      for (const L of lines) {
        if (!L.text) { PROLOGUE_BAKED.push(null); continue; }
        const w = Math.max(1, textWidth(L.text, 1));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = 8;
        const c = cv.getContext('2d');
        drawText(c, L.text, 0, 0, { color: L.color });
        PROLOGUE_BAKED.push(cv);
      }
    }

    /* each line enters at the vanishing point, grows, and drops off the bottom */
    const TRAVEL = 6.2, dt = 0.40;
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < lines.length; i++) {
      const img = PROLOGUE_BAKED[i];
      if (!img) continue;
      const L = lines[i];
      const q = (t - i * dt) / TRAVEL;
      if (q < 0 || q > 1.02) continue;
      const s = (0.5 + 0.6 * Math.pow(q, 1.6)) * L.mul;
      const y = 4 + 220 * Math.pow(q, 0.75);
      if (y > 230) continue;
      const a = U.clamp(q / 0.12, 0, 1) * U.clamp((1 - q) / 0.10, 0, 1);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      const w = Math.round(img.width * s), h = Math.round(img.height * s);
      ctx.drawImage(img, Math.round(200 - w / 2), Math.round(y), w, h);
    }
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;

    /* opening fade up from black */
    if (t < 1.6) {
      ctx.globalAlpha = U.clamp(1 - t / 1.6, 0, 1);
      ctx.fillStyle = PAL.inkDeep;
      ctx.fillRect(0, 0, 400, 224);
      ctx.globalAlpha = 1;
    }

    this.skipHint(ctx, t);
  },

  skipHint(ctx, t) {
    if (Math.floor(t * 2) % 2 === 0) {
      drawText(ctx, L('prologue.skip'), 200, 210,
        { align: 'center', color: PAL.stone, shadow: PAL.ink });
    }
  },

  /* a strip of real meadow floor for the story panels */
  meadowFloor(ctx, top) {
    for (let tx = 0; tx < 25; tx++) {
      ctx.drawImage(Tiles.cache.dirtTop[tx % 3], tx * 16, top);
      ctx.drawImage(Tiles.cache.dirt[(tx + 1) % 2], tx * 16, top + 16);
      ctx.drawImage(Tiles.cache.dirt[tx % 2], tx * 16, top + 32);
    }
  },

  /* ---------- the story panels ---------- */

  sceneMeadow(ctx, game, t) {
    Backgrounds.draw(ctx, 'dusk', 0, 0, game.time);
    this.meadowFloor(ctx, 184);

    for (let i = 0; i < 9; i++) {
      const mx = 14 + i * 42;
      const my = 176 + (i % 3) * 3;
      ctx.drawImage(Sprites.marigold, mx, my);
    }

    const breathe = Math.sin(game.time * 2) > 0 ? 0 : 1;
    ctx.drawImage(Sprites.princess, 248, 166 + breathe);

    const idle = Sprites.hero.idle;
    ctx.drawImage(Sprites.facing(idle, 1), 150, 166);

    this.playBeats(ctx, CUTSCENE.meadow, t);
  },

  /* she asks him for help, and the meadow turns cold */
  sceneAsk(ctx, game, t) {
    Backgrounds.draw(ctx, 'dusk', 0, 0, game.time);
    this.meadowFloor(ctx, 184);

    /* the light goes out of the meadow */
    const dark = U.clamp(t / 13, 0, 1) * 0.5;
    ctx.fillStyle = 'rgba(11,9,18,' + dark.toFixed(3) + ')';
    ctx.fillRect(0, 0, 400, 224);

    /* the marigolds bow away from the wind */
    for (let i = 0; i < 9; i++) {
      const sway = t > 6 ? Math.round(Math.sin(game.time * 2.4 + i) * 2) : 0;
      ctx.drawImage(Sprites.marigold, 14 + i * 42 + sway, 176 + (i % 3) * 3);
    }

    const breathe = Math.sin(game.time * 2) > 0 ? 0 : 1;
    ctx.drawImage(Sprites.princess, 248, 166 + breathe);

    const idle = Sprites.hero.idle;
    ctx.drawImage(Sprites.facing(idle, 1), 150, 166);

    /* a root breaks the turf at the edge of the meadow */
    if (t > 11.5) {
      const grow = U.clamp((t - 11.5) / 2.4, 0, 1);
      const segs = 9;
      for (let i = 0; i < segs; i++) {
        if (i / segs > grow) break;
        const x = 294 + i * 11;
        const y = 196 - Math.round(Math.sin(i * 0.9) * 2);
        ctx.fillStyle = PAL.ink;
        ctx.fillRect(x, y + 2, 12, 4);
        ctx.fillStyle = PAL.moss;
        ctx.fillRect(x, y + 1, 11, 3);
        ctx.fillStyle = PAL.leafDark;
        ctx.fillRect(x + 3, y - 2, 2, 3);
        ctx.fillRect(x + 8, y - 3, 2, 4);
      }
    }

    this.playBeats(ctx, CUTSCENE.ask, t);
  },

  sceneShadow(ctx, game, t) {
    Backgrounds.draw(ctx, 'dusk', 0, 0, game.time);
    this.meadowFloor(ctx, 184);

    /* night creeps over the meadow */
    const dark = U.clamp(t / 5, 0, 1) * 0.72;
    ctx.fillStyle = 'rgba(11,9,18,' + dark.toFixed(3) + ')';
    ctx.fillRect(0, 0, 400, 224);

    for (let i = 0; i < 9; i++) {
      const shake = t > 1.1 ? Math.round(Math.sin(game.time * 40 + i) * 2) : 0;
      ctx.drawImage(Sprites.marigold, 14 + i * 42 + shake, 176 + (i % 3) * 3);
    }

    ctx.drawImage(Sprites.princess, 248, 166);

    /* the beast claws up out of the dark on the right */
    const rise = U.clamp((t - 0.9) / 1.4, 0, 1);
    if (rise > 0) {
      const by = 208 - rise * 34;
      const img = (t > 1.6 && Math.floor(t * 6) % 2 === 0) ? Sprites.beastRoar : Sprites.beast;
      ctx.drawImage(img, 300, by - 6);
    }

    /* the shockwave */
    if (t > 1.2 && t < 1.7) {
      const w = U.clamp((t - 1.2) / 0.5, 0, 1);
      ctx.globalAlpha = (1 - w) * 0.5;
      ctx.fillStyle = PAL.rust;
      ctx.fillRect(0, 0, 400, 224);
      ctx.globalAlpha = 1;
    }

    const idle = Sprites.hero.idle;
    ctx.drawImage(Sprites.facing(idle, 1), 150, 166);

    this.playBeats(ctx, CUTSCENE.shadow, t);
  },

  sceneTaking(ctx, game, t) {
    Backgrounds.draw(ctx, 'dusk', 0, 0, game.time);
    this.meadowFloor(ctx, 184);

    ctx.fillStyle = 'rgba(11,9,18,0.72)';
    ctx.fillRect(0, 0, 400, 224);

    /* the beast lifts away to the east, carrying her */
    const lift = U.clamp(t / 4.2, 0, 1);
    const bx = 290 + lift * 120;
    const by = 150 - lift * 90;
    ctx.drawImage(Sprites.beast, bx, by);
    ctx.drawImage(Sprites.princess, bx + 2, by - 22 + Math.round(Math.sin(game.time * 3) * 1));

    /* Finn runs after them */
    const run = U.clamp(t / 2.4, 0, 1);
    const frame = Sprites.hero.run[Math.floor(game.time * 12) % 2];
    ctx.drawImage(Sprites.facing(frame, 1), 90 + run * 70, 166);

    this.playBeats(ctx, CUTSCENE.taking, t);
  },

  sceneKnight(ctx, game, t) {
    Backgrounds.draw(ctx, 'night', 0, 0, game.time);
    this.meadowFloor(ctx, 184);

    ctx.fillStyle = 'rgba(11,9,18,0.66)';
    ctx.fillRect(0, 0, 400, 224);

    /* the last marigolds of the meadow, still burning */
    for (let i = 0; i < 5; i++) {
      ctx.drawImage(Sprites.marigold, 20 + i * 30, 176 + (i % 2) * 2);
    }

    /* Finn alone, shield up, blade drawn - and then down on one knee */
    const ready = U.clamp((t - 0.8) / 1.4, 0, 1);
    const frame = ready > 0.99 ? Sprites.hero.idle : Sprites.hero.run[Math.floor(game.time * 12) % 2];
    const kneel = U.clamp((t - 6.2) / 0.7, 0, 1);
    ctx.globalAlpha = 1 - kneel;
    ctx.drawImage(Sprites.facing(frame, 1), 120, 166);
    if (ready > 0.5 && kneel < 1) {
      ctx.globalAlpha = (ready - 0.5) * 2 * (1 - kneel);
      ctx.drawImage(Sprites.shield, 104, 168);
    }
    ctx.globalAlpha = 1;
    if (kneel > 0) {
      ctx.globalAlpha = kneel;
      ctx.drawImage(Sprites.hero.kneel.r, 122, 166);
      ctx.globalAlpha = 1;
    }

    this.playBeats(ctx, CUTSCENE.knight, t);

    if (t > 8.6) {
      if (Math.floor(game.time * 2) % 2 === 0) {
        drawText(ctx, L('scene.knight.ride'), 200, 132,
          { align: 'center', color: PAL.white, shadow: PAL.ink });
      }
      drawText(ctx, L('scene.knight.skip'), 200, 144,
        { align: 'center', color: PAL.cream2, shadow: PAL.ink });
    }
  },

  /* ---------- her side of the same night ---------- */

  /* the meadow, and the keeper who looks after it */
  sceneKeepMeadow(ctx, game, t) {
    Backgrounds.draw(ctx, 'dusk', 0, 0, game.time);
    this.meadowFloor(ctx, 184);

    /* the marigolds are late, and a few of them are already grey */
    for (let i = 0; i < 9; i++) {
      const mx = 14 + i * 42;
      const my = 176 + (i % 3) * 3;
      if (i === 3 || i === 7) {
        ctx.globalAlpha = 0.55;
        ctx.drawImage(Sprites.bloomDead, mx, my - 6);
        ctx.globalAlpha = 1;
      } else {
        ctx.drawImage(Sprites.marigold, mx, my);
      }
    }

    /* she is at the middle of the meadow, checking them */
    const breathe = Math.sin(game.time * 2) > 0 ? 0 : 1;
    ctx.drawImage(Sprites.keeper.idle.r, 240, 164 + breathe);

    /* Finn is a few steps away, waiting */
    const idle = Sprites.hero.idle;
    ctx.drawImage(Sprites.facing(idle, 1), 148, 166);

    this.playBeats(ctx, CUTSCENE.keepMeadow, t);
  },

  /* she asks him to hold the meadow, and he will not */
  sceneKeepAsk(ctx, game, t) {
    Backgrounds.draw(ctx, 'dusk', 0, 0, game.time);
    this.meadowFloor(ctx, 184);

    /* the light goes out of the meadow as they talk */
    const dark = U.clamp(t / 14, 0, 1) * 0.5;
    ctx.fillStyle = 'rgba(11,9,18,' + dark.toFixed(3) + ')';
    ctx.fillRect(0, 0, 400, 224);

    for (let i = 0; i < 9; i++) {
      const sway = t > 6 ? Math.sin(game.time * 2.2 + i) * 1 : 0;
      ctx.drawImage(Sprites.marigold, 14 + i * 42, 176 + (i % 3) * 3 + sway);
    }

    /* she turns to him */
    const face = U.clamp((t - 0.6) / 0.5, 0, 1);
    ctx.drawImage(Sprites.keeper.idle.r, 236, 164);
    if (face > 0.5) {
      ctx.drawImage(Sprites.keeper.idle.l, 236, 164);
    }

    /* he does not want to stay */
    const step = U.clamp((t - 9.0) / 1.6, 0, 1);
    const frame = step > 0 && step < 1 ? Sprites.hero.run[Math.floor(game.time * 12) % 2] : Sprites.hero.idle;
    ctx.drawImage(Sprites.facing(frame, 1), 150 - step * 10, 166);

    this.playBeats(ctx, CUTSCENE.keepAsk, t);
  },

  /* the briar, and the road going grey */
  sceneKeepShadow(ctx, game, t) {
    Backgrounds.draw(ctx, 'dusk', 0, 0, game.time);
    this.meadowFloor(ctx, 184);

    ctx.fillStyle = 'rgba(11,9,18,0.68)';
    ctx.fillRect(0, 0, 400, 224);

    /* the briar rises out of the far end of the meadow */
    const rise = U.clamp(t / 6.5, 0, 1);
    const bh = Math.round(70 * rise);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(24, 196 - bh, 150, bh);
    ctx.fillStyle = PAL.moss;
    for (let i = 0; i < 14; i++) {
      const x = 30 + i * 10;
      const y = 196 - bh + Math.round(Math.sin(i * 0.9) * 6);
      ctx.fillRect(x, y, 8, 3);
      ctx.fillRect(x + 2, y - 3, 2, 3);
    }
    ctx.fillStyle = PAL.leafDark;
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(34 + i * 14, 196 - bh + 6 + (i % 3) * 5, 3, 2);
    }

    /* she does not run */
    ctx.drawImage(Sprites.keeper.idle.r, 240, 164);

    this.playBeats(ctx, CUTSCENE.keepShadow, t);
  },

  /* she walks west, and he follows her anyway */
  sceneKeepWest(ctx, game, t) {
    Backgrounds.draw(ctx, 'night', 0, 0, game.time);
    this.meadowFloor(ctx, 184);
    ctx.fillStyle = 'rgba(11,9,18,0.62)';
    ctx.fillRect(0, 0, 400, 224);

    /* the briar closes in behind them */
    for (let i = 0; i < 11; i++) {
      const x = 6 + i * 9;
      const y = 198 - Math.round(Math.sin(i * 0.8) * 4);
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(x, y + 3, 11, 5);
      ctx.fillStyle = PAL.moss;
      ctx.fillRect(x, y, 10, 4);
      ctx.fillStyle = PAL.leafDark;
      ctx.fillRect(x + 2, y - 3, 2, 3);
      ctx.fillRect(x + 7, y - 2, 2, 2);
    }

    /* she walks west, into the dark */
    const walk = U.clamp(t / 4.0, 0, 1);
    const frame = Sprites.keeper.run[Math.floor(game.time * 11) % 2];
    ctx.drawImage(Sprites.facing(frame, -1), 312 - walk * 186, 164);

    /* and behind her, a small knight who was told to stay */
    const follow = U.clamp((t - 3.4) / 3.0, 0, 1);
    const fframe = Sprites.hero.run[Math.floor(game.time * 11) % 2];
    ctx.drawImage(Sprites.facing(fframe, -1), 336 - follow * 176, 166);

    this.playBeats(ctx, CUTSCENE.keepWest, t);
  },

  /* the old bloom, under the fen */
  sceneKeepHeart(ctx, game, t) {
    Backgrounds.draw(ctx, 'night', 0, 0, game.time);
    this.meadowFloor(ctx, 184);
    ctx.fillStyle = 'rgba(11,9,18,0.58)';
    ctx.fillRect(0, 0, 400, 224);

    /* a few marigolds still burning */
    for (let i = 0; i < 5; i++) {
      ctx.drawImage(Sprites.marigold, 18 + i * 30, 176 + (i % 2) * 2);
    }

    /* she stands at the road's end with her light up */
    const kneel = U.clamp((t - 7.4) / 0.7, 0, 1);
    ctx.globalAlpha = 1 - kneel;
    ctx.drawImage(Sprites.keeper.idle.r, 150, 164);
    ctx.globalAlpha = 1;
    if (kneel > 0) {
      ctx.globalAlpha = kneel;
      ctx.drawImage(Sprites.keeper.kneel.r, 152, 164);
      ctx.globalAlpha = 1;
    }

    /* the light she carries */
    ctx.globalAlpha = 0.45 + Math.sin(game.time * 2.4) * 0.06;
    ctx.drawImage(Sprites.light, 150, 130, 104, 104);
    ctx.globalAlpha = 1;

    /* the old bloom itself, breathing, far off under the fen */
    const glow = 0.35 + Math.sin(game.time * 1.6) * 0.12;
    ctx.globalAlpha = glow;
    ctx.drawImage(Sprites.light, 288, 150, 66, 66);
    ctx.globalAlpha = 1;
    ctx.drawImage(Sprites.bloom[2], 300, 176);

    this.playBeats(ctx, CUTSCENE.keepHeart, t);
  },

  /* ---------- dialogue ---------- */

  /* show the newest beat, fading in; optionally typed out letter by letter */
  playBeats(ctx, beats, t) {
    let cur = null;
    for (const b of beats) if (t >= b.at) cur = b;
    if (!cur) return;
    const age = t - cur.at;
    const full = L(cur.key);
    let reveal = null;
    if (Save.data.reveal === 'typed') {
      const n = Math.floor(age * 26);
      if (n < full.length) reveal = Math.max(0, n);
    }
    const a = U.clamp(age / 0.45, 0, 1);
    ctx.globalAlpha = a;
    this.sayBox(ctx, cur.who, full, reveal);
    ctx.globalAlpha = 1;
  },

  /* the box grows upward so long lines never run off the screen */
  sayBox(ctx, who, text, reveal) {
    const bw = 340;
    const full = String(text);
    const lines = wrapText(full, bw - 16, 1);
    const bh = Math.max(44, 12 + lines.length * 9 + 8);
    const bx = 30;
    const by = 200 - bh;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(bx, by, bw, 1);
    ctx.fillRect(bx, by + bh - 1, bw, 1);
    ctx.fillRect(bx, by, 1, bh);
    ctx.fillRect(bx + bw - 1, by, 1, bh);
    if (who) drawText(ctx, who, bx + 8, by + 7, { color: PAL.gold });
    const top = by + (who ? 19 : 12);
    const shown = (reveal === null) ? full : full.slice(0, reveal);
    drawParagraph(ctx, shown, bx + 8, top, bw - 16, { color: PAL.cream });
    if (reveal !== null) {
      const rl = wrapText(shown, bw - 16, 1);
      if (rl.length) {
        const last = rl[rl.length - 1];
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(bx + 8 + textWidth(last, 1) + 1, top + (rl.length - 1) * 9, 1, 7);
      }
    }
  },

  /* ---------- the finding ---------- */

  rescue(ctx, game) {
    const t = game.rescueT;

    /* chamber */
    Backgrounds.draw(ctx, 'night', 0, 0, game.time);

    for (let ty = 0; ty < 18; ty++) {
      for (let tx = 0; tx < 25; tx++) {
        const windowHole = tx >= 11 && tx <= 13 && ty >= 2 && ty <= 6;
        if (windowHole) continue;
        if (ty >= 13) {
          ctx.drawImage(Tiles.cache.flag[(tx + ty) % 2], tx * 16, ty * 16);
        } else {
          ctx.drawImage(Tiles.cache.stone[(tx + ty) % 2], tx * 16, ty * 16);
        }
      }
    }
    /* window frame */
    ctx.fillStyle = PAL.inkSoft;
    ctx.fillRect(11 * 16 - 2, 2 * 16 - 2, 3 * 16 + 4, 5 * 16 + 4);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(11 * 16, 2 * 16 - 4, 3 * 16, 4);
    ctx.fillStyle = PAL.stoneDark;
    ctx.fillRect(11 * 16, 6 * 16 + 16, 3 * 16, 4);
    ctx.fillStyle = PAL.stoneDark;
    ctx.fillRect(12 * 16 + 7, 2 * 16, 2, 80);
    ctx.fillRect(11 * 16, 4 * 16, 48, 2);

    Tiles.drawTorch(ctx, 4 * 16 + 8, 13 * 16, game.time);
    Tiles.drawTorch(ctx, 20 * 16 + 8, 13 * 16, game.time + 1.4);

    /* floor runner */
    ctx.fillStyle = PAL.moss;
    ctx.fillRect(120, 206, 160, 8);
    ctx.fillStyle = PAL.leafDark;
    ctx.fillRect(120, 206, 160, 2);

    /* SnoozyPaw, spent, by the wall */
    const ex = 236;
    const ey = 208 - 18;
    const breathe = Math.sin(game.time * 2) > 0 ? 0 : 1;
    ctx.drawImage(Sprites.princessWeak, ex, ey + breathe);

    /* Finn walks in, then goes down on one knee */
    const walkT = U.clamp((t - 0.3) / 2.6, 0, 1);
    const wx = Math.round(U.lerp(-20, 150, U.easeOutCubic(walkT)));
    const moving = walkT < 1;
    const frame = moving ? Sprites.hero.run[Math.floor(game.time * 10) % 2] : Sprites.hero.idle;
    const kneel = U.clamp((t - 5.2) / 0.5, 0, 1);
    if (kneel < 1) {
      ctx.globalAlpha = 1 - kneel;
      ctx.drawImage(Sprites.facing(frame, 1), wx, 186);
      ctx.globalAlpha = 1;
    }
    if (kneel > 0) {
      ctx.globalAlpha = kneel;
      ctx.drawImage(Sprites.hero.kneel.r, wx + 2, 186);
      ctx.globalAlpha = 1;
    }

    /* petals drift in as the room warms up */
    if (t > 11) {
      const rnd = U.rng(5);
      for (let i = 0; i < 26; i++) {
        const px = rnd() * 400;
        const speed = 16 + rnd() * 20;
        const py = ((game.time * speed + rnd() * 224) % 240) - 10;
        ctx.fillStyle = i % 3 === 0 ? PAL.gold : PAL.marigold;
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
    }

    /* dialogue */
    this.playBeats(ctx, CUTSCENE.rescue, t);

    /* the white-out into the epilogue */
    if (t > 19.0) {
      const flash = U.clamp((t - 19.0) / 0.8, 0, 1);
      ctx.globalAlpha = flash * 0.8;
      ctx.fillStyle = PAL.white;
      ctx.fillRect(0, 0, 400, 224);
      ctx.globalAlpha = 1;
    }
  },

  /* ---------- the reunion: dawn, and the rest of their lives ---------- */

  epilogue(ctx, game) {
    const t = game.epilogueT;
    const keep = game.road === 'keep';
    const heartsAt = keep ? 24.4 : 12.4;
    const cardAt = keep ? 25.6 : 21.2;

    Backgrounds.draw(ctx, 'day', 0, 0, game.time);
    this.meadowFloor(ctx, 184);

    /* the sun comes up over the meadow */
    const dark = U.clamp(1 - t / 3.4, 0, 1) * 0.85;
    if (dark > 0.001) {
      ctx.fillStyle = 'rgba(11,9,18,' + dark.toFixed(3) + ')';
      ctx.fillRect(0, 0, 400, 224);
    }

    /* the marigolds are blooming again */
    for (let i = 0; i < 11; i++) {
      const mx = 10 + i * 37;
      const my = 176 + (i % 3) * 3;
      ctx.drawImage(Sprites.marigold, mx, my);
    }

    /* the two of them, together */
    const bob = Math.sin(game.time * 3) > 0 ? 0 : -1;
    if (keep) {
      ctx.drawImage(Sprites.keeper.idle.r, 154, 164 + bob);
      ctx.drawImage(Sprites.facing(Sprites.hero.idle, 1), 184, 166 - bob);
    } else {
      ctx.drawImage(Sprites.facing(Sprites.hero.idle, 1), 158, 176 + bob);
      ctx.drawImage(Sprites.princess, 184, 178 - bob);
    }

    /* hearts, once the words have been said */
    if (t > heartsAt) {
      const rise = U.clamp((t - heartsAt) / 2.2, 0, 1);
      for (let i = 0; i < 7; i++) {
        const seed = i * 1.7;
        const p = (game.time * 0.35 + seed * 0.31) % 1;
        const hx = 168 + i * 9 + Math.sin(game.time * 1.1 + seed) * 7;
        const hy = 172 - p * 38;
        ctx.globalAlpha = U.clamp(1 - p, 0, 1) * rise * 0.95;
        this.heart(ctx, Math.round(hx), Math.round(hy), true);
      }
      ctx.globalAlpha = 1;
    }

    /* dialogue */
    this.playBeats(ctx, keep ? CUTSCENE.keepEpilogue : CUTSCENE.epilogue, t);

    /* the closing card */
    if (t > cardAt) {
      const a = U.clamp((t - cardAt) / 0.8, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(30, 106, 340, 22);
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(30, 106, 340, 1);
      ctx.fillRect(30, 127, 340, 1);
      drawText(ctx, L(keep ? 'epilogue.keep.card' : 'epilogue.card'), 200, 113, { align: 'center', color: PAL.gold });
      ctx.globalAlpha = 1;
    }
  },

  /* ---------- victory ---------- */

  victory(ctx, game) {
    const keep = game.road === 'keep';
    const coop = game.road === 'coop';
    const cam = 100;
    Backgrounds.draw(ctx, keep || coop ? 'day' : 'day', cam, 0, game.time);
    ctx.save();
    ctx.translate(-cam, 0);
    Tiles.draw(ctx, game.titleLevel, cam, 0, game.time);
    Tiles.drawDecor(ctx, game.titleLevel, cam, 0, game.time);
    ctx.restore();

    ctx.fillStyle = 'rgba(11,9,18,0.5)';
    ctx.fillRect(0, 0, 400, 224);

    /* the pair standing together */
    const bob = Math.sin(game.time * 3) > 0 ? 0 : -1;
    if (keep || coop) {
      ctx.drawImage(Sprites.keeper.idle.r, 148, 176 + bob);
      ctx.drawImage(Sprites.facing(Sprites.hero.idle, 1), 176, 178 - bob);
    } else {
      ctx.drawImage(Sprites.facing(Sprites.hero.idle, 1), 150, 176 + bob);
      ctx.drawImage(Sprites.princess, 176, 178 - bob);
    }
    for (let i = 0; i < 7; i++) {
      ctx.drawImage(Sprites.marigold, 120 + i * 26, 196 + (i % 2) * 2);
    }

    const titleKey = coop ? 'victory.coop.title' : (keep ? 'victory.keep.title' : 'victory.title');
    const lineKey = coop ? 'victory.coop.line' : (keep ? 'victory.keep.line' : 'victory.line');
    const romanceKey = keep ? 'victory.keep.romance' : 'victory.romance';

    this.logo(ctx, L(titleKey), 200, 22, 3, PAL.cream, PAL.rust);
    drawText(ctx, L(lineKey), 200, 58,
      { align: 'center', color: PAL.gold, shadow: PAL.ink });
    drawText(ctx, L(romanceKey), 200, 70,
      { align: 'center', color: PAL.cream2, shadow: PAL.ink });

    this.panel(ctx, 74, 80, 252, 92);
    drawText(ctx, L('victory.flowers'), 200, 86, { align: 'center', color: PAL.cream2 });

    const camp = game.campaign();
    const best = (game.road === 'keep') ? Save.data.keepBest : Save.data.best;
    let total = 0;
    for (let i = 0; i < camp.length; i++) total += best[i] || 0;
    let possible = 0;
    for (const def of camp) possible += new Level(def).totalFlowers;

    drawText(ctx, String(total) + ' / ' + String(possible).padStart(3, '0'),
      200, 96, { align: 'center', color: PAL.marigold, scale: 2 });
    for (let i = 0; i < camp.length; i++) {
      drawText(ctx, L(camp[i].nameKey) + '  ' + String(best[i] || 0).padStart(2, '0'),
        200, 118 + i * 9, { align: 'center', color: PAL.cream });
    }

    if (keep) {
      if (Math.floor(game.time * 2) % 2 === 0) {
        drawText(ctx, L('victory.keep.letter'), 200, 180,
          { align: 'center', color: PAL.marigold, shadow: PAL.ink });
      }
      drawText(ctx, L('victory.thanks'), 200, 210,
        { align: 'center', color: PAL.cream2, shadow: PAL.ink });
    } else {
      if (Math.floor(game.time * 2) % 2 === 0) {
        drawText(ctx, L('victory.back'), 200, 180,
          { align: 'center', color: PAL.white, shadow: PAL.ink });
      }
      drawText(ctx, L('victory.thanks'), 200, 210,
        { align: 'center', color: PAL.cream2, shadow: PAL.ink });
    }

    this.rects.victoryExit = { x: 90, y: 172, w: 220, h: 22 };
  },

  /* ---------- one keepsake, on its own ---------- */

  keepsake(ctx, game) {
    const idx = game.keepsakeIdx;
    const src = Photos.cards[idx];
    const cap = L('photo.' + idx + '.caption');

    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);

    if (src) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, 400, 224);
      /* knock it back toward the game's palette */
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = PAL.inkDeep;
      ctx.fillRect(0, 0, 400, 224);
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = PAL.marigold;
      ctx.fillRect(0, 0, 400, 224);
      ctx.globalAlpha = 1;
    } else {
      /* nothing to show: the marigolds stand in for it */
      ctx.drawImage(Sprites.marigold, 188, 96);
      ctx.drawImage(Sprites.marigold, 168, 100);
      ctx.drawImage(Sprites.marigold, 208, 98);
    }

    /* the caption sits on its own band at the bottom */
    if (cap) {
      ctx.fillStyle = 'rgba(11,9,18,0.78)';
      ctx.fillRect(0, 192, 400, 32);
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(0, 192, 400, 1);
      drawMixed(ctx, cap, 200, 200, { align: 'center', color: PAL.cream });
    }

    if (Math.floor(game.time * 2) % 2 === 0) {
      drawText(ctx, L('keepsake.hint'), 200, 176,
        { align: 'center', color: PAL.cream2, shadow: PAL.ink });
    }
  },

  /* ---------- one keepsake, large ---------- */

  photoView(ctx, game) {
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);
    ctx.fillStyle = '#131019';
    for (let y = 0; y < 224; y += 8) {
      for (let x = ((y / 8) % 2) * 8; x < 400; x += 16) ctx.fillRect(x, y, 8, 8);
    }

    const idx = game.mementoSel + 1;
    const src = Photos.cards[idx];
    const x = 40, y = 16, w = 320, h = 192;

    if (src) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, x, y, w, h);
      /* the same knock-back the small cards get */
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = PAL.inkDeep;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = PAL.marigold;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    }

    /* a thin gold frame */
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(x - 2, y - 2, w + 4, 2);
    ctx.fillRect(x - 2, y + h, w + 4, 2);
    ctx.fillRect(x - 2, y - 2, 2, h + 4);
    ctx.fillRect(x + w, y - 2, 2, h + 4);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x - 1, y - 1, w + 2, 1);
    ctx.fillRect(x - 1, y + h, w + 2, 1);
    ctx.fillRect(x - 1, y - 1, 1, h + 2);
    ctx.fillRect(x + w, y - 1, 1, h + 2);

    drawMixed(ctx, L('photo.' + idx + '.caption'), 200, 212,
      { align: 'center', color: PAL.marigold });
  },

  /* ---------- choosing a road ---------- */

  roadSelect(ctx, game) {
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);
    ctx.fillStyle = '#131019';
    for (let y = 0; y < 224; y += 8) {
      for (let x = ((y / 8) % 2) * 8; x < 400; x += 16) ctx.fillRect(x, y, 8, 8);
    }

    this.logo(ctx, L('road.title'), 200, 12, 2, PAL.cream, PAL.rust);

    const roads = game.roadList();
    const cardW = 112, cardH = 140, gap = 8;
    const total = cardW * roads.length + gap * (roads.length - 1);
    const x0 = Math.floor((400 - total) / 2);
    const y = 42;

    this.rects.roads = [];
    for (let i = 0; i < roads.length; i++) {
      const r = roads[i];
      const x = x0 + i * (cardW + gap);
      const sel = game.roadSel === i;
      this.rects.roads.push({ x, y, w: cardW, h: cardH, i });

      ctx.fillStyle = PAL.ink;
      ctx.fillRect(x, y, cardW, cardH);
      ctx.fillStyle = sel ? PAL.gold : PAL.shadow;
      ctx.fillRect(x + 2, y + 2, cardW - 4, cardH - 4);

      /* a little picture of the road */
      const px = x + 5, py = y + 5, pw = cardW - 10, ph = 52;
      this.preview(ctx, r.theme, px, py, pw, ph, i + 1);
      if (r.profile === 'keep') ctx.drawImage(Sprites.keeper.idle.r, px + pw - 24, py + ph - 24);
      else ctx.drawImage(Sprites.facing(Sprites.hero.idle, 1), px + pw - 22, py + ph - 22);

      if (r.locked) {
        ctx.fillStyle = 'rgba(11,9,18,0.72)';
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = PAL.cream2;
        ctx.fillRect(px + pw / 2 - 7, py + ph / 2 - 2, 14, 11);
        ctx.fillStyle = PAL.inkSoft;
        ctx.fillRect(px + pw / 2 - 5, py + ph / 2, 10, 7);
        ctx.fillStyle = PAL.cream2;
        ctx.fillRect(px + pw / 2 - 5, py + ph / 2 - 9, 10, 7);
        ctx.fillStyle = PAL.inkSoft;
        ctx.fillRect(px + pw / 2 - 3, py + ph / 2 - 7, 6, 5);
      }

      drawText(ctx, L(r.titleKey), x + cardW / 2, py + ph + 8,
        { align: 'center', color: r.locked ? PAL.stoneDark : PAL.cream });
      const subLines = this.wrapCenter(ctx, L(r.subKey), x + cardW / 2, py + ph + 19, cardW - 12,
        { align: 'center', color: r.locked ? PAL.stoneDark : PAL.cream2, lineHeight: 9 }, 2);

      const lineY = py + ph + 19 + subLines * 9 + 4;
      this.wrapCenter(ctx, L(r.lineKey), x + cardW / 2, lineY, cardW - 12,
        { align: 'center', color: PAL.gold, lineHeight: 9 }, 2);

      if (r.locked) {
        drawText(ctx, L('road.locked'), x + cardW / 2, y + cardH - 12,
          { align: 'center', color: PAL.stone });
      } else if (r.done) {
        drawText(ctx, L('road.done'), x + cardW / 2, y + cardH - 12,
          { align: 'center', color: PAL.marigold });
      }

      if (sel) {
        ctx.fillStyle = PAL.goldLight;
        ctx.fillRect(x + 2, y + 2, cardW - 4, 1);
        ctx.fillRect(x + 2, y + cardH - 3, cardW - 4, 1);
        drawText(ctx, '^', x + cardW / 2, y - 10, { align: 'center', color: PAL.gold });
      }
    }

    drawText(ctx, L('road.hint'), 200, 198, { align: 'center', color: PAL.cream, shadow: PAL.ink });
    drawText(ctx, L('title.memento') + '  ' + L('title.settings'), 200, 212,
      { align: 'center', color: PAL.stone, shadow: PAL.ink });
  },

  /* ---------- settings ---------- */

  settings(ctx, game) {
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);
    ctx.fillStyle = '#131019';
    for (let y = 0; y < 224; y += 8) {
      for (let x = ((y / 8) % 2) * 8; x < 400; x += 16) ctx.fillRect(x, y, 8, 8);
    }

    this.logo(ctx, L('settings.title'), 200, 12, 2, PAL.cream, PAL.rust);

    const items = game.settingsItems();
    this.rects.menu = [];
    for (let i = 0; i < items.length; i++) {
      const r = { x: 44, y: 44 + i * 22, w: 312, h: 20, i };
      this.rects.menu.push(r);
      const sel = game.settingsSel === i;
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = sel ? PAL.gold : PAL.inkSoft;
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      if (sel) drawText(ctx, '>', r.x + 6, r.y + 6, { color: PAL.ink });
      drawText(ctx, items[i].label, r.x + 14, r.y + 6, { color: sel ? PAL.ink : PAL.cream });
      if (items[i].value) {
        drawText(ctx, items[i].value, r.x + r.w - 12, r.y + 6,
          { align: 'right', color: sel ? PAL.ink : PAL.gold });
      }
      if (items[i].warn) {
        drawText(ctx, items[i].warn, r.x + r.w - 12, r.y + 6,
          { align: 'right', color: sel ? PAL.ink : PAL.rust });
      }
    }

    drawText(ctx, L('settings.hint'), 200, 210, { align: 'center', color: PAL.cream2, shadow: PAL.ink });
  },

  /* ---------- keepsakes ---------- */

  memento(ctx, game) {
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);
    ctx.fillStyle = '#131019';
    for (let y = 0; y < 224; y += 8) {
      for (let x = ((y / 8) % 2) * 8; x < 400; x += 16) ctx.fillRect(x, y, 8, 8);
    }

    this.logo(ctx, L('memento.title'), 200, 8, 2, PAL.cream, PAL.rust);

    const cw = 78, ch = 46, gapx = 6, gapy = 4, cols = 4;
    const x0 = Math.floor((400 - (cols * cw + (cols - 1) * gapx)) / 2);
    const y0 = 32;

    this.rects.photos = [];
    for (let i = 0; i < Photos.MAX; i++) {
      const idx = i + 1;
      const x = x0 + (i % cols) * (cw + gapx);
      const y = y0 + Math.floor(i / cols) * (ch + gapy);
      const sel = game.mementoSel === i;
      this.rects.photos.push({ x, y, w: cw, h: ch, i: idx });

      const open = Photos.unlocked(idx);
      const has = open && !!Photos.cards[idx];

      ctx.fillStyle = PAL.ink;
      ctx.fillRect(x, y, cw, ch);
      ctx.fillStyle = sel ? PAL.gold : '#1a1626';
      ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);

      if (has) {
        Photos.drawCard(ctx, idx, x + 2, y + 2, cw - 4, ch - 4);
        if (Save.sawPhoto(idx)) {
          ctx.fillStyle = PAL.goldLight;
          ctx.fillRect(x + cw - 8, y + 3, 4, 4);
        }
      } else {
        /* a closed bud waiting to be found */
        ctx.globalAlpha = open ? 0.4 : 0.18;
        ctx.drawImage(Sprites.bloom[1], x + cw / 2 - 8, y + ch / 2 - 6);
        ctx.globalAlpha = 1;
      }
    }

    /* the caption of whatever is selected */
    const sel = game.mementoSel;
    const openSel = sel < Photos.MAX && Photos.unlocked(sel + 1);
    const cap = openSel ? L('photo.' + (sel + 1) + '.caption') : L('memento.notFound');
    drawMixed(ctx, cap, 200, 184, { align: 'center', color: PAL.marigold });

    /* the letter */
    const lrow = { x: 120, y: 196, w: 160, h: 15 };
    this.rects.letter = lrow;
    const lsel = game.mementoSel === Photos.MAX;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(lrow.x, lrow.y, lrow.w, lrow.h);
    ctx.fillStyle = lsel ? PAL.gold : PAL.inkSoft;
    ctx.fillRect(lrow.x + 2, lrow.y + 2, lrow.w - 4, lrow.h - 4);
    if (lsel) drawText(ctx, '>', lrow.x + 6, lrow.y + 4, { color: PAL.ink });
    const letterOk = Save.data.letterSeen || Save.data.keepDone;
    drawText(ctx, L(letterOk ? 'memento.letter' : 'memento.letterLocked'), lrow.x + lrow.w / 2 + (lsel ? 4 : 0), lrow.y + 4,
      { align: 'center', color: lsel ? PAL.ink : (letterOk ? PAL.gold : PAL.stoneDark) });

    drawText(ctx, L('memento.hint'), 200, 216, { align: 'center', color: PAL.cream2, shadow: PAL.ink });
  },

  /* ---------- the letter ---------- */

  letter(ctx, game) {
    const t = game.letterT;
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);

    /* the page */
    const px = LETTER_PAGE.x, py = LETTER_PAGE.y;
    const pw = LETTER_PAGE.w, ph = LETTER_PAGE.h;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(px - 2, py - 2, pw + 4, ph + 4);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = PAL.cream2;
    ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(px + 2, py + ph - 4, pw - 4, 2);

    drawText(ctx, L('letter.title'), px + 10, py + 8, { color: PAL.inkDeep });
    drawText(ctx, L('letter.from'), px + 10, py + 20, { color: PAL.rust });

    /* a small face in the corner, if there is one */
    if (!Photos.drawPortrait(ctx, px + pw - 38, py + 8, 30)) {
      ctx.drawImage(Sprites.marigold, px + pw - 34, py + 12);
    }

    /* the rule under the header, stopping short of the portrait */
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(px + 10, py + 34, pw - 56, 1);

    /* the body, typed out letter by letter */
    const lines = letterBlock();
    const bodyY = py + 42;
    const signY = py + ph - 24;
    const lh = Math.max(9, Math.min(11,
      Math.floor((signY - bodyY) / Math.max(1, lines.length))));

    let budget = Math.floor(t * 52);
    let y = bodyY;
    for (const line of lines) {
      if (budget <= 0) break;
      const n = Math.min(budget, line.length);
      drawMixed(ctx, line.slice(0, n), px + 10, y, { color: PAL.inkDeep });
      budget -= line.length;
      y += lh;
    }

    /* the sign-off, once the whole letter is out */
    const totalChars = letterChars();
    if (t * 52 >= totalChars) {
      const sign = L('letter.sign', [letterName()]);
      const sy = Math.min(signY, y);
      drawMixed(ctx, sign, px + pw - 12, sy, { align: 'right', color: PAL.rust });
      if (Math.floor(t * 2.4) % 2 === 0) {
        const w = mixedWidth(sign, 1);
        ctx.fillStyle = PAL.rust;
        ctx.fillRect(px + pw - 12 - w + 1, sy + 1, 1, 7);
      }
    }

    /* the hint */
    if (t > totalChars / 52 + 0.4 && Math.floor(game.time * 2) % 2 === 0) {
      drawText(ctx, L('letter.hint'), 200, 218, { align: 'center', color: PAL.cream2, shadow: PAL.ink });
    }
  },

  /* ---------- transition ---------- */

  transition(ctx, game) {
    const tr = game.trans;
    if (!tr) return;
    const half = tr.dur / 2;
    const a = tr.t < half ? tr.t / half : 1 - (tr.t - half) / half;
    ctx.globalAlpha = U.clamp(a, 0, 1);
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);
    ctx.globalAlpha = 1;
  }
};

/* ---------- the prologue timeline ---------- */

/* how each crawl line is drawn: size multiplier and colour.
   The list must stay in step with the crawl text in the language tables. */
const PROLOGUE_STYLE = [
  { mul: 2.0, color: PAL.goldLight },
  { mul: 1.45, color: PAL.goldLight },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold },
  { mul: 1, color: PAL.gold }
];

/* both roads are the same night, told from opposite ends */
const PROLOGUE_DEFS = {
  finn: {
    crawlDur: 13,
    crawlKey: 'prologue.crawl',
    scenes: [
      { id: 'meadow', dur: 12 },
      { id: 'ask', dur: 15 },
      { id: 'shadow', dur: 9 },
      { id: 'taking', dur: 8 },
      { id: 'knight', dur: 11 }
    ]
  },
  keep: {
    crawlDur: 13,
    crawlKey: 'prologue2.crawl',
    scenes: [
      { id: 'keepMeadow', dur: 12 },
      { id: 'keepAsk', dur: 16 },
      { id: 'keepShadow', dur: 9 },
      { id: 'keepWest', dur: 12 },
      { id: 'keepHeart', dur: 12 }
    ]
  }
};

function makePrologue(def) {
  return {
    crawlDur: def.crawlDur,
    crawlKey: def.crawlKey,
    crawlStyle: PROLOGUE_STYLE,
    scenes: def.scenes,

    get panelsDur() {
      let s = 0;
      for (const sc of this.scenes) s += sc.dur;
      return s;
    },
    get end() { return this.crawlDur + this.panelsDur; },
    get lastStart() {
      return this.crawlDur + this.panelsDur - this.scenes[this.scenes.length - 1].dur;
    },

    /* which panel is playing, and how far into it */
    sceneAt(p) {
      let acc = 0;
      for (let i = 0; i < this.scenes.length; i++) {
        const sc = this.scenes[i];
        if (p < acc + sc.dur) return { id: sc.id, i, local: p - acc, dur: sc.dur };
        acc += sc.dur;
      }
      const last = this.scenes.length - 1;
      return { id: this.scenes[last].id, i: last, local: this.scenes[last].dur, dur: this.scenes[last].dur };
    },

    /* the time the next panel begins (or the end of the prologue) */
    nextSceneTime(t) {
      if (t < this.crawlDur) return this.crawlDur;
      const p = t - this.crawlDur;
      let acc = 0;
      for (const sc of this.scenes) {
        if (p < acc + sc.dur) return this.crawlDur + acc + sc.dur;
        acc += sc.dur;
      }
      return this.end;
    },

    /* the time a given panel begins */
    sceneStart(id) {
      let acc = 0;
      for (const sc of this.scenes) {
        if (sc.id === id) return this.crawlDur + acc;
        acc += sc.dur;
      }
      return this.crawlDur + acc;
    }
  };
}

const PROLOGUE = makePrologue(PROLOGUE_DEFS.finn);
const PROLOGUE_KEEP = makePrologue(PROLOGUE_DEFS.keep);

/* ---------- who says what, and when ---------- */

const CUTSCENE = {
  meadow: [
    { at: 1.4, who: 'SnoozyPaw', key: 'scene.meadow.1' },
    { at: 4.6, who: 'Finn', key: 'scene.meadow.2' },
    { at: 7.4, who: 'SnoozyPaw', key: 'scene.meadow.3' },
    { at: 10.2, who: 'Finn', key: 'scene.meadow.4' }
  ],
  ask: [
    { at: 2.0, who: 'SnoozyPaw', key: 'scene.ask.1' },
    { at: 4.6, who: 'Finn', key: 'scene.ask.2' },
    { at: 7.2, who: 'SnoozyPaw', key: 'scene.ask.3' },
    { at: 9.8, who: 'Finn', key: 'scene.ask.4' },
    { at: 12.4, who: 'SnoozyPaw', key: 'scene.ask.5' }
  ],
  shadow: [
    { at: 1.9, who: 'Finn', key: 'scene.shadow.1' },
    { at: 5.2, who: '', key: 'scene.shadow.2' }
  ],
  taking: [
    { at: 0.9, who: 'SnoozyPaw', key: 'scene.taking.1' },
    { at: 4.4, who: 'SnoozyPaw', key: 'scene.taking.2' }
  ],
  knight: [
    { at: 1.6, who: 'Finn', key: 'scene.knight.1' },
    { at: 5.0, who: 'Finn', key: 'scene.knight.2' },
    { at: 7.6, who: 'Finn', key: 'scene.knight.3' }
  ],
  rescue: [
    { at: 3.4, who: 'Finn', key: 'rescue.1' },
    { at: 6.4, who: 'SnoozyPaw', key: 'rescue.2' },
    { at: 8.4, who: 'Finn', key: 'rescue.3' },
    { at: 10.2, who: 'SnoozyPaw', key: 'rescue.4' },
    { at: 12.0, who: 'Finn', key: 'rescue.5' },
    { at: 14.0, who: 'SnoozyPaw', key: 'rescue.6' },
    { at: 16.0, who: 'Finn', key: 'rescue.7' },
    { at: 17.8, who: 'SnoozyPaw', key: 'rescue.8' }
  ],
  epilogue: [
    { at: 2.4, who: 'SnoozyPaw', key: 'epilogue.1' },
    { at: 4.0, who: 'Finn', key: 'epilogue.2' },
    { at: 5.6, who: 'SnoozyPaw', key: 'epilogue.3' },
    { at: 8.0, who: 'Finn', key: 'epilogue.4' },
    { at: 10.0, who: 'SnoozyPaw', key: 'epilogue.5' },
    { at: 11.8, who: 'Finn', key: 'epilogue.6' },
    { at: 13.8, who: 'SnoozyPaw', key: 'epilogue.7' },
    { at: 15.8, who: 'Finn', key: 'epilogue.8' },
    { at: 17.8, who: 'SnoozyPaw', key: 'epilogue.9' },
    { at: 19.6, who: 'Finn', key: 'epilogue.10' }
  ],

  /* ---------- her side of the same night ---------- */
  keepMeadow: [
    { at: 1.6, who: 'SnoozyPaw', key: 'scene.keep.1' },
    { at: 4.4, who: 'SnoozyPaw', key: 'scene.keep.2' },
    { at: 7.2, who: '', key: 'scene.keep.3' },
    { at: 10.0, who: 'Finn', key: 'scene.keep.4' }
  ],
  keepAsk: [
    { at: 2.0, who: 'SnoozyPaw', key: 'scene.keep.ask.1' },
    { at: 4.6, who: 'Finn', key: 'scene.keep.ask.2' },
    { at: 7.4, who: 'SnoozyPaw', key: 'scene.keep.ask.3' },
    { at: 10.0, who: 'Finn', key: 'scene.keep.ask.4' },
    { at: 12.6, who: 'SnoozyPaw', key: 'scene.keep.ask.5' },
    { at: 14.2, who: 'Finn', key: 'scene.keep.ask.6' }
  ],
  keepShadow: [
    { at: 1.9, who: 'SnoozyPaw', key: 'scene.keep.shadow.1' },
    { at: 5.0, who: '', key: 'scene.keep.shadow.2' }
  ],
  keepWest: [
    { at: 1.2, who: 'SnoozyPaw', key: 'scene.keep.west.1' },
    { at: 4.4, who: 'SnoozyPaw', key: 'scene.keep.west.2' },
    { at: 7.6, who: 'SnoozyPaw', key: 'scene.keep.west.3' }
  ],
  keepHeart: [
    { at: 1.8, who: 'SnoozyPaw', key: 'scene.keep.heart.1' },
    { at: 5.0, who: 'SnoozyPaw', key: 'scene.keep.heart.2' },
    { at: 8.4, who: 'SnoozyPaw', key: 'scene.keep.heart.3' }
  ],
  keepEpilogue: [
    { at: 2.4, who: '', key: 'epilogue.keep.1' },
    { at: 4.6, who: '', key: 'epilogue.keep.2' },
    { at: 6.8, who: 'Finn', key: 'epilogue.keep.3' },
    { at: 8.8, who: 'Finn', key: 'epilogue.keep.4' },
    { at: 11.0, who: 'SnoozyPaw', key: 'epilogue.keep.5' },
    { at: 12.6, who: 'SnoozyPaw', key: 'epilogue.keep.6' },
    { at: 14.4, who: 'SnoozyPaw', key: 'epilogue.keep.7' },
    { at: 16.4, who: 'SnoozyPaw', key: 'epilogue.keep.8' },
    { at: 18.4, who: 'SnoozyPaw', key: 'epilogue.keep.9' },
    { at: 20.6, who: 'Finn', key: 'epilogue.keep.10' },
    { at: 22.6, who: 'SnoozyPaw', key: 'epilogue.keep.11' }
  ]
};

/* which draw function paints which panel */
const SCENE_DRAW = {
  meadow: function (ctx, game, t) { UI.sceneMeadow(ctx, game, t); },
  ask: function (ctx, game, t) { UI.sceneAsk(ctx, game, t); },
  shadow: function (ctx, game, t) { UI.sceneShadow(ctx, game, t); },
  taking: function (ctx, game, t) { UI.sceneTaking(ctx, game, t); },
  knight: function (ctx, game, t) { UI.sceneKnight(ctx, game, t); },
  keepMeadow: function (ctx, game, t) { UI.sceneKeepMeadow(ctx, game, t); },
  keepAsk: function (ctx, game, t) { UI.sceneKeepAsk(ctx, game, t); },
  keepShadow: function (ctx, game, t) { UI.sceneKeepShadow(ctx, game, t); },
  keepWest: function (ctx, game, t) { UI.sceneKeepWest(ctx, game, t); },
  keepHeart: function (ctx, game, t) { UI.sceneKeepHeart(ctx, game, t); }
};

/* the crawl text, cached until the language changes */
let CRAWL_CACHE = null;
let CRAWL_KEY = null;
function crawlLines(prologue) {
  const def = prologue || PROLOGUE;
  if (!CRAWL_CACHE || CRAWL_KEY !== def.crawlKey) {
    const texts = L(def.crawlKey) || [];
    const styles = def.crawlStyle;
    const fallback = styles[styles.length - 1];
    CRAWL_CACHE = texts.map(function (t, i) {
      const st = styles[i] || fallback;
      return { text: t, mul: st.mul, color: st.color };
    });
    CRAWL_KEY = def.crawlKey;
    PROLOGUE_BAKED.length = 0;
  }
  return CRAWL_CACHE;
}

LANG.onChange(function () {
  CRAWL_CACHE = null;
  CRAWL_KEY = null;
  PROLOGUE_BAKED.length = 0;
});

const PROLOGUE_BAKED = [];

const PROLOGUE_STARS = (() => {
  const rnd = U.rng(90210);
  const out = [];
  for (let i = 0; i < 150; i++) {
    const layer = rnd();
    out.push({
      x: rnd() * 400,
      y: rnd() * 224,
      l: layer > 0.86 ? 2 : 1,
      s: 1.5 + layer * 11,
      b: 0.35 + layer * 0.65,
      p: rnd() * 6.283,
      c: layer > 0.92 ? PAL.cream : (layer > 0.7 ? PAL.cream2 : PAL.shadow)
    });
  }
  return out;
})();
