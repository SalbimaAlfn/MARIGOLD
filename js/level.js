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
    return ch === '#' || ch === '=' || ch === 'X';
  }

  oneWayAt(tx, ty) {
    if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return false;
    return this.grid[ty][tx] === '-';
  }

  hazardAt(tx, ty) {
    const ch = this.charAt(tx, ty);
    return ch === '^' || ch === '~' || ch === 'v';
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
        if (ch !== '#' && ch !== '=') continue;
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
}

/* ---------- the campaign ---------- */

const STAGES = [
  {
    id: 'meadow',
    name: 'LONG MEADOW',
    number: 'STAGE 1',
    theme: 'day',
    music: 'meadow',
    seed: 101,
    chunks: [
      /* 0 â€” welcome */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(8, 12, 'THE KEEP LIES EAST');
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
    id: 'mill',
    name: 'MILLBROOK',
    number: 'STAGE 2',
    theme: 'dusk',
    music: 'mill',
    seed: 202,
    chunks: [
      /* 0 â€” welcome to the water */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'MIND THE WATER');
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
        this.mover(9, 11, 2, 'y', 5, 48);
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
    id: 'keep',
    name: 'BRIAR KEEP',
    number: 'STAGE 3',
    theme: 'night',
    music: 'keep',
    seed: 303,
    chunks: [
      /* 0 â€” through the gate */
      function () {
        this.ground();
        this.spawn(3, 12);
        this.sign(7, 12, 'SHE IS IN THE TOWER');
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
