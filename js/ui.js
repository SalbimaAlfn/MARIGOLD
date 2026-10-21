/* MARIGOLD — all screen furniture: HUD, menus, cards, cutscenes.
   Every pixel is drawn with the 5x7 font or hand-placed rects. */

const UI = {
  rects: {},

  /* ---------- shared pieces ---------- */

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

    /* stage name, right */
    const def = STAGES[game.stageIndex];
    drawText(ctx, def.name, 368, 8, { align: 'right', color: PAL.cream, shadow: PAL.ink });
    drawText(ctx, 'STAGE ' + (game.stageIndex + 1) + '/3', 368, 18, { align: 'right', color: PAL.cream2, shadow: PAL.ink });

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
    ctx.fillRect(70, y, 260, 34);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(70, y, 260, 1);
    ctx.fillRect(70, y + 33, 260, 1);
    drawText(ctx, 'ARROWS/WASD MOVE   SPACE JUMP', 200, y + 7, { align: 'center', color: PAL.cream });
    drawText(ctx, 'J SWORD   L SHIELD   P PAUSE   M SOUND', 200, y + 19, { align: 'center', color: PAL.cream2 });
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

    /* hero + flowers standing on the title ground */
    ctx.drawImage(Sprites.facing(Sprites.hero.idle, 1), 52, 188);
    ctx.drawImage(Sprites.marigold, 300, 198);
    ctx.drawImage(Sprites.marigold, 318, 199);
    ctx.drawImage(Sprites.marigold, 334, 197);

    this.logo(ctx, 'MARIGOLD', 200, 44, 4, PAL.cream, PAL.rust);
    drawText(ctx, 'A SMALL KNIGHT\'S ERRAND', 200, 96, { align: 'center', color: PAL.gold, shadow: PAL.ink, scale: 1 });
    drawText(ctx, '3 STAGES  -  1 PRINCESS  -  A GREAT MANY THORNS', 200, 110,
      { align: 'center', color: PAL.cream2, shadow: PAL.ink });

    const blink = Math.floor(game.time * 2) % 2 === 0;
    if (blink) {
      const label = Save.data.unlocked > 1 ? 'CONTINUE' : 'PRESS SPACE TO BEGIN';
      drawText(ctx, label, 200, 140, { align: 'center', color: PAL.white, shadow: PAL.ink });
    }

    drawText(ctx, 'HAND-CODED PIXELS. NO ASSETS. NO ENGINE.', 200, 215,
      { align: 'center', color: PAL.cream2, shadow: PAL.ink });

    this.rects.titleStart = { x: 100, y: 128, w: 200, h: 30 };
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

    this.logo(ctx, 'STAGE SELECT', 200, 16, 2, PAL.cream, PAL.rust);
    drawText(ctx, 'CHOOSE YOUR ROAD', 200, 38, { align: 'center', color: PAL.cream2 });

    const cardW = 116, cardH = 122, gap = 14;
    const total = cardW * 3 + gap * 2;
    const x0 = Math.floor((400 - total) / 2);
    const y = 56;
    this.rects.cards = [];

    for (let i = 0; i < 3; i++) {
      const def = STAGES[i];
      const x = x0 + i * (cardW + gap);
      const locked = i + 1 > Save.data.unlocked;
      const sel = game.selectSel === i;
      this.rects.cards.push({ x, y, w: cardW, h: cardH, i });

      ctx.fillStyle = PAL.ink;
      ctx.fillRect(x, y, cardW, cardH);
      ctx.fillStyle = sel ? PAL.gold : PAL.shadow;
      ctx.fillRect(x + 2, y + 2, cardW - 4, cardH - 4);

      /* preview window */
      const px = x + 5, py = y + 5, pw = cardW - 10, ph = 52;
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

      drawText(ctx, def.number, x + 6, py + ph + 6, { color: locked ? PAL.stone : PAL.gold });
      drawText(ctx, def.name, x + 6, py + ph + 17, { color: locked ? PAL.stoneDark : PAL.cream });

      const best = Save.data.best[i] || 0;
      drawText(ctx, locked ? 'LOCKED' : ('FLOWERS ' + String(best).padStart(2, '0')),
        x + 6, y + cardH - 14, { color: locked ? PAL.stoneDark : PAL.cream2 });

      if (sel && !locked) {
        ctx.fillStyle = PAL.goldLight;
        ctx.fillRect(x + 2, y + 2, cardW - 4, 1);
        ctx.fillRect(x + 2, y + cardH - 3, cardW - 4, 1);
        /* arrow over the card */
        drawText(ctx, '^', x + cardW / 2, y - 10, { align: 'center', color: PAL.gold });
      }
    }

    const hint = lockedNow(game.selectSel) ? 'THIS ROAD IS STILL BARRED' : 'PRESS SPACE TO RIDE';
    drawText(ctx, hint, 200, 196, { align: 'center', color: PAL.cream, shadow: PAL.ink });
    drawText(ctx, 'ARROWS CHOOSE   ESC BACK', 200, 210, { align: 'center', color: PAL.cream2, shadow: PAL.ink });

    function lockedNow(i) { return i + 1 > Save.data.unlocked; }
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
    const def = STAGES[game.stageIndex];
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

    drawText(ctx, def.number, 200, 78, { align: 'center', color: PAL.gold, scale: 1 });
    this.logo(ctx, def.name, 200, 94, 2, PAL.cream, PAL.rust);
    drawText(ctx, game.stageBlurb || '', 200, 130, { align: 'center', color: PAL.cream2 });

    ctx.drawImage(Sprites.marigold, 178, 142);
    ctx.drawImage(Sprites.marigold, 212, 142);

    if (Math.floor(game.time * 3) % 2 === 0) {
      drawText(ctx, 'SPACE TO RIDE', 200, 172, { align: 'center', color: PAL.white, shadow: PAL.ink });
    }
    ctx.globalAlpha = 1;
  },

  paused(ctx, game) {
    ctx.fillStyle = 'rgba(11,9,18,0.72)';
    ctx.fillRect(0, 0, 400, 224);
    this.panel(ctx, 120, 44, 160, 136);
    this.logo(ctx, 'PAUSED', 200, 56, 2, PAL.cream, PAL.rust);

    const items = ['RESUME', 'RESTART STAGE', 'SOUND: ' + (Save.data.muted ? 'OFF' : 'ON'), 'QUIT TO TITLE'];
    this.rects.menu = [];
    for (let i = 0; i < items.length; i++) {
      const r = { x: 134, y: 92 + i * 20, w: 132, h: 16, i };
      this.rects.menu.push(r);
      this.button(ctx, items[i], r.x, r.y, r.w, r.h, game.pausedSel === i, false);
    }
    drawText(ctx, 'P/ESC RESUME', 200, 170 - 6, { align: 'center', color: PAL.cream2 });
  },

  dead(ctx, game) {
    ctx.fillStyle = 'rgba(60,10,20,0.55)';
    ctx.fillRect(0, 0, 400, 224);
    const t = game.deadT;
    const a = Math.min(1, t * 2);
    ctx.globalAlpha = a;
    this.logo(ctx, 'YOU FELL', 200, 74, 3, PAL.cream, PAL.inkDeep);
    drawText(ctx, 'THE THORNS TAKE ANOTHER DAY', 200, 116, { align: 'center', color: PAL.cream2, shadow: PAL.ink });
    if (Math.floor(game.time * 3) % 2 === 0) {
      drawText(ctx, 'STAND AT THE LAST LANTERN', 200, 140, { align: 'center', color: PAL.gold, shadow: PAL.ink });
    }
    ctx.globalAlpha = 1;
  },

  /* ---------- prologue: the story before the road ---------- */

  prologue(ctx, game) {
    const t = game.prologueT;
    if (t < PROLOGUE.crawlDur) {
      this.crawl(ctx, t);
      return;
    }
    const p = t - PROLOGUE.crawlDur;
    const idx = Math.min(3, Math.floor(p / PROLOGUE.panelDur));
    const local = p - idx * PROLOGUE.panelDur;
    if (idx === 0) this.sceneMeadow(ctx, game, local);
    else if (idx === 1) this.sceneShadow(ctx, game, local);
    else if (idx === 2) this.sceneTaking(ctx, game, local);
    else this.sceneKnight(ctx, game, local);

    /* cross-fade across the seam between panels */
    const seam = Math.min(local, PROLOGUE.panelDur - local) / 0.4;
    if (seam < 1) {
      ctx.globalAlpha = U.clamp(1 - seam, 0, 1);
      ctx.fillStyle = PAL.inkDeep;
      ctx.fillRect(0, 0, 400, 224);
      ctx.globalAlpha = 1;
    }
  },

  /* the crawl: gold text receding to a vanishing point over a starfield */
  crawl(ctx, t) {
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

    if (!PROLOGUE_BAKED.length) {
      for (const L of PROLOGUE.crawlLines) {
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
    const TRAVEL = 4.6, dt = 0.30;
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < PROLOGUE.crawlLines.length; i++) {
      const img = PROLOGUE_BAKED[i];
      if (!img) continue;
      const L = PROLOGUE.crawlLines[i];
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
    if (t < 1.2) {
      ctx.globalAlpha = U.clamp(1 - t / 1.2, 0, 1);
      ctx.fillStyle = PAL.inkDeep;
      ctx.fillRect(0, 0, 400, 224);
      ctx.globalAlpha = 1;
    }

    this.skipHint(ctx, t);
  },

  skipHint(ctx, t) {
    if (Math.floor(t * 2) % 2 === 0) {
      drawText(ctx, 'SPACE SKIPS AHEAD   ESC SKIPS ALL', 200, 210,
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

    if (t > 1.4 && t < 4.6) {
      this.sayBox(ctx, 'SnoozyPaw', 'THE BLOOMS ARE EARLY THIS YEAR. IT IS A GOOD OMEN.');
    } else if (t >= 4.6) {
      this.sayBox(ctx, 'Finn', 'A GOOD OMEN. I WILL BRING YOU A CROWN OF THEM.');
    }
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

    if (t > 1.9 && t < 5.2) {
      this.sayBox(ctx, 'Finn', 'SNOOZYP... NO.');
    } else if (t >= 5.2) {
      this.sayBox(ctx, '', 'SOMETHING OLD IS AWAKE.');
    }
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

    if (t > 0.9 && t < 4.4) {
      this.sayBox(ctx, 'SnoozyPaw', 'FINN. FOLLOW THE THORNS. FIND ME.');
    } else if (t >= 4.4) {
      this.sayBox(ctx, 'SnoozyPaw', 'IT IS TAKING ME EAST.');
    }
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

    /* Finn alone, shield up, blade drawn */
    const ready = U.clamp((t - 0.8) / 1.4, 0, 1);
    const frame = ready > 0.99 ? Sprites.hero.idle : Sprites.hero.run[Math.floor(game.time * 12) % 2];
    ctx.drawImage(Sprites.facing(frame, 1), 120, 166);
    if (ready > 0.5) {
      ctx.globalAlpha = (ready - 0.5) * 2;
      ctx.drawImage(Sprites.shield, 104, 168);
      ctx.globalAlpha = 1;
    }

    if (t > 1.6 && t < 5.0) {
      this.sayBox(ctx, 'Finn', 'THEN I WALK INTO THE DARK.');
    } else if (t >= 5.0) {
      this.sayBox(ctx, 'Finn', 'SHE IS STILL ALIVE. SO AM I.');
    }

    if (t > 5.6) {
      if (Math.floor(game.time * 2) % 2 === 0) {
        drawText(ctx, 'PRESS SPACE TO RIDE', 200, 132,
          { align: 'center', color: PAL.white, shadow: PAL.ink });
      }
      drawText(ctx, 'ESC TO GO STRAIGHT TO THE ROAD', 200, 144,
        { align: 'center', color: PAL.cream2, shadow: PAL.ink });
    }
  },

  sayBox(ctx, who, text) {
    const bx = 30, by = 156, bw = 340, bh = 44;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(bx, by, bw, 1);
    ctx.fillRect(bx, by + bh - 1, bw, 1);
    ctx.fillRect(bx, by, 1, bh);
    ctx.fillRect(bx + bw - 1, by, 1, bh);
    if (who) drawText(ctx, who, bx + 8, by + 7, { color: PAL.gold });
    drawParagraph(ctx, text, bx + 8, by + (who ? 19 : 12), bw - 16, { color: PAL.cream });
  },

  /* ---------- rescue cutscene ---------- */

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

    /* SnoozyPaw */
    const ex = 236;
    const ey = 208 - 18;
    const breathe = Math.sin(game.time * 2) > 0 ? 0 : 1;
    ctx.drawImage(Sprites.princess, ex, ey + breathe);

    /* Finn walks in during phase 0 */
    const walkT = U.clamp((t - 0.3) / 2.2, 0, 1);
    const wx = Math.round(U.lerp(-20, 150, U.easeOutCubic(walkT)));
    const moving = walkT < 1;
    const frame = moving ? Sprites.hero.run[Math.floor(game.time * 10) % 2] : Sprites.hero.idle;
    if (!(game.time < 0)) ctx.drawImage(Sprites.facing(frame, 1), wx, 186);

    /* petals drift in from phase 2 */
    if (t > 5.4) {
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
    const lines = [
      { at: 2.6, text: 'SnoozyPaw! THE THORNS LET GO OF YOU.' },
      { at: 4.8, text: 'Finn... YOU CAME ALL THIS WAY.' },
      { at: 7.0, text: 'THE MARIGOLDS BLOOMED THE WHOLE ROAD HOME.' }
    ];
    let shown = null;
    for (const l of lines) if (t >= l.at) shown = l;
    if (shown && t < 9.4) {
      const who = shown.text.startsWith('SnoozyPaw') ? 'SnoozyPaw' : 'Finn';
      const body = shown.text.slice(shown.text.indexOf(' ') + 1);
      this.sayBox(ctx, who, body);
    }

    if (t > 9.4) {
      const flash = U.clamp((t - 9.4) / 0.8, 0, 1);
      ctx.globalAlpha = flash * 0.8;
      ctx.fillStyle = PAL.white;
      ctx.fillRect(0, 0, 400, 224);
      ctx.globalAlpha = 1;
    }
  },

  /* ---------- victory ---------- */

  victory(ctx, game) {
    const cam = 100;
    Backgrounds.draw(ctx, 'day', cam, 0, game.time);
    ctx.save();
    ctx.translate(-cam, 0);
    Tiles.draw(ctx, game.titleLevel, cam, 0, game.time);
    Tiles.drawDecor(ctx, game.titleLevel, cam, 0, game.time);
    ctx.restore();

    ctx.fillStyle = 'rgba(11,9,18,0.5)';
    ctx.fillRect(0, 0, 400, 224);

    /* pair standing together */
    const bob = Math.sin(game.time * 3) > 0 ? 0 : -1;
    ctx.drawImage(Sprites.facing(Sprites.hero.idle, 1), 150, 176 + bob);
    ctx.drawImage(Sprites.princess, 176, 178 - bob);
    for (let i = 0; i < 7; i++) {
      ctx.drawImage(Sprites.marigold, 120 + i * 26, 196 + (i % 2) * 2);
    }

    this.logo(ctx, 'VICTORY', 200, 26, 3, PAL.cream, PAL.rust);
    drawText(ctx, 'SnoozyPaw IS FREE AND THE BRIAR IS QUIET', 200, 66,
      { align: 'center', color: PAL.gold, shadow: PAL.ink });

    this.panel(ctx, 74, 82, 252, 74);
    drawText(ctx, 'FLOWERS GATHERED', 200, 90, { align: 'center', color: PAL.cream2 });
    let total = 0;
    for (let i = 0; i < 3; i++) total += Save.data.best[i] || 0;
    drawText(ctx, String(total) + ' / ' + String(game.totalPossible).padStart(3, '0'),
      200, 102, { align: 'center', color: PAL.marigold, scale: 2 });
    for (let i = 0; i < 3; i++) {
      drawText(ctx, STAGES[i].name + '  ' + String(Save.data.best[i] || 0).padStart(2, '0'),
        200, 128 + i * 9, { align: 'center', color: PAL.cream });
    }

    if (Math.floor(game.time * 2) % 2 === 0) {
      drawText(ctx, 'PRESS SPACE FOR THE TITLE', 200, 170,
        { align: 'center', color: PAL.white, shadow: PAL.ink });
    }
    drawText(ctx, 'THANK YOU FOR PLAYING MARIGOLD', 200, 212,
      { align: 'center', color: PAL.cream2, shadow: PAL.ink });

    this.rects.victoryExit = { x: 90, y: 160, w: 220, h: 24 };
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

/* ---------- the prologue ---------- */

const PROLOGUE = {
  crawlDur: 9,
  panelDur: 7,
  get end() { return this.crawlDur + this.panelDur * 4; },
  crawlLines: [
    { text: 'EPISODE I', mul: 2.0, color: PAL.goldLight },
    { text: 'THE THORN TAKES HER', mul: 1.45, color: PAL.goldLight },
    { text: '', mul: 1, color: PAL.gold },
    { text: 'LONG AGO, IN A MEADOW OF GOLD', mul: 1, color: PAL.gold },
    { text: 'AND THORN, SNOOZYPAW KEPT THE', mul: 1, color: PAL.gold },
    { text: 'MARIGOLDS AND THE PEACE.', mul: 1, color: PAL.gold },
    { text: 'BESIDE HER WALKED FINN - A KNIGHT', mul: 1, color: PAL.gold },
    { text: 'WITH A WOODEN SWORD AND A SHIELD', mul: 1, color: PAL.gold },
    { text: 'HE HAD NEVER NEEDED.', mul: 1, color: PAL.gold },
    { text: '', mul: 1, color: PAL.gold },
    { text: 'BUT THE BRIAR HAD BEEN HUNGRY', mul: 1, color: PAL.gold },
    { text: 'A LONG WHILE, AND ON THE EVE', mul: 1, color: PAL.gold },
    { text: 'OF THE HARVEST, IT CAME.', mul: 1, color: PAL.gold }
  ]
};

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
