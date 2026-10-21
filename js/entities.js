/* MARIGOLD — characters, enemies, platforms, pickups.
   Movement helpers are shared: axis-separated AABB against the tile grid. */

const PHYS = {
  GRAV: 1150,
  MAX_FALL: 520,
  RUN: 110,
  ACCEL_G: 820,
  ACCEL_A: 540,
  FRICTION: 1100,
  JUMP: 380,
  COYOTE: 0.1,
  BUFFER: 0.12,
  ATTACK_DUR: 0.3,
  ATTACK_ACTIVE: [0.05, 0.17]
};

/* ---------- tile collision ---------- */

function moveX(e, level, dt) {
  e.x += e.vx * dt;
  const dir = e.vx > 0 ? 1 : e.vx < 0 ? -1 : 0;
  if (!dir) return false;
  const y0 = Math.floor(e.y / 16);
  const y1 = Math.floor((e.y + e.h - 1) / 16);
  if (dir > 0) {
    const tx = Math.floor((e.x + e.w - 1) / 16);
    for (let ty = y0; ty <= y1; ty++) {
      if (level.solidAt(tx, ty)) { e.x = tx * 16 - e.w; e.vx = 0; return true; }
    }
  } else {
    const tx = Math.floor(e.x / 16);
    for (let ty = y0; ty <= y1; ty++) {
      if (level.solidAt(tx, ty)) { e.x = (tx + 1) * 16; e.vx = 0; return true; }
    }
  }
  return false;
}

function moveY(e, level, dt) {
  e.prevBottom = e.y + e.h;
  e.y += e.vy * dt;
  const dir = e.vy > 0 ? 1 : e.vy < 0 ? -1 : 0;
  if (!dir) return false;
  const x0 = Math.floor(e.x / 16);
  const x1 = Math.floor((e.x + e.w - 1) / 16);
  if (dir > 0) {
    const ty = Math.floor((e.y + e.h) / 16);
    for (let tx = x0; tx <= x1; tx++) {
      const solid = level.solidAt(tx, ty);
      const oneWay = level.oneWayAt(tx, ty) && e.prevBottom <= ty * 16 + 1;
      if (solid || oneWay) { e.y = ty * 16 - e.h; e.vy = 0; return true; }
    }
  } else {
    const ty = Math.floor(e.y / 16);
    for (let tx = x0; tx <= x1; tx++) {
      if (level.solidAt(tx, ty)) { e.y = (ty + 1) * 16; e.vy = 0; return true; }
    }
  }
  return false;
}

function groundProbe(e, level) {
  const x0 = Math.floor((e.x + 1) / 16);
  const x1 = Math.floor((e.x + e.w - 2) / 16);
  const ty = Math.floor((e.y + e.h + 1) / 16);
  for (let tx = x0; tx <= x1; tx++) {
    if (level.solidAt(tx, ty)) return true;
    if (level.oneWayAt(tx, ty) && (e.y + e.h) <= ty * 16 + 1) return true;
  }
  return false;
}

/* ---------- player ---------- */

class Player {
  constructor(x, y) {
    this.w = 10;
    this.h = 18;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.riding = null;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumpCut = false;
    this.attackT = -1;
    this.blocking = false;
    this.hitSet = new Set();
    this.invuln = 0;
    this.hurtTimer = 0;
    this.landTimer = 0;
    this.animT = 0;
    this.prevBottom = y + 18;
    this.dead = false;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  resetAt(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.riding = null;
    this.attackT = -1;
    this.invuln = 1.3;
    this.hurtTimer = 0;
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.dead = false;
  }

  update(dt, game) {
    const level = game.level;
    this.animT += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.coyote > 0) this.coyote -= dt;
    if (this.landTimer > 0) this.landTimer -= dt;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;

    const dir = (Input.held.right ? 1 : 0) - (Input.held.left ? 1 : 0);

    /* shield: a braced stance, only from the ground */
    this.blocking = !!Input.held.shield && this.hurtTimer <= 0 && this.onGround;

    /* attack */
    if (this.attackT >= 0) {
      this.attackT += dt;
      if (this.attackT > 0.3) this.attackT = -1;
    }
    if (Input.pressed.attack && this.attackT < 0 && !this.blocking) {
      this.attackT = 0;
      this.hitSet = new Set();
      AudioSys.sfx('attack');
    }

    /* jump */
    if (Input.pressed.jump) this.jumpBuffer = PHYS.BUFFER;
    if (this.jumpBuffer > 0 && this.coyote > 0 && this.hurtTimer <= 0) {
      this.vy = -PHYS.JUMP;
      this.onGround = false;
      this.riding = null;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.jumpCut = true;
      AudioSys.sfx('jump');
      game.burst(this.cx, this.y + this.h, PAL.cream2, 5, 60, 0.28, 'dust');
    }
    if (this.jumpCut && !Input.held.jump && this.vy < 0) {
      this.vy *= 0.45;
      this.jumpCut = false;
    }

    /* horizontal */
    if (this.hurtTimer > 0) {
      this.vx = U.approach(this.vx, 0, 260 * dt);
    } else if (dir !== 0) {
      const a = this.onGround ? PHYS.ACCEL_G : PHYS.ACCEL_A;
      const max = this.blocking ? PHYS.RUN * 0.45 : PHYS.RUN;
      this.vx = U.approach(this.vx, dir * max, a * dt);
      this.facing = dir;
    } else {
      const f = this.onGround ? PHYS.FRICTION : 260;
      this.vx = U.approach(this.vx, 0, f * dt);
    }

    /* gravity (a soft float while swinging in the air) */
    let g = PHYS.GRAV;
    if (this.attackT >= 0 && !this.onGround && this.vy > -60) g *= 0.6;
    this.vy = Math.min(this.vy + g * dt, PHYS.MAX_FALL);

    /* move */
    const wasGround = this.onGround;
    const fallSpeed = this.vy;
    moveX(this, level, dt);
    const landed = moveY(this, level, dt);
    if (landed) this.onGround = true;
    else this.onGround = groundProbe(this, level);

    /* platforms (one-way from above) */
    this.riding = null;
    if (this.vy >= 0 && landed === false) this.resolvePlatforms(game);
    else if (landed) { /* tile ground */ }

    if (this.onGround) this.coyote = PHYS.COYOTE;
    else if (wasGround) this.coyote = PHYS.COYOTE;

    /* a brace needs both feet */
    if (this.blocking && !this.onGround) this.blocking = false;

    if (landed && !wasGround && fallSpeed > 210) {
      AudioSys.sfx('land');
      game.burst(this.cx, this.y + this.h, PAL.dirtLight, 6, 70, 0.3, 'dust');
      this.landTimer = 0.12;
    }

    /* hazards */
    this.checkHazards(game);

    /* fell out of the world */
    if (this.y > level.h * 16 + 8) game.drown();

    /* sword */
    if (this.attackT >= PHYS.ATTACK_ACTIVE[0] && this.attackT <= PHYS.ATTACK_ACTIVE[1]) {
      this.resolveAttack(game);
    }
  }

  resolvePlatforms(game) {
    const prevBottom = this.prevBottom;
    for (const p of game.platforms) {
      if (p.gone) continue;
      if (this.x + this.w <= p.x + 1 || this.x >= p.x + p.w - 1) continue;
      if (prevBottom <= p.y + 3 && this.y + this.h >= p.y && this.y + this.h <= p.y + p.h + 4) {
        this.y = p.y - this.h;
        this.vy = 0;
        this.onGround = true;
        this.riding = p;
        if (p.trigger) p.trigger(game);
        break;
      }
    }
  }

  attackBox() {
    const x = this.facing > 0 ? this.x + this.w - 2 : this.x - 14;
    return { x, y: this.y + 1, w: 16, h: 16 };
  }

  resolveAttack(game) {
    const box = this.attackBox();
    const level = game.level;

    /* crates */
    const tx0 = Math.floor(box.x / 16);
    const tx1 = Math.floor((box.x + box.w - 1) / 16);
    const ty0 = Math.floor(box.y / 16);
    const ty1 = Math.floor((box.y + box.h - 1) / 16);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const key = 't' + tx + ',' + ty;
        if (this.hitSet.has(key)) continue;
        if (level.breakCrate(tx, ty)) {
          this.hitSet.add(key);
          AudioSys.sfx('crate');
          game.freeze = 0.05;
          game.shake = Math.max(game.shake, 2);
          const px = tx * 16 + 8;
          const py = ty * 16 + 8;
          game.burst(px, py, PAL.wood, 10, 110, 0.4, 'chip');
          game.burst(px, py, PAL.woodDark, 6, 80, 0.35, 'chip');
        }
      }
    }

    /* enemies */
    for (const e of game.enemies) {
      if (e.dead || e.gone || this.hitSet.has(e)) continue;
      if (!U.overlap(box, e)) continue;
      const blocked = e.onSword ? e.onSword(this, game) : false;
      this.hitSet.add(e);
      if (blocked) continue;
      game.freeze = 0.05;
      game.shake = Math.max(game.shake, 2);
      game.spark(e.x + e.w / 2, e.y + e.h / 2);
    }
  }

  checkHazards(game) {
    const level = game.level;
    const box = { x: this.x + 2, y: this.y + 2, w: this.w - 4, h: this.h - 3 };
    const x0 = Math.floor(box.x / 16);
    const x1 = Math.floor((box.x + box.w - 1) / 16);
    const y0 = Math.floor(box.y / 16);
    const y1 = Math.floor((box.y + box.h - 1) / 16);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const ch = level.charAt(tx, ty);
        if (ch === '^') {
          const r = { x: tx * 16 + 2, y: ty * 16 + 8, w: 12, h: 8 };
          if (U.overlap(box, r)) game.hurtPlayer(1, tx * 16 + 8, this.y);
        } else if (ch === 'v') {
          const r = { x: tx * 16 + 4, y: ty * 16, w: 8, h: 16 };
          if (U.overlap(box, r)) game.hurtPlayer(1, tx * 16 + 8, this.y);
        } else if (ch === 'B') {
          const r = { x: tx * 16 + 1, y: ty * 16 + 5, w: 14, h: 11 };
          if (U.overlap(box, r)) game.hurtPlayer(1, tx * 16 + 8, this.y);
        } else if (ch === '~') {
          const r = { x: tx * 16, y: ty * 16 + 2, w: 16, h: 14 };
          if (U.overlap(box, r)) { game.drown(); return; }
        }
      }
    }
  }

  draw(ctx, game) {
    const t = game.time;
    const drawX = Math.round(this.x - 4);
    const drawY = Math.round(this.y - 2);

    /* shadow */
    if (this.onGround) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(drawX + 5, drawY + 20, 8, 2);
      ctx.globalAlpha = 1;
    }

    /* blink while invulnerable */
    if (this.invuln > 0 && Math.floor(t * 20) % 2 === 0) return;

    let frame;
    if (this.hurtTimer > 0) frame = Sprites.hero.hurt;
    else if (this.attackT >= 0 && !this.onGround) frame = this.vy < 0 ? Sprites.hero.jump : Sprites.hero.fall;
    else if (!this.onGround) frame = this.vy < 0 ? Sprites.hero.jump : Sprites.hero.fall;
    else if (Math.abs(this.vx) > 12) frame = Sprites.hero.run[Math.floor(this.animT * 10) % 2];
    else frame = Sprites.hero.idle;

    const img = Sprites.facing(frame, this.facing);
    const bob = (this.onGround && Math.abs(this.vx) > 12 && Math.floor(this.animT * 10) % 2 === 1) ? -1 : 0;
    ctx.drawImage(img, drawX, drawY + bob);

    /* the blade, carried at the side when it is not swinging */
    if (this.attackT < 0) this.drawRestingSword(ctx);

    /* shield raised */
    if (this.blocking) this.drawShield(ctx);

    /* sword + arc */
    if (this.attackT >= 0) this.drawSword(ctx, t);
  }

  /* the sword hangs point-down at the hero's leading side */
  drawRestingSword(ctx) {
    const f = this.facing;
    const x = Math.round(f > 0 ? this.x + this.w + 1 : this.x - 5);
    const y = Math.round(this.y + 3);

    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x, y + 2, 4, 12);
    ctx.fillStyle = PAL.metal;
    ctx.fillRect(x + 1, y + 3, 2, 10);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(x + 1, y + 3, 1, 7);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(x - 1, y, 6, 3);
    ctx.fillStyle = PAL.rust;
    ctx.fillRect(x + 1, y - 3, 2, 3);
  }

  /* the shield comes up in front when Finn braces */
  drawShield(ctx) {
    const f = this.facing;
    const img = Sprites.shield;
    const sx = Math.round(f > 0 ? this.x + this.w - 2 : this.x - 5);
    const sy = Math.round(this.y);
    if (f < 0) {
      ctx.save();
      ctx.translate(sx + img.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, sy);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, sy);
    }
  }

  drawSword(ctx, t) {
    const p = this.attackT / PHYS.ATTACK_DUR;
    if (p > 0.92) return;
    const f = this.facing;
    const cx = this.x + this.w / 2;
    const cy = this.y + 8;

    /* arc of pixels */
    if (this.attackT >= PHYS.ATTACK_ACTIVE[0] && this.attackT <= PHYS.ATTACK_ACTIVE[1] + 0.03) {
      const a0 = -1.15, a1 = 1.0;
      for (let i = 0; i <= 9; i++) {
        const a = U.lerp(a0, a1, i / 9);
        const px = Math.round(cx + f * (Math.cos(a) * 12 + 4) - 1);
        const py = Math.round(cy + Math.sin(a) * 11 - 1);
        ctx.globalAlpha = 0.55 + (i / 9) * 0.45;
        ctx.fillStyle = i > 6 ? PAL.goldLight : PAL.white;
        ctx.fillRect(px, py, 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    /* blade */
    const swing = this.attackT < 0.05 ? -3 : Math.round(U.lerp(-6, 4, Math.min(1, p * 2.2)));
    const bx = Math.round(cx + (f > 0 ? swing : -swing - 11));
    const by = Math.round(cy - 1);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(bx + 1, by - 2, 10, 6);
    ctx.fillStyle = PAL.metal;
    ctx.fillRect(bx + 1, by - 1, 8, 3);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(bx + 1, by - 1, 6, 1);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(f > 0 ? bx - 1 : bx + 8, by - 2, 3, 5);
    ctx.fillStyle = PAL.rust;
    ctx.fillRect(f > 0 ? bx - 4 : bx + 9, by, 3, 3);
  }
}

/* ---------- enemies ---------- */

class Enemy {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.dead = false;
    this.t = Math.random() * 3;
    this.flash = 0;
    this.hp = 1;
    this.damage = 1;
    this.stompable = true;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  shadow(ctx, inset) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(Math.round(this.x + (inset || 2)), Math.round(this.y + this.h - 1), this.w - (inset || 2) * 2, 2);
    ctx.globalAlpha = 1;
  }

  hurt(n, game) {
    this.hp -= n;
    this.flash = 0.16;
    if (this.hp <= 0) {
      this.dead = true;
      AudioSys.sfx('hit');
      game.burst(this.cx, this.cy, PAL.leaf, 9, 120, 0.45, 'chip');
      game.burst(this.cx, this.cy, PAL.gold, 5, 90, 0.4, 'spark');
      game.shake = Math.max(game.shake, 2);
    }
  }
}

/* bramble imp — patrols, stomps in one hit */
class Imp extends Enemy {
  constructor(x, y) {
    super(x, y, 14, 12);
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.speed = 34;
    this.hp = 1;
  }

  update(dt, game) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    this.vy = Math.min(this.vy + PHYS.GRAV * dt, PHYS.MAX_FALL);
    this.vx = this.dir * this.speed;
    if (moveX(this, game.level, dt)) this.dir *= -1;
    moveY(this, game.level, dt);

    /* turn at ledges */
    const fx = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
    const tx = Math.floor(fx / 16);
    const ty = Math.floor((this.y + this.h + 2) / 16);
    if (!game.level.solidAt(tx, ty) && !game.level.oneWayAt(tx, ty)) this.dir *= -1;
  }

  onSword(player, game) {
    this.hurt(1, game);
    AudioSys.sfx('hit');
    return false;
  }

  stomp(player, game) {
    this.hurt(1, game);
  }

  draw(ctx, game) {
    this.shadow(ctx, 1);
    if (this.flash > 0 && Math.floor(game.time * 30) % 2 === 0) return;
    const pair = Sprites.imp[Math.floor(this.t * 6) % 2];
    const img = this.dir < 0 ? pair.l : pair.r;
    const bob = Math.floor(this.t * 6) % 2 === 1 ? -1 : 0;
    ctx.drawImage(img, Math.round(this.x), Math.round(this.y + bob));
  }
}

/* thornbeetle — armoured; stomp staggers, sword finishes */
class Beetle extends Enemy {
  constructor(x, y) {
    super(x, y, 16, 12);
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.hp = 2;
    this.mode = 'patrol';
    this.modeT = 0;
    this.stun = 0;
  }

  update(dt, game) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.stun > 0) this.stun -= dt;

    const p = game.player;
    const dx = p.cx - this.cx;

    let speed = 30;
    if (this.stun > 0) {
      speed = 0;
    } else {
      this.modeT += dt;
      if (this.mode === 'patrol') {
        if (Math.abs(dx) < 110 && Math.abs(p.y - this.y) < 44) {
          this.mode = 'tele';
          this.modeT = 0;
          this.dir = U.sign(dx) || this.dir;
        }
      } else if (this.mode === 'tele') {
        speed = 0;
        if (this.modeT > 0.4) { this.mode = 'charge'; this.modeT = 0; AudioSys.sfx('attack'); }
        this.dir = U.sign(dx) || this.dir;
      } else if (this.mode === 'charge') {
        speed = 78;
        if (this.modeT > 0.6) { this.mode = 'rest'; this.modeT = 0; }
      } else {
        speed = 0;
        if (this.modeT > 0.55) { this.mode = 'patrol'; this.modeT = 0; }
      }
    }

    this.vy = Math.min(this.vy + PHYS.GRAV * dt, PHYS.MAX_FALL);
    this.vx = this.dir * speed;
    if (moveX(this, game.level, dt)) { this.dir *= -1; this.mode = 'patrol'; this.modeT = 0; }
    moveY(this, game.level, dt);

    const fx = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
    const tx = Math.floor(fx / 16);
    const ty = Math.floor((this.y + this.h + 2) / 16);
    if (speed > 0 && !game.level.solidAt(tx, ty) && !game.level.oneWayAt(tx, ty)) {
      this.dir *= -1;
      this.mode = 'patrol';
      this.modeT = 0;
    }
  }

  onSword(player, game) {
    this.hurt(1, game);
    const push = U.sign(this.cx - player.cx) || 1;
    this.x += push * 4;
    this.stun = Math.max(this.stun, 0.4);
    return false;
  }

  stomp(player, game) {
    if (this.hp >= 2) {
      this.stun = 1.1;
      this.hp -= 0;
      AudioSys.sfx('clank');
      game.shake = Math.max(game.shake, 2);
      game.spark(this.cx, this.y);
      this.flash = 0.2;
    } else {
      this.hurt(1, game);
    }
  }

  draw(ctx, game) {
    this.shadow(ctx, 1);
    const shaking = this.mode === 'tele' && Math.floor(game.time * 40) % 2 === 0;
    if (this.flash > 0 && Math.floor(game.time * 30) % 2 === 0) return;
    const pair = Sprites.beetle[Math.floor(this.t * 7 + (shaking ? 1 : 0)) % 2];
    const img = this.dir < 0 ? pair.l : pair.r;
    const dy = shaking ? (Math.floor(game.time * 60) % 2 ? -1 : 1) : 0;
    ctx.drawImage(img, Math.round(this.x), Math.round(this.y + dy));
    if (this.stun > 0) {
      ctx.fillStyle = PAL.gold;
      const sy = Math.round(this.y - 4 + (Math.floor(game.time * 8) % 2));
      ctx.fillRect(Math.round(this.x + 3), sy, 2, 2);
      ctx.fillRect(Math.round(this.x + 11), sy, 2, 2);
    }
  }
}

/* bat — hovers, dives when you walk under it */
class Bat extends Enemy {
  constructor(x, y) {
    super(x, y, 14, 10);
    this.homeX = x;
    this.homeY = y;
    this.hp = 1;
    this.alert = false;
  }

  update(dt, game) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    const p = game.player;
    const dx = p.cx - this.cx;
    const dy = p.cy - this.cy;

    if (!this.alert) {
      if (Math.abs(dx) < 120 && p.y > this.y - 8) this.alert = true;
      this.x = this.homeX + Math.sin(this.t * 1.3) * 24;
      this.y = this.homeY + Math.sin(this.t * 2.1) * 7;
      return;
    }

    if (Math.abs(dx) > 210 || Math.abs(dy) > 170) this.alert = false;

    const sp = 58;
    this.vx = U.approach(this.vx, U.clamp(dx, -sp, sp), 220 * dt);
    this.vy = U.approach(this.vy, U.clamp(dy, -52, 74), 200 * dt);
    this.x = this.homeX + Math.sin(this.t * 1.3) * 6;
    this.y += this.vy * dt;
    this.x = U.clamp(this.x, this.homeX - 70, this.homeX + 70);
    this.y = U.clamp(this.y, this.homeY - 44, this.homeY + 70);
    this.x += this.vx * dt * 0.4;
  }

  onSword(player, game) {
    this.hurt(1, game);
    return false;
  }

  stomp(player, game) {
    this.hurt(1, game);
  }

  draw(ctx, game) {
    if (this.flash > 0 && Math.floor(game.time * 30) % 2 === 0) return;
    const pair = Sprites.bat[Math.floor(this.t * 8) % 2];
    ctx.drawImage(pair.r, Math.round(this.x), Math.round(this.y));
  }
}

/* sawblade — rides a rail; the sword only rings off it */
class Sawblade extends Enemy {
  constructor(x, y, dist, speed) {
    super(x, y, 18, 18);
    this.homeX = x;
    this.dist = dist * 16;
    this.railX0 = x + 9;
    this.railX1 = x + 9 + this.dist;
    this.speed = speed || 46;
    this.dir = 1;
    this.stompable = false;
    this.damage = 1;
  }

  update(dt, game) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    this.x += this.dir * this.speed * dt;
    if (this.x >= this.homeX + this.dist) { this.x = this.homeX + this.dist; this.dir = -1; }
    if (this.x <= this.homeX) { this.x = this.homeX; this.dir = 1; }
  }

  onSword(player, game) {
    AudioSys.sfx('clank');
    game.freeze = 0.04;
    game.shake = Math.max(game.shake, 2);
    game.spark(this.cx, this.cy);
    return true;
  }

  stomp(player, game) { /* the blade does not care what lands on it */ }

  draw(ctx, game) {
    const cx = Math.round(this.cx);
    const cy = Math.round(this.cy);

    /* the rail it rides */
    ctx.fillStyle = PAL.inkSoft;
    ctx.fillRect(Math.round(this.railX0), cy - 1, Math.round(this.railX1 - this.railX0), 2);
    ctx.fillStyle = PAL.stoneDark;
    ctx.fillRect(Math.round(this.railX0), cy, 2, 3);
    ctx.fillRect(Math.round(this.railX1) - 2, cy, 2, 3);

    /* the blade */
    const spin = this.t * 16;
    ctx.fillStyle = PAL.metalDark;
    for (let i = 0; i < 6; i++) {
      const a = spin + i * 1.047;
      const px = cx + Math.round(Math.cos(a) * 7);
      const py = cy + Math.round(Math.sin(a) * 7);
      ctx.fillRect(px - 1, py - 1, 3, 3);
    }
    ctx.fillStyle = PAL.metal;
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(cx - 2, cy - 2, 2, 2);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  }
}

/* marsh wasp — hovers, then stings */
class Wasp extends Enemy {
  constructor(x, y, range) {
    super(x, y, 12, 10);
    this.homeX = x;
    this.homeY = y;
    this.range = (range || 3) * 16;
    this.hp = 1;
    this.dive = 0;
    this.stompable = false;
    this.damage = 1;
  }

  update(dt, game) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    const p = game.player;
    const dx = p.cx - this.cx;
    const dy = p.cy - this.cy;

    if (this.dive > 0) {
      this.dive -= dt;
      this.vx = U.approach(this.vx, U.clamp(dx, -100, 100), 320 * dt);
      this.vy = U.approach(this.vy, U.clamp(dy, -92, 92), 320 * dt);
    } else {
      this.vx = U.approach(this.vx, 0, 240 * dt);
      this.vy = U.approach(this.vy, 0, 240 * dt);
      if (Math.abs(dx) < 100 && Math.abs(dy) < 72) {
        this.dive = 0.85;
        AudioSys.sfx('attack');
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    /* leash around the nest */
    const lx = this.homeX + this.range;
    const rx = this.homeX - this.range;
    if (this.x < rx) { this.x = rx; this.vx = Math.abs(this.vx); }
    if (this.x > lx) { this.x = lx; this.vx = -Math.abs(this.vx); }
    if (this.y < this.homeY - 46) { this.y = this.homeY - 46; this.vy = Math.abs(this.vy); }
    if (this.y > this.homeY + 38) { this.y = this.homeY + 38; this.vy = -Math.abs(this.vy); }
  }

  onSword(player, game) {
    this.hurt(1, game);
    return false;
  }

  stomp(player, game) { /* too quick to land on */ }

  draw(ctx, game) {
    if (this.flash > 0 && Math.floor(game.time * 30) % 2 === 0) return;
    const x = Math.round(this.x);
    const y = Math.round(this.y + Math.sin(this.t * 9) * 1);
    const dir = this.vx >= 0 ? 1 : -1;

    /* wings */
    const flap = Math.floor(this.t * 18) % 2;
    ctx.fillStyle = 'rgba(233,240,247,0.75)';
    ctx.fillRect(x + (dir > 0 ? 1 : 9), y - 2 + flap, 4, 2);
    ctx.fillRect(x + (dir > 0 ? 1 : 9), y + 2 - flap, 4, 2);

    /* body */
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x + 1, y + 1, 10, 8);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(x + 2, y + 2, 8, 6);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x + 5, y + 3, 2, 4);
    /* head and sting */
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x + (dir > 0 ? 9 : 1), y + 2, 3, 6);
    ctx.fillStyle = PAL.cream2;
    ctx.fillRect(x + (dir > 0 ? 3 : 7), y + 4, 2, 2);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x + (dir > 0 ? 0 : 10), y + 5, 2, 2);
  }
}

/* boulder — rolls, and turns at a wall or a drop */
class Boulder extends Enemy {
  constructor(x, y, dist, speed) {
    super(x, y, 16, 16);
    this.dir = 1;
    this.speed = speed || 42;
    this.hp = 3;
    this.stompable = false;
    this.damage = 1;
  }

  update(dt, game) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    this.vy = Math.min(this.vy + PHYS.GRAV * dt, PHYS.MAX_FALL);
    this.vx = this.dir * this.speed;
    if (moveX(this, game.level, dt)) this.dir *= -1;
    moveY(this, game.level, dt);

    /* no floor ahead: turn back */
    const fx = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
    const tx = Math.floor(fx / 16);
    const ty = Math.floor((this.y + this.h + 2) / 16);
    if (!game.level.solidAt(tx, ty) && !game.level.oneWayAt(tx, ty)) this.dir *= -1;
  }

  onSword(player, game) {
    this.hurt(1, game);
    return false;
  }

  stomp(player, game) {
    this.hurt(1, game);
  }

  draw(ctx, game) {
    this.shadow(ctx, 1);
    if (this.flash > 0 && Math.floor(game.time * 30) % 2 === 0) return;
    const cx = Math.round(this.cx);
    const cy = Math.round(this.cy);
    const roll = Math.floor(this.t * 9) % 4;

    ctx.fillStyle = PAL.ink;
    ctx.fillRect(cx - 7, cy - 6, 14, 13);
    ctx.fillRect(cx - 6, cy - 7, 12, 14);
    ctx.fillStyle = PAL.stoneDark;
    ctx.fillRect(cx - 6, cy - 6, 12, 11);
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(cx - 4, cy - 5, 5, 4);
    ctx.fillRect(cx + 1, cy + 1, 4, 3);
    ctx.fillStyle = PAL.stoneLight;
    if (roll === 0) ctx.fillRect(cx - 2, cy - 4, 2, 2);
    else if (roll === 1) ctx.fillRect(cx + 2, cy - 2, 2, 2);
    else if (roll === 2) ctx.fillRect(cx - 1, cy + 2, 2, 2);
    else ctx.fillRect(cx + 3, cy - 5, 2, 2);
    /* moss on the underside */
    ctx.fillStyle = PAL.moss;
    ctx.fillRect(cx - 4, cy + 4, 3, 2);
    ctx.fillRect(cx + 2, cy + 4, 2, 2);
  }
}

/* briar guard — shield blocks the front */
class Guard extends Enemy {
  constructor(x, y) {
    super(x, y, 14, 20);
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.speed = 26;
    this.hp = 2;
  }

  update(dt, game) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    this.vy = Math.min(this.vy + PHYS.GRAV * dt, PHYS.MAX_FALL);
    this.vx = this.dir * this.speed;
    if (moveX(this, game.level, dt)) this.dir *= -1;
    moveY(this, game.level, dt);

    const fx = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
    const tx = Math.floor(fx / 16);
    const ty = Math.floor((this.y + this.h + 2) / 16);
    if (!game.level.solidAt(tx, ty) && !game.level.oneWayAt(tx, ty)) this.dir *= -1;
  }

  onSword(player, game) {
    const fromFront = U.sign(player.cx - this.cx) === this.dir;
    if (fromFront) {
      AudioSys.sfx('clank');
      game.freeze = 0.03;
      game.spark(this.cx + this.dir * 7, this.y + 6);
      return true;
    }
    this.hurt(1, game);
    AudioSys.sfx('hit');
    return false;
  }

  stomp(player, game) {
    this.hurt(1, game);
  }

  draw(ctx, game) {
    this.shadow(ctx, 2);
    if (this.flash > 0 && Math.floor(game.time * 30) % 2 === 0) return;
    const pair = Sprites.guard[Math.floor(this.t * 5) % 2];
    const img = this.dir < 0 ? pair.l : pair.r;
    const dy = Math.floor(this.t * 5) % 2 ? -1 : 0;
    ctx.drawImage(img, Math.round(this.x), Math.round(this.y + dy));
    /* shield rides on the facing side */
    const sx = this.dir > 0 ? Math.round(this.x + this.w - 2) : Math.round(this.x - 5);
    const shield = this.dir > 0 ? Sprites.shield : Sprites.shield;
    ctx.save();
    if (this.dir < 0) {
      ctx.translate(sx + shield.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(shield, 0, Math.round(this.y + 5));
      ctx.restore();
    } else {
      ctx.drawImage(shield, sx, Math.round(this.y + 5));
      ctx.restore();
    }
  }
}

/* thorn pod — drops when you walk beneath it */
class Pod extends Enemy {
  constructor(x, y) {
    super(x - 6, y, 12, 12);
    this.anchorX = x;
    this.anchorY = y;
    this.state = 'hang';
    this.timer = 0;
    this.hp = 1;
    this.stompable = false;
    this.damage = 1;
  }

  get alive() { return this.state !== 'burst'; }

  update(dt, game) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    const p = game.player;

    if (this.state === 'hang') {
      this.x = this.anchorX - 6;
      this.y = this.anchorY;
      if (Math.abs(p.cx - this.anchorX) < 34 && p.y > this.y + 4) {
        this.state = 'drop';
        this.vy = 40;
        AudioSys.sfx('pod');
      }
      return;
    }

    if (this.state === 'drop') {
      this.vy = Math.min(this.vy + 900 * dt, 320);
      this.y += this.vy * dt;
      const ty = Math.floor((this.y + this.h) / 16);
      const tx = Math.floor((this.x + this.w / 2) / 16);
      if (game.level.solidAt(tx, ty) || game.level.oneWayAt(tx, ty)) {
        this.explode(game, true);
      }
      return;
    }

    if (this.state === 'burst') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = 'hang';
        this.x = this.anchorX - 6;
        this.y = this.anchorY;
        this.vy = 0;
      }
    }
  }

  explode(game, hurts) {
    this.state = 'burst';
    this.timer = 1.4;
    AudioSys.sfx('pod');
    game.burst(this.cx, this.cy, PAL.rust, 12, 130, 0.5, 'chip');
    game.burst(this.cx, this.cy, PAL.leafDark, 8, 100, 0.45, 'chip');
    game.shake = Math.max(game.shake, 3);
    if (hurts) {
      const p = game.player;
      if (Math.abs(p.cx - this.cx) < 26 && Math.abs(p.cy - this.cy) < 26) {
        game.hurtPlayer(1, this.cx, this.cy);
      }
    }
  }

  onSword(player, game) {
    this.explode(game, false);
    return false;
  }

  stomp(player, game) {
    this.explode(game, false);
  }

  draw(ctx, game) {
    if (this.state === 'burst') {
      const a = U.clamp(this.timer, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = PAL.rust;
      ctx.fillRect(Math.round(this.cx - 3), Math.round(this.cy - 3), 6, 6);
      ctx.globalAlpha = 1;
      return;
    }
    if (this.state === 'hang') {
      /* vine to the ceiling */
      ctx.fillStyle = PAL.moss;
      ctx.fillRect(Math.round(this.anchorX - 1), Math.round(this.anchorY - 16), 2, 17);
      ctx.fillStyle = PAL.leafDark;
      ctx.fillRect(Math.round(this.anchorX), Math.round(this.anchorY - 16), 1, 17);
    }
    const sway = this.state === 'hang' ? Math.round(Math.sin(this.t * 3) * 1) : 0;
    ctx.drawImage(Sprites.pod, Math.round(this.x + sway), Math.round(this.y));
  }
}

/* ---------- platforms ---------- */

class Mover {
  constructor(x, y, w, axis, distTiles, speed) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.w = w;
    this.h = 8;
    this.x0 = x;
    this.y0 = y;
    this.axis = axis;
    this.len = distTiles * 16;
    this.speed = speed;
    this.d = 0;
    this.dir = 1;
    this.pause = 0;
    this.gone = false;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    if (this.pause > 0) { this.pause -= dt; return; }
    this.d += this.dir * this.speed * dt;
    if (this.d >= this.len) { this.d = this.len; this.dir = -1; this.pause = 0.35; }
    else if (this.d <= 0) { this.d = 0; this.dir = 1; this.pause = 0.35; }
    this.x = this.x0 + (this.axis === 'x' ? this.d : 0);
    this.y = this.y0 + (this.axis === 'y' ? this.d : 0);
  }

  draw(ctx, game) {
    /* rope bridge plank on a chain */
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(Math.round(this.x - 1), Math.round(this.y - 1), this.w + 2, 10);
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, 8);
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, 4);
    ctx.fillStyle = PAL.dirtLight;
    for (let i = 2; i < this.w - 1; i += 5) ctx.fillRect(Math.round(this.x + i), Math.round(this.y + 1), 2, 1);
    ctx.fillStyle = PAL.stoneDark;
    if (this.axis === 'y') {
      ctx.fillRect(Math.round(this.x + this.w / 2 - 1), Math.round(this.y - 40), 2, 40);
    }
    ctx.fillStyle = PAL.metalDark;
    ctx.fillRect(Math.round(this.x + 1), Math.round(this.y + 5), 1, 2);
    ctx.fillRect(Math.round(this.x + this.w - 2), Math.round(this.y + 5), 1, 2);
  }
}

class Crumble {
  constructor(x, y, w) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.w = w;
    this.h = 8;
    this.state = 'idle';
    this.timer = 0;
    this.gone = false;
    this.wobble = 0;
  }

  trigger(game) {
    if (this.state === 'idle') {
      this.state = 'shake';
      this.timer = 0.5;
      AudioSys.sfx('blip');
    }
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    if (this.state === 'shake') {
      this.timer -= dt;
      this.wobble = Math.sin(this.timer * 55) * 1.5;
      if (this.timer <= 0) {
        this.state = 'gone';
        this.timer = 3;
        this.gone = true;
        this.wobble = 0;
        if (this.onBreak) this.onBreak();
      }
    } else if (this.state === 'gone') {
      this.timer -= dt;
      if (this.timer <= 0) { this.state = 'idle'; this.gone = false; }
    }
  }

  draw(ctx, game) {
    if (this.state === 'gone') return;
    const ox = this.state === 'shake' ? this.wobble : 0;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(Math.round(this.x - 1 + ox), Math.round(this.y - 1), this.w + 2, 10);
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(Math.round(this.x + ox), Math.round(this.y), this.w, 8);
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(Math.round(this.x + ox), Math.round(this.y), this.w, 3);
    /* cracks */
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(Math.round(this.x + this.w * 0.4 + ox), Math.round(this.y + 3), 1, 3);
    ctx.fillRect(Math.round(this.x + this.w * 0.7 + ox), Math.round(this.y + 2), 1, 4);
    ctx.fillStyle = PAL.moss;
    ctx.fillRect(Math.round(this.x + 2 + ox), Math.round(this.y + 5), 2, 1);
  }
}

/* ---------- pickups, props, goal ---------- */

class Pickup {
  constructor(x, y, kind, spec) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.w = 10;
    this.h = 10;
    this.kind = kind;
    this.spec = spec || null;
    this.t = Math.random() * 6;
    this.taken = false;
  }

  get cx() { return this.x + 5; }
  get cy() { return this.y + 5; }

  update(dt, game) {
    this.t += dt;
    if (this.taken) return;
    const p = game.player;
    const dx = p.cx - this.cx;
    const dy = p.cy - this.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 26 && dist > 1) {
      const pull = (1 - dist / 26) * 130 * dt;
      this.x += (dx / dist) * pull;
      this.y += (dy / dist) * pull;
    }
    if (dist < 12) {
      this.taken = true;
      game.collect(this);
    }
  }

  draw(ctx, game) {
    if (this.taken) return;
    const bob = Math.sin(this.t * 3) > 0 ? 0 : -1;
    const img = this.kind === 'violet' ? Sprites.violet : Sprites.marigold;
    if (this.kind === 'violet') {
      ctx.globalAlpha = 0.3;
      U.pixelCircle(ctx, Math.round(this.cx), Math.round(this.cy), 8, 'rgba(139,108,196,0.30)');
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(img, Math.round(this.x), Math.round(this.y + bob));
  }
}

class Checkpoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 20;
    this.active = false;
  }

  draw(ctx, game) {
    const img = this.active ? Sprites.lanternLit : Sprites.lantern;
    ctx.drawImage(img, Math.round(this.x), Math.round(this.y));
    if (this.active) {
      const flick = Math.sin(game.time * 7) * 0.5 + 0.5;
      ctx.globalAlpha = 0.22 + flick * 0.1;
      U.pixelCircle(ctx, Math.round(this.x + 6), Math.round(this.y + 3), 12, 'rgba(240,169,74,0.35)');
      ctx.globalAlpha = 1;
    }
  }
}

class Sign {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 16;
    this.text = text;
  }

  draw(ctx, game) {
    ctx.drawImage(Sprites.sign, Math.round(this.x), Math.round(this.y));
  }
}

class Goal {
  constructor(x, y, type) {
    this.type = type;
    this.w = type === 'tower' ? 48 : 32;
    this.h = type === 'tower' ? 64 : 48;
    this.x = x;
    this.y = y - this.h;   /* y given as the base line */
    this.baseY = y;
  }

  get box() {
    if (this.type === 'tower') return { x: this.x + 8, y: this.baseY - 56, w: 32, h: 56 };
    return { x: this.x + 6, y: this.baseY - 40, w: 20, h: 40 };
  }

  draw(ctx, game) {
    Tiles.drawGoal(ctx, this.x, this.baseY, this.type, game.time);
  }
}
