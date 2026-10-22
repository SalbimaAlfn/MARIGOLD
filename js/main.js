/* MARIGOLD — boot, main loop, page chrome. */

(function () {
  'use strict';

  const STEP = 1 / 60;
  const canvas = document.getElementById('game');
  const rotateEl = document.getElementById('rotate');
  const rotateOk = document.getElementById('rotateOk');
  const fsBtn = document.getElementById('fsBtn');
  const langBtn = document.getElementById('langBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const mementoBtn = document.getElementById('mementoBtn');

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  Save.load();
  AudioSys.muted = !!Save.data.muted;

  /* language: stored choice wins, otherwise follow the browser */
  LANG.set(STRINGS[Save.data.lang] ? Save.data.lang : LANG.detect());
  LANG.applyDom();
  syncLangBtn();

  function syncLangBtn() {
    if (!langBtn) return;
    langBtn.textContent = LANG.SHORT[LANG.current] || 'EN';
    langBtn.title = (LANG.LABEL[LANG.current] || 'ENGLISH') + ' (G)';
  }
  LANG.onChange(syncLangBtn);

  Sprites.init();
  Tiles.init();
  Game.init();

  /* the keepsake photos: optional, so a missing folder is not an error */
  Photos.load();

  Input.init(canvas);
  Input.bindTouch(document.getElementById('touch'));
  Input.onGesture.push(function () { AudioSys.init(); });

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      LANG.toggle();
      canvas.focus();
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', function () {
      Game.openSettings();
      canvas.focus();
    });
  }

  if (mementoBtn) {
    mementoBtn.addEventListener('click', function () {
      Game.openMemento();
      canvas.focus();
    });
  }

  /* ---------- page chrome ---------- */

  let rotateDismissed = false;
  let lastInGame = null;

  function isCoarse() {
    return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      document.body.classList.contains('touch');
  }

  function syncBody() {
    const inGame = Game.state === 'playing' || Game.state === 'paused';
    if (inGame !== lastInGame) {
      lastInGame = inGame;
      document.body.classList.toggle('in-game', inGame);
    }
  }

  function updateOrientation() {
    const portrait = window.innerHeight > window.innerWidth;
    const show = portrait && isCoarse() && !rotateDismissed;
    rotateEl.hidden = !show;
  }

  rotateOk.addEventListener('click', function () {
    rotateDismissed = true;
    rotateEl.hidden = true;
    canvas.focus();
  });

  window.addEventListener('resize', updateOrientation);
  window.addEventListener('orientationchange', function () { setTimeout(updateOrientation, 120); });
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener('change', updateOrientation);
  }
  setTimeout(updateOrientation, 60);

  function toggleFullscreen() {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) {
          const p = req.call(el);
          if (p && p.catch) p.catch(function () {});
        }
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) {
          const p = exit.call(document);
          if (p && p.catch) p.catch(function () {});
        }
      }
    } catch (err) { /* unsupported */ }
  }

  fsBtn.addEventListener('click', function () {
    toggleFullscreen();
    canvas.focus();
  });

  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyF') toggleFullscreen();
  });

  document.addEventListener('fullscreenchange', function () {
    document.body.classList.toggle('full', !!document.fullscreenElement);
    ctx.imageSmoothingEnabled = false;
  });

  canvas.addEventListener('pointerdown', function () {
    canvas.focus();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && Game.state === 'playing') {
      Game.state = 'paused';
      Game.pausedSel = 0;
    }
  });

  /* keep the canvas crisp when it is resized by CSS */
  window.addEventListener('resize', function () {
    ctx.imageSmoothingEnabled = false;
  });

  /* ---------- main loop ---------- */

  let last = 0;
  let acc = 0;

  function frame(now) {
    requestAnimationFrame(frame);

    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    if (dt < 0) dt = 0;

    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      Game.update(STEP);
      if (!(Game.freeze > 0)) Input.endStep();
      acc -= STEP;
      steps++;
    }
    if (steps >= 5) acc = 0;

    Game.render(ctx);
    syncBody();
  }

  requestAnimationFrame(frame);

  /* expose for curious tinkerers and the QA harness */
  window.MARIGOLD = {
    Game: Game, Save: Save, AudioSys: AudioSys, Input: Input, Level: Level,
    STAGES: STAGES, UI: UI, LANG: LANG, PROLOGUE: PROLOGUE,
    STRINGS: STRINGS, CUTSCENE: CUTSCENE,

    /* the west road, the co-op chapter, and the people in them */
    CHAPTERS: CHAPTERS, COOP_CHAPTER: COOP_CHAPTER, PROLOGUE_KEEP: PROLOGUE_KEEP,
    Photos: Photos, Player: Player, Bloom: Bloom, Shrine: Shrine, Husk: Husk,
    PROFILES: PROFILES, LETTER_LINES: LETTER_LINES,
    letterBlock: letterBlock, letterChars: letterChars, letterName: letterName,
    LETTER_PAGE: LETTER_PAGE, LETTER_TEXT_W: LETTER_TEXT_W,

    /* QA: look for missing translations and text that would not fit */
    checkText: function () {
      const issues = [];
      const en = STRINGS.en;
      const codes = Object.keys(STRINGS);

      for (const code of codes) {
        const table = STRINGS[code];
        for (const key of Object.keys(en)) {
          if (!Object.prototype.hasOwnProperty.call(table, key)) issues.push('missing ' + code + ' -> ' + key);
        }
        for (const key of Object.keys(table)) {
          if (!Object.prototype.hasOwnProperty.call(en, key)) issues.push('extra ' + code + ' -> ' + key);
        }
      }

      /* keys that are built at runtime still have to exist */
      const dyn = [];
      for (const def of STAGES) dyn.push(def.nameKey);
      for (let i = 1; i <= STAGES.length; i++) {
        dyn.push('sign.' + i);
        dyn.push('blurb.' + i);
      }
      for (const def of CHAPTERS) dyn.push(def.nameKey);
      for (let i = 1; i <= CHAPTERS.length; i++) {
        dyn.push('sign.keep.' + i);
        dyn.push('sign.keep.' + i + 'end');
        dyn.push('blurb.keep.' + i);
      }
      dyn.push(COOP_CHAPTER.nameKey);
      dyn.push('blurb.coop');
      for (let i = 1; i <= Photos.MAX; i++) dyn.push('photo.' + i + '.caption');
      for (let i = 1; i <= 12; i++) dyn.push('letter.' + i);
      dyn.push('letter.sign');
      for (const scene of Object.keys(CUTSCENE)) {
        for (const b of CUTSCENE[scene]) dyn.push(b.key);
      }
      for (const k of ['menu.paceSlow', 'menu.paceNormal', 'menu.paceFast',
        'menu.revealInstant', 'menu.revealTyped']) dyn.push(k);
      for (const code of codes) {
        for (const key of dyn) {
          if (!Object.prototype.hasOwnProperty.call(STRINGS[code], key)) issues.push('missing ' + code + ' -> ' + key);
        }
      }

      /* arrays (the crawl) must line up line for line */
      for (const key of Object.keys(en)) {
        if (!Array.isArray(en[key])) continue;
        for (const code of codes) {
          const v = STRINGS[code][key];
          if (!Array.isArray(v) || v.length !== en[key].length) {
            issues.push('array length ' + code + ' -> ' + key);
          }
        }
      }

      for (const code of codes) {
        const table = STRINGS[code];
        for (const key of Object.keys(table)) {
          const v = table[key];
          if (typeof v !== 'string') continue;

          /* the dialogue box holds two lines of 54 characters */
          if (/^(scene|rescue|epilogue)\./.test(key)) {
            const lines = wrapText(v, 324, 1);
            if (lines.length > 2) issues.push('overflow ' + code + ' -> ' + key + ' (' + lines.length + ' lines)');
          }

          /* the stage blurb is centred under the stage name */
          if (/^blurb\./.test(key) && textWidth(v, 1) > 336) {
            issues.push('overflow ' + code + ' -> ' + key);
          }

          /* a stage name sits on a 65px card */
          if (/^stage\.\d\.name$/.test(key) && textWidth(v, 1) > 65) {
            issues.push('overflow ' + code + ' -> ' + key);
          }

          /* a chapter name sits on a 67px card, over two lines */
          if (/^chapter\.\d+\.name$/.test(key) && wrapText(v, 67, 1).length > 2) {
            issues.push('overflow ' + code + ' -> ' + key);
          }

          /* a chapter name in the top right of the screen */
          if (/^chapter\./.test(key) && textWidth(v, 1) > 200) {
            issues.push('overflow ' + code + ' -> ' + key);
          }

          /* the road cards: the sub-line and the line under it */
          if (/^road\.(west|knight|together)(Sub|Line)$/.test(key)
            && wrapText(v, 100, 1).length > 2) {
            issues.push('overflow ' + code + ' -> ' + key);
          }

          /* a photo caption is centred under the card */
          if (/^photo\.\d+\.caption$/.test(key) && mixedWidth(v, 1) > 340) {
            issues.push('overflow ' + code + ' -> ' + key);
          }

          /* a letter line has to sit on the paper in one line */
          if (/^letter\.\d+$/.test(key) && mixedWidth(v, 1) > LETTER_TEXT_W) {
            issues.push('overflow ' + code + ' -> ' + key);
          }

          /* the sign-off, with the longest name in it */
          if (key === 'letter.sign' && mixedWidth(v.replace(/\{0\}/, 'XXXXXXXXXXXXXXXX'), 1) > LETTER_TEXT_W) {
            issues.push('overflow ' + code + ' -> ' + key);
          }

          /* pause menu rows sit in a 208px button */
          if (key.indexOf('menu.') === 0) {
            const probe = v.replace(/\{0\}/, 'XXXXXXXXXX');
            if (textWidth(probe, 1) > 186) issues.push('overflow ' + code + ' -> ' + key);
          }

          /* toasts and hints sit in a 340px subtitle box */
          if (/^(toast|prologue\.skip|hint)\./.test(key) && textWidth(v, 1) > 336) {
            issues.push('overflow ' + code + ' -> ' + key);
          }
        }
      }

      /* the whole letter has to fit on the page, in every language */
      for (const code of codes) {
        const saved = LANG.current;
        LANG.current = code;
        const lines = letterBlock();
        LANG.current = saved;
        const bodyY = LETTER_PAGE.y + 42;
        const signY = LETTER_PAGE.y + LETTER_PAGE.h - 24;
        if (lines.length * 9 > signY - bodyY) {
          issues.push('letter overflow ' + code + ' (' + lines.length + ' lines)');
        }
      }

      return { issues: issues, count: issues.length, ok: issues.length === 0 };
    }
  };
})();
