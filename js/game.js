/* MARIGOLD — the game: state machine, world simulation, camera, collisions. */

const Game = {
  state: 'title',
  time: 0,
  stageIndex: 0,
  stageBlurb: '',
  level: null,
  titleLevel: null,
  player: null,

  enemies: [],
  platforms: [],
  pickups: [],
  checkpoints: [],
  signs: [],
  goals: [],
  particles: [],

  /* the west road */
  blooms: [],
  shrines: [],
  warmth: 3,
  maxWarmth: 3,
  warmthT: 0,

  /* the second player */
  player2: null,
  threadCut: false,
  threadT: 0,

  /* the colour draining out of the nettle road */
  drainFront: 0,
  drainOn: false,

  camera: { x: 0, y: 0 },
  hearts: 3,
  maxHearts: 3,
  stageFlowers: 0,
  marigolds: 0,
  totalPossible: 0,

  checkpointPos: null,
  checkpointSpec: null,
  spawnPos: null,

  freeze: 0,
  shake: 0,
  trans: null,
  msg: null,
  hintT: 0,
  introT: 0,
  prologueT: 0,
  prologueDone: false,
  prologueWait: 0,
  prologueDef: PROLOGUE,
  prologueRoad: 'finn',
  roared: false,
  deadT: 0,
  rescueT: 0,
  epilogueT: 0,
  selectSel: 0,
  pausedSel: 0,
  pointerInPause: false,
  pointerOver: null,

  /* which road, and the screens around it */
  road: 'keep',
  roadSel: 0,
  settingsSel: 0,
  mementoSel: 0,
  letterT: 0,
  letterFrom: 'title',
  keepsakeIdx: 0,
  keepsakeNext: null,
  settingsFrom: 'title',
  mementoFrom: 'title',
  resetArmed: false,

  /* ---------- setup ---------- */

  init() {
    this.titleLevel = new Level(STAGES[0]);
    let total = 0;
    for (const def of STAGES) total += new Level(def).totalFlowers;
    for (const def of CHAPTERS) total += new Level(def).totalFlowers;
    this.totalPossible = total;
    this.hearts = this.maxHearts;
    this.state = 'title';
    this.road = Save.data.road === 'finn' ? 'finn' : 'keep';
    AudioSys.playMusic('meadow');
  },

  /* ---------- the two roads ---------- */

  /* the list of chapters the player is currently walking */
  campaign() {
    if (this.road === 'coop') return [COOP_CHAPTER];
    if (this.road === 'keep') return CHAPTERS;
    return STAGES;
  },

  campaignDef() {
    const c = this.campaign();
    return c[U.clamp(this.stageIndex, 0, c.length - 1)];
  },

  /* how many chapters are open on this road */
  unlockedCount() {
    if (this.road === 'keep') return Save.data.keepUnlocked;
    if (this.road === 'coop') return 1;
    return Save.data.unlocked;
  },

  /* the three roads on the title screen */
  roadList() {
    return [
      {
        id: 'keep',
        titleKey: 'road.west',
        subKey: 'road.westSub',
        lineKey: 'road.westLine',
        theme: 'day',
        profile: 'keep',
        locked: false,
        done: Save.data.keepDone
      },
      {
        id: 'finn',
        titleKey: 'road.knight',
        subKey: 'road.knightSub',
        lineKey: 'road.knightLine',
        theme: 'night',
        profile: 'finn',
        locked: false,
        done: Save.data.unlocked >= Save.SLOTS
      },
      {
        id: 'coop',
        titleKey: 'road.together',
        subKey: 'road.togetherSub',
        lineKey: 'road.togetherLine',
        theme: 'dusk',
        profile: 'keep',
        locked: !Save.data.keepPrologueSeen,
        done: Save.data.coopDone
      }
    ];
  },

  startRoadSelect() {
    this.state = 'roadSelect';
    const roads = this.roadList();
    let idx = 0;
    for (let i = 0; i < roads.length; i++) {
      if (roads[i].id === Save.data.road) idx = i;
    }
    this.roadSel = idx;
    AudioSys.playMusic('meadow');
  },

  chooseRoad(i) {
    const roads = this.roadList();
    const r = roads[i];
    if (!r) return;
    if (r.locked) {
      AudioSys.sfx('locked');
      this.msg = { text: L('toast.barred'), t: 2 };
      return;
    }
    AudioSys.sfx('select');
    this.road = r.id;
    Save.data.road = (r.id === 'coop') ? 'keep' : r.id;
    Save.write();
    this.stageIndex = 0;
    this.selectSel = 0;
    this.startTransition(() => {
      if (r.id === 'coop') { this.enterStage(0); return; }
      const seen = (r.id === 'keep') ? Save.data.keepPrologueSeen : Save.data.prologueSeen;
      if (!seen) this.startPrologue(r.id);
      else this.startSelect();
    });
  },

  startSettings(from) {
    this.state = 'settings';
    this.settingsSel = 0;
    this.resetArmed = false;
    this.settingsFrom = from || this.settingsFrom || 'title';
    AudioSys.sfx('select');
  },

  startMemento(from) {
    this.state = 'memento';
    this.mementoSel = 0;
    this.mementoFrom = from || 'title';
    AudioSys.sfx('select');
  },

  startLetter(from) {
    this.state = 'letter';
    this.letterT = 0;
    this.letterFrom = from || 'title';
    Save.data.letterSeen = true;
    Save.write();
    AudioSys.sfx('select');
  },

  /* go back to whichever screen sent us here */
  backTo(where) {
    const w = where || 'title';
    if (w === 'roadSelect') this.state = 'roadSelect';
    else if (w === 'select') this.state = 'select';
    else if (w === 'memento') this.state = 'memento';
    else if (w === 'settings') this.state = 'settings';
    else if (w === 'pause') this.state = 'paused';
    else this.state = 'title';
  },

  /* the header buttons: settings and keepsakes, from anywhere sensible */
  openSettings() {
    if (this.state === 'letter' || this.state === 'photoView') return;
    let from = 'title';
    if (this.state === 'paused') from = 'pause';
    else if (this.state === 'roadSelect') from = 'roadSelect';
    else if (this.state === 'select') from = 'select';
    else if (this.state === 'memento') from = 'memento';
    this.startTransition(() => this.startSettings(from));
  },

  openMemento() {
    if (this.state === 'letter' || this.state === 'photoView') return;
    let from = 'title';
    if (this.state === 'paused') from = 'pause';
    else if (this.state === 'roadSelect') from = 'roadSelect';
    else if (this.state === 'settings') from = 'settings';
    this.startTransition(() => this.startMemento(from));
  },

  /* the rows on the settings screen */
  settingsItems() {
    const paceKey = { slow: 'menu.paceSlow', normal: 'menu.paceNormal', fast: 'menu.paceFast' };
    const revKey = { instant: 'menu.revealInstant', typed: 'menu.revealTyped' };
    const name = Save.keeperName();
    const items = [
      { label: L('settings.name'), value: name || L('settings.nameMissing'), act: 'name' },
      { label: L('settings.language'), value: LANG.LABEL[LANG.current] || 'ENGLISH', act: 'language' },
      { label: L('settings.pace'), value: L(paceKey[Save.data.pace] || 'menu.paceNormal'), act: 'pace' },
      { label: L('settings.reveal'), value: L(revKey[Save.data.reveal] || 'menu.revealInstant'), act: 'reveal' },
      { label: L('settings.sound'), value: Save.data.muted ? L('menu.soundOff') : L('menu.soundOn'), act: 'sound' },
      { label: L('settings.reset'), value: this.resetArmed ? L('settings.resetArmed') : '', warn: this.resetArmed, act: 'reset' },
      { label: L('settings.back'), value: '', act: 'back' }
    ];
    return items;
  },

  startSelect() {
    this.state = 'select';
    const c = this.campaign();
    this.selectSel = U.clamp(this.unlockedCount() - 1, 0, c.length - 1);
    AudioSys.sfx('select');
    AudioSys.playMusic('meadow');
  },

  startPrologue(road) {
    const r = road || this.road;
    this.state = 'prologue';
    this.prologueRoad = (r === 'keep') ? 'keep' : 'finn';
    this.prologueDef = (this.prologueRoad === 'keep') ? PROLOGUE_KEEP : PROLOGUE;
    this.prologueT = 0;
    this.prologueDone = false;
    this.prologueWait = 0;
    this.roared = false;
    AudioSys.playMusic(this.prologueRoad === 'keep' ? 'keeper' : 'keep');
  },

  /* how fast the story clock runs: slow stretches it, fast tightens it */
  paceRate() {
    if (Save.data.pace === 'slow') return 1 / 1.5;
    if (Save.data.pace === 'fast') return 1 / 0.6;
    return 1;
  },

  /* the pause menu, rebuilt every frame so it can show live values */
  pauseItems() {
    const paceKey = { slow: 'menu.paceSlow', normal: 'menu.paceNormal', fast: 'menu.paceFast' };
    const revKey = { instant: 'menu.revealInstant', typed: 'menu.revealTyped' };
    return [
      { label: L('menu.resume'), act: 'resume' },
      { label: L('menu.restart'), act: 'restart' },
      { label: L('menu.sound', Save.data.muted ? L('menu.soundOff') : L('menu.soundOn')), act: 'sound' },
      { label: L('menu.pace', L(paceKey[Save.data.pace] || 'menu.paceNormal')), act: 'pace' },
      { label: L('menu.reveal', L(revKey[Save.data.reveal] || 'menu.revealInstant')), act: 'reveal' },
      { label: L('menu.language', LANG.LABEL[LANG.current] || 'ENGLISH'), act: 'language' },
      { label: L('menu.keepsake'), act: 'memento' },
      { label: L('menu.name', Save.keeperName() || L('settings.nameMissing')), act: 'name' },
      { label: L('menu.quit'), act: 'quit' }
    ];
  },

  startTransition(cb) {
    this.trans = { t: 0, dur: 0.5, mid: false, cb };
  },

  enterStage(i, opts) {
    opts = opts || {};
    this.stageIndex = i;
    const def = this.campaign()[i];
    const coop = !!def.coop;
    Input.setCoop(coop);

    if (opts.keepLevel && this.level && this.level.def === def) {
      this.hearts = this.maxHearts;
      this.spawnEntities();          // enemies & props come back; flowers stay picked
    } else {
      this.level = new Level(def);
      this.stageFlowers = 0;
      this.marigolds = 0;
      this.checkpointPos = null;
      this.checkpointSpec = null;
      this.hearts = this.maxHearts;
      this.blooms = [];
      this.shrines = [];
      this.warmth = this.maxWarmth;
      this.warmthT = 0;
      this.threadCut = false;
      this.spawnEntities();
      this.particles = [];
    }

    const start = (opts.keepLevel && this.checkpointPos) ? this.checkpointPos : this.spawnPos;
    const profile = def.profile || 'finn';
    this.player = new Player(start.x, start.y, profile, Input);
    this.player.invuln = 0.8;

    /* the second player: the little knight, on the letter keys */
    this.player2 = null;
    if (coop && this.level.spawnTile2) {
      const s2 = this.level.spawnTile2;
      this.player2 = new Player(s2.tx * 16 + 3, (s2.ty + 1) * 16 - 18, 'finn', Input.p2);
      this.player2.invuln = 0.8;
    }

    this.camera.x = U.clamp(start.x - 200, 0, Math.max(0, this.level.w * 16 - 400));
    this.camera.y = U.clamp(start.y - 130, 0, 64);

    this.msg = null;
    this.freeze = 0;
    this.shake = 0;

    if (opts.keepLevel) {
      this.state = 'playing';
    } else {
      this.state = 'intro';
      this.introT = 0;
      this.stageBlurb = L(def.blurbKey || ('blurb.' + (i + 1)));
      if (i === 0 && !Save.data.hintSeen) this.hintT = 9;
    }

    AudioSys.playMusic(def.music);
  },

  spawnEntities() {
    const level = this.level;
    this.enemies = [];
    this.platforms = [];
    this.pickups = [];
    this.checkpoints = [];
    this.signs = [];
    this.goals = [];
    this.spawnPos = null;
    this.drainOn = false;
    this.drainFront = 0;
    this.drainStart = 0;
    this.drainWarned = false;
    this.bloomLost = false;

    for (const s of level.specs) {
      switch (s.kind) {
        case 'imp':
        case 'beetle':
        case 'bat':
        case 'guard': {
          const proto = {
            imp: [14, 12], beetle: [16, 12], bat: [14, 10], guard: [14, 20]
          }[s.kind];
          const w = proto[0], h = proto[1];
          const e = s.kind === 'imp' ? new Imp(0, 0)
            : s.kind === 'beetle' ? new Beetle(0, 0)
              : s.kind === 'bat' ? new Bat(0, 0)
                : new Guard(0, 0);
          e.x = s.tx * 16 + (16 - w) / 2;
          e.y = (s.ty + 1) * 16 - h;
          if (e.homeX !== undefined) { e.homeX = e.x; e.homeY = e.y; }
          this.enemies.push(e);
          break;
        }
        case 'pod':
          this.enemies.push(new Pod(s.tx * 16 + 8, s.ty * 16));
          break;
        case 'saw':
          this.enemies.push(new Sawblade(s.tx * 16 - 1, s.ty * 16, s.dist, s.speed));
          break;
        case 'wasp':
          this.enemies.push(new Wasp(s.tx * 16 + 2, s.ty * 16, s.range));
          break;
        case 'boulder':
          this.enemies.push(new Boulder(s.tx * 16, s.ty * 16, s.dist, s.speed));
          break;
        case 'husk':
          this.enemies.push(new Husk(s.tx * 16 + 2, (s.ty + 1) * 16 - 18));
          break;
        case 'flower':
        case 'violet':
        case 'glint': {
          const pk = new Pickup(s.tx * 16 + 3, s.ty * 16 + 3, s.kind, s);
          if (level.taken.has(s.i)) pk.taken = true;
          this.pickups.push(pk);
          break;
        }
        case 'shrine':
          this.shrines.push(new Shrine(s.tx * 16, (s.ty + 1) * 16));
          break;
        case 'drain':
          this.drainOn = true;
          this.drainStart = s.tx * 16;
          this.drainFront = s.tx * 16;
          break;
        case 'checkpoint': {
          const c = new Checkpoint(s.tx * 16 + 2, (s.ty + 1) * 16 - 20);
          c.spec = s;
          c.active = (s === this.checkpointSpec);
          this.checkpoints.push(c);
          break;
        }
        case 'sign':
          this.signs.push(new Sign(s.tx * 16, (s.ty + 1) * 16 - 16, s.text));
          break;
        case 'mover':
          this.platforms.push(new Mover(s.tx * 16, s.ty * 16, s.tiles * 16, s.axis, s.dist, s.speed));
          break;
        case 'crumble': {
          const cr = new Crumble(s.tx * 16, s.ty * 16, s.tiles * 16);
          this.platforms.push(cr);
          break;
        }
        case 'door':
          this.goals.push(new Goal(s.tx * 16, (s.ty + 1) * 16, s.type));
          break;
        default:
          break;
      }
    }

    const sp = level.spawnTile;
    this.spawnPos = { x: sp.tx * 16 + 3, y: (sp.ty + 1) * 16 - 18 };
    if (!this.checkpointPos) this.checkpointPos = this.spawnPos;
  },

  /* ---------- update ---------- */

  update(dt) {
    this.time += dt;

    if (this.freeze > 0) {
      this.freeze -= dt;
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 10);
      return;
    }

    /* fade transitions own the update until the halfway point */
    if (this.trans) {
      this.trans.t += dt;
      if (!this.trans.mid && this.trans.t >= this.trans.dur / 2) {
        this.trans.mid = true;
        this.trans.cb();
      }
      if (this.trans.t >= this.trans.dur) this.trans = null;
      else if (!this.trans.mid) return;
    }

    /* global keys */
    if (Input.pressed.mute) {
      const m = AudioSys.toggle();
      Save.data.muted = m;
      Save.write();
    }
    if (Input.pressed.language) LANG.toggle();

    this.updatePointer();

    switch (this.state) {
      case 'title': this.updateTitle(dt); break;
      case 'roadSelect': this.updateRoadSelect(dt); break;
      case 'settings': this.updateSettings(dt); break;
      case 'memento': this.updateMemento(dt); break;
      case 'photoView': this.updatePhotoView(dt); break;
      case 'keepsake': this.updateKeepsake(dt); break;
      case 'letter': this.updateLetter(dt); break;
      case 'select': this.updateSelect(dt); break;
      case 'prologue': this.updatePrologue(dt); break;
      case 'intro': this.updateIntro(dt); break;
      case 'playing': this.updatePlaying(dt); break;
      case 'paused': this.updatePaused(dt); break;
      case 'dead': this.updateDead(dt); break;
      case 'rescue': this.updateRescue(dt); break;
      case 'epilogue': this.updateEpilogue(dt); break;
      case 'victory': this.updateVictory(dt); break;
      default: break;
    }
  },

  clicked(rect) {
    return !!(Input.click && rect && U.pointIn(Input.click.x, Input.click.y, rect));
  },

  /* which button the pointer is resting on, so it can light up */
  updatePointer() {
    const p = Input.pointer;
    this.pointerInPause = !!(this.state === 'playing' && UI.rects.pause
      && p.x >= 0 && U.pointIn(p.x, p.y, UI.rects.pause));

    let over = null;
    if (this.state === 'title') {
      if (p.x >= 0 && UI.rects.titleSettings && U.pointIn(p.x, p.y, UI.rects.titleSettings)) over = 'titleSettings';
      else if (p.x >= 0 && UI.rects.titleMemento && U.pointIn(p.x, p.y, UI.rects.titleMemento)) over = 'titleMemento';
    }
    this.pointerOver = over;
  },

  updateTitle() {
    /* the prologue can be watched again from the title */
    if (Input.pressed.replay) {
      AudioSys.sfx('select');
      this.startTransition(() => this.startPrologue(this.road));
      return;
    }
    if (this.clicked(UI.rects.titleSettings)) {
      AudioSys.sfx('select');
      this.startTransition(() => this.startSettings('title'));
      return;
    }
    if (this.clicked(UI.rects.titleMemento)) {
      AudioSys.sfx('select');
      this.startTransition(() => this.startMemento('title'));
      return;
    }
    if (Input.pressed.confirm || this.clicked(UI.rects.titleStart)) {
      AudioSys.sfx('select');
      this.startTransition(() => this.startRoadSelect());
    }
  },

  /* ---------- the road picker ---------- */

  updateRoadSelect(dt) {
    const roads = this.roadList();
    if (Input.pressed.left) {
      this.roadSel = (this.roadSel + roads.length - 1) % roads.length;
      AudioSys.sfx('blip');
    }
    if (Input.pressed.right) {
      this.roadSel = (this.roadSel + 1) % roads.length;
      AudioSys.sfx('blip');
    }

    let chosen = -1;
    if (UI.rects.roads) {
      for (const r of UI.rects.roads) {
        if (this.clicked(r)) chosen = r.i;
      }
    }
    if (Input.pressed.confirm && chosen < 0) chosen = this.roadSel;
    if (chosen >= 0) this.chooseRoad(chosen);

    if (Input.pressed.back) {
      AudioSys.sfx('blip');
      this.startTransition(() => { this.state = 'title'; });
    }
  },

  /* ---------- settings ---------- */

  updateSettings(dt) {
    const items = this.settingsItems();
    if (Input.pressed.up) { this.settingsSel = (this.settingsSel + items.length - 1) % items.length; AudioSys.sfx('blip'); }
    if (Input.pressed.down) { this.settingsSel = (this.settingsSel + 1) % items.length; AudioSys.sfx('blip'); }

    let pick = -1;
    for (const r of (UI.rects.menu || [])) if (this.clicked(r)) pick = r.i;
    if (Input.pressed.confirm && pick < 0) pick = this.settingsSel;

    if (Input.pressed.back) {
      AudioSys.sfx('blip');
      const from = this.settingsFrom;
      this.startTransition(() => this.backTo(from));
      return;
    }
    if (pick < 0) return;

    const act = (items[pick] || {}).act;
    switch (act) {
      case 'name':
        AudioSys.sfx('select');
        this.openNameEntry();
        break;
      case 'language':
        LANG.set(LANG.current === 'en' ? 'id' : 'en');
        AudioSys.sfx('blip');
        break;
      case 'pace': {
        const order = ['slow', 'normal', 'fast'];
        const i = order.indexOf(Save.data.pace);
        Save.data.pace = order[(i + 1) % order.length];
        Save.write();
        AudioSys.sfx('blip');
        break;
      }
      case 'reveal': {
        Save.data.reveal = Save.data.reveal === 'typed' ? 'instant' : 'typed';
        Save.write();
        AudioSys.sfx('blip');
        break;
      }
      case 'sound': {
        const m = AudioSys.toggle();
        Save.data.muted = m;
        Save.write();
        AudioSys.sfx('blip');
        break;
      }
      case 'reset': {
        if (!this.resetArmed) {
          this.resetArmed = true;
          AudioSys.sfx('blip');
        } else {
          this.resetArmed = false;
          AudioSys.sfx('down');
          Save.reset();
          this.startTransition(() => {
            this.state = 'title';
            this.road = 'keep';
            this.hearts = this.maxHearts;
          });
        }
        break;
      }
      case 'back':
        AudioSys.sfx('select');
        {
          const from = this.settingsFrom;
          this.startTransition(() => this.backTo(from));
        }
        break;
      default: break;
    }
  },

  /* the name is typed into a real field, so it can hold anything */
  openNameEntry(from) {
    const el = document.getElementById('nameInput');
    if (!el) return;
    const field = el.querySelector('input');
    const veil = el;
    const backState = from || this.state;
    field.value = Save.data.name || '';
    veil.classList.add('is-open');
    field.focus();
    field.select();

    const close = (ok) => {
      veil.classList.remove('is-open');
      field.blur();
      if (ok) {
        const v = String(field.value || '').trim().slice(0, 16);
        Save.data.name = v;
        Save.write();
      }
      this.state = backState;
      if (Input.canvas) Input.canvas.focus();
      window.removeEventListener('keydown', onKey, true);
    };
    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); }
      else { e.stopPropagation(); }
    };
    window.addEventListener('keydown', onKey, true);
  },

  /* ---------- keepsakes ---------- */

  updateMemento(dt) {
    const n = Photos.MAX + 1;      /* twelve slots and the letter */
    if (Input.pressed.up) { this.mementoSel = (this.mementoSel + n - 1) % n; AudioSys.sfx('blip'); }
    if (Input.pressed.down) { this.mementoSel = (this.mementoSel + 1) % n; AudioSys.sfx('blip'); }
    if (Input.pressed.left) { this.mementoSel = (this.mementoSel + n - 1) % n; AudioSys.sfx('blip'); }
    if (Input.pressed.right) { this.mementoSel = (this.mementoSel + 1) % n; AudioSys.sfx('blip'); }

    if (Input.pressed.back) {
      AudioSys.sfx('blip');
      const from = this.mementoFrom;
      this.startTransition(() => this.backTo(from));
      return;
    }

    if (Input.pressed.confirm) {
      if (this.mementoSel >= Photos.MAX) {
        if (this.letterUnlocked()) this.startLetter('memento');
        else { AudioSys.sfx('locked'); this.msg = { text: L('memento.letterLocked'), t: 2 }; }
      } else {
        const idx = this.mementoSel + 1;
        if (Photos.has(idx)) {
          this.state = 'photoView';
          AudioSys.sfx('select');
        } else {
          AudioSys.sfx('locked');
          this.msg = { text: L('memento.notFound'), t: 2 };
        }
      }
    }
  },

  updatePhotoView(dt) {
    if (Input.pressed.confirm || Input.pressed.back || Input.pressed.jump) {
      AudioSys.sfx('blip');
      this.state = 'memento';
    }
  },

  letterUnlocked() {
    return !!(Save.data.letterSeen || Save.data.keepDone);
  },

  /* ---------- the letter ---------- */

  updateLetter(dt) {
    this.letterT += dt;
    const total = letterChars();
    const done = this.letterT * 52 >= total;

    if (done && (Input.pressed.confirm || Input.pressed.back || Input.pressed.jump)) {
      AudioSys.sfx('blip');
      this.startTransition(() => {
        if (this.letterFrom === 'memento') this.state = 'memento';
        else if (this.letterFrom === 'victory') this.state = 'victory';
        else this.state = 'title';
      });
    }
  },

  updatePrologue(dt) {
    if (this.prologueDone) return;
    const pro = this.prologueDef || PROLOGUE;
    this.prologueT += dt * this.paceRate();

    const end = pro.end;
    const inLast = this.prologueT >= pro.lastStart;

    if (Input.pressed.back) {
      this.prologueT = end;
      this.prologueDone = true;
      AudioSys.sfx('blip');
    } else if (Input.pressed.confirm || Input.pressed.jump) {
      this.prologueT = inLast ? end : pro.nextSceneTime(this.prologueT);
      this.prologueDone = inLast;
      AudioSys.sfx('blip');
    }

    /* the beast calls out of the dark as it rises */
    if (this.prologueRoad === 'finn' && this.prologueT >= pro.sceneStart('shadow') + 1.9 && !this.roared) {
      this.roared = true;
      AudioSys.sfx('roar');
    }
    /* her side of the night: the briar opens */
    if (this.prologueRoad === 'keep' && this.prologueT >= pro.sceneStart('keepShadow') + 1.9 && !this.roared) {
      this.roared = true;
      AudioSys.sfx('thunder');
    }

    /* the last panel waits for the player, but never traps them */
    if (inLast && !this.prologueDone) {
      this.prologueWait += dt;
      if (this.prologueWait > 14) { this.prologueT = end; this.prologueDone = true; }
    }
    if (this.prologueT > end) this.prologueT = end;

    if (this.prologueDone) {
      if (this.prologueRoad === 'keep') Save.data.keepPrologueSeen = true;
      else Save.data.prologueSeen = true;
      Save.write();
      this.startTransition(() => this.startSelect());
    }
  },

  updateSelect() {
    const c = this.campaign();
    if (Input.pressed.left) {
      this.selectSel = Math.max(0, this.selectSel - 1);
      AudioSys.sfx('blip');
    }
    if (Input.pressed.right) {
      this.selectSel = Math.min(c.length - 1, this.selectSel + 1);
      AudioSys.sfx('blip');
    }

    let chosen = -1;
    if (UI.rects.cards) {
      for (const r of UI.rects.cards) {
        if (this.clicked(r)) chosen = r.i;
      }
    }
    if (Input.pressed.confirm && chosen < 0) chosen = this.selectSel;

    if (chosen >= 0) {
      if (chosen + 1 > this.unlockedCount()) {
        AudioSys.sfx('locked');
        this.msg = { text: L('toast.barred'), t: 2 };
      } else {
        this.selectSel = chosen;
        AudioSys.sfx('select');
        this.startTransition(() => this.enterStage(chosen));
      }
    }

    if (Input.pressed.back) {
      AudioSys.sfx('blip');
      this.startTransition(() => { this.state = 'roadSelect'; });
    }
  },

  updateIntro(dt) {
    this.introT += dt;
    if (this.introT > 2.5 || Input.pressed.confirm || Input.pressed.jump) {
      this.state = 'playing';
      AudioSys.sfx('select');
    }
  },

  updatePlaying(dt) {
    if (Input.pressed.back || this.clicked(UI.rects.pause)) {
      this.state = 'paused';
      this.pausedSel = 0;
      AudioSys.sfx('blip');
      return;
    }
    this.updateWorld(dt);
  },

  updateWorld(dt) {
    const p = this.player;
    const p2 = this.player2;

    /* platforms move first; carry the rider */
    for (const plat of this.platforms) plat.update(dt);

    /* both players, one after the other */
    const crew = p2 ? [p, p2] : [p];
    for (const who of crew) {
      /* a moving ledge carries its rider; her own flowers stand still */
      if (who.riding && who.riding.prevX !== undefined) {
        who.x += who.riding.x - who.riding.prevX;
        who.y += who.riding.y - who.riding.prevY;
      }
      who.update(dt, this);
      if (this.state !== 'playing') return;
    }

    /* her flowers */
    for (const b of this.blooms) b.update(dt, this);
    for (const s of this.shrines) s.update(dt);

    for (const e of this.enemies) {
      if (e.dead) continue;
      e.update(dt, this);
    }
    if (this.state !== 'playing') return;

    this.resolveContact();
    if (this.state !== 'playing') return;

    /* the warmth comes back on its own, slowly */
    if (this.warmth < this.maxWarmth) {
      this.warmthT += dt;
      if (this.warmthT >= 2.4) {
        this.warmthT = 0;
        this.warmth++;
        AudioSys.sfx('light');
      }
    } else {
      this.warmthT = 0;
    }

    /* the colour draining out of the nettle road */
    this.updateDrain(dt);

    /* the thread that holds the two of them together */
    this.updateThread(dt);

    for (const pk of this.pickups) pk.update(dt, this);

    for (const c of this.checkpoints) {
      if (!c.active && U.overlap(p, c)) this.activateCheckpoint(c);
    }

    for (const g of this.goals) {
      if (U.overlap(p, g.box)) { this.reachGoal(); return; }
    }

    /* the shrine takes three of her own flowers */
    this.updateShrines();

    if (this.msg) {
      this.msg.t -= dt;
      if (this.msg.t <= 0) this.msg = null;
    }
    this.scanSigns();

    this.updateParticles(dt);

    if (this.hintT > 0) {
      this.hintT -= dt;
      if (this.hintT <= 0) { Save.data.hintSeen = true; Save.write(); }
    }

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 16);
    this.updateCamera(dt);
  },

  /* ---------- the west road: warmth, flowers, shrines ---------- */

  /* she presses a marigold into the ground at her feet */
  plantBloom(p) {
    if (this.warmth <= 0) {
      AudioSys.sfx('locked');
      this.msg = { text: L('toast.warmth'), t: 2.2 };
      return;
    }

    /* The surface she is standing on: a flower of her own, a ledge, or the
       ground. When she is in the air the flower opens where she is, so a
       jump and a plant can carry her up the briar. */
    let gy = null;

    if (p.riding) {
      gy = p.riding.y + p.riding.h;
    } else if (p.onGround) {
      const tx = Math.floor(p.cx / 16);
      for (let ty = Math.floor((p.y + p.h) / 16); ty < this.level.h; ty++) {
        if (this.level.solidAt(tx, ty)) { gy = ty * 16; break; }
      }
    }
    if (gy === null) gy = p.y + p.h;

    const b = new Bloom(Math.round(p.cx - 8), gy, p);
    this.blooms.push(b);
    this.warmth--;
    AudioSys.sfx('bloom');
    this.burst(b.x + 8, gy - 4, PAL.marigold, 10, 70, 0.5, 'spark');
    this.burst(b.x + 8, gy - 4, PAL.goldLight, 6, 50, 0.4, 'spark');
    this.msg = { text: L('toast.planted'), t: 1.3 };
  },

  /* she takes one back, and the warmth returns with it */
  reclaimBloom(p) {
    let best = null;
    let bd = 1e9;
    for (const b of this.blooms) {
      if (b.dead || b.anchored) continue;
      const dx = b.cx - p.cx;
      const dy = b.baseY - (p.y + p.h);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 24 && d < bd) { bd = d; best = b; }
    }
    if (!best) {
      AudioSys.sfx('locked');
      return;
    }
    best.dead = true;
    const i = this.blooms.indexOf(best);
    if (i >= 0) this.blooms.splice(i, 1);
    this.warmth = Math.min(this.maxWarmth, this.warmth + 1);
    AudioSys.sfx('pickup');
    this.burst(best.x + 8, best.baseY - 4, PAL.marigold, 8, 60, 0.4, 'spark');
    this.msg = { text: L('toast.uprooted'), t: 1.6 };
  },

  /* a flower that has gone over */
  onBloomFaded(b) {
    const i = this.blooms.indexOf(b);
    if (i >= 0) this.blooms.splice(i, 1);
    /* in the hall of the Old Bloom the dark takes the gap she leaves */
    this.bloomLost = true;
  },

  /* the shrine fills, and the chapter ends */
  updateShrines() {
    if (!this.shrines.length) return;
    for (const s of this.shrines) {
      if (s.done) continue;
      for (const b of this.blooms) {
        if (b.dead || b.anchored) continue;
        if (s.tryFill(b)) {
          AudioSys.sfx('shrine');
          this.msg = { text: L('toast.shrine'), t: 2 };
          this.burst(b.x + 8, b.baseY - 6, PAL.goldLight, 12, 90, 0.5, 'spark');
        }
      }
    }

    const s = this.shrines.find(function (sh) { return sh.done; });
    if (!s) return;

    /* in co-op the shrine only opens when both of them are there */
    if (this.player2) {
      const a = Math.abs(this.player.cx - (s.x + 28));
      const b = Math.abs(this.player2.cx - (s.x + 28));
      if (a > 150 || b > 150) {
        if (!this.msg || this.msg.text !== L('toast.thread')) {
          this.msg = { text: L('toast.thread'), t: 1.4 };
        }
        return;
      }
    }

    this.completeChapter();
  },

  completeChapter() {
    if (this.state !== 'playing') return;
    const c = this.campaign();
    const i = this.stageIndex;

    /* bank the marigolds */
    if (this.road === 'keep') {
      Save.data.keepBest[i] = Math.max(Save.data.keepBest[i] || 0, this.stageFlowers);
      Save.clearedChapter(i);
    } else if (this.road === 'finn') {
      Save.data.best[i] = Math.max(Save.data.best[i] || 0, this.stageFlowers);
    }
    Save.data.flowers += this.stageFlowers;
    Save.write();

    AudioSys.sfx('win');

    if (i < c.length - 1) {
      if (this.road === 'keep') Save.data.keepUnlocked = Math.max(Save.data.keepUnlocked, i + 2);
      else if (this.road === 'finn') Save.data.unlocked = Math.max(Save.data.unlocked, i + 2);
      Save.write();

      /* a keepsake waits between the chapters */
      const keep = this.keepsakeFor(i);
      if (keep) {
        this.state = 'keepsake';
        this.keepsakeIdx = keep;
        this.keepsakeNext = () => this.enterStage(i + 1);
        AudioSys.stopMusic();
        AudioSys.sfx('glint');
        return;
      }

      this.startTransition(() => this.enterStage(i + 1));
      return;
    }

    /* the end of the road */
    if (this.road === 'coop') {
      Save.data.coopDone = true;
      Save.write();
      const keep = this.keepsakeFor(5);
      if (keep) {
        this.state = 'keepsake';
        this.keepsakeIdx = keep;
        this.keepsakeNext = () => {
          this.state = 'victory';
          this.time = 0;
          AudioSys.stopMusic();
          AudioSys.playMusic('dawn');
        };
        AudioSys.stopMusic();
        AudioSys.sfx('glint');
        return;
      }
      this.state = 'victory';
      this.time = 0;
      AudioSys.stopMusic();
      AudioSys.playMusic('dawn');
      return;
    }
    if (this.road === 'finn') {
      Save.data.unlocked = Save.SLOTS;
      Save.write();
      this.state = 'rescue';
      this.rescueT = 0;
      AudioSys.stopMusic();
      return;
    }

    /* her road ends at the heart of the briar */
    Save.data.keepDone = true;
    Save.write();
    this.state = 'epilogue';
    this.epilogueT = 0;
    AudioSys.playMusic('dawn');
  },

  /* the keepsake that comes after chapter number n (one based), if there is one */
  keepsakeFor(n) {
    const idx = n + 1;
    if (idx < 1 || idx > Photos.MAX) return 0;
    if (!Photos.cards[idx]) return 0;
    if (!Photos.unlocked(idx)) return 0;
    return idx;
  },

  /* ---------- the keepsake between chapters ---------- */

  updateKeepsake(dt) {
    if (!Input.pressed.confirm && !Input.pressed.jump && !Input.pressed.back) return;
    AudioSys.sfx('select');
    Save.sawPhoto(this.keepsakeIdx);
    const next = this.keepsakeNext;
    this.keepsakeIdx = 0;
    this.keepsakeNext = null;
    if (next) this.startTransition(() => next());
    else this.startTransition(() => { this.state = 'title'; });
  },

  /* ---------- the drain ---------- */

  updateDrain(dt) {
    if (!this.drainOn) return;
    const def = this.campaignDef();
    const speed = def.drainSpeed || 24;
    const p = this.player;

    if (def.drainMode === 'bloom') {
      /* The hall of the Old Bloom: the dark creeps, and every flower of hers
         that goes out lets it take a step closer. A living flower holds it
         where it is - the light she leaves behind keeps the briar back. */
      if (this.bloomLost) {
        this.bloomLost = false;
        this.drainFront += 48;
        this.shake = Math.max(this.shake, 3);
        AudioSys.sfx('down');
      }
      this.drainFront += speed * dt;

      let hold = null;
      for (const b of this.blooms) {
        if (b.dead || b.anchored) continue;
        if (hold === null || b.x < hold) hold = b.x;
      }
      if (hold !== null && this.drainFront > hold) this.drainFront = hold;

      this.drainWarn();
      this.drainTouch(p);
      return;
    }

    /* The nettle road: the colour drains out of the road behind her. It
       waits at the edge until she is properly on the way, then it creeps
       east on its own - stop moving and it will find her. */
    if (p.cx > this.drainStart + 400) this.drainFront += speed * dt;

    this.drainWarn();
    this.drainTouch(p);
  },

  /* a nudge when the dark is close */
  drainWarn() {
    if (this.drainWarned) return;
    if (this.player.cx - this.drainFront < 150) {
      this.drainWarned = true;
      this.msg = { text: L('toast.drain'), t: 2.4 };
    }
  },

  /* and it bites when it reaches her */
  drainTouch(p) {
    if (p.cx - 12 < this.drainFront) {
      this.hurtPlayer(1, this.drainFront - 10, p.cy);
    }
  },

  /* ---------- the thread ---------- */

  updateThread(dt) {
    if (!this.player2) return;
    this.threadT += dt;
    const d = Math.abs(this.player.cx - this.player2.cx);
    const far = d > 120;

    if (far && !this.threadCut) {
      this.threadCut = true;
      AudioSys.sfx('down');
      this.msg = { text: L('toast.threadCut'), t: 2.2 };
      this.shake = Math.max(this.shake, 3);
      /* the flowers go out while the thread is dark */
      for (const b of this.blooms) {
        if (b.anchored) continue;
        b.dead = true;
      }
      this.blooms = this.blooms.filter(function (b) { return b.anchored; });
    } else if (!far && this.threadCut) {
      this.threadCut = false;
      this.msg = { text: L('toast.thread'), t: 1.8 };
    }
  },

  scanSigns() {
    const p = this.player;
    for (const s of this.signs) {
      if (Math.abs(p.cx - (s.x + 8)) < 34 && Math.abs(p.y - s.y) < 46) {
        this.msg = { text: L(s.text), t: 2.2 };
        return;
      }
    }
  },

  resolveContact() {
    this.contactFor(this.player);
    if (this.player2) this.contactFor(this.player2);
  },

  contactFor(p) {
    if (!p || p.invuln > 0 || p.dead) return;
    for (const e of this.enemies) {
      if (e.dead || e.state === 'burst') continue;
      if (!U.overlap(p, e)) continue;
      const stomping = p.vy > 30 && p.prevBottom <= e.y + 8 && e.stompable !== false;
      if (stomping) {
        p.vy = -235;
        p.jumpCut = false;
        p.onGround = false;
        e.stomp(p, this);
        if (!e.dead) this.burst(p.cx, p.y + p.h, PAL.cream2, 5, 70, 0.3, 'dust');
      } else if (p.blocking && U.sign(e.cx - p.cx) === p.facing) {
        /* the shield holds: a clank, a shove, no heart lost */
        AudioSys.sfx('clank');
        this.freeze = 0.04;
        this.shake = Math.max(this.shake, 2);
        this.spark(p.cx + p.facing * 6, p.cy);
        p.vx = -p.facing * 45;
        p.vy = Math.min(p.vy, 0);
      } else {
        this.hurtPlayer(e.damage || 1, e.cx, e.cy, p);
      }
      if (this.state !== 'playing') return;
    }
  },

  updateCamera(dt) {
    const p = this.player;
    const maxX = Math.max(0, this.level.w * 16 - 400);
    const tx = U.clamp(p.cx - 200, 0, maxX);
    const ty = U.clamp(p.y + p.h / 2 - 224 * 0.58, 0, 64);
    this.camera.x = U.approach(this.camera.x, tx, 640 * dt);
    this.camera.y = U.approach(this.camera.y, ty, 500 * dt);
  },

  updatePaused(dt) {
    const items = UI.rects.menu || [];
    if (Input.pressed.up) { this.pausedSel = (this.pausedSel + items.length - 1) % items.length; AudioSys.sfx('blip'); }
    if (Input.pressed.down) { this.pausedSel = (this.pausedSel + 1) % items.length; AudioSys.sfx('blip'); }

    let pick = -1;
    for (const r of items) if (this.clicked(r)) pick = r.i;
    if (Input.pressed.confirm && pick < 0) pick = this.pausedSel;

    if (Input.pressed.back) {
      this.state = 'playing';
      AudioSys.sfx('blip');
      return;
    }

    if (pick < 0) return;
    const act = (this.pauseItems()[pick] || {}).act;
    switch (act) {
      case 'resume':
        this.state = 'playing';
        AudioSys.sfx('select');
        break;
      case 'restart':
        AudioSys.sfx('select');
        this.startTransition(() => this.enterStage(this.stageIndex));
        break;
      case 'sound': {
        const m = AudioSys.toggle();
        Save.data.muted = m;
        Save.write();
        AudioSys.sfx('blip');
        break;
      }
      case 'pace': {
        const order = ['slow', 'normal', 'fast'];
        const i = order.indexOf(Save.data.pace);
        Save.data.pace = order[(i + 1) % order.length];
        Save.write();
        AudioSys.sfx('blip');
        break;
      }
      case 'reveal': {
        Save.data.reveal = Save.data.reveal === 'typed' ? 'instant' : 'typed';
        Save.write();
        AudioSys.sfx('blip');
        break;
      }
      case 'language':
        LANG.set(LANG.current === 'en' ? 'id' : 'en');
        AudioSys.sfx('blip');
        break;
      case 'memento':
        AudioSys.sfx('select');
        this.startMemento('pause');
        break;
      case 'name':
        AudioSys.sfx('select');
        this.openNameEntry();
        break;
      case 'quit':
        AudioSys.sfx('down');
        this.startTransition(() => {
          this.state = 'title';
          AudioSys.playMusic('meadow');
        });
        break;
      default: break;
    }
  },

  updateDead(dt) {
    this.deadT += dt;
    this.updateParticles(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 16);
    if (this.deadT > 1.6 || (this.deadT > 0.5 && Input.pressed.confirm)) {
      this.startTransition(() => this.enterStage(this.stageIndex, { keepLevel: true }));
    }
  },

  updateRescue(dt) {
    this.rescueT += dt;
    if (this.rescueT === dt) AudioSys.sfx('rescue');
    if (this.rescueT > 19.8) {
      /* she is found - dawn is next */
      this.state = 'epilogue';
      this.epilogueT = 0;
      AudioSys.playMusic('dawn');
    }
  },

  updateEpilogue(dt) {
    this.epilogueT += dt;
    const end = (this.road === 'keep') ? 25.4 : 23.5;
    if (this.epilogueT > end) {
      /* write the finish */
      if (this.road === 'keep') {
        Save.data.keepDone = true;
        Save.data.keepUnlocked = Save.SLOTS;
      } else {
        Save.data.unlocked = Save.SLOTS;
      }
      Save.write();
      this.state = 'victory';
      this.time = 0;
      AudioSys.stopMusic();
      AudioSys.sfx('win');
    }
  },

  updateVictory() {
    const canLetter = this.road === 'keep' && this.letterUnlocked();
    if (canLetter && (Input.pressed.confirm || this.clicked(UI.rects.victoryExit))) {
      AudioSys.sfx('select');
      this.startLetter('victory');
      return;
    }
    if (Input.pressed.confirm || Input.pressed.back || this.clicked(UI.rects.victoryExit)) {
      AudioSys.sfx('select');
      this.startTransition(() => {
        this.state = 'title';
        this.time = 0;
        AudioSys.playMusic('meadow');
      });
    }
  },

  /* ---------- gameplay events ---------- */

  activateCheckpoint(c) {
    c.active = true;
    this.checkpointSpec = c.spec;
    this.checkpointPos = { x: c.x - 13, y: c.y + c.h - 18 };
    if (this.hearts < this.maxHearts) this.hearts++;
    AudioSys.sfx('checkpoint');
    this.burst(c.x + 6, c.y + 4, PAL.gold, 12, 90, 0.55, 'spark');
    this.msg = { text: L('toast.checkpoint'), t: 3 };
  },

  collect(pk) {
    if (pk.spec) this.level.taken.add(pk.spec.i);
    if (pk.kind === 'violet') {
      this.hearts = this.maxHearts;
      AudioSys.sfx('violet');
      this.msg = { text: L('toast.violet'), t: 3 };
      this.burst(pk.cx, pk.cy, PAL.violet, 16, 110, 0.6, 'spark');
      this.burst(pk.cx, pk.cy, PAL.white, 8, 80, 0.5, 'spark');
      return;
    }

    this.stageFlowers++;
    this.marigolds++;
    AudioSys.sfx('pickup');
    this.burst(pk.cx, pk.cy, PAL.marigold, 8, 80, 0.45, 'spark');

    if (this.marigolds % 5 === 0) {
      if (this.hearts < this.maxHearts) this.hearts++;
      AudioSys.sfx('heal');
      this.msg = { text: L('toast.heal'), t: 3 };
      this.burst(this.player.cx, this.player.cy, PAL.rose, 12, 90, 0.5, 'spark');
    }
  },

  hurtPlayer(n, fromX, fromY, target) {
    if (this.state !== 'playing') return;
    const p = target || this.player;
    if (p.invuln > 0) return;

    this.hearts -= n;
    AudioSys.sfx('hurt');
    this.shake = 5;
    this.freeze = 0.07;
    p.invuln = 1.7;
    p.hurtTimer = 0.4;
    p.jumpCut = false;
    p.riding = null;
    p.onGround = false;
    const dir = U.sign(p.cx - fromX) || -p.facing;
    p.vx = dir * 150;
    p.vy = -205;

    /* the keeper's oldest flower goes out when she is hurt */
    if (p.prof && p.prof.grow) this.witherOldestBloom();

    /* the other one feels it too */
    const other = (p === this.player) ? this.player2 : this.player;
    if (other && !other.dead) {
      other.invuln = Math.max(other.invuln, 0.9);
    }

    if (this.hearts <= 0) this.die();
  },

  /* the oldest flower she planted goes over */
  witherOldestBloom() {
    let oldest = null;
    for (const b of this.blooms) {
      if (b.dead || b.anchored) continue;
      if (!oldest || b.age > oldest.age) oldest = b;
    }
    if (!oldest) return;
    oldest.dead = true;
    const i = this.blooms.indexOf(oldest);
    if (i >= 0) this.blooms.splice(i, 1);
    this.bloomLost = true;
    this.burst(oldest.x + 8, oldest.baseY - 4, PAL.stoneDark, 8, 60, 0.45, 'chip');
  },

  drown(target) {
    if (this.state !== 'playing') return;
    const p = target || this.player;
    if (p.invuln > 0.05) return;
    this.hearts--;
    AudioSys.sfx('hurt');
    if (this.hearts <= 0) { this.die(); return; }

    const cp = this.checkpointPos || this.spawnPos;
    for (const who of [this.player, this.player2]) {
      if (!who) continue;
      who.x = cp.x + (who === this.player2 ? 20 : 0);
      who.y = cp.y;
      who.vx = 0;
      who.vy = 0;
      who.invuln = 1.6;
      who.hurtTimer = 0;
      who.attackT = -1;
      who.riding = null;
    }
    /* the colour comes back with her */
    if (this.drainOn) this.drainFront = Math.min(this.drainFront, cp.x - 200);
    this.freeze = 0.1;
    this.shake = 3;
    this.msg = { text: L('toast.drown'), t: 2.5 };
    this.camera.x = U.clamp(p.cx - 200, 0, Math.max(0, this.level.w * 16 - 400));
    this.camera.y = U.clamp(p.y - 130, 0, 64);
    this.burst(p.cx, p.y, PAL.waterLight, 12, 110, 0.5, 'chip');
  },

  die() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.deadT = 0;
    if (this.player) {
      this.player.dead = true;
      this.player.vx = 0;
      this.burst(this.player.cx, this.player.cy, PAL.rose, 16, 140, 0.7, 'spark');
      this.burst(this.player.cx, this.player.cy, PAL.white, 8, 100, 0.6, 'spark');
    }
    if (this.player2) {
      this.player2.dead = true;
      this.player2.vx = 0;
      this.burst(this.player2.cx, this.player2.cy, PAL.rose, 12, 120, 0.6, 'spark');
    }
    AudioSys.sfx('down');
    this.shake = 6;
  },

  reachGoal() {
    if (this.state !== 'playing') return;
    AudioSys.sfx('door');

    const c = this.campaign();
    const i = this.stageIndex;

    if (i < c.length - 1) {
      /* bank the flowers */
      if (this.road === 'keep') {
        Save.data.keepBest[i] = Math.max(Save.data.keepBest[i] || 0, this.stageFlowers);
        Save.data.keepUnlocked = Math.max(Save.data.keepUnlocked, i + 2);
      } else if (this.road === 'finn') {
        Save.data.best[i] = Math.max(Save.data.best[i] || 0, this.stageFlowers);
        Save.data.unlocked = Math.max(Save.data.unlocked, i + 2);
      }
      Save.data.flowers += this.stageFlowers;
      Save.write();
      this.startTransition(() => this.enterStage(i + 1));
    } else {
      if (this.road === 'finn') {
        Save.data.best[i] = Math.max(Save.data.best[i] || 0, this.stageFlowers);
        Save.data.unlocked = Save.SLOTS;
      }
      Save.data.flowers += this.stageFlowers;
      Save.write();
      this.state = 'rescue';
      this.rescueT = 0;
      AudioSys.stopMusic();
    }
  },

  /* ---------- particles ---------- */

  burst(x, y, color, n, speed, life, kind) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.65);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - (kind === 'dust' ? 30 : 0),
        t: 0,
        life: life * (0.6 + Math.random() * 0.6),
        color,
        kind
      });
    }
  },

  spark(x, y) {
    this.burst(x, y, PAL.white, 6, 130, 0.3, 'spark');
    this.burst(x, y, PAL.gold, 5, 100, 0.35, 'spark');
  },

  updateParticles(dt) {
    const list = this.particles;
    for (let i = list.length - 1; i >= 0; i--) {
      const pt = list[i];
      pt.t += dt;
      if (pt.t >= pt.life) { list.splice(i, 1); continue; }
      if (pt.kind === 'chip') pt.vy += 620 * dt;
      else if (pt.kind === 'dust') pt.vy += 120 * dt;
      else pt.vy += 40 * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
  },

  drawParticles(ctx) {
    for (const pt of this.particles) {
      const k = pt.t / pt.life;
      ctx.globalAlpha = pt.kind === 'spark' ? (Math.sin(pt.t * 40) > -0.3 ? 1 - k : 0.2) : 1 - k;
      ctx.fillStyle = pt.color;
      const size = pt.kind === 'dust' ? 2 : 2;
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y), size, size);
    }
    ctx.globalAlpha = 1;
  },

  /* ---------- render ---------- */

  render(ctx) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = PAL.inkDeep;
    ctx.fillRect(0, 0, 400, 224);

    switch (this.state) {
      case 'title': UI.title(ctx, this); break;
      case 'roadSelect': UI.roadSelect(ctx, this); break;
      case 'settings': UI.settings(ctx, this); break;
      case 'memento': UI.memento(ctx, this); break;
      case 'photoView': UI.photoView(ctx, this); break;
      case 'keepsake': UI.keepsake(ctx, this); break;
      case 'letter': UI.letter(ctx, this); break;
      case 'select': UI.select(ctx, this); break;
      case 'prologue': UI.prologue(ctx, this); break;
      case 'intro':
        this.renderWorld(ctx);
        UI.intro(ctx, this);
        break;
      case 'playing':
        this.renderWorld(ctx);
        UI.hud(ctx, this);
        UI.subtitle(ctx, this);
        UI.hint(ctx, this);
        break;
      case 'paused':
        this.renderWorld(ctx);
        UI.hud(ctx, this);
        UI.subtitle(ctx, this);
        UI.paused(ctx, this);
        break;
      case 'dead':
        this.renderWorld(ctx);
        UI.hud(ctx, this);
        UI.dead(ctx, this);
        break;
      case 'rescue': UI.rescue(ctx, this); break;
      case 'epilogue': UI.epilogue(ctx, this); break;
      case 'victory': UI.victory(ctx, this); break;
      default: break;
    }

    UI.transition(ctx, this);
  },

  renderWorld(ctx) {
    const cam = this.camera;
    const sh = this.shake;
    const sx = sh > 0 ? Math.round((Math.random() * 2 - 1) * sh) : 0;
    const sy = sh > 0 ? Math.round((Math.random() * 2 - 1) * sh) : 0;
    const cx = Math.round(cam.x) + sx;
    const cy = Math.round(cam.y) + sy;

    Backgrounds.draw(ctx, this.level.theme, cx, cy, this.time);

    ctx.save();
    ctx.translate(-cx, -cy);

    Tiles.draw(ctx, this.level, cam.x, cam.y, this.time);
    Tiles.drawDecor(ctx, this.level, cam.x, cam.y, this.time);

    const left = cam.x - 80;
    const right = cam.x + 480;

    for (const g of this.goals) {
      if (g.x > left && g.x < right) g.draw(ctx, this);
    }
    for (const c of this.checkpoints) {
      if (c.x > left && c.x < right) c.draw(ctx, this);
    }
    for (const s of this.signs) {
      if (s.x > left && s.x < right) s.draw(ctx, this);
    }
    for (const plat of this.platforms) {
      if (plat.x > left && plat.x < right) plat.draw(ctx, this);
    }
    for (const pk of this.pickups) {
      if (!pk.taken && pk.x > left && pk.x < right) pk.draw(ctx, this);
    }
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.x > left && e.x < right) e.draw(ctx, this);
    }

    /* the shrines, and the flowers in them */
    for (const s of this.shrines) {
      if (s.x > left && s.x < right) s.draw(ctx, this);
    }
    for (const b of this.blooms) {
      if (b.x > left && b.x < right) b.draw(ctx, this);
    }

    /* the golden thread between the two of them */
    if (this.player2) this.drawThread(ctx);

    if (this.player && this.state !== 'intro') this.player.draw(ctx, this);
    if (this.player2 && this.state !== 'intro') this.player2.draw(ctx, this);

    /* the colour draining out of the road */
    if (this.drainOn) this.drawDrain(ctx);

    this.drawParticles(ctx);

    ctx.restore();
  },

  /* the thread of gold that holds them together */
  drawThread(ctx) {
    const a = this.player;
    const b = this.player2;
    const ax = a.cx, ay = a.cy - 4;
    const bx = b.cx, by = b.cy - 4;
    const steps = Math.max(2, Math.round(Math.abs(bx - ax) / 5));
    const cut = this.threadCut;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t + Math.sin(t * Math.PI) * -10;
      const flick = cut ? (Math.floor(this.time * 12) % 2 === 0) : (0.55 + Math.sin(this.time * 3 + t * 6) * 0.25);
      if (flick <= 0.02) continue;
      ctx.globalAlpha = Math.min(1, flick);
      ctx.fillStyle = cut ? PAL.stoneDark : PAL.goldLight;
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
  },

  /* the briar taking the colour out of the road */
  drawDrain(ctx) {
    const x = Math.round(this.drainFront);
    if (x < -40) return;
    const cam = this.camera;

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    /* the drained part of the road goes grey and cold */
    const left = cam.x - 20;
    const w = Math.max(0, x - left);
    if (w > 0) {
      ctx.fillStyle = 'rgba(24,22,34,0.55)';
      ctx.fillRect(left, cam.y - 40, w, 320);
      ctx.fillStyle = 'rgba(60,52,70,0.35)';
      ctx.fillRect(left, cam.y - 40, w, 320);
    }

    /* the edge itself: a ragged line of thorns */
    ctx.fillStyle = PAL.inkDeep;
    for (let i = 0; i < 8; i++) {
      const yy = cam.y - 30 + i * 34;
      const wob = Math.sin(this.time * 2 + i) * 2;
      ctx.fillRect(x - 4 + wob, yy, 5, 34);
    }
    ctx.fillStyle = PAL.leafDark;
    for (let i = 0; i < 8; i++) {
      const yy = cam.y - 30 + i * 34;
      const wob = Math.sin(this.time * 2 + i) * 2;
      ctx.fillRect(x - 2 + wob, yy + 6, 3, 2);
      ctx.fillRect(x + 1 + wob, yy + 20, 2, 2);
    }

    ctx.restore();
  }
};
