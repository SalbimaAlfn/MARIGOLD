/* MARIGOLD — persistence. Kept in its own file so the i18n layer can read and
   write the stored language without depending on the boot order. */

const Save = {
  KEY: 'marigold.save.v1',
  SLOTS: 5,
  data: {
    muted: false,
    unlocked: 1,
    best: [0, 0, 0, 0, 0],
    hintSeen: false,
    lang: 'en',
    pace: 'normal',
    reveal: 'instant',
    prologueSeen: false
  },

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
        }
      }
    } catch (err) { /* storage may be unavailable under file:// in some browsers */ }
  },

  write() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (err) { /* ignore */ }
  }
};
