/* MARIGOLD — persistence, boot, main loop, page chrome. */

const Save = {
  KEY: 'marigold.save.v1',
  data: {
    muted: false,
    unlocked: 1,
    best: [0, 0, 0],
    hintSeen: false
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.unlocked === 'number') this.data.unlocked = U.clamp(parsed.unlocked, 1, 3);
          if (typeof parsed.muted === 'boolean') this.data.muted = parsed.muted;
          if (typeof parsed.hintSeen === 'boolean') this.data.hintSeen = parsed.hintSeen;
          if (Array.isArray(parsed.best)) {
            for (let i = 0; i < 3; i++) {
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

(function () {
  'use strict';

  const STEP = 1 / 60;
  const canvas = document.getElementById('game');
  const rotateEl = document.getElementById('rotate');
  const rotateOk = document.getElementById('rotateOk');
  const fsBtn = document.getElementById('fsBtn');

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  Save.load();
  AudioSys.muted = !!Save.data.muted;

  Sprites.init();
  Tiles.init();
  Game.init();

  Input.init(canvas);
  Input.bindTouch(document.getElementById('touch'));
  Input.onGesture.push(function () { AudioSys.init(); });

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
  window.MARIGOLD = { Game: Game, Save: Save, AudioSys: AudioSys, Input: Input, Level: Level, STAGES: STAGES };
})();
