/* MARIGOLD — procedural tiles, decoration, doors, parallax backdrops.
   Everything is baked once into offscreen canvases; nothing is drawn per-pixel per frame. */

const Tiles = {
  cache: {},

  init() {
    const C = this.cache;
    C.dirtTop = [0, 1, 2].map((i) => bakeTile((ctx) => this.paintDirtTop(ctx, i)));
    C.dirt = [0, 1].map((i) => bakeTile((ctx) => this.paintDirt(ctx, i)));
    C.flag = [0, 1].map((i) => bakeTile((ctx) => this.paintFlagstone(ctx, i)));
    C.stone = [0, 1].map((i) => bakeTile((ctx) => this.paintBrick(ctx, i, PAL.stone, PAL.stoneDark, PAL.stoneLight)));
    C.stoneKeep = [0, 1].map((i) => bakeTile((ctx) => this.paintBrick(ctx, i, PAL.stoneDark, PAL.inkSoft, PAL.stone)));
    C.plank = bakeTile((ctx) => this.paintPlank(ctx));
    C.crate = bakeTile((ctx) => this.paintCrate(ctx));
    C.spike = bakeTile((ctx) => this.paintSpike(ctx));
    C.water = [0, 1].map((i) => bakeTile((ctx) => this.paintWater(ctx, i)));
    C.vine = bakeTile((ctx) => this.paintVine(ctx));
    C.trunk = [0, 1].map((i) => bakeTile((ctx) => this.paintTrunk(ctx, i)));
    C.mud = [0, 1].map((i) => bakeTile((ctx) => this.paintMud(ctx, i)));
    C.bramble = bakeTile((ctx) => this.paintBramble(ctx));
  },

  /* ---------- tile painters ---------- */

  paintDirtTop(ctx, variant) {
    ctx.fillStyle = PAL.dirt;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = PAL.dirtDark;
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(U.hash(i * 7 + variant * 31) * 14);
      const y = 6 + Math.floor(U.hash(i * 11 + variant * 13) * 9);
      ctx.fillRect(x, y, 2, 1);
    }
    ctx.fillStyle = PAL.dirtLight;
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(U.hash(i * 5 + variant * 17) * 14);
      ctx.fillRect(x, 8 + Math.floor(U.hash(i * 3 + variant * 7) * 7), 1, 1);
    }
    /* grass lip with uneven edge */
    ctx.fillStyle = PAL.leafDark;
    ctx.fillRect(0, 2, 16, 3);
    ctx.fillStyle = PAL.leaf;
    ctx.fillRect(0, 1, 16, 2);
    for (let x = 0; x < 16; x++) {
      const n = U.hash(x * 13 + variant * 29);
      if (n > 0.66) ctx.fillRect(x, 4, 1, 2);
      else if (n > 0.4) ctx.fillRect(x, 4, 1, 1);
    }
    ctx.fillStyle = PAL.leafLight;
    for (let x = 0; x < 16; x += 2) {
      if (U.hash(x * 3 + variant * 5) > 0.5) ctx.fillRect(x, 1, 1, 1);
    }
  },

  paintDirt(ctx, variant) {
    ctx.fillStyle = PAL.dirt;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = PAL.dirtDark;
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(U.hash(i * 9 + variant * 23) * 15);
      const y = Math.floor(U.hash(i * 17 + variant * 3) * 15);
      ctx.fillRect(x, y, 2, 1);
    }
    ctx.fillStyle = PAL.dirtLight;
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(U.hash(i * 6 + variant * 19) * 15);
      const y = Math.floor(U.hash(i * 2 + variant * 27) * 15);
      ctx.fillRect(x, y, 1, 1);
    }
  },

  paintFlagstone(ctx, variant) {
    ctx.fillStyle = PAL.stoneDark;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#433d56';
    for (let row = 0; row < 4; row++) {
      const off = (row + variant) % 2 ? 4 : 0;
      for (let col = -1; col < 3; col++) {
        ctx.fillRect(col * 8 + off + 1, row * 4 + 1, 6, 2);
      }
    }
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = PAL.moss;
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(U.hash(i * 13 + variant * 31) * 14);
      ctx.fillRect(x, 1, 2, 1);
    }
  },

  paintBrick(ctx, variant, base, mortar, light) {
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = base;
    for (let row = 0; row < 4; row++) {
      const off = (row + variant) % 2 ? 4 : 0;
      for (let col = -1; col < 3; col++) {
        ctx.fillRect(col * 8 + off + 1, row * 4 + 1, 6, 2);
      }
    }
    ctx.fillStyle = light;
    for (let col = 0; col < 2; col++) {
      const x = (col * 8 + ((0 + variant) % 2 ? 4 : 0)) + 1;
      ctx.fillRect(x, 1, 6, 1);
    }
  },

  paintPlank(ctx) {
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(0, 0, 16, 8);
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(0, 1, 16, 4);
    ctx.fillStyle = PAL.dirtLight;
    for (let x = 1; x < 16; x += 4) ctx.fillRect(x, 2, 2, 1);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(1, 3, 1, 1);
    ctx.fillRect(14, 3, 1, 1);
    ctx.fillStyle = PAL.moss;
    ctx.fillRect(6, 5, 2, 1);
  },

  paintCrate(ctx) {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(2, 2, 12, 3);
    ctx.fillRect(2, 11, 12, 3);
    /* diagonal cross */
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(3 + i, 5 + i, 1, 1);
      ctx.fillRect(12 - i, 5 + i, 1, 1);
    }
    ctx.fillStyle = PAL.ink;
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(3 + i, 6 + i, 1, 1);
      ctx.fillRect(12 - i, 6 + i, 1, 1);
    }
    ctx.fillStyle = PAL.stoneLight;
    ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(13, 13, 1, 1);
  },

  paintSpike(ctx) {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, 13, 16, 3);
    ctx.fillStyle = PAL.stoneDark;
    ctx.fillRect(0, 14, 16, 2);
    for (const sx of [0, 5, 10]) {
      ctx.fillStyle = PAL.metal;
      ctx.fillRect(sx + 1, 8, 3, 5);
      ctx.fillRect(sx + 2, 4, 1, 4);
      ctx.fillStyle = PAL.white;
      ctx.fillRect(sx + 1, 9, 1, 3);
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(sx + 1, 13, 3, 1);
      ctx.fillRect(sx, 13, 1, 3);
      ctx.fillRect(sx + 4, 13, 1, 3);
    }
  },

  paintWater(ctx, variant) {
    ctx.fillStyle = PAL.waterDeep;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = PAL.water;
    ctx.fillRect(0, 2, 16, 14);
    ctx.fillStyle = PAL.waterLight;
    for (let x = 0; x < 16; x++) {
      const n = U.hash(x * 7 + variant * 41);
      if (n > 0.55) ctx.fillRect((x + variant * 3) % 16, 2, 2, 1);
      if (n > 0.85) ctx.fillRect((x + variant * 5) % 16, 3, 1, 1);
    }
    ctx.fillStyle = PAL.inkSoft;
    for (let x = 0; x < 16; x += 3) ctx.fillRect((x + variant * 4) % 16, 9, 2, 1);
  },

  paintVine(ctx) {
    ctx.fillStyle = PAL.moss;
    ctx.fillRect(7, 0, 3, 16);
    ctx.fillStyle = PAL.leafDark;
    ctx.fillRect(8, 0, 1, 16);
    /* thorns */
    for (const ty of [2, 6, 10, 14]) {
      ctx.fillStyle = PAL.leaf;
      ctx.fillRect(5, ty, 2, 1);
      ctx.fillRect(10, ty + 1, 2, 1);
      ctx.fillRect(6, ty + 1, 1, 1);
    }
    ctx.fillStyle = PAL.rust;
    ctx.fillRect(8, 4, 1, 1);
    ctx.fillRect(8, 12, 1, 1);
  },

  /* a wide old trunk: the deep woods are full of them */
  paintTrunk(ctx, variant) {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(1, 0, 14, 16);
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(2, 0, 10, 16);
    ctx.fillStyle = PAL.dirtDark;
    for (let i = 0; i < 5; i++) {
      const y = Math.floor(U.hash(i * 7 + variant * 19) * 14);
      const x = 3 + Math.floor(U.hash(i * 13 + variant * 5) * 8);
      ctx.fillRect(x, y, 1, 4 + Math.floor(U.hash(i * 3) * 3));
    }
    ctx.fillStyle = PAL.dirtLight;
    ctx.fillRect(3 + variant, 2, 1, 5);
    ctx.fillStyle = PAL.moss;
    ctx.fillRect(0, 3 + variant * 4, 3, 2);
    ctx.fillRect(13, 9 - variant * 3, 3, 2);
    ctx.fillStyle = PAL.leafDark;
    ctx.fillRect(0, 0, 2, 3);
    ctx.fillRect(14, 13, 2, 3);
  },

  /* bog mud: solid, but it looks like it would swallow you */
  paintMud(ctx, variant) {
    ctx.fillStyle = '#3b3527';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#4c4533';
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(U.hash(i * 9 + variant * 23) * 14);
      const y = Math.floor(U.hash(i * 17 + variant * 3) * 14);
      ctx.fillRect(x, y, 2, 1);
    }
    ctx.fillStyle = '#2a261c';
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(U.hash(i * 5 + variant * 11) * 14);
      ctx.fillRect(x, 1 + Math.floor(U.hash(i * 3 + variant) * 13), 1, 1);
    }
    ctx.fillStyle = '#6b6b52';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(2 + variant * 3, 0, 3, 1);
  },

  /* bramble: thorny scrub that hurts */
  paintBramble(ctx) {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, 11, 16, 5);
    ctx.fillStyle = PAL.leafDark;
    ctx.fillRect(0, 12, 16, 4);
    ctx.fillStyle = PAL.moss;
    ctx.fillRect(1, 8, 2, 5);
    ctx.fillRect(6, 7, 2, 6);
    ctx.fillRect(11, 8, 2, 5);
    ctx.fillStyle = PAL.leaf;
    ctx.fillRect(0, 11, 2, 2);
    ctx.fillRect(4, 11, 2, 2);
    ctx.fillRect(8, 11, 2, 2);
    ctx.fillRect(12, 11, 2, 2);
    ctx.fillStyle = PAL.cream2;
    ctx.fillRect(2, 5, 1, 4);
    ctx.fillRect(7, 4, 1, 5);
    ctx.fillRect(12, 5, 1, 4);
  },

  /* ---------- world drawing ---------- */

  draw(ctx, level, camX, camY, time) {
    const C = this.cache;
    const theme = level.theme;
    const x0 = Math.max(0, Math.floor(camX / 16));
    const x1 = Math.min(level.w - 1, Math.ceil((camX + 400) / 16));
    const y0 = Math.max(0, Math.floor(camY / 16));
    const y1 = Math.min(level.h - 1, Math.ceil((camY + 224) / 16));
    const waterFrame = Math.floor(time * 2.4) % 2;

    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const ch = level.grid[ty][tx];
        if (ch === ' ') continue;
        const px = tx * 16;
        const py = ty * 16;
        const v = Math.floor(U.hash(tx * 31 + ty * 7) * 100);

        switch (ch) {
          case '#': {
            const above = level.solidAt(tx, ty - 1);
            if (above) ctx.drawImage(C.dirt[v % 2], px, py);
            else ctx.drawImage(C.dirtTop[v % 3], px, py);
            /* exposed sides */
            if (!level.solidAt(tx - 1, ty)) {
              ctx.fillStyle = PAL.inkSoft;
              ctx.fillRect(px, py, 1, 16);
            }
            if (!level.solidAt(tx + 1, ty)) {
              ctx.fillStyle = PAL.inkSoft;
              ctx.fillRect(px + 15, py, 1, 16);
            }
            break;
          }
          case '=': {
            const set = theme === 'keep' ? C.stoneKeep : C.stone;
            ctx.drawImage(set[v % 2], px, py);
            if (!level.solidAt(tx - 1, ty)) { ctx.fillStyle = PAL.inkSoft; ctx.fillRect(px, py, 1, 16); }
            if (!level.solidAt(tx + 1, ty)) { ctx.fillStyle = PAL.inkSoft; ctx.fillRect(px + 15, py, 1, 16); }
            break;
          }
          case '-': ctx.drawImage(C.plank, px, py); break;
          case 'X': ctx.drawImage(C.crate, px, py); break;
          case '^': ctx.drawImage(C.spike, px, py); break;
          case '~': ctx.drawImage(C.water[waterFrame], px, py); break;
          case 'v': ctx.drawImage(C.vine, px, py); break;
          case 'T': ctx.drawImage(C.trunk[v % 2], px, py); break;
          case 'M': ctx.drawImage(C.mud[v % 2], px, py); break;
          case 'B': ctx.drawImage(C.bramble, px, py); break;
          default: break;
        }
      }
    }
  },

  /* decoration on top of the terrain */
  drawDecor(ctx, level, camX, camY, time) {
    const list = level.decor;
    const left = camX - 24;
    const right = camX + 424;
    const top = camY - 24;
    const bot = camY + 248;
    for (let i = 0; i < list.length; i++) {
      const d = list[i];
      if (d.x < left || d.x > right || d.y < top || d.y > bot) continue;
      this.drawDecorOne(ctx, d, time);
    }
  },

  drawDecorOne(ctx, d, time) {
    switch (d.type) {
      case 'tuft': {
        ctx.fillStyle = PAL.leafDark;
        ctx.fillRect(d.x, d.y - 3, 1, 3);
        ctx.fillStyle = PAL.leaf;
        ctx.fillRect(d.x + 2, d.y - 5, 1, 5);
        ctx.fillStyle = PAL.leafLight;
        ctx.fillRect(d.x + 4, d.y - 4, 1, 4);
        break;
      }
      case 'bush': {
        ctx.fillStyle = PAL.ink;
        ctx.fillRect(d.x - 1, d.y - 7, 12, 7);
        ctx.fillStyle = PAL.leafDark;
        ctx.fillRect(d.x, d.y - 6, 10, 6);
        ctx.fillStyle = PAL.leaf;
        ctx.fillRect(d.x + 1, d.y - 7, 8, 4);
        ctx.fillStyle = PAL.leafLight;
        ctx.fillRect(d.x + 2, d.y - 7, 3, 1);
        ctx.fillRect(d.x + 7, d.y - 5, 2, 1);
        break;
      }
      case 'flower': {
        ctx.fillStyle = PAL.leafDark;
        ctx.fillRect(d.x + 1, d.y - 4, 1, 4);
        ctx.fillStyle = d.color === 'rose' ? PAL.rose : PAL.cream;
        ctx.fillRect(d.x, d.y - 6, 3, 2);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(d.x + 1, d.y - 5, 1, 1);
        break;
      }
      case 'rock': {
        ctx.fillStyle = PAL.inkSoft;
        ctx.fillRect(d.x - 1, d.y - 4, 7, 4);
        ctx.fillStyle = PAL.stoneDark;
        ctx.fillRect(d.x, d.y - 3, 5, 3);
        ctx.fillStyle = PAL.stone;
        ctx.fillRect(d.x + 1, d.y - 3, 2, 1);
        break;
      }
      case 'rubble': {
        ctx.fillStyle = PAL.stoneDark;
        ctx.fillRect(d.x, d.y - 2, 3, 2);
        ctx.fillRect(d.x + 4, d.y - 3, 2, 3);
        ctx.fillStyle = PAL.stone;
        ctx.fillRect(d.x + 1, d.y - 2, 1, 1);
        break;
      }
      case 'thorn': {
        ctx.fillStyle = PAL.moss;
        ctx.fillRect(d.x + 1, d.y - 5, 1, 5);
        ctx.fillStyle = PAL.leafDark;
        ctx.fillRect(d.x - 1, d.y - 4, 2, 1);
        ctx.fillRect(d.x + 2, d.y - 3, 2, 1);
        ctx.fillRect(d.x, d.y - 2, 2, 1);
        ctx.fillStyle = PAL.rust;
        ctx.fillRect(d.x + 3, d.y - 3, 1, 1);
        ctx.fillRect(d.x - 2, d.y - 4, 1, 1);
        break;
      }
      case 'reed': {
        ctx.fillStyle = PAL.leafDark;
        ctx.fillRect(d.x + 1, d.y - 7, 1, 7);
        ctx.fillRect(d.x + 4, d.y - 10, 1, 10);
        ctx.fillStyle = PAL.leaf;
        ctx.fillRect(d.x, d.y - 5, 1, 5);
        ctx.fillRect(d.x + 3, d.y - 8, 1, 8);
        ctx.fillStyle = PAL.cream2;
        ctx.fillRect(d.x + 4, d.y - 12, 1, 3);
        break;
      }
      case 'mushroom': {
        ctx.fillStyle = PAL.cream2;
        ctx.fillRect(d.x + 2, d.y - 4, 2, 4);
        ctx.fillStyle = PAL.rust;
        ctx.fillRect(d.x, d.y - 7, 6, 3);
        ctx.fillStyle = PAL.cream;
        ctx.fillRect(d.x + 1, d.y - 7, 1, 1);
        ctx.fillRect(d.x + 4, d.y - 7, 1, 1);
        break;
      }
      case 'torch': {
        this.drawTorch(ctx, d.x, d.y, time + (d.seed || 0));
        break;
      }
      default: break;
    }
  },

  drawTorch(ctx, x, y, time) {
    const flick = Math.sin(time * 9.3) * 0.5 + Math.sin(time * 5.1) * 0.5;
    const rise = flick > 0 ? 1 : 0;
    U.pixelCircle(ctx, Math.round(x), Math.round(y - 10), Math.round(18 + flick), 'rgba(240,169,74,0.10)');
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x - 2, y - 9, 5, 9);
    ctx.fillStyle = PAL.metalDark;
    ctx.fillRect(x - 1, y - 8, 3, 8);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x - 3, y - 12, 7, 4);
    ctx.fillStyle = PAL.rust;
    ctx.fillRect(x - 2, y - 11, 5, 3);
    ctx.fillStyle = PAL.orange;
    ctx.fillRect(x - 1, y - 14 - rise, 3, 3 + rise);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(x, y - 15 - rise, 1, 3);
  },

  /* ---------- doors ---------- */

  drawGoal(ctx, x, y, type, time) {
    if (type === 'tower') this.drawTowerDoor(ctx, x, y, time);
    else this.drawGateDoor(ctx, x, y, time);
  },

  drawGateDoor(ctx, x, y, time) {
    const h = 48;
    ctx.fillStyle = PAL.inkSoft;
    ctx.fillRect(x - 3, y - h + 6, 38, h - 6);
    ctx.fillStyle = PAL.stoneDark;
    ctx.fillRect(x - 1, y - h + 8, 34, h - 8);
    U.pixelCircle(ctx, x + 16, y - h + 8, 17, PAL.stoneDark);
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(x + 1, y - h + 10, 30, h - 10);
    U.pixelCircle(ctx, x + 16, y - h + 10, 15, PAL.stone);
    /* dark opening */
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x + 5, y - 34, 22, 34);
    U.pixelCircle(ctx, x + 16, y - 34, 11, PAL.ink);
    /* wooden door */
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(x + 7, y - 32, 18, 32);
    U.pixelCircle(ctx, x + 16, y - 32, 9, PAL.woodDark);
    ctx.fillStyle = PAL.wood;
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 8 + i * 4, y - 30, 2, 30);
    ctx.fillStyle = PAL.metalDark;
    ctx.fillRect(x + 7, y - 26, 18, 2);
    ctx.fillRect(x + 7, y - 10, 18, 2);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(x + 20, y - 18, 3, 3);
    /* little flower above the arch */
    const bob = Math.sin(time * 2) > 0 ? 0 : 1;
    ctx.fillStyle = PAL.leafDark;
    ctx.fillRect(x + 15, y - h - 1 + bob, 2, 4);
    ctx.fillStyle = PAL.marigold;
    ctx.fillRect(x + 14, y - h - 4 + bob, 4, 3);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(x + 15, y - h - 3 + bob, 2, 1);
  },

  drawTowerDoor(ctx, x, y, time) {
    const w = 48, h = 64;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x - 2, y - h + 10, w + 4, h - 10);
    ctx.fillStyle = PAL.stoneDark;
    ctx.fillRect(x, y - h + 12, w, h - 12);
    U.pixelCircle(ctx, x + w / 2, y - h + 12, w / 2, PAL.stoneDark);
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(x + 4, y - h + 14, w - 8, h - 14);
    U.pixelCircle(ctx, x + w / 2, y - h + 14, w / 2 - 4, PAL.stone);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x + 10, y - 48, w - 20, 48);
    U.pixelCircle(ctx, x + w / 2, y - 48, w / 2 - 10, PAL.ink);
    /* double leaves */
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(x + 11, y - 46, w - 22, 46);
    U.pixelCircle(ctx, x + w / 2, y - 46, w / 2 - 11, PAL.woodDark);
    ctx.fillStyle = PAL.wood;
    for (let i = 0; i < 6; i++) ctx.fillRect(x + 12 + i * 4, y - 44, 2, 44);
    ctx.fillStyle = PAL.metalDark;
    ctx.fillRect(x + 11, y - 38, w - 22, 2);
    ctx.fillRect(x + 11, y - 16, w - 22, 2);
    ctx.fillStyle = PAL.metal;
    ctx.fillRect(x + 23, y - 26, 2, 8);
    /* thorn emblem */
    ctx.fillStyle = PAL.rust;
    ctx.fillRect(x + w / 2 - 3, y - 32, 6, 2);
    ctx.fillRect(x + w / 2 - 1, y - 34, 2, 6);
    ctx.fillStyle = PAL.leafDark;
    ctx.fillRect(x + w / 2 - 1, y - 2, 2, 2);
    /* flanking torches */
    this.drawTorch(ctx, x - 6, y - 20, time);
    this.drawTorch(ctx, x + w + 6, y - 20, time + 1.7);
  }
};

/* ---------- baking helper ---------- */

function bakeTile(painter) {
  const cv = document.createElement('canvas');
  cv.width = 16;
  cv.height = 16;
  const ctx = cv.getContext('2d');
  painter(ctx);
  return cv;
}

/* ---------- parallax backdrops ---------- */

const Backgrounds = {
  cache: {},

  get(theme) {
    if (!this.cache[theme]) this.cache[theme] = this.build(theme);
    return this.cache[theme];
  },

  layer(w, h, painter) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    painter(ctx, w, h);
    return cv;
  },

  build(theme) {
    const def = {};
    def.sky = this.layer(400, 224, (ctx, w, h) => this.paintSky(ctx, theme));
    def.far = this.layer(800, 224, (ctx, w, h) => this.paintFar(ctx, theme, w, h));
    def.mid = this.layer(800, 224, (ctx, w, h) => this.paintMid(ctx, theme, w, h));
    def.near = this.layer(800, 224, (ctx, w, h) => this.paintNear(ctx, theme, w, h));
    def.clouds = [
      bakeSprite(cloudRows(0)),
      bakeSprite(cloudRows(1)),
      bakeSprite(cloudRows(2))
    ];
    return def;
  },

  paintSky(ctx, theme) {
    let bands;
    if (theme === 'day') bands = [[0, 54, PAL.skyTop], [54, 104, PAL.skyMid], [104, 156, PAL.skyLow], [156, 224, '#dfe3b4']];
    else if (theme === 'dusk') bands = [[0, 50, PAL.duskTop], [50, 100, PAL.duskMid], [100, 152, PAL.duskLow], [152, 224, '#c98f62']];
    else if (theme === 'woods') bands = [[0, 58, '#1e3324'], [58, 108, '#2a452d'], [108, 158, '#355738'], [158, 224, '#43684a']];
    else if (theme === 'marsh') bands = [[0, 60, '#232436'], [60, 112, '#313248'], [112, 160, '#413d52'], [160, 224, '#4e4653']];
    else bands = [[0, 60, PAL.night], [60, 116, PAL.nightMid], [116, 170, PAL.nightSoft], [170, 224, '#252c4c']];

    for (let b = 0; b < bands.length; b++) {
      const [y0, y1, col] = bands[b];
      ctx.fillStyle = col;
      ctx.fillRect(0, y0, 400, y1 - y0);
      /* dithered seam with the band below */
      if (b < bands.length - 1) {
        const next = bands[b + 1][2];
        for (let k = 0; k < 4; k++) {
          const y = y1 - 4 + k;
          ctx.fillStyle = next;
          const density = (k + 1) / 4.4;
          for (let x = (y % 2) * 2; x < 400; x += 4) {
            if (U.hash(x * 3 + y * 7 + b * 91) < density) ctx.fillRect(x, y, 2, 1);
          }
        }
      }
    }

    if (theme === 'night') {
      const rnd = U.rng(7);
      ctx.fillStyle = PAL.moon;
      U.pixelCircle(ctx, 316, 40, 13, PAL.moon);
      ctx.fillStyle = '#d9cda4';
      U.pixelCircle(ctx, 311, 36, 3, '#d9cda4');
      U.pixelCircle(ctx, 320, 45, 2, '#d9cda4');
      ctx.fillStyle = PAL.cream;
      for (let i = 0; i < 70; i++) {
        const x = Math.floor(rnd() * 400);
        const y = Math.floor(rnd() * 140);
        ctx.fillRect(x, y, 1, 1);
      }
    } else if (theme === 'day') {
      U.pixelCircle(ctx, 330, 42, 14, PAL.gold);
      U.pixelCircle(ctx, 330, 42, 10, PAL.goldLight);
    } else if (theme === 'woods') {
      /* a dim sun filtered through the canopy */
      U.pixelCircle(ctx, 322, 40, 22, 'rgba(240,200,120,0.10)');
      U.pixelCircle(ctx, 322, 40, 12, '#cbbd7c');
      ctx.fillStyle = 'rgba(240,214,140,0.05)';
      for (let i = 0; i < 4; i++) ctx.fillRect(270 + i * 26, 0, 9, 224);
    } else if (theme === 'marsh') {
      U.pixelCircle(ctx, 100, 40, 12, '#b9bccb');
      U.pixelCircle(ctx, 96, 36, 3, '#dfe1ea');
    } else {
      U.pixelCircle(ctx, 92, 128, 20, PAL.orange);
      U.pixelCircle(ctx, 92, 128, 14, PAL.gold);
    }
  },

  paintFar(ctx, theme, w, h) {
    if (theme === 'day') {
      this.paintHills(ctx, 0, w, 168, '#93bfa4', 0.9);
      /* a small keep on the horizon */
      this.paintKeep(ctx, 250, 168, '#86b19a', '#79a48e');
    } else if (theme === 'dusk') {
      this.paintHills(ctx, 0, w, 172, '#6b5170', 0.8);
      this.paintMill(ctx, 210, 172, '#4a3a55');
    } else if (theme === 'woods') {
      this.paintHills(ctx, 0, w, 170, '#2f4a35', 0.9);
      this.paintTrees(ctx, w, 170, ['#27412f', '#1f3626']);
    } else if (theme === 'marsh') {
      this.paintHills(ctx, 0, w, 176, '#2c2f3f', 0.8);
      this.paintDeadTrees(ctx, w, 176, '#1d1e2b');
    } else {
      this.paintHills(ctx, 0, w, 184, '#232a49', 1.4);
      this.paintKeep(ctx, 120, 184, '#161c33', '#10152a', true);
      this.paintKeep(ctx, 560, 184, '#161c33', '#10152a', true);
    }
  },

  paintMid(ctx, theme, w, h) {
    if (theme === 'day') {
      this.paintHills(ctx, 13, w, 190, '#6fa04a', 1.2);
      this.paintTrees(ctx, w, 190, ['#5c8f42', '#4b7d47']);
    } else if (theme === 'dusk') {
      this.paintHills(ctx, 13, w, 196, '#7a5a5f', 1.1);
      this.paintReeds(ctx, w, 196);
    } else if (theme === 'woods') {
      this.paintHills(ctx, 13, w, 192, '#24402c', 1.2);
      this.paintTrees(ctx, w, 192, ['#1d3626', '#162b1e']);
    } else if (theme === 'marsh') {
      this.paintHills(ctx, 13, w, 198, '#2b2c3c', 1.1);
      this.paintReeds(ctx, w, 198);
      this.paintDeadTrees(ctx, w, 198, '#171823');
    } else {
      this.paintHills(ctx, 13, w, 202, '#1f2740', 1.3);
      this.paintThornTrees(ctx, w, 202);
    }
  },

  paintNear(ctx, theme, w, h) {
    if (theme === 'day') {
      this.paintHills(ctx, 29, w, 212, '#3f6b3f', 1.6);
    } else if (theme === 'dusk') {
      this.paintHills(ctx, 29, w, 214, '#3d2f4a', 1.7);
    } else if (theme === 'woods') {
      this.paintHills(ctx, 29, w, 214, '#16281b', 1.6);
      this.paintTrees(ctx, w, 214, ['#122317', '#0d1b12']);
    } else if (theme === 'marsh') {
      this.paintHills(ctx, 29, w, 216, '#1c1d28', 1.7);
    } else {
      this.paintHills(ctx, 29, w, 216, '#141a2e', 1.8);
    }
  },

  paintDeadTrees(ctx, w, groundY, col) {
    const rnd = U.rng(83);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(rnd() * w);
      const th = 14 + Math.floor(rnd() * 11);
      ctx.fillStyle = col;
      ctx.fillRect(x, groundY - th, 2, th + 10);
      ctx.fillRect(x - 4, groundY - th + 3, 5, 1);
      ctx.fillRect(x + 1, groundY - th + 6, 5, 1);
      ctx.fillRect(x - 3, groundY - th + 1, 1, 4);
      ctx.fillRect(x + 2, groundY - th + 4, 1, 3);
    }
  },

  paintHills(ctx, seed, w, base, color, amp) {
    ctx.fillStyle = color;
    for (let x = 0; x < w; x += 2) {
      const t = (x + seed * 40) * 0.011;
      const top = Math.floor(base - (Math.sin(t) * 9 + Math.sin(t * 2.3 + 1.7) * 5 + Math.sin(t * 0.5) * 8) * amp);
      ctx.fillRect(x, top, 2, 224 - top);
    }
  },

  paintKeep(ctx, x, groundY, col, colDark, lit) {
    ctx.fillStyle = col;
    ctx.fillRect(x, groundY - 46, 30, 60);
    ctx.fillRect(x + 6, groundY - 62, 8, 20);
    ctx.fillRect(x + 18, groundY - 70, 9, 28);
    /* battlements */
    for (let i = 0; i < 3; i++) ctx.fillRect(x + 7 + i * 3, groundY - 65, 2, 4);
    for (let i = 0; i < 3; i++) ctx.fillRect(x + 19 + i * 3, groundY - 73, 2, 4);
    ctx.fillStyle = colDark;
    ctx.fillRect(x + 2, groundY - 30, 26, 30);
    if (lit) {
      ctx.fillStyle = PAL.torch;
      ctx.fillRect(x + 9, groundY - 56, 2, 3);
      ctx.fillRect(x + 21, groundY - 60, 2, 3);
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(x + 21, groundY - 50, 2, 2);
    }
  },

  paintMill(ctx, x, groundY, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x, groundY - 52, 74, 62);
    /* stepped gable roof */
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(x + 26 - i * 2, groundY - 52 - i * 2, 22 + i * 4, 2);
    }
    ctx.fillStyle = '#3a2c44';
    ctx.fillRect(x + 8, groundY - 40, 10, 12);
    ctx.fillRect(x + 54, groundY - 40, 10, 12);
    /* water wheel */
    ctx.fillStyle = '#3a2c44';
    U.pixelCircle(ctx, x + 84, groundY - 18, 18, '#3a2c44');
    ctx.fillStyle = col;
    U.pixelCircle(ctx, x + 84, groundY - 18, 13, col);
    ctx.fillStyle = '#3a2c44';
    for (let a = 0; a < 8; a++) {
      const ang = a * Math.PI / 4;
      for (let r = 4; r < 18; r++) {
        ctx.fillRect(Math.round(x + 84 + Math.cos(ang) * r), Math.round(groundY - 18 + Math.sin(ang) * r), 1, 1);
      }
    }
    ctx.fillRect(x + 82, groundY - 20, 4, 4);
  },

  paintTrees(ctx, w, groundY, colors) {
    const rnd = U.rng(41);
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(rnd() * w);
      const th = 8 + Math.floor(rnd() * 6);
      ctx.fillStyle = '#4b3b2a';
      ctx.fillRect(x, groundY - th, 3, th + 6);
      ctx.fillStyle = colors[0];
      ctx.fillRect(x - 5, groundY - th - 8, 13, 6);
      ctx.fillStyle = colors[1];
      ctx.fillRect(x - 7, groundY - th - 3, 17, 5);
    }
  },

  paintReeds(ctx, w, groundY) {
    const rnd = U.rng(53);
    ctx.fillStyle = '#5d4550';
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(rnd() * w);
      const hgt = 4 + Math.floor(rnd() * 6);
      ctx.fillRect(x, groundY - hgt, 1, hgt + 12);
    }
  },

  paintThornTrees(ctx, w, groundY) {
    const rnd = U.rng(67);
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(rnd() * w);
      ctx.fillStyle = '#111626';
      ctx.fillRect(x, groundY - 18, 3, 22);
      ctx.fillRect(x - 6, groundY - 18, 6, 2);
      ctx.fillRect(x + 3, groundY - 22, 6, 2);
      ctx.fillRect(x - 4, groundY - 24, 2, 6);
      ctx.fillRect(x + 6, groundY - 26, 2, 6);
      ctx.fillStyle = '#1c2440';
      ctx.fillRect(x - 1, groundY - 18, 1, 18);
    }
  },

  draw(ctx, theme, camX, camY, time) {
    const def = this.get(theme);
    ctx.drawImage(def.sky, 0, 0);

    const drift = time * 6;
    const cloudCount = theme === 'night' ? 2 : 4;
    for (let i = 0; i < cloudCount; i++) {
      const img = def.clouds[i % def.clouds.length];
      const speed = 3 + (i % 3) * 2;
      let x = (i * 137 + drift * speed * 0.35 - camX * 0.05) % 520;
      if (x < -60) x += 520;
      const y = 22 + i * 22 + Math.sin(time * 0.5 + i) * 1.5;
      ctx.globalAlpha = theme === 'night' ? 0.25 : 0.9;
      ctx.drawImage(img, Math.round(x - 40), Math.round(y));
      ctx.globalAlpha = 1;
    }

    this.drawLayer(ctx, def.far, camX * 0.12, camY * 0.04);
    this.drawLayer(ctx, def.mid, camX * 0.28, camY * 0.07);
    this.drawLayer(ctx, def.near, camX * 0.5, camY * 0.12);

    /* ambient life */
    if (theme === 'day') {
      ctx.fillStyle = PAL.inkSoft;
      for (let i = 0; i < 3; i++) {
        const bx = ((time * 14 + i * 150 - camX * 0.1) % 460) - 30;
        const by = 46 + i * 16 + Math.sin(time * 3 + i) * 2;
        ctx.fillRect(bx, by, 2, 1);
        ctx.fillRect(bx + 3, by, 2, 1);
        ctx.fillRect(bx + 2, by - 1, 1, 1);
      }
    } else if (theme === 'marsh') {
      /* low mist drifting over the bog */
      ctx.fillStyle = 'rgba(150,160,175,0.09)';
      for (let i = 0; i < 4; i++) {
        const y = 118 + i * 24;
        const x = Math.round(((time * (5 + i * 2) - camX * 0.13) % 520) - 60);
        ctx.fillRect(x, y, 96, 5);
        ctx.fillRect(x + 130, y + 6, 60, 4);
      }
    } else {
      const rnd = U.rng(theme === 'dusk' ? 91 : 97);
      for (let i = 0; i < 9; i++) {
        const fx = rnd() * 400;
        const fy = 90 + rnd() * 110;
        const px = fx + Math.sin(time * 0.8 + i) * 10 - (camX * 0.2) % 400;
        const py = fy + Math.sin(time * 1.3 + i * 2) * 6;
        const x = ((px % 400) + 400) % 400;
        const on = Math.sin(time * 3 + i * 1.7) > -0.2;
        if (on) {
          ctx.fillStyle = theme === 'dusk' ? PAL.goldLight : PAL.torch;
          ctx.fillRect(x, py, 1, 1);
        }
      }
    }
  },

  drawLayer(ctx, layer, offX, offY) {
    const w = layer.width;
    const ox = Math.floor(offX % w);
    const oy = Math.floor(offY || 0);
    ctx.drawImage(layer, -ox, -oy);
    ctx.drawImage(layer, w - ox, -oy);
  }
};

function cloudRows(variant) {
  const sets = [
    [
      '....cccc....',
      '..cccccccc..',
      '.cccccccccc.',
      '.cccccccccc.',
      '..cccccccc..'
    ],
    [
      '......cccc........',
      '..cccccccccc......',
      '.cccccccccccccc...',
      '.cccccccccccccccc.',
      '..cccccccccccccc..'
    ],
    [
      '...ccc....',
      '..ccccccc.',
      '.ccccccccc',
      '..ccccccc.'
    ]
  ];
  return sets[variant % sets.length];
}
