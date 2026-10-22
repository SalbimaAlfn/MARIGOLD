/* MARIGOLD â€” level construction.
   Each stage is a row of 25x18 "chunks" (one screen wide). Builders write into a
   tile grid and push entity specs; nothing is parsed from ASCII by hand. */

class Level {
  constructor(def) {
    this.def = def;
    this.theme = def.theme;
    this.w = def.chunks.length * 25;
    this.h = 18;
    this.grid = [];
    for (let y = 0; y < this.h; y++) this.grid.push(new Array(this.w).fill(' '));
    this.specs = [];
    this.decor = [];
    this.occupied = new Set();
    this.taken = new Set();
    this.totalFlowers = 0;
    this.spawnTile = { tx: 3, ty: 12 };
    this.spawnTile2 = null;
    this.drainAt = null;

    def.chunks.forEach((fn, i) => fn.call(new Chunk(this, i * 25)));

    this.markOccupied();
    this.autoDecor();
    this.buildTorches();
  }

  add(kind, data) {
    const spec = Object.assign({ kind }, data);
    spec.i = this.specs.length;
    if (kind === 'flower') this.totalFlowers++;
    this.specs.push(spec);
    return spec;
  }

  buildTorches() {
    for (const s of this.specs) {
      if (s.kind !== 'torch') continue;
      this.decor.push({ type: 'torch', x: s.tx * 16 + 8, y: s.ty * 16, seed: s.tx * 0.7 });
    }
  }

  charAt(tx, ty) {
    if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return ' ';
    return this.grid[ty][tx];
  }

  solidAt(tx, ty) {
    if (tx < 0 || tx >= this.w) return true;   // walls of the world
    if (ty < 0 || ty >= this.h) return false;  // open sky, open pit
    const ch = this.grid[ty][tx];
    return ch === '#' || ch === '=' || ch === 'X' || ch === 'T' || ch === 'M' || ch === 'w';
  }

  oneWayAt(tx, ty) {
    if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return false;
    return this.grid[ty][tx] === '-';
  }

  hazardAt(tx, ty) {
    const ch = this.charAt(tx, ty);
    return ch === '^' || ch === '~' || ch === 'v' || ch === 'B';
  }

  breakCrate(tx, ty) {
    if (this.charAt(tx, ty) !== 'X') return false;
    this.grid[ty][tx] = ' ';
    return true;
  }

  markOccupied() {
    for (const s of this.specs) {
      if (s.kind === 'door') {
        const tw = s.type === 'tower' ? 3 : 2;
        const th = s.type === 'tower' ? 4 : 3;
        for (let i = 0; i < tw; i++) {
          for (let j = -th + 1; j <= 0; j++) {
            this.occupied.add((s.tx + i) + ',' + (s.ty + j));
          }
        }
      } else {
        this.occupied.add(s.tx + ',' + s.ty);
      }
    }
  }

  isOccupied(tx, ty) { return this.occupied.has(tx + ',' + ty); }

  /* scatter small scenery on every reachable ground surface */
  autoDecor() {
    const theme = this.theme;
    const rnd = U.rng(this.def.seed || 1234);
    for (let tx = 1; tx < this.w - 1; tx++) {
      for (let ty = 8; ty < 17; ty++) {
        const ch = this.grid[ty][tx];
        if (ch !== '#' && ch !== '=' && ch !== 'M') continue;
        if (this.grid[ty - 1][tx] !== ' ') continue;
        if (this.isOccupied(tx, ty) || this.isOccupied(tx, ty - 1)) continue;
        const r = rnd();
        if (r > 0.46) continue;
        const px = tx * 16 + Math.floor(rnd() * 8);
        const py = ty * 16;
        const pick = rnd();
        let type;
        if (theme === 'keep') {
          type = pick < 0.5 ? 'rubble' : 'thorn';
        } else if (theme === 'woods') {
          if (pick < 0.26) type = 'tuft';
          else if (pick < 0.58) type = 'bush';
          else if (pick < 0.74) type = 'flower';
          else if (pick < 0.9) type = 'thorn';
          else type = 'rock';
        } else if (theme === 'marsh') {
          if (pick < 0.3) type = 'tuft';
          else if (pick < 0.58) type = 'reed';
          else if (pick < 0.74) type = 'flower';
          else if (pick < 0.9) type = 'mushroom';
          else type = 'rock';
        } else {
          if (pick < 0.3) type = 'tuft';
          else if (pick < 0.55) type = 'bush';
          else if (pick < 0.8) type = 'flower';
          else type = 'rock';
        }
        this.decor.push({ type, x: px, y: py, color: rnd() < 0.5 ? 'rose' : 'cream', seed: rnd() * 10 });
      }
    }
  }
}

/* ---------- chunk builder (local coordinates, 25 wide x 18 tall) ---------- */

class Chunk {
  constructor(level, ox) {
    this.l = level;
    this.ox = ox;
  }

  put(x, y, ch) {
    if (x < 0 || x > 24 || y < 0 || y > 17) return;
    this.l.grid[y][this.ox + x] = ch;
  }

  rect(x, y, w, h, ch) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) this.put(x + dx, y + dy, ch);
    }
  }

  clear(x, y, w, h) { this.rect(x, y, w, h, ' '); }

  ground(x0 = 0, x1 = 24, top = 13) {
    this.rect(x0, top, x1 - x0 + 1, 18 - top, '#');
  }

  water(x0, x1) {
    this.clear(x0, 13, x1 - x0 + 1, 2);
    this.rect(x0, 15, x1 - x0 + 1, 3, '~');
  }

  platform(x, y, w) { this.rect(x, y, w, 1, '-'); }
  stone(x, y, w) { this.rect(x, y, w, 1, '='); }
  ceiling(y, x0 = 0, x1 = 24) { this.rect(x0, y, x1 - x0 + 1, 1, '='); }
  crate(x, y) { this.put(x, y, 'X'); }
  spike(x, y, w = 1) { this.rect(x, y, w, 1, '^'); }
  vine(x, y, h) { this.rect(x, y, 1, h, 'v'); }
  /* new ground kinds */
  tree(x, y, h = 2) { this.rect(x, y, 1, h, 'T'); }
  mud(x, y, w = 1, h = 1) { this.rect(x, y, w, h, 'M'); }
  bramble(x, y, w = 1) { this.rect(x, y, w, 1, 'B'); }
  saw(x, y, dist = 4, speed = 46) { this.l.add('saw', { tx: this.ox + x, ty: y, dist, speed }); }
  wasp(x, y, range = 3) { this.l.add('wasp', { tx: this.ox + x, ty: y, range }); }
  boulder(x, y, dist = 5, speed = 40) { this.l.add('boulder', { tx: this.ox + x, ty: y, dist, speed }); }

  spawn(x, y) { this.l.spawnTile = { tx: this.ox + x, ty: y }; }
  enemy(kind, x, y) { this.l.add(kind, { tx: this.ox + x, ty: y }); }
  flower(x, y) { this.l.add('flower', { tx: this.ox + x, ty: y }); }
  violet(x, y) { this.l.add('violet', { tx: this.ox + x, ty: y }); }
  checkpoint(x, y) { this.l.add('checkpoint', { tx: this.ox + x, ty: y }); }
  sign(x, y, text) { this.l.add('sign', { tx: this.ox + x, ty: y, text }); }
  pod(x, y) { this.l.add('pod', { tx: this.ox + x, ty: y }); }
  mover(x, y, w, axis, dist, speed) {
    this.l.add('mover', { tx: this.ox + x, ty: y, tiles: w, axis, dist, speed });
  }
  crumble(x, y, w) { this.l.add('crumble', { tx: this.ox + x, ty: y, tiles: w }); }
  door(x, y, type) { this.l.add('door', { tx: this.ox + x, ty: y, type }); }
  torch(x, y) { this.l.add('torch', { tx: this.ox + x, ty: y }); }

  /* the west road */
  shrine(x, y) { this.l.add('shrine', { tx: this.ox + x, ty: y }); }
  husk(x, y) { this.l.add('husk', { tx: this.ox + x, ty: y }); }
  glint(x, y) { this.l.add('glint', { tx: this.ox + x, ty: y }); }
  beacon(x, y) { this.l.add('beacon', { tx: this.ox + x, ty: y }); }
  drain(x = 0) { this.l.add('drain', { tx: this.ox + x }); }
  wade(x, y, w = 1) { this.rect(x, y, w, 1, 'w'); }
  spawn2(x, y) { this.l.spawnTile2 = { tx: this.ox + x, ty: y }; }
}

/* ---------- the campaign ---------- */

const STAGES = [
  {
    id: 'meadow',
    nameKey: 'stage.1.name',
    number: 'STAGE 1',
    theme: 'day',
    music: 'meadow',
    seed: 101,
    chunks: [
      /* 0 â€” welcome */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(8, 12, 'sign.1');
        this.flower(14, 12);
        this.platform(17, 11, 4);
        this.flower(18, 10);
        this.flower(19, 10);
        this.crate(23, 12);
      },
      /* 1 â€” first foe, first gap */
      function () {
        this.ground();
        this.clear(9, 13, 3, 5);
        this.enemy('imp', 5, 12);
        this.flower(10, 10);
        this.flower(14, 12);
        this.crate(18, 12);
        this.flower(21, 11);
      },
      /* 2 â€” lantern, spikes, hill */
      function () {
        this.ground();
        this.rect(14, 11, 11, 7, '#');
        this.put(13, 12, '#');
        this.checkpoint(2, 12);
        this.spike(7, 12, 3);
        this.flower(17, 10);
        this.flower(19, 10);
        this.flower(21, 10);
        this.crate(23, 10);
        this.enemy('imp', 20, 10);
      },
      /* 3 â€” bridged pit, crate wall */
      function () {
        this.ground();
        this.clear(7, 13, 4, 5);
        this.platform(8, 11, 2);
        this.flower(9, 10);
        this.crate(16, 12);
        this.crate(16, 11);
        this.crate(17, 12);
        this.enemy('imp', 20, 12);
        this.flower(23, 12);
      },
      /* 4 â€” the high road */
      function () {
        this.ground();
        this.platform(11, 10, 3);
        this.flower(12, 9);
        this.flower(13, 9);
        this.platform(16, 7, 3);
        this.violet(18, 6);
        this.spike(9, 12, 3);
        this.spike(15, 12, 2);
        this.enemy('imp', 6, 12);
        this.enemy('imp', 22, 12);
      },
      /* 5 â€” old ruins */
      function () {
        this.ground();
        this.stone(5, 11, 4);
        this.flower(6, 10);
        this.flower(8, 10);
        this.clear(10, 13, 3, 5);
        this.crate(15, 12);
        this.crate(16, 12);
        this.enemy('imp', 18, 12);
        this.spike(21, 12, 2);
        this.stone(23, 11, 2);
        this.flower(23, 10);
      },
      /* 6 â€” the gate */
      function () {
        this.ground();
        this.enemy('imp', 9, 12);
        this.flower(12, 12);
        this.flower(14, 12);
        this.flower(16, 11);
        this.door(20, 12, 'gate');
      }
    ]
  },

  {
    id: 'woods',
    nameKey: 'stage.2.name',
    number: 'STAGE 2',
    theme: 'woods',
    music: 'woods',
    seed: 212,
    chunks: [
      /* 0 — the tree line */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'sign.2');
        this.tree(12, 11, 2);
        this.flower(16, 12);
        this.flower(18, 12);
        this.crate(21, 12);
        this.enemy('beetle', 23, 12);
      },
      /* 1 — bramble beds */
      function () {
        this.ground();
        this.bramble(8, 12, 2);
        this.tree(13, 11, 2);
        this.bramble(16, 12, 2);
        this.platform(19, 11, 3);
        this.flower(20, 10);
        this.enemy('imp', 5, 12);
        this.enemy('imp', 22, 12);
        this.flower(14, 12);
      },
      /* 2 — the saw rail */
      function () {
        this.ground();
        this.checkpoint(3, 12);
        this.saw(9, 11, 5, 52);
        this.tree(16, 11, 2);
        this.platform(19, 10, 3);
        this.flower(20, 9);
        this.flower(14, 12);
        this.enemy('beetle', 23, 12);
      },
      /* 3 — up the trunks */
      function () {
        this.ground();
        this.tree(5, 11, 2);
        this.platform(8, 11, 2);
        this.platform(12, 9, 2);
        this.platform(16, 7, 2);
        this.flower(13, 8);
        this.flower(17, 6);
        this.wasp(11, 9, 3);
        this.enemy('imp', 21, 12);
        this.flower(23, 12);
      },
      /* 4 — the thorn floor */
      function () {
        this.ground();
        this.ceiling(7);
        this.bramble(9, 12, 3);
        this.bramble(16, 12, 2);
        this.tree(13, 11, 2);
        this.enemy('imp', 6, 12);
        this.flower(19, 12);
        this.flower(21, 12);
      },
      /* 5 — the rolling stones */
      function () {
        this.ground();
        this.rect(2, 11, 1, 2, '=');
        this.rect(15, 11, 1, 2, '=');
        this.boulder(6, 12, 0, 42);
        this.checkpoint(17, 12);
        this.platform(18, 10, 3);
        this.flower(19, 9);
        this.enemy('imp', 21, 12);
        this.flower(23, 12);
      },
      /* 6 — the clearing */
      function () {
        this.ground();
        this.torch(4, 13);
        this.torch(17, 13);
        this.flower(8, 12);
        this.flower(11, 12);
        this.enemy('imp', 14, 12);
        this.door(20, 12, 'gate');
      }
    ]
  },

  {
    id: 'mill',
    nameKey: 'stage.3.name',
    number: 'STAGE 3',
    theme: 'dusk',
    music: 'mill',
    seed: 202,
    chunks: [
      /* 0 â€” welcome to the water */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'sign.3');
        this.flower(12, 12);
        this.flower(14, 12);
        this.crate(18, 12);
        this.enemy('beetle', 22, 12);
      },
      /* 1 â€” first crossing */
      function () {
        this.ground(0, 9);
        this.water(10, 17);
        this.ground(18, 24);
        this.mover(11, 10, 2, 'x', 6, 55);
        this.flower(13, 9);
        this.flower(14, 9);
        this.enemy('bat', 15, 8);
        this.flower(20, 12);
      },
      /* 2 â€” the mill wall */
      function () {
        this.ground(0, 9);
        this.water(10, 13);
        this.rect(14, 6, 11, 12, '=');
        /* lift: hangs from the mill chain, top of its run level with the wall top
           (row 6), bottom of its run 2 tiles above the ground so it can be boarded */
        this.mover(11, 6, 2, 'y', 5, 48);
        this.flower(12, 5);
        this.stone(15, 5, 3);
        this.enemy('bat', 17, 4);
        this.flower(16, 4);
        this.checkpoint(21, 5);
        this.crate(23, 5);
        this.flower(19, 5);
      },
      /* 3 â€” coming down */
      function () {
        this.rect(0, 6, 6, 12, '=');
        this.ground(6, 24);
        this.crumble(8, 8, 2);
        this.crumble(12, 10, 2);
        this.flower(9, 7);
        this.flower(13, 9);
        this.enemy('bat', 16, 6);
        this.enemy('beetle', 20, 12);
        this.flower(23, 12);
      },
      /* 4 â€” the long water */
      function () {
        this.ground(0, 3);
        this.water(4, 19);
        this.ground(20, 24);
        this.mover(5, 11, 2, 'x', 5, 55);
        this.crumble(11, 10, 2);
        this.mover(14, 9, 2, 'x', 4, 45);
        this.flower(8, 8);
        this.flower(16, 7);
        this.enemy('bat', 12, 7);
      },
      /* 5 â€” the mill yard */
      function () {
        this.ground();
        this.checkpoint(3, 12);
        this.enemy('beetle', 9, 12);
        this.spike(12, 12, 2);
        this.crate(16, 12);
        this.crate(17, 12);
        this.platform(18, 10, 3);
        this.flower(19, 9);
        this.platform(21, 7, 3);
        this.violet(23, 6);
        this.flower(14, 11);
      },
      /* 6 â€” second crossing */
      function () {
        this.ground(0, 5);
        this.water(6, 14);
        this.ground(15, 24);
        this.mover(7, 11, 2, 'x', 4, 60);
        this.crumble(12, 10, 2);
        this.flower(9, 9);
        this.enemy('bat', 10, 7);
        this.enemy('beetle', 18, 12);
        this.flower(16, 12);
        this.flower(20, 12);
      },
      /* 7 â€” the mill gate */
      function () {
        this.ground();
        this.enemy('beetle', 7, 12);
        this.flower(10, 12);
        this.flower(12, 12);
        this.crate(15, 12);
        this.crate(16, 11);
        this.flower(13, 11);
        this.door(20, 12, 'gate');
      }
    ]
  },

  {
    id: 'marsh',
    nameKey: 'stage.4.name',
    number: 'STAGE 4',
    theme: 'marsh',
    music: 'marsh',
    seed: 404,
    chunks: [
      /* 0 — the bog edge */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(5, 12, 'sign.4');
        this.mud(8, 12, 3, 1);
        this.flower(9, 11);
        this.water(14, 18);
        this.ground(19, 24);
        this.mover(15, 11, 2, 'x', 3, 42);
        this.flower(21, 12);
        this.enemy('beetle', 23, 12);
      },
      /* 1 — the mud flats */
      function () {
        this.ground(0, 8);
        this.checkpoint(2, 12);
        this.water(9, 15);
        this.ground(16, 24);
        this.mud(4, 12, 3, 1);
        this.flower(5, 11);
        this.crumble(10, 11, 2);
        this.platform(13, 11, 2);
        this.flower(14, 10);
        this.mover(15, 10, 2, 'x', 2, 40);
        this.flower(19, 12);
        this.enemy('beetle', 22, 12);
      },
      /* 2 — the wasp nest */
      function () {
        this.ground();
        this.checkpoint(3, 12);
        this.ceiling(7);
        this.vine(11, 9, 2);
        this.vine(17, 9, 2);
        this.wasp(9, 9, 4);
        this.wasp(18, 8, 4);
        this.mud(6, 12, 2, 1);
        this.flower(7, 11);
        this.flower(14, 12);
      },
      /* 3 — the sinking bog */
      function () {
        this.ground(0, 4);
        this.water(5, 17);
        this.ground(18, 24);
        this.crumble(7, 11, 2);
        this.platform(10, 10, 2);
        this.flower(11, 9);
        this.mover(12, 10, 2, 'x', 3, 46);
        this.wasp(13, 8, 3);
        this.flower(20, 12);
      },
      /* 4 — the mud mounds */
      function () {
        this.ground();
        this.mud(4, 11, 3, 2);
        this.flower(5, 10);
        this.rect(9, 11, 1, 2, '=');
        this.rect(17, 11, 1, 2, '=');
        this.boulder(12, 12, 0, 38);
        this.checkpoint(3, 12);
        this.enemy('imp', 20, 12);
        this.flower(23, 12);
      },
      /* 5 — the reed beds */
      function () {
        this.ground(0, 3);
        this.water(4, 18);
        this.ground(19, 24);
        this.mover(5, 11, 2, 'x', 4, 48);
        this.platform(11, 10, 2);
        this.flower(12, 9);
        this.mover(14, 9, 2, 'x', 3, 44);
        this.wasp(10, 7, 4);
        this.flower(21, 12);
        this.enemy('beetle', 23, 12);
      },
      /* 6 — the reed gate */
      function () {
        this.ground();
        this.checkpoint(3, 12);
        this.torch(5, 13);
        this.torch(16, 13);
        this.flower(8, 12);
        this.flower(11, 12);
        this.enemy('imp', 13, 12);
        this.flower(15, 12);
        this.crate(17, 12);
        this.door(20, 12, 'gate');
      }
    ]
  },

  {
    id: 'keep',
    nameKey: 'stage.5.name',
    number: 'STAGE 5',
    theme: 'night',
    music: 'keep',
    seed: 303,
    chunks: [
      /* 0 â€” through the gate */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'sign.5');
        this.torch(4, 13);
        this.torch(17, 13);
        this.flower(12, 12);
        this.flower(14, 12);
        this.crate(18, 12);
        this.enemy('guard', 22, 12);
      },
      /* 1 â€” thorn corridor */
      function () {
        this.ground();
        this.ceiling(7);
        this.vine(8, 9, 2);
        this.vine(14, 9, 2);
        this.spike(11, 12, 2);
        this.pod(18, 8);
        this.enemy('guard', 21, 12);
        this.flower(13, 11);
        this.flower(16, 11);
      },
      /* 2 â€” the cellar */
      function () {
        this.ground();
        this.ceiling(7);
        this.checkpoint(3, 12);
        this.vine(10, 9, 2);
        this.vine(16, 9, 2);
        this.pod(14, 8);
        this.enemy('guard', 12, 12);
        this.crate(20, 12);
        this.crate(21, 12);
        this.flower(7, 11);
        this.flower(23, 11);
      },
      /* 3 â€” climbing the briars */
      function () {
        this.ground();
        this.stone(5, 11, 4);
        this.flower(6, 10);
        this.stone(11, 9, 4);
        this.flower(12, 8);
        this.spike(8, 12, 2);
        this.crumble(17, 7, 3);
        this.flower(17, 6);
        this.violet(19, 6);
        this.enemy('guard', 22, 12);
      },
      /* 4 â€” the gauntlet */
      function () {
        this.ground();
        this.ceiling(7);
        this.spike(6, 12, 2);
        this.spike(13, 12, 3);
        this.pod(8, 8);
        this.pod(11, 8);
        this.pod(19, 8);
        this.vine(15, 9, 2);
        this.enemy('guard', 17, 12);
        this.enemy('guard', 23, 12);
        this.flower(10, 11);
        this.flower(14, 11);
        this.flower(4, 11);
      },
      /* 5 â€” the chasm */
      function () {
        this.ground(0, 9);
        this.clear(10, 13, 4, 4);
        this.rect(10, 17, 4, 1, '=');
        this.spike(10, 16, 4);
        this.ground(14, 24);
        this.mover(10, 11, 2, 'x', 3, 45);
        this.flower(12, 9);
        this.flower(17, 12);
        this.torch(16, 13);
        this.enemy('beetle', 21, 12);
      },
      /* 6 â€” final hall */
      function () {
        this.ground();
        this.ceiling(7);
        this.checkpoint(3, 12);
        this.pod(7, 8);
        this.pod(16, 8);
        this.vine(11, 9, 2);
        this.spike(13, 12, 2);
        this.enemy('guard', 9, 12);
        this.enemy('guard', 19, 12);
        this.flower(5, 11);
        this.flower(22, 11);
      },
      /* 7 â€” the tower door */
      function () {
        this.ground();
        this.enemy('guard', 11, 12);
        this.flower(8, 12);
        this.flower(13, 12);
        this.flower(15, 11);
        this.crate(16, 12);
        this.torch(5, 13);
        this.torch(22, 13);
        this.door(18, 12, 'tower');
      }
    ]
  }
];

/* ---------- the west road ----------
   The same night, walked the other way. SnoozyPaw is the keeper of the
   meadow: she cannot fight, but she can grow things, and the road remembers
   what she plants. Five chapters, each ending at a shrine with three empty
   sockets that only her own flowers can fill. */

const CHAPTERS = [
  {
    id: 'lantern',
    nameKey: 'chapter.1.name',
    number: 'CHAPTER 1',
    blurbKey: 'blurb.keep.1',
    theme: 'day',
    music: 'keeper',
    seed: 211,
    profile: 'keep',
    chunks: [
      /* 0 — the meadow, and the house she left */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'sign.keep.1');
        this.flower(11, 12);
        this.flower(12, 12);
        this.torch(15, 12);
        this.platform(18, 11, 3);
        this.flower(19, 10);
        this.flower(20, 10);
        this.checkpoint(23, 12);
      },
      /* 1 — the first gap */
      function () {
        this.ground();
        this.flower(4, 12);
        this.clear(9, 13, 5, 5);
        this.platform(11, 12, 3);
        this.flower(12, 11);
        this.enemy('imp', 18, 12);
        this.flower(20, 12);
        this.flower(21, 12);
        this.torch(23, 12);
      },
      /* 2 — the hill, and the brambles at its foot */
      function () {
        this.ground();
        this.checkpoint(3, 12);
        this.platform(6, 11, 3);
        this.flower(7, 10);
        this.flower(8, 10);
        this.clear(10, 13, 4, 5);
        this.rect(14, 12, 11, 6, '#');
        this.flower(16, 11);
        this.flower(18, 11);
        this.flower(20, 11);
        this.enemy('imp', 17, 11);
        this.torch(23, 11);
      },
      /* 3 — the long gap under the lantern line */
      function () {
        this.ground();
        this.torch(2, 12);
        this.clear(6, 13, 6, 5);
        this.platform(8, 12, 2);
        this.platform(10, 11, 2);
        this.flower(11, 10);
        this.enemy('bat', 15, 8);
        this.flower(17, 12);
        this.flower(18, 12);
        this.spike(21, 12, 2);
        this.checkpoint(23, 12);
      },
      /* 4 — the shrine */
      function () {
        this.ground();
        this.flower(4, 12);
        this.flower(5, 12);
        this.torch(8, 12);
        this.enemy('imp', 12, 12);
        this.platform(15, 11, 3);
        this.flower(16, 10);
        this.shrine(19, 12);
        this.sign(23, 12, 'sign.keep.1end');
      }
    ]
  },

  {
    id: 'nettle',
    nameKey: 'chapter.2.name',
    number: 'CHAPTER 2',
    blurbKey: 'blurb.keep.2',
    theme: 'woods',
    music: 'nettle',
    seed: 233,
    profile: 'keep',
    drain: true,
    drainSpeed: 24,
    chunks: [
      /* 0 — the wood thins out */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'sign.keep.2');
        this.flower(11, 12);
        this.drain(0);
        this.tree(14, 11, 2);
        this.flower(16, 12);
        this.platform(19, 11, 3);
        this.flower(20, 10);
        this.checkpoint(23, 12);
      },
      /* 1 — nettles and a hole in the path */
      function () {
        this.ground();
        this.bramble(6, 12, 2);
        this.flower(9, 12);
        this.clear(11, 13, 4, 5);
        this.platform(13, 12, 2);
        this.enemy('imp', 18, 12);
        this.tree(20, 11, 2);
        this.flower(22, 12);
      },
      /* 2 — the bramble bed */
      function () {
        this.ground();
        this.checkpoint(3, 12);
        this.platform(6, 11, 4);
        this.flower(7, 10);
        this.flower(8, 10);
        this.bramble(11, 12, 3);
        this.clear(15, 13, 3, 5);
        this.platform(17, 11, 3);
        this.flower(18, 10);
        this.enemy('beetle', 21, 12);
      },
      /* 3 — over the top */
      function () {
        this.ground();
        this.tree(4, 11, 2);
        this.flower(7, 12);
        this.clear(9, 13, 7, 5);
        this.platform(12, 11, 2);
        this.flower(13, 10);
        this.platform(15, 10, 2);
        this.bramble(18, 12, 2);
        this.enemy('imp', 21, 12);
        this.checkpoint(23, 12);
      },
      /* 4 — the colour starts to go */
      function () {
        this.ground();
        this.flower(3, 12);
        this.bramble(6, 12, 2);
        this.platform(10, 11, 3);
        this.flower(11, 10);
        this.clear(14, 13, 4, 5);
        this.platform(16, 12, 2);
        this.enemy('beetle', 20, 12);
        this.torch(22, 12);
      },
      /* 5 — the shrine */
      function () {
        this.ground();
        this.flower(4, 12);
        this.flower(5, 12);
        this.bramble(8, 12, 2);
        this.tree(12, 11, 2);
        this.flower(15, 12);
        this.shrine(18, 12);
        this.sign(22, 12, 'sign.keep.2end');
      }
    ]
  },

  {
    id: 'drowned',
    nameKey: 'chapter.3.name',
    number: 'CHAPTER 3',
    blurbKey: 'blurb.keep.3',
    theme: 'marsh',
    music: 'drowned',
    seed: 251,
    profile: 'keep',
    chunks: [
      /* 0 — the water starts */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'sign.keep.3');
        this.wade(11, 13, 5);
        this.flower(12, 12);
        this.flower(14, 12);
        this.checkpoint(18, 12);
      },
      /* 1 — wading, and a hole under the water */
      function () {
        this.ground();
        this.wade(5, 13, 4);
        this.clear(10, 13, 4, 5);
        this.platform(12, 12, 2);
        this.flower(13, 11);
        this.wade(15, 13, 3);
        this.enemy('beetle', 20, 12);
        this.flower(22, 12);
      },
      /* 2 — the reed beds */
      function () {
        this.ground();
        this.checkpoint(3, 12);
        this.wade(6, 13, 3);
        this.platform(10, 11, 3);
        this.flower(11, 10);
        this.flower(12, 10);
        this.clear(14, 13, 5, 5);
        this.platform(16, 11, 2);
        this.flower(17, 10);
        this.enemy('bat', 20, 8);
        this.wade(21, 13, 4);
      },
      /* 3 — the long wet stretch */
      function () {
        this.ground();
        this.flower(4, 12);
        this.clear(7, 13, 6, 5);
        this.platform(9, 12, 2);
        this.platform(12, 11, 2);
        this.flower(13, 10);
        this.enemy('bat', 16, 7);
        this.wade(18, 13, 5);
        this.flower(20, 12);
        this.spike(22, 12, 2);
      },
      /* 4 — the mud shelf */
      function () {
        this.ground();
        this.wade(4, 13, 3);
        this.flower(6, 12);
        this.platform(9, 11, 3);
        this.flower(10, 10);
        this.clear(13, 13, 4, 5);
        this.platform(15, 12, 2);
        this.enemy('beetle', 19, 12);
        this.torch(22, 12);
        this.checkpoint(23, 12);
      },
      /* 5 — the shrine */
      function () {
        this.ground();
        this.wade(4, 13, 4);
        this.flower(6, 12);
        this.flower(7, 12);
        this.platform(11, 11, 3);
        this.flower(12, 10);
        this.enemy('bat', 15, 8);
        this.shrine(18, 12);
        this.sign(22, 12, 'sign.keep.3end');
      }
    ]
  },

  {
    id: 'husks',
    nameKey: 'chapter.4.name',
    number: 'CHAPTER 4',
    blurbKey: 'blurb.keep.4',
    theme: 'dusk',
    music: 'husks',
    seed: 271,
    profile: 'keep',
    chunks: [
      /* 0 — something is standing in the field */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'sign.keep.4');
        this.husk(12, 12);
        this.glint(15, 11);
        this.checkpoint(19, 12);
        this.torch(22, 12);
      },
      /* 1 — the first of them wakes */
      function () {
        this.ground();
        this.clear(7, 13, 5, 5);
        this.platform(9, 12, 2);
        this.husk(14, 12);
        this.glint(17, 10);
        this.platform(16, 10, 3);
        this.flower(19, 12);
        this.spike(21, 12, 3);
      },
      /* 2 — the stone shelf */
      function () {
        this.ground();
        this.checkpoint(3, 12);
        this.husk(8, 12);
        this.glint(11, 9);
        this.platform(10, 10, 3);
        this.rect(15, 12, 10, 6, '#');
        this.husk(18, 11);
        this.flower(20, 11);
        this.torch(23, 11);
      },
      /* 3 — three of them */
      function () {
        this.ground();
        this.clear(5, 13, 6, 5);
        this.platform(7, 12, 2);
        this.platform(10, 11, 2);
        this.glint(11, 10);
        this.husk(15, 12);
        this.husk(18, 12);
        this.flower(20, 12);
        this.checkpoint(23, 12);
      },
      /* 4 — keep the light up */
      function () {
        this.ground();
        this.glint(4, 10);
        this.platform(3, 11, 3);
        this.husk(10, 12);
        this.clear(12, 13, 5, 5);
        this.platform(14, 11, 2);
        this.glint(15, 10);
        this.husk(19, 12);
        this.flower(21, 12);
      },
      /* 5 — the shrine */
      function () {
        this.ground();
        this.husk(6, 12);
        this.glint(9, 11);
        this.platform(8, 12, 3);
        this.flower(12, 12);
        this.husk(15, 12);
        this.shrine(18, 12);
        this.sign(22, 12, 'sign.keep.4end');
      }
    ]
  },

  {
    id: 'bloom',
    nameKey: 'chapter.5.name',
    number: 'CHAPTER 5',
    blurbKey: 'blurb.keep.5',
    theme: 'night',
    music: 'bloom',
    seed: 293,
    profile: 'keep',
    drain: true,
    drainMode: 'bloom',
    drainSpeed: 6,
    chunks: [
      /* 0 — the briar has reached the road */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'sign.keep.5');
        this.torch(10, 12);
        this.flower(13, 12);
        this.bramble(16, 12, 2);
        this.checkpoint(20, 12);
        this.drain(0);
      },
      /* 1 — the first wall of it */
      function () {
        this.ground();
        this.clear(6, 13, 5, 5);
        this.platform(8, 12, 2);
        this.bramble(12, 12, 3);
        this.husk(16, 12);
        this.flower(19, 12);
        this.torch(22, 12);
      },
      /* 2 — over the briar bank */
      function () {
        this.ground();
        this.checkpoint(3, 12);
        this.bramble(7, 12, 2);
        this.rect(11, 11, 14, 7, '#');
        this.bramble(13, 10, 3);
        this.flower(16, 10);
        this.flower(18, 10);
        this.husk(21, 10);
        this.torch(23, 10);
      },
      /* 3 — the dark stretch */
      function () {
        this.ground();
        this.clear(5, 13, 8, 5);
        this.platform(7, 12, 2);
        this.platform(10, 11, 2);
        this.bramble(13, 12, 2);
        this.glint(16, 9);
        this.platform(15, 10, 3);
        this.husk(19, 12);
        this.checkpoint(23, 12);
      },
      /* 4 — the last open ground */
      function () {
        this.ground();
        this.bramble(5, 12, 2);
        this.husk(9, 12);
        this.glint(12, 10);
        this.platform(11, 11, 3);
        this.clear(15, 13, 4, 5);
        this.platform(17, 11, 2);
        this.flower(20, 12);
        this.spike(22, 12, 2);
      },
      /* 5 — the gate of the old bloom */
      function () {
        this.ground();
        this.flower(4, 12);
        this.husk(8, 12);
        this.bramble(11, 12, 3);
        this.platform(16, 11, 3);
        this.glint(17, 10);
        this.husk(20, 12);
        this.checkpoint(23, 12);
      },
      /* 6 — the heart, and the shrine */
      function () {
        this.ground();
        this.rect(5, 11, 5, 7, '=');
        this.rect(15, 11, 5, 7, '=');
        this.bramble(11, 12, 3);
        this.flower(13, 12);
        this.shrine(20, 12);
        this.sign(24, 12, 'sign.keep.5end');
      }
    ]
  }
];

/* ---------- the two of them, together ---------- */

const COOP_CHAPTER = {
  id: 'together',
  nameKey: 'chapter.coop.name',
  number: 'CO-OP',
  blurbKey: 'blurb.coop',
  theme: 'dusk',
  music: 'keeper',
  seed: 311,
  profile: 'keep',
  coop: true,
  chunks: [
    /* 0 — side by side */
    function () {
      this.ground();
      this.spawn(3, 12);
      this.spawn2(6, 12);
      this.sign(9, 12, 'sign.coop.1');
      this.flower(12, 12);
      this.torch(15, 12);
      this.checkpoint(19, 12);
    },
    /* 1 — a gap only one of you can cross */
    function () {
      this.ground();
      this.clear(7, 13, 4, 5);
      this.platform(9, 12, 2);
      this.enemy('imp', 14, 12);
      this.flower(17, 12);
      this.torch(21, 12);
    },
    /* 2 — the high ledge */
    function () {
      this.ground();
      this.checkpoint(3, 12);
      this.platform(6, 11, 4);
      this.flower(7, 10);
      this.flower(8, 10);
      this.clear(12, 13, 4, 5);
      this.rect(17, 12, 8, 6, '#');
      this.flower(19, 11);
      this.enemy('beetle', 22, 11);
    },
    /* 3 — do not let go */
    function () {
      this.ground();
      this.clear(5, 13, 7, 5);
      this.platform(7, 12, 2);
      this.platform(10, 11, 2);
      this.flower(11, 10);
      this.enemy('bat', 15, 8);
      this.flower(18, 12);
      this.spike(21, 12, 2);
    },
    /* 4 — the last stretch */
    function () {
      this.ground();
      this.bramble(5, 12, 2);
      this.platform(9, 11, 3);
      this.flower(10, 10);
      this.clear(13, 13, 4, 5);
      this.platform(15, 12, 2);
      this.enemy('imp', 19, 12);
      this.torch(22, 12);
      this.checkpoint(23, 12);
    },
    /* 5 — the shrine, together */
    function () {
      this.ground();
      this.flower(4, 12);
      this.flower(5, 12);
      this.platform(10, 11, 3);
      this.flower(11, 10);
      this.shrine(17, 12);
      this.sign(22, 12, 'sign.coop.2');
    }
  ]
};
