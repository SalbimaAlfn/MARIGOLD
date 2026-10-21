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
  roared: false,
  deadT: 0,
  rescueT: 0,
  selectSel: 0,
  pausedSel: 0,
  pointerInPause: false,

  BLURBS: [
    'A MORNING WALK, PAST THE BRAMBLE IMPS.',
    'THE MILL IS STILL. THE WATER IS NOT.',
    'PAST THE GATE, THE KEEP WAITS IN MOONLIGHT.'
  ],

  /* ---------- setup ---------- */

  init() {
    this.titleLevel = new Level(STAGES[0]);
    let total = 0;
    for (const def of STAGES) total += new Level(def).totalFlowers;
    this.totalPossible = total;
    this.hearts = this.maxHearts;
    this.state = 'title';
    AudioSys.playMusic('meadow');
  },

  startSelect() {
    this.state = 'select';
    this.selectSel = U.clamp(Save.data.unlocked - 1, 0, STAGES.length - 1);
    AudioSys.sfx('select');
    AudioSys.playMusic('meadow');
  },

  startPrologue() {
    this.state = 'prologue';
    this.prologueT = 0;
    this.prologueDone = false;
    this.roared = false;
    AudioSys.playMusic('keep');
  },

  startTransition(cb) {
    this.trans = { t: 0, dur: 0.5, mid: false, cb };
  },

  enterStage(i, opts) {
    opts = opts || {};
    this.stageIndex = i;
    const def = STAGES[i];

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
      this.spawnEntities();
      this.particles = [];
    }

    const start = (opts.keepLevel && this.checkpointPos) ? this.checkpointPos : this.spawnPos;
    this.player = new Player(start.x, start.y);
    this.player.invuln = 0.8;

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
      this.stageBlurb = this.BLURBS[i];
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
        case 'flower':
        case 'violet': {
          const pk = new Pickup(s.tx * 16 + 3, s.ty * 16 + 3, s.kind, s);
          if (level.taken.has(s.i)) pk.taken = true;
          this.pickups.push(pk);
          break;
        }
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

    switch (this.state) {
      case 'title': this.updateTitle(dt); break;
      case 'select': this.updateSelect(dt); break;
      case 'prologue': this.updatePrologue(dt); break;
      case 'intro': this.updateIntro(dt); break;
      case 'playing': this.updatePlaying(dt); break;
      case 'paused': this.updatePaused(dt); break;
      case 'dead': this.updateDead(dt); break;
      case 'rescue': this.updateRescue(dt); break;
      case 'victory': this.updateVictory(dt); break;
      default: break;
    }
  },

  clicked(rect) {
    return !!(Input.click && rect && U.pointIn(Input.click.x, Input.click.y, rect));
  },

  updateTitle() {
    if (Input.pressed.confirm || this.clicked(UI.rects.titleStart)) {
      AudioSys.sfx('select');
      this.startTransition(() => this.startPrologue());
    }
  },

  updatePrologue(dt) {
    if (this.prologueDone) return;
    this.prologueT += dt;

    const end = PROLOGUE.end;
    if (Input.pressed.back) {
      this.prologueT = end;
      AudioSys.sfx('blip');
    } else if (Input.pressed.confirm || Input.pressed.jump) {
      const t = this.prologueT;
      let nxt;
      if (t < PROLOGUE.crawlDur) nxt = PROLOGUE.crawlDur;
      else nxt = PROLOGUE.crawlDur +
        (Math.floor((t - PROLOGUE.crawlDur) / PROLOGUE.panelDur) + 1) * PROLOGUE.panelDur;
      this.prologueT = Math.min(end, nxt);
      AudioSys.sfx('blip');
    }

    /* the beast calls out of the dark as it rises */
    if (this.prologueT >= PROLOGUE.crawlDur + 1.9 && !this.roared) {
      this.roared = true;
      AudioSys.sfx('roar');
    }

    if (this.prologueT >= end) {
      this.prologueDone = true;
      this.startTransition(() => this.startSelect());
    }
  },

  updateSelect() {
    if (Input.pressed.left) {
      this.selectSel = Math.max(0, this.selectSel - 1);
      AudioSys.sfx('blip');
    }
    if (Input.pressed.right) {
      this.selectSel = Math.min(2, this.selectSel + 1);
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
      if (chosen + 1 > Save.data.unlocked) {
        AudioSys.sfx('locked');
        this.msg = { text: 'THE THORNS STILL BAR THIS ROAD', t: 2 };
      } else {
        this.selectSel = chosen;
        AudioSys.sfx('select');
        this.startTransition(() => this.enterStage(chosen));
      }
    }

    if (Input.pressed.back) {
      AudioSys.sfx('blip');
      this.startTransition(() => { this.state = 'title'; });
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

    /* platforms move first; carry the rider */
    for (const plat of this.platforms) plat.update(dt);
    if (p.riding && !p.riding.gone) {
      p.x += p.riding.x - p.riding.prevX;
      p.y += p.riding.y - p.riding.prevY;
    }

    p.update(dt, this);
    if (this.state !== 'playing') return;

    for (const e of this.enemies) {
      if (e.dead) continue;
      e.update(dt, this);
    }
    if (this.state !== 'playing') return;

    this.resolveContact();

    for (const pk of this.pickups) pk.update(dt, this);

    for (const c of this.checkpoints) {
      if (!c.active && U.overlap(p, c)) this.activateCheckpoint(c);
    }

    for (const g of this.goals) {
      if (U.overlap(p, g.box)) { this.reachGoal(); return; }
    }

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

  scanSigns() {
    const p = this.player;
    for (const s of this.signs) {
      if (Math.abs(p.cx - (s.x + 8)) < 34 && Math.abs(p.y - s.y) < 46) {
        this.msg = { text: s.text, t: 2.2 };
        return;
      }
    }
  },

  resolveContact() {
    const p = this.player;
    if (p.invuln > 0 || p.dead) return;
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
        this.hurtPlayer(e.damage || 1, e.cx, e.cy);
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
    switch (pick) {
      case 0:
        this.state = 'playing';
        AudioSys.sfx('select');
        break;
      case 1:
        AudioSys.sfx('select');
        this.startTransition(() => this.enterStage(this.stageIndex));
        break;
      case 2: {
        const m = AudioSys.toggle();
        Save.data.muted = m;
        Save.write();
        AudioSys.sfx('blip');
        break;
      }
      case 3:
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
    if (this.rescueT > 11) {
      /* write the finish */
      Save.data.unlocked = 3;
      Save.write();
      this.state = 'victory';
      this.time = 0;
      AudioSys.stopMusic();
      AudioSys.sfx('win');
    }
  },

  updateVictory() {
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
    this.msg = { text: 'LANTERN LIT - YOU WILL WAKE HERE', t: 3 };
  },

  collect(pk) {
    if (pk.spec) this.level.taken.add(pk.spec.i);
    if (pk.kind === 'violet') {
      this.hearts = this.maxHearts;
      AudioSys.sfx('violet');
      this.msg = { text: 'THE VIOLET BLOOM - FULLY HEALED', t: 3 };
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
      this.msg = { text: 'FIVE MARIGOLDS MEND A HEART', t: 3 };
      this.burst(this.player.cx, this.player.cy, PAL.rose, 12, 90, 0.5, 'spark');
    }
  },

  hurtPlayer(n, fromX, fromY) {
    if (this.state !== 'playing') return;
    const p = this.player;
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

    if (this.hearts <= 0) this.die();
  },

  drown() {
    if (this.state !== 'playing') return;
    const p = this.player;
    if (p.invuln > 0.05) return;
    this.hearts--;
    AudioSys.sfx('hurt');
    if (this.hearts <= 0) { this.die(); return; }

    const cp = this.checkpointPos || this.spawnPos;
    p.x = cp.x;
    p.y = cp.y;
    p.vx = 0;
    p.vy = 0;
    p.invuln = 1.6;
    p.hurtTimer = 0;
    p.attackT = -1;
    p.riding = null;
    this.freeze = 0.1;
    this.shake = 3;
    this.msg = { text: 'THE WATER DRAGS YOU BACK TO THE LANTERN', t: 2.5 };
    this.camera.x = U.clamp(p.cx - 200, 0, Math.max(0, this.level.w * 16 - 400));
    this.camera.y = U.clamp(p.y - 130, 0, 64);
    this.burst(p.cx, p.y, PAL.waterLight, 12, 110, 0.5, 'chip');
  },

  die() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.deadT = 0;
    this.player.dead = true;
    this.player.vx = 0;
    AudioSys.sfx('down');
    this.shake = 6;
    this.burst(this.player.cx, this.player.cy, PAL.rose, 16, 140, 0.7, 'spark');
    this.burst(this.player.cx, this.player.cy, PAL.white, 8, 100, 0.6, 'spark');
  },

  reachGoal() {
    if (this.state !== 'playing') return;
    AudioSys.sfx('door');

    if (this.stageIndex < STAGES.length - 1) {
      /* bank the flowers */
      const i = this.stageIndex;
      Save.data.best[i] = Math.max(Save.data.best[i] || 0, this.stageFlowers);
      Save.data.unlocked = Math.max(Save.data.unlocked, i + 2);
      Save.write();
      this.startTransition(() => this.enterStage(i + 1));
    } else {
      Save.data.best[2] = Math.max(Save.data.best[2] || 0, this.stageFlowers);
      Save.data.unlocked = 3;
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
    if (this.player && this.state !== 'intro') this.player.draw(ctx, this);

    this.drawParticles(ctx);

    ctx.restore();
  }
};
