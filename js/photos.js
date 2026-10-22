/* MARIGOLD — optional photographs.
   The tribute layer of the game: drop real photos into assets/photos/ and the
   game finds them on its own. Nothing here is required — a missing photo is
   skipped silently and never blocks progress.

     assets/photos/portrait.png   a face for the letter
     assets/photos/01.png         a keepsake shown after west road chapter 1
     assets/photos/02.png         ... and so on, up to 12

   Any of .png .jpg .jpeg .webp works. The first extension that loads wins. */

const Photos = {
  DIR: 'assets/photos/',
  EXTS: ['png', 'jpg', 'jpeg', 'webp'],
  MAX: 12,

  portrait: null,      /* baked pixel canvas */
  cards: [],           /* index 1..MAX -> baked pixel canvas or null */
  ready: false,

  /* ---------- loading ---------- */

  /* Two passes, so a folder with nothing in it only ever asks for the .png
     files: the other formats are only tried once we know the folder holds
     something. Missing files are silent. */
  load(onDone) {
    this.cards = new Array(this.MAX + 1).fill(null);
    let pending = this.MAX + 1;

    const done = () => {
      pending--;
      if (pending > 0) return;
      /* if anything at all was found, look for the other formats too */
      if (this.found() > 0) this.secondPass();
      this.ready = true;
      if (onDone) onDone();
    };

    /* pass one: .png everywhere */
    this.probeExt('portrait', 'png', (cv) => {
      this.portrait = cv;
      done();
    });
    for (let i = 1; i <= this.MAX; i++) {
      this.probeExt(pad2(i), 'png', (cv) => {
        this.cards[i] = cv;
        done();
      });
    }
  },

  /* pass two: the other formats, for the slots the .png pass came up empty
     on. Only runs when the folder holds something, so an empty folder stays
     quiet. */
  secondPass() {
    if (!this.portrait) {
      this.probe('portrait', (cv) => { this.portrait = cv; });
    }
    for (let i = 1; i <= this.MAX; i++) {
      if (this.cards[i]) continue;
      const idx = i;
      this.probe(pad2(i), (cv) => { this.cards[idx] = cv; });
    }
  },

  /* try one extension for one base name */
  probeExt(base, ext, onFound) {
    const img = new Image();
    img.onload = function () {
      onFound(Photos.bake(img, Photos.gridFor(base)));
    };
    img.onerror = function () { onFound(null); };
    img.src = this.DIR + base + '.' + ext;
  },

  /* try every extension for one base name; the first to arrive wins */
  probe(base, onFound) {
    const self = this;
    let i = 0;
    const tryNext = () => {
      if (i >= self.EXTS.length) { onFound(null); return; }
      const ext = self.EXTS[i++];
      const img = new Image();
      img.onload = function () {
        onFound(Photos.bake(img, Photos.gridFor(base)));
      };
      img.onerror = function () { tryNext(); };
      img.src = self.DIR + base + '.' + ext;
    };
    tryNext();
  },

  /* how coarse the pixels should be for each picture */
  gridFor(base) {
    if (base === 'portrait') return { cols: 24, rows: 24 };
    return { cols: 80, rows: 48 };
  },

  /* downscale to a small grid, then let the caller blow it back up */
  bake(img, grid) {
    const cols = grid.cols || 80;
    const rows = grid.rows || 48;
    const cv = document.createElement('canvas');
    cv.width = cols;
    cv.height = rows;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    try {
      c.drawImage(img, 0, 0, cols, rows);
    } catch (err) {
      return null;
    }
    return cv;
  },

  /* ---------- drawing ---------- */

  /* a keepsake card, drawn large and slightly knocked back so it sits
     inside the pixel art rather than on top of it */
  drawCard(ctx, index, x, y, w, h) {
    const src = this.cards[index];
    if (!src) return false;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, x, y, w, h);

    /* knock the photo back toward the game's palette */
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = PAL.marigold;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    /* a thin gold frame */
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x + 1, y + 1, w - 2, 1);
    ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
    ctx.fillRect(x + 1, y + 1, 1, h - 2);
    ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
    ctx.restore();
    return true;
  },

  /* the face beside the letter's sign-off */
  drawPortrait(ctx, x, y, size) {
    if (!this.portrait) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.portrait, x, y, size, size);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(x, y, size, 1);
    ctx.fillRect(x, y + size - 1, size, 1);
    ctx.fillRect(x, y, 1, size);
    ctx.fillRect(x + size - 1, y, 1, size);
    ctx.restore();
    return true;
  },

  /* how many keepsakes have been found */
  found() {
    let n = 0;
    for (let i = 1; i <= this.MAX; i++) if (this.cards[i]) n++;
    return n;
  },

  /* is this slot open yet?
     1..5 come with the west road, 6 with the co-op chapter, and 7..12 are
     the extra cards that open once either road is finished. */
  unlocked(index) {
    if (index <= 5) return Save.isCleared(index - 1);
    if (index === 6) return !!Save.data.coopDone;
    return !!(Save.data.keepDone || Save.data.unlocked >= Save.SLOTS);
  },

  /* a slot that is both open and has a file behind it */
  has(index) {
    return !!this.cards[index] && this.unlocked(index);
  },

  /* the next keepsake to show, if any */
  nextKeepsake() {
    for (let i = 1; i <= this.MAX; i++) {
      if (this.cards[i] && this.unlocked(i) && !Save.data.photos.includes(i)) return i;
    }
    return 0;
  }
};

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}
