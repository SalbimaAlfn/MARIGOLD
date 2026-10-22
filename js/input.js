/* MARIGOLD — unified keyboard + multi-touch input.
   `held` is state; `pressed` are one-frame edges, cleared by endStep(). */

const Input = {
  held: { left: false, right: false, up: false, down: false, jump: false, attack: false, shield: false },
  pressed: { left: false, right: false, up: false, down: false, jump: false, attack: false, shield: false, confirm: false, back: false, mute: false, fullscreen: false, language: false, replay: false },
  click: null,
  pointer: { x: -1, y: -1 },
  onGesture: [],
  canvas: null,
  _pointerCount: {},
  _gestureFired: false,

  /* the second player's slot. only live while the co-op chapter is on. */
  p2: {
    held: { left: false, right: false, up: false, down: false, jump: false, attack: false, shield: false },
    pressed: { left: false, right: false, up: false, down: false, jump: false, attack: false, shield: false }
  },

  /* when co-op is on, the letter keys belong to player two and player one
     keeps to the arrow keys. */
  coop: false,

  KEYMAP: {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'jump',
    KeyK: 'jump', KeyX: 'attack', KeyJ: 'attack',
    KeyL: 'shield', KeyQ: 'shield', ShiftLeft: 'shield', ShiftRight: 'shield',
    Enter: 'confirm', NumpadEnter: 'confirm', KeyZ: 'confirm',
    Escape: 'back', KeyP: 'back',
    KeyM: 'mute', KeyF: 'fullscreen', KeyG: 'language', KeyR: 'replay'
  },

  KEYMAP2: {
    KeyA: 'left', KeyD: 'right', KeyS: 'down',
    KeyV: 'jump', KeyB: 'attack', KeyC: 'shield'
  },

  PREVENT: ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'NumpadEnter'],

  init(canvas) {
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      const toP2 = this.coop && this.KEYMAP2[e.code];
      const act = toP2 ? this.KEYMAP2[e.code] : this.KEYMAP[e.code];
      if (!act) return;
      if (this.PREVENT.includes(e.code) || act === 'jump') e.preventDefault();
      if (act === 'fullscreen') return;             // handled globally
      const slot = toP2 ? this.p2 : this;
      if (!e.repeat) {
        slot.pressed[act] = true;
        // Space / Z double as confirm for menus
        if (!toP2 && act === 'jump' && e.code === 'Space') this.pressed.confirm = true;
        if (!toP2 && act === 'jump' && e.code === 'KeyZ') { this.pressed.jump = false; this.pressed.confirm = true; }
      }
      if (act === 'left' || act === 'right' || act === 'up' || act === 'down' || act === 'jump' || act === 'attack' || act === 'shield') {
        slot.held[act] = true;
      }
      this._gesture();
    });

    window.addEventListener('keyup', (e) => {
      const toP2 = this.coop && this.KEYMAP2[e.code];
      const act = toP2 ? this.KEYMAP2[e.code] : this.KEYMAP[e.code];
      if (!act) return;
      if (act === 'left' || act === 'right' || act === 'up' || act === 'down' || act === 'jump' || act === 'attack' || act === 'shield') {
        (toP2 ? this.p2 : this).held[act] = false;
      }
    });

    window.addEventListener('blur', () => this.releaseAll());

    if (canvas) {
      canvas.addEventListener('pointerdown', (e) => {
        const r = canvas.getBoundingClientRect();
        this.click = {
          x: (e.clientX - r.left) / Math.max(1, r.width) * canvas.width,
          y: (e.clientY - r.top) / Math.max(1, r.height) * canvas.height
        };
        this.pointer.x = this.click.x;
        this.pointer.y = this.click.y;
        this._gesture();
        e.preventDefault();
      });

      /* the pointer is followed so buttons can light up under it */
      canvas.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        this.pointer.x = (e.clientX - r.left) / Math.max(1, r.width) * canvas.width;
        this.pointer.y = (e.clientY - r.top) / Math.max(1, r.height) * canvas.height;
      });

      canvas.addEventListener('pointerleave', () => {
        this.pointer.x = -1;
        this.pointer.y = -1;
      });

      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') {
        document.body.classList.add('touch');
        if (this.onTouchChange) this.onTouchChange();
      }
      this._gesture();
    }, { passive: true });
  },

  bindTouch(root) {
    if (!root) return;
    root.querySelectorAll('[data-act]').forEach((btn) => {
      const act = btn.dataset.act;

      const down = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this._pointerCount[act] === undefined) this._pointerCount[act] = 0;
        if (this._pointerCount[act] === 0) {
          this.held[act] = true;
          this.pressed[act] = true;
          btn.classList.add('is-down');
        }
        this._pointerCount[act]++;
        try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        this._gesture();
      };

      const up = (e) => {
        e.preventDefault();
        if (this._pointerCount[act]) this._pointerCount[act]--;
        if (this._pointerCount[act] === 0) {
          this.held[act] = false;
          btn.classList.remove('is-down');
        }
      };

      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  },

  releaseAll() {
    this.held.left = this.held.right = this.held.up = this.held.down = false;
    this.held.jump = this.held.attack = this.held.shield = false;
    const h = this.p2.held;
    h.left = h.right = h.up = h.down = false;
    h.jump = h.attack = h.shield = false;
    this._pointerCount = {};
    document.querySelectorAll('.cbtn.is-down').forEach((b) => b.classList.remove('is-down'));
  },

  endStep() {
    const p = this.pressed;
    for (const k in p) p[k] = false;
    const p2 = this.p2.pressed;
    for (const k in p2) p2[k] = false;
    this.click = null;
  },

  /* turn the second player's keys on or off */
  setCoop(on) {
    this.coop = !!on;
    if (!on) {
      const h = this.p2.held;
      h.left = h.right = h.up = h.down = false;
      h.jump = h.attack = h.shield = false;
    }
  },

  _gesture() {
    if (this._gestureFired) return;
    this._gestureFired = true;
    for (const fn of this.onGesture) {
      try { fn(); } catch (err) { /* audio may be unavailable */ }
    }
  }
};
