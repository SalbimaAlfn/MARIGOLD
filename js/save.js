/* MARIGOLD — persistence. Kept in its own file so the i18n layer can read and
   write the stored language without depending on the boot order. */

/* a fresh save: both roads, the letter, the photos, all empty */
function saveDefaults() {
  return {
    muted: false,
    unlocked: 1,
    best: [0, 0, 0, 0, 0],
    hintSeen: false,
    lang: 'en',
    pace: 'normal',
    reveal: 'instant',
    prologueSeen: false,

    /* the keeper's name, signed into the letter */
    name: '',

    /* the west road: her own campaign */
    keepUnlocked: 1,
    keepBest: [0, 0, 0, 0, 0],
    keepCleared: [],
    keepDone: false,
    keepPrologueSeen: false,

    /* the two of them, together */
    coopDone: false,

    /* the meadow is shared between both roads */
    flowers: 0,

    /* keepsake photos, by index */
    photos: [],

    letterSeen: false,

    /* which road a fresh play starts on */
    road: 'keep'
  };
}

const Save = {
  KEY: 'marigold.save.v1',
  SLOTS: 5,
  data: saveDefaults(),

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.unlocked === 'number') this.data.unlocked = U.clamp(parsed.unlocked, 1, this.SLOTS);
          if (typeof parsed.muted === 'boolean') this.data.muted = parsed.muted;
          if (typeof parsed.hintSeen === 'boolean') this.data.hintSeen = parsed.hintSeen;
          if (typeof parsed.prologueSeen === 'boolean') this.data.prologueSeen = parsed.prologueSeen;
          if (typeof parsed.lang === 'string') this.data.lang = parsed.lang;
          if (parsed.pace === 'slow' || parsed.pace === 'normal' || parsed.pace === 'fast') this.data.pace = parsed.pace;
          if (parsed.reveal === 'instant' || parsed.reveal === 'typed') this.data.reveal = parsed.reveal;
          if (Array.isArray(parsed.best)) {
            for (let i = 0; i < this.SLOTS; i++) {
              this.data.best[i] = Math.max(0, Number(parsed.best[i]) || 0);
            }
          }

          /* the west road */
          if (typeof parsed.keepUnlocked === 'number') this.data.keepUnlocked = U.clamp(parsed.keepUnlocked, 1, this.SLOTS);
          if (Array.isArray(parsed.keepBest)) {
            for (let i = 0; i < this.SLOTS; i++) {
              this.data.keepBest[i] = Math.max(0, Number(parsed.keepBest[i]) || 0);
            }
          }
          if (typeof parsed.keepDone === 'boolean') this.data.keepDone = parsed.keepDone;
          if (typeof parsed.keepPrologueSeen === 'boolean') this.data.keepPrologueSeen = parsed.keepPrologueSeen;
          if (Array.isArray(parsed.keepCleared)) {
            const cleared = [];
            for (const v of parsed.keepCleared) {
              const n = Math.floor(Number(v) || 0);
              if (n >= 0 && n < this.SLOTS && cleared.indexOf(n) < 0) cleared.push(n);
            }
            this.data.keepCleared = cleared.sort(function (a, b) { return a - b; });
          }

          /* the rest */
          if (typeof parsed.coopDone === 'boolean') this.data.coopDone = parsed.coopDone;
          if (typeof parsed.flowers === 'number') this.data.flowers = Math.max(0, Math.floor(parsed.flowers) || 0);
          if (typeof parsed.letterSeen === 'boolean') this.data.letterSeen = parsed.letterSeen;
          if (parsed.road === 'keep' || parsed.road === 'finn') this.data.road = parsed.road;
          if (typeof parsed.name === 'string') this.data.name = parsed.name.slice(0, 16);
          if (Array.isArray(parsed.photos)) {
            const seen = [];
            for (const v of parsed.photos) {
              const n = Math.floor(Number(v) || 0);
              if (n >= 1 && n <= 12 && seen.indexOf(n) < 0) seen.push(n);
            }
            this.data.photos = seen.sort(function (a, b) { return a - b; });
          }
        }
      }
    } catch (err) { /* storage may be unavailable under file:// in some browsers */ }
  },

  write() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (err) { /* ignore */ }
  },

  /* the name the letter is signed with */
  keeperName(fallback) {
    const n = String(this.data.name || '').trim().toUpperCase();
    return n || (fallback || null);
  },

  /* forget everything: both roads, the letter, the photos */
  reset() {
    const lang = this.data.lang;
    const muted = this.data.muted;
    this.data = saveDefaults();
    this.data.lang = lang;
    this.data.muted = muted;
    this.write();
  },

  defaults() {
    return saveDefaults();
  },

  /* remember a keepsake photo */
  sawPhoto(i) {
    if (this.data.photos.indexOf(i) >= 0) return false;
    this.data.photos.push(i);
    this.data.photos.sort(function (a, b) { return a - b; });
    this.write();
    return true;
  },

  /* remember that a west road chapter was walked */
  clearedChapter(i) {
    if (this.data.keepCleared.indexOf(i) >= 0) return false;
    this.data.keepCleared.push(i);
    this.data.keepCleared.sort(function (a, b) { return a - b; });
    this.write();
    return true;
  },

  /* was that west road chapter walked? */
  isCleared(i) {
    return this.data.keepCleared.indexOf(i) >= 0;
  }
};
