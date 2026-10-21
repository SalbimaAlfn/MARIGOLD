/* MARIGOLD — text tables and the language switch.
   English is the base table and always holds every key. Other languages live
   in their own file (js/lang_id.js) and fall back to English key by key, so a
   half-finished translation never breaks the game. */

const STRINGS = {
  en: {
    /* ---------- page chrome ---------- */
    'html.title': 'MARIGOLD - a small knight\'s errand',
    'html.description': 'MARIGOLD - a small knight\'s errand. A hand-coded pixel platformer.',
    'html.tag': 'a small knight\'s errand',
    'html.hint.move': 'MOVE',
    'html.hint.jump': 'JUMP',
    'html.hint.attack': 'ATTACK',
    'html.hint.pause': 'PAUSE',
    'html.hint.sound': 'SOUND',
    'html.cap.left': 'LEFT',
    'html.cap.right': 'RIGHT',
    'html.cap.hit': 'HIT',
    'html.cap.guard': 'GUARD',
    'html.cap.jump': 'JUMP',
    'html.rotate.title': 'TURN THE PHONE SIDEWAYS',
    'html.rotate.text': 'MARIGOLD plays in landscape. Rotate your device.',
    'html.rotate.button': 'PLAY IN PORTRAIT',
    'html.aria.canvas': 'MARIGOLD, a 2D pixel platformer. Move with arrow keys or A and D, jump with Space, attack with J, pause with P.',
    'html.aria.fullscreen': 'Toggle fullscreen',
    'html.aria.language': 'Change language',
    'html.aria.left': 'Move left',
    'html.aria.right': 'Move right',
    'html.aria.attack': 'Attack',
    'html.aria.shield': 'Raise shield',
    'html.aria.jump': 'Jump',

    /* ---------- title ---------- */
    'title.tagline': 'A SMALL KNIGHT\'S ERRAND',
    'title.counts': '{0} STAGES  -  1 PRINCESS  -  A GREAT MANY THORNS',
    'title.begin': 'PRESS SPACE TO BEGIN',
    'title.continue': 'CONTINUE',
    'title.replay': 'PRESS R TO REPLAY THE PROLOGUE',
    'title.footer': 'HAND-CODED PIXELS. NO ASSETS. NO ENGINE.',

    /* ---------- stage select ---------- */
    'select.title': 'STAGE SELECT',
    'select.heading': 'CHOOSE YOUR ROAD',
    'select.locked': 'LOCKED',
    'select.flowers': 'FLOWERS {0}',
    'select.barred': 'THIS ROAD IS STILL BARRED',
    'select.controls': 'ARROWS CHOOSE   ESC BACK',

    /* ---------- hud ---------- */
    'hud.stage': 'STAGE {0}/{1}',
    'hint.move': 'ARROWS/WASD MOVE   SPACE JUMP',
    'hint.actions': 'J SWORD   L SHIELD   P PAUSE   M SOUND',

    /* ---------- stage intro ---------- */
    'intro.ride': 'SPACE TO RIDE',

    /* ---------- pause menu ---------- */
    'menu.paused': 'PAUSED',
    'menu.resume': 'RESUME',
    'menu.restart': 'RESTART STAGE',
    'menu.sound': 'SOUND: {0}',
    'menu.soundOn': 'ON',
    'menu.soundOff': 'OFF',
    'menu.quit': 'QUIT TO TITLE',
    'menu.resumeHint': 'P/ESC RESUME',
    'menu.language': 'LANGUAGE: {0}',
    'menu.pace': 'STORY PACE: {0}',
    'menu.paceSlow': 'SLOW',
    'menu.paceNormal': 'NORMAL',
    'menu.paceFast': 'FAST',
    'menu.reveal': 'TEXT REVEAL: {0}',
    'menu.revealInstant': 'INSTANT',
    'menu.revealTyped': 'TYPED',

    /* ---------- death ---------- */
    'dead.title': 'YOU FELL',
    'dead.line': 'THE THORNS TAKE ANOTHER DAY',
    'dead.hint': 'STAND AT THE LAST LANTERN',

    /* ---------- prologue ---------- */
    'prologue.skip': 'SPACE SKIPS AHEAD   ESC SKIPS ALL',
    'prologue.crawl': [
      'EPISODE I',
      'THE THORN TAKES HER',
      '',
      'LONG AGO, IN A MEADOW OF GOLD',
      'AND THORN, SNOOZYPAW KEPT THE',
      'MARIGOLDS AND THE PEACE.',
      'BESIDE HER WALKED FINN - A KNIGHT',
      'WITH A WOODEN SWORD AND A SHIELD',
      'HE HAD NEVER NEEDED.',
      '',
      'BUT THE BRIAR HAD BEEN HUNGRY',
      'A LONG WHILE, AND ON THE EVE',
      'OF THE HARVEST, IT CAME.'
    ],

    /* ---------- the story, panel by panel ---------- */
    'scene.meadow.1': 'THE BLOOMS ARE EARLY THIS YEAR. IT IS A GOOD OMEN.',
    'scene.meadow.2': 'A GOOD OMEN. I WILL BRING YOU A CROWN OF THEM.',
    'scene.meadow.3': 'AND YOU? WHAT WILL YOU BRING ME?',
    'scene.meadow.4': '...MYSELF. ALL OF IT.',

    'scene.ask.1': 'FINN. THE BRIAR IS HUNGRY AGAIN.',
    'scene.ask.2': 'THEN I STAY. WITH MY SWORD. WITH YOU.',
    'scene.ask.3': 'PROMISE ME. WHATEVER COMES UP TONIGHT.',
    'scene.ask.4': 'I PROMISE.',
    'scene.ask.5': 'THEN STAY CLOSE.',

    'scene.shadow.1': 'SNOOZYP... NO.',
    'scene.shadow.2': 'SOMETHING OLD IS AWAKE.',

    'scene.taking.1': 'FINN. FOLLOW THE THORNS. FIND ME.',
    'scene.taking.2': 'IT IS TAKING ME EAST.',

    'scene.knight.1': 'THEN I WALK INTO THE DARK.',
    'scene.knight.2': 'SHE IS STILL ALIVE. SO AM I.',
    'scene.knight.3': 'AND I WILL BRING HER HOME.',
    'scene.knight.ride': 'PRESS SPACE TO RIDE',
    'scene.knight.skip': 'ESC TO GO STRAIGHT TO THE ROAD',

    /* ---------- the finding ---------- */
    'rescue.1': 'SNOOZYPAW.',
    'rescue.2': '...FINN?',
    'rescue.3': 'I CAME.',
    'rescue.4': 'THE THORNS LET GO OF YOU.',
    'rescue.5': 'NOT TONIGHT.',
    'rescue.6': 'FINN... YOU CAME ALL THIS WAY.',
    'rescue.7': 'I SAID I WOULD.',
    'rescue.8': 'YOU ALWAYS DO.',

    /* ---------- the reunion ---------- */
    'epilogue.1': 'FINN.',
    'epilogue.2': 'MM.',
    'epilogue.3': 'IN THE DARK, I ONLY THOUGHT OF THE MEADOW.',
    'epilogue.4': 'AND THE MARIGOLDS.',
    'epilogue.5': 'AND YOU.',
    'epilogue.6': '...AND YOU.',
    'epilogue.7': 'FINN. I LOVE YOU.',
    'epilogue.8': 'I LOVE YOU TOO.',
    'epilogue.9': '...SAY IT AGAIN.',
    'epilogue.10': 'I LOVE YOU.',
    'epilogue.card': 'AND THEY WALKED HOME TOGETHER',

    /* ---------- victory ---------- */
    'victory.title': 'VICTORY',
    'victory.line': 'SnoozyPaw IS FREE AND THE BRIAR IS QUIET',
    'victory.romance': 'AND THEY LIVED HAPPILY EVER AFTER',
    'victory.flowers': 'FLOWERS GATHERED',
    'victory.back': 'PRESS SPACE FOR THE TITLE',
    'victory.thanks': 'THANK YOU FOR PLAYING MARIGOLD',

    /* ---------- toasts ---------- */
    'toast.barred': 'THE THORNS STILL BAR THIS ROAD',
    'toast.checkpoint': 'LANTERN LIT - YOU WILL WAKE HERE',
    'toast.violet': 'THE VIOLET BLOOM - FULLY HEALED',
    'toast.heal': 'FIVE MARIGOLDS MEND A HEART',
    'toast.drown': 'THE WATER DRAGS YOU BACK TO THE LANTERN',

    /* ---------- stages ---------- */
    'stage.num': 'STAGE {0}',
    'stage.1.name': 'LONG MEADOW',
    'stage.2.name': 'DEEP WOODS',
    'stage.3.name': 'MILLBROOK',
    'stage.4.name': 'SABLE MARSH',
    'stage.5.name': 'BRIAR KEEP',

    'blurb.1': 'A MORNING WALK, PAST THE BRAMBLE IMPS.',
    'blurb.2': 'THE TREES STAND CLOSE. THE BLADE RINGS.',
    'blurb.3': 'THE MILL IS STILL. THE WATER IS NOT.',
    'blurb.4': 'THE BOG KEEPS WHAT IT TAKES.',
    'blurb.5': 'PAST THE GATE, THE KEEP WAITS IN MOONLIGHT.',

    'sign.1': 'THE KEEP LIES EAST',
    'sign.2': 'THE THORN WOODS',
    'sign.3': 'MIND THE WATER',
    'sign.4': 'SABLE MARSH',
    'sign.5': 'SHE IS IN THE TOWER'
  }
};

const LANG = {
  current: 'en',
  hooks: [],

  CODES: ['en', 'id'],
  LABEL: { en: 'ENGLISH', id: 'INDONESIA' },
  SHORT: { en: 'EN', id: 'ID' },

  /* the active table, then English, then the key itself */
  t(key, fallback) {
    const table = STRINGS[this.current];
    if (table && Object.prototype.hasOwnProperty.call(table, key)) return table[key];
    const base = STRINGS.en;
    if (base && Object.prototype.hasOwnProperty.call(base, key)) return base[key];
    return fallback !== undefined ? fallback : key;
  },

  set(code) {
    if (!STRINGS[code]) code = 'en';
    const changed = this.current !== code;
    this.current = code;
    Save.data.lang = code;
    Save.write();
    if (changed) {
      for (const fn of this.hooks) {
        try { fn(); } catch (err) { /* a stale cache must not break the switch */ }
      }
      this.applyDom();
    }
  },

  toggle() {
    this.set(this.current === 'en' ? 'id' : 'en');
    AudioSys.sfx('select');
  },

  /* first run: follow the browser */
  detect() {
    const list = navigator.languages || [navigator.language || ''];
    for (const tag of list) {
      const code = String(tag).toLowerCase().split('-')[0];
      if (STRINGS[code]) return code;
    }
    return 'en';
  },

  onChange(fn) { this.hooks.push(fn); },

  applyDom() {
    const text = document.querySelectorAll('[data-i18n]');
    for (const el of text) el.textContent = this.t(el.getAttribute('data-i18n'));
    const attrs = document.querySelectorAll('[data-i18n-content]');
    for (const el of attrs) el.setAttribute('content', this.t(el.getAttribute('data-i18n-content')));
    const aria = document.querySelectorAll('[data-i18n-aria]');
    for (const el of aria) el.setAttribute('aria-label', this.t(el.getAttribute('data-i18n-aria')));
    document.title = this.t('html.title');
    document.documentElement.lang = this.current === 'id' ? 'id' : 'en';
  }
};

/* {0} {1} ... placeholders */
function fmt(str, args) {
  return String(str).replace(/\{(\d+)\}/g, function (m, i) {
    const v = args[Number(i)];
    return v === undefined ? m : String(v);
  });
}

function L(key, args) {
  const v = LANG.t(key);
  if (args === undefined) return v;
  return fmt(v, Array.isArray(args) ? args : [args]);
}
