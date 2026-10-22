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
    'html.aria.memento': 'Keepsakes',
    'html.aria.settings': 'Settings',
    'html.aria.left': 'Move left',
    'html.aria.right': 'Move right',
    'html.aria.attack': 'Attack',
    'html.aria.shield': 'Raise shield',
    'html.aria.jump': 'Jump',

    /* ---------- title ---------- */
    'title.tagline': 'A SMALL KNIGHT\'S ERRAND',
    'title.counts': '5 STAGES  -  5 MORE ON THE WEST ROAD  -  1 PRINCESS',
    'title.begin': 'PRESS SPACE TO BEGIN',
    'title.continue': 'CONTINUE',
    'title.replay': 'PRESS R TO REPLAY THE PROLOGUE',
    'title.footer': 'HAND-CODED PIXELS. ONE SMALL TRIBUTE.',
    'title.settings': 'SETTINGS',
    'title.memento': 'KEEPSAKES',

    /* ---------- stage select ---------- */
    'select.title': 'STAGE SELECT',
    'select.heading': 'CHOOSE YOUR ROAD',
    'select.locked': 'LOCKED',
    'select.flowers': 'FLOWERS {0}',
    'select.barred': 'THIS ROAD IS STILL BARRED',
    'select.controls': 'ARROWS CHOOSE   ESC BACK',

    /* ---------- hud ---------- */
    'hud.stage': 'STAGE {0}/{1}',
    'hud.chapter': 'CHAPTER {0}/{1}',
    'hud.warmth': 'WARMTH',
    'hud.p2': 'P2',
    'hud.thread': 'THE THREAD HOLDS',
    'hint.move': 'ARROWS/WASD MOVE   SPACE JUMP',
    'hint.actions': 'J SWORD   L SHIELD   P PAUSE   M SOUND',
    'hint.keep': 'X BLOOM   L LIGHT   DOWN+X UPROOT   P PAUSE',
    'hint.coop': 'P2: A D MOVE   V JUMP   B SWORD   C SHIELD',

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
    'menu.name': 'LETTER NAME: {0}',
    'menu.keepsake': 'KEEPSAKES',
    'menu.settings': 'SETTINGS',

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
    'sign.5': 'SHE IS IN THE TOWER',

    /* ---------- the west road: choosing a side ---------- */
    'road.title': 'CHOOSE A ROAD',
    'road.hint': 'ARROWS CHOOSE   SPACE GO   ESC BACK',
    'road.west': 'THE WEST ROAD',
    'road.westSub': 'THE KEEPER OF THE MEADOW',
    'road.westLine': 'FIVE CHAPTERS. HER ROAD FIRST.',
    'road.knight': 'THE KNIGHT\'S ROAD',
    'road.knightSub': 'FINN, A SMALL KNIGHT',
    'road.knightLine': 'FIVE STAGES. HIS ROAD.',
    'road.together': 'TOGETHER',
    'road.togetherSub': 'TWO OF THEM, ONE NIGHT',
    'road.togetherLine': 'TWO PLAYERS. ONE THREAD.',
    'road.locked': 'LOCKED',
    'road.done': 'FINISHED',

    /* ---------- settings ---------- */
    'settings.title': 'SETTINGS',
    'settings.name': 'THE NAME ON THE LETTER',
    'settings.nameValue': 'SIGNED AS: {0}',
    'settings.nameMissing': 'NOT SET YET',
    'settings.nameHint': 'PRESS SPACE TO TYPE A NAME',
    'settings.nameHelp': 'ENTER TO SAVE   ESC TO CANCEL',
    'settings.language': 'LANGUAGE',
    'settings.pace': 'STORY PACE',
    'settings.reveal': 'TEXT REVEAL',
    'settings.sound': 'SOUND',
    'settings.reset': 'ERASE ALL PROGRESS',
    'settings.resetArmed': 'PRESS AGAIN TO ERASE',
    'settings.back': 'BACK',
    'settings.hint': 'ARROWS CHOOSE   SPACE CHANGE   ESC BACK',

    /* ---------- keepsakes ---------- */
    'memento.title': 'KEEPSAKES',
    'memento.empty': 'NO KEEPSAKES YET',
    'memento.emptyLine': 'PUT PHOTOS IN assets/photos AND THEY SHOW UP HERE.',
    'memento.hint': 'ARROWS LOOK   SPACE OPEN   ESC BACK',
    'memento.notFound': 'NOT FOUND YET',
    'memento.found': 'FOUND',
    'memento.letter': 'THE LETTER',
    'memento.letterLocked': 'THE LETTER IS NOT READY YET',
    'memento.flowers': '{0} MARIGOLDS SHARED',
    'memento.open': 'OPEN',
    'keepsake.hint': 'PRESS SPACE TO KEEP IT',

    /* ---------- the letter ---------- */
    'letter.title': 'A LETTER',
    'letter.from': 'FROM SNOOZYPAW',
    'letter.1': 'If you are reading this, I walked the whole road.',
    'letter.2': 'You were right about the briar. About most things.',
    'letter.3': 'Every flower is still standing. I counted them twice.',
    'letter.4': 'I did not plant them for you, exactly.',
    'letter.5': 'I planted them so the road would remember.',
    'letter.6': 'And then you came along it anyway.',
    'letter.7': 'Nobody asked you to. I keep turning that over.',
    'letter.8': 'So I write it down, in case the road eats the rest.',
    'letter.9': 'I love you. I love you in the morning, and in the dark.',
    'letter.10': 'I love you when you follow me, and when you are late.',
    'letter.11': 'Come find me in the yellow.',
    'letter.12': 'I am not going anywhere.',
    'letter.sign': 'ALWAYS, {0}',
    'letter.hint': 'SPACE TO CONTINUE',

    /* ---------- the west road: chapters ---------- */
    'chapter.1.name': 'THE LANTERN PATH',
    'chapter.2.name': 'THE NETTLE ROAD',
    'chapter.3.name': 'THE DROWNED FIELD',
    'chapter.4.name': 'THE HUSKS',
    'chapter.5.name': 'THE OLD BLOOM',
    'chapter.coop.name': 'TOGETHER',

    'blurb.keep.1': 'THE MEADOW AT DUSK. THE FIRST FLOWER.',
    'blurb.keep.2': 'THE WOODS GO GREY BEHIND HER.',
    'blurb.keep.3': 'THE FIELD IS UNDER WATER TONIGHT.',
    'blurb.keep.4': 'SOMETHING IS STANDING IN THE WAY.',
    'blurb.keep.5': 'THE BRIAR HAS THE ROAD. SHE TAKES IT BACK.',
    'blurb.coop': 'TWO OF THEM, AND THE NIGHT BETWEEN.',

    'sign.keep.1': 'THE MARIGOLDS HOLD THE WARMTH',
    'sign.keep.1end': 'THE SHRINE REMEMBERS WHAT YOU PLANT',
    'sign.keep.2': 'THE NETTLES BITE. KEEP MOVING.',
    'sign.keep.2end': 'THREE SOCKETS. THREE OF YOUR FLOWERS.',
    'sign.keep.3': 'THE FIELD FLOODS WITH THE MOON',
    'sign.keep.3end': 'THE WATER TAKES BACK WHAT IT WANTS',
    'sign.keep.4': 'DO NOT LET YOUR LIGHT OUT',
    'sign.keep.4end': 'THEY ARE ONLY THE BROKEN ONES',
    'sign.keep.5': 'THE OLD BLOOM IS UNDER THE FEN',
    'sign.keep.5end': 'THE HEART OF THE BRIAR',
    'sign.coop.1': 'STAY CLOSE. THE THREAD HOLDS.',
    'sign.coop.2': 'TOGETHER, THEN',

    /* ---------- toasts for the west road ---------- */
    'toast.warmth': 'NO WARMTH LEFT. WAIT, OR STAND ON A FLOWER.',
    'toast.planted': 'A MARIGOLD OPENS',
    'toast.uprooted': 'YOU TAKE THE WARMTH BACK',
    'toast.shrine': 'THE SHRINE REMEMBERS',
    'toast.glint': 'SOMETHING SHINES IN THE DARK',
    'toast.drain': 'THE COLOUR IS LEAVING THE ROAD',
    'toast.thread': 'THE THREAD HOLDS YOU BOTH',
    'toast.threadCut': 'THE THREAD GOES DARK',

    /* ---------- her prologue: the other side of the same night ---------- */
    'prologue2.crawl': [
      'EPISODE I',
      'THE KEEPER GOES OUT',
      '',
      'THE MARIGOLDS HOLD THE MEADOW\'S',
      'WARMTH, AND SNOOZYPAW IS THE ONE',
      'WHO KEEPS THEM. ON THE NIGHT',
      'OF THE HARVEST THE BRIAR CAME',
      'FOR THE OLD BLOOM - THE ONE',
      'THAT GROWS UNDER THE FEN, WHERE',
      'THE ROAD ENDS AND THE DARK BEGINS.',
      '',
      'SO SHE WALKED WEST TO FIND IT.',
      'AND HE FOLLOWED, AS HE ALWAYS DOES.'
    ],

    'scene.keep.1': 'THE BLOOMS ARE LATE THIS YEAR.',
    'scene.keep.2': 'THE MEADOW IS COOLER THAN IT SHOULD BE.',
    'scene.keep.3': 'SOMETHING IS TAKING THE WARMTH OUT OF THE GROUND.',
    'scene.keep.4': 'THEN WE WILL FIND IT BEFORE IT TAKES THE REST.',

    'scene.keep.ask.1': 'FINN. HOLD THE MEADOW FOR ME.',
    'scene.keep.ask.2': 'ALONE? YOU KNOW THE BRIAR TAKES THE ROAD.',
    'scene.keep.ask.3': 'I KNOW. THAT IS WHY THE MEADOW NEEDS YOU TONIGHT.',
    'scene.keep.ask.4': 'THEN WE GO TOGETHER.',
    'scene.keep.ask.5': 'NO. ONE OF US STAYS, AND IT IS NOT YOU.',
    'scene.keep.ask.6': 'THEN I WILL HOLD IT MYSELF. AND FOLLOW YOU AFTER.',

    'scene.keep.shadow.1': 'THE ROAD OUT WEST IS ALREADY GREY.',
    'scene.keep.shadow.2': 'THE BRIAR IS AHEAD OF ME NOW.',

    'scene.keep.west.1': 'IF IT TAKES THE ROAD, IT TAKES THE MORNING TOO.',
    'scene.keep.west.2': 'SO I WILL WALK IT BACK. WITH FLOWERS.',
    'scene.keep.west.3': 'HE IS FOLLOWING ME. HE ALWAYS FOLLOWS ME.',

    'scene.keep.heart.1': 'THE OLD BLOOM IS UNDER THE FEN.',
    'scene.keep.heart.2': 'SO THE KEEPER WILL GO AND ASK IT FOR THE MEADOW BACK.',
    'scene.keep.heart.3': 'THIS IS MY ROAD. I AM NOT AFRAID OF IT.',

    /* ---------- her epilogue ---------- */
    'epilogue.keep.1': 'THE ROAD ENDS AT A HEART OF BRIAR.',
    'epilogue.keep.2': 'AND A SMALL KNIGHT IS ALREADY STANDING IN IT.',
    'epilogue.keep.3': 'HE DID NOT HOLD THE MEADOW.',
    'epilogue.keep.4': 'HE NEVER DOES.',
    'epilogue.keep.5': 'FINN.',
    'epilogue.keep.6': 'YOU CAME.',
    'epilogue.keep.7': 'I TOLD YOU TO HOLD THE MEADOW.',
    'epilogue.keep.8': 'I ALSO TOLD YOU I LOVE YOU.',
    'epilogue.keep.9': '...I DID NOT SAY IT BEFORE. I AM SAYING IT NOW.',
    'epilogue.keep.10': 'SAY IT AGAIN.',
    'epilogue.keep.11': 'I LOVE YOU.',
    'epilogue.keep.card': 'AND THE MEADOW HELD BOTH OF THEM',

    /* ---------- her victory ---------- */
    'victory.keep.title': 'THE ROAD IS OPEN',
    'victory.keep.line': 'THE BRIAR IS QUIET AND THE MEADOW IS WARM',
    'victory.keep.romance': 'AND THE ROAD IS FULL OF FLOWERS',
    'victory.keep.letter': 'PRESS SPACE TO READ THE LETTER',
    'victory.coop.title': 'THE THREAD HELD',
    'victory.coop.line': 'THE TWO OF THEM, ALL THE WAY THROUGH',

    /* ---------- keepsake captions ---------- */
    'photo.1.caption': 'the meadow, before any of it',
    'photo.2.caption': 'you, mid-sentence',
    'photo.3.caption': 'the night we did not sleep',
    'photo.4.caption': 'your hand on the old gate',
    'photo.5.caption': 'rain on the window',
    'photo.6.caption': 'the first flower we planted',
    'photo.7.caption': 'two chairs, one conversation',
    'photo.8.caption': 'you, laughing at nothing',
    'photo.9.caption': 'the long road home',
    'photo.10.caption': 'the yellow one',
    'photo.11.caption': 'late, and worth it',
    'photo.12.caption': 'us'
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
