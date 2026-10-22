/* MARIGOLD — synthesized audio. No sample files, everything is WebAudio.
   Music: 8th-note step scheduler with a short lookahead. */

const AudioSys = {
  ctx: null,
  master: null,
  noiseBuf: null,
  muted: false,
  ready: false,
  musicName: null,
  timer: null,
  step: 0,
  next: 0,

  NOTE: { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 },

  init() {
    if (this.ready) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch (e) { return; }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.ctx.destination);

    const len = Math.floor(this.ctx.sampleRate * 0.3);
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.ready = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.musicName) this.startScheduler(this.musicName);
  },

  setMuted(m, silent) {
    this.muted = !!m;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
    if (!silent && this.ready) this.sfx('blip');
  },

  toggle() {
    this.setMuted(!this.muted);
    return this.muted;
  },

  freq(name) {
    if (!name || name === 0 || name === '0') return 0;
    const m = String(name).match(/^([A-G]#?)(\d)$/);
    if (!m) return 0;
    const semi = this.NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (semi - 69) / 12);
  },

  /* ---- primitives ---- */

  tone(freq, time, dur, type, vol, slideTo) {
    if (!this.ready) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, time);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), time + dur);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vol, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(time);
    o.stop(time + dur + 0.03);
  },

  noise(time, dur, vol, freq) {
    if (!this.ready) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq || 1200;
    f.Q.value = 0.9;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(time);
    src.stop(time + dur + 0.02);
  },

  arp(notes, type, vol, gap) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.005;
    notes.forEach((n, i) => {
      this.tone(this.freq(n), t + i * (gap || 0.05), 0.09, type || 'square', vol || 0.12);
    });
  },

  /* ---- sfx ---- */

  sfx(name) {
    if (!this.ready) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime + 0.002;
    switch (name) {
      case 'jump':    this.tone(330, t, 0.14, 'square', 0.14, 580); break;
      case 'land':    this.noise(t, 0.05, 0.10, 260); break;
      case 'attack':  this.noise(t, 0.07, 0.10, 2000); this.tone(440, t, 0.07, 'square', 0.08, 200); break;
      case 'hit':     this.noise(t, 0.09, 0.18, 900); this.tone(170, t, 0.09, 'square', 0.12, 60); break;
      case 'clank':   this.tone(1200, t, 0.05, 'square', 0.08, 700); this.noise(t, 0.05, 0.08, 3200); break;
      case 'hurt':    this.tone(230, t, 0.25, 'sawtooth', 0.16, 70); this.noise(t, 0.12, 0.10, 500); break;
      case 'pickup':  this.arp(['C6', 'E6', 'G6'], 'square', 0.10, 0.04); break;
      case 'violet':  this.arp(['E5', 'A5', 'C6', 'E6', 'A6'], 'triangle', 0.14, 0.05); break;
      case 'heal':    this.arp(['C5', 'E5', 'G5'], 'triangle', 0.14, 0.06); break;
      case 'checkpoint': this.arp(['D4', 'A4', 'D5'], 'triangle', 0.14, 0.09); break;
      case 'crate':   this.noise(t, 0.10, 0.16, 700); break;
      case 'pod':     this.noise(t, 0.14, 0.16, 400); this.tone(160, t, 0.14, 'sawtooth', 0.10, 70); break;
      case 'door':    this.tone(392, t, 0.18, 'triangle', 0.12); this.tone(587, t + 0.12, 0.22, 'triangle', 0.12); break;
      case 'blip':    this.tone(560, t, 0.03, 'square', 0.07); break;
      case 'select':  this.tone(760, t, 0.05, 'square', 0.10); break;
      case 'locked':  this.tone(150, t, 0.10, 'square', 0.10, 110); break;
      case 'down':    this.arp(['E5', 'C5', 'A4', 'F4'], 'square', 0.12, 0.09); break;
      case 'rescue':  this.arp(['C5', 'E5', 'G5', 'C6'], 'triangle', 0.14, 0.11); break;
      case 'win':     this.arp(['C5', 'E5', 'G5', 'C6', 'G5', 'C6'], 'square', 0.13, 0.12); break;
      case 'roar':    this.tone(88, t, 0.95, 'sawtooth', 0.22, 42); this.tone(132, t, 0.85, 'square', 0.09, 58); this.noise(t, 0.95, 0.13, 240); break;
      case 'thunder': this.noise(t, 0.7, 0.14, 190); this.tone(58, t, 0.8, 'sawtooth', 0.13, 38); break;
      case 'bloom':   this.arp(['C5', 'E5', 'G5', 'C6'], 'triangle', 0.10, 0.045); break;
      case 'light':   this.tone(880, t, 0.14, 'sine', 0.055, 1240); break;
      case 'glint':   this.arp(['E6', 'A6'], 'sine', 0.09, 0.06); break;
      case 'shrine':  this.arp(['C5', 'G5', 'C6', 'E6', 'G6'], 'triangle', 0.12, 0.07); break;
      default: break;
    }
  },

  /* ---- music ---- */

  playMusic(name) {
    if (!name) return;
    const same = this.musicName === name;
    this.musicName = name;
    if (!this.ready) return;
    if (same && this.timer) return;
    this.stopScheduler();
    this.step = 0;
    this.next = this.ctx.currentTime + 0.12;
    this.startScheduler(name);
  },

  stopMusic() {
    this.musicName = null;
    this.stopScheduler();
  },

  startScheduler(name) {
    if (!this.ready || !TRACKS[name]) return;
    if (this.timer) return;
    this.timer = setInterval(() => this.pump(), 30);
    this.pump();
  },

  stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  pump() {
    if (!this.ready || !this.timer) return;
    const track = TRACKS[this.musicName];
    if (!track) { this.stopScheduler(); return; }
    if (this.ctx.state === 'suspended') { this.next = this.ctx.currentTime + 0.1; return; }
    const stepDur = 60 / track.bpm / 2;
    const leadDur = stepDur * 0.92;
    while (this.next < this.ctx.currentTime + 0.2) {
      const s = this.step % track.lead.length;
      const lead = track.lead[s];
      const bass = track.bass[s];
      if (lead) this.tone(this.freq(lead), this.next, leadDur, track.leadType || 'square', track.leadVol || 0.055);
      if (bass) this.tone(this.freq(bass), this.next, stepDur * 1.6, 'triangle', 0.085);
      if (track.hat && s % 2 === 0) this.noise(this.next, 0.025, 0.014, 6000);
      this.step++;
      this.next += stepDur;
    }
  }
};

/* 32 steps of 8th notes. 0 = rest. */
const TRACKS = {
  meadow: {
    bpm: 126,
    hat: true,
    lead: [
      'C5', 0, 'E5', 'G5', 'A5', 'G5', 'E5', 0,
      'F5', 0, 'A5', 'C6', 'B5', 'G5', 'E5', 0,
      'C5', 0, 'E5', 'G5', 'A5', 0, 'C6', 'A5',
      'F5', 'E5', 'D5', 'B4', 'C5', 0, 'G4', 0
    ],
    bass: [
      'C3', 0, 'G3', 0, 'A2', 0, 'E3', 0,
      'F2', 0, 'C3', 0, 'G2', 0, 'D3', 0,
      'C3', 0, 'G3', 0, 'A2', 0, 'E3', 0,
      'F2', 0, 'C3', 0, 'G2', 0, 'G2', 0
    ]
  },
  mill: {
    bpm: 102,
    hat: true,
    lead: [
      'D5', 0, 'F5', 'A5', 'C6', 'A5', 'F5', 0,
      'E5', 0, 'G5', 'B5', 'A5', 'F5', 'D5', 0,
      'D5', 'F5', 'A5', 0, 'C6', 0, 'A5', 'F5',
      'E5', 'D5', 'C5', 'A4', 'D5', 0, 0, 0
    ],
    bass: [
      'D3', 0, 'A3', 0, 'D3', 0, 'A3', 0,
      'G2', 0, 'D3', 0, 'A2', 0, 'E3', 0,
      'F2', 0, 'C3', 0, 'G2', 0, 'D3', 0,
      'A2', 0, 'E3', 0, 'D3', 0, 'A3', 0
    ]
  },
  woods: {
    bpm: 116,
    hat: true,
    lead: [
      'A4', 0, 'C5', 'E5', 'A5', 0, 'G5', 'E5',
      'F5', 0, 'E5', 'C5', 'D5', 0, 'E5', 0,
      'A4', 0, 'C5', 'E5', 'A5', 0, 'B5', 'A5',
      'G5', 'E5', 'D5', 'C5', 'A4', 0, 'A4', 0
    ],
    bass: [
      'A2', 0, 'E3', 0, 'A2', 0, 'E3', 0,
      'F2', 0, 'C3', 0, 'D3', 0, 'A2', 0,
      'A2', 0, 'E3', 0, 'A2', 0, 'E3', 0,
      'G2', 0, 'D3', 0, 'E3', 0, 'E3', 0
    ]
  },
  marsh: {
    bpm: 88,
    hat: false,
    lead: [
      'D5', 0, 'F5', 0, 'A5', 0, 'G5', 0,
      'F5', 0, 'E5', 0, 'D5', 0, 'C5', 0,
      'D5', 'F5', 'A5', 0, 'C6', 0, 'A5', 0,
      'A#5', 0, 'A5', 0, 'F5', 0, 'D5', 0
    ],
    bass: [
      'D2', 0, 'A2', 0, 'D2', 0, 'A2', 0,
      'A#2', 0, 'F2', 0, 'G2', 0, 'D2', 0,
      'D2', 0, 'A2', 0, 'D2', 0, 'A2', 0,
      'G2', 0, 'A#2', 0, 'A2', 0, 'D3', 0
    ]
  },
  keep: {
    bpm: 122,
    hat: true,
    lead: [
      'A4', 0, 'C5', 'E5', 'A5', 0, 'G5', 'E5',
      'F5', 0, 'E5', 'C5', 'D5', 0, 'E5', 0,
      'A4', 0, 'C5', 'E5', 'G5', 0, 'F5', 'D5',
      'C5', 'B4', 'A4', 0, 'A4', 0, 'E4', 0
    ],
    bass: [
      'A2', 0, 'E3', 0, 'A2', 0, 'E3', 0,
      'F2', 0, 'C3', 0, 'G2', 0, 'D3', 0,
      'A2', 0, 'E3', 0, 'F2', 0, 'C3', 0,
      'G2', 0, 'D3', 0, 'A2', 0, 'E3', 0
    ]
  },
  /* dawn: slow, warm, and a little sad - for the end */
  dawn: {
    bpm: 70,
    hat: false,
    leadType: 'triangle',
    leadVol: 0.075,
    lead: [
      'C5', 0, 'E5', 'G5', 0, 'E5', 'D5', 0,
      'A4', 0, 'C5', 'E5', 0, 'D5', 'C5', 0,
      'F4', 0, 'A4', 'C5', 0, 'A4', 'G4', 0,
      'E4', 0, 'G4', 'B4', 0, 'C5', 'G4', 0
    ],
    bass: [
      'C3', 0, 0, 0, 'A2', 0, 0, 0,
      'F2', 0, 0, 0, 'G2', 0, 0, 0,
      'C3', 0, 0, 0, 'E3', 0, 0, 0,
      'G2', 0, 0, 0, 'C3', 0, 0, 0
    ]
  },

  /* ---------- the west road ---------- */

  /* keeper: hers. warm, plain, a little hopeful */
  keeper: {
    bpm: 104,
    hat: false,
    leadType: 'triangle',
    leadVol: 0.07,
    lead: [
      'G4', 0, 'B4', 'D5', 0, 'C5', 'B4', 0,
      'A4', 0, 'C5', 'E5', 0, 'D5', 'C5', 0,
      'G4', 0, 'B4', 'D5', 0, 'E5', 'D5', 0,
      'C5', 0, 'B4', 'A4', 0, 'G4', 0, 0
    ],
    bass: [
      'G2', 0, 0, 0, 'C3', 0, 0, 0,
      'E2', 0, 0, 0, 'D3', 0, 0, 0,
      'G2', 0, 0, 0, 'A2', 0, 0, 0,
      'D3', 0, 0, 0, 'G2', 0, 0, 0
    ]
  },

  /* nettle: the wood closing in. prickly, and it hurries */
  nettle: {
    bpm: 120,
    hat: true,
    leadType: 'square',
    leadVol: 0.048,
    lead: [
      'D5', 'F5', 'G5', 'F5', 'D5', 0, 'C5', 0,
      'A#4', 0, 'D5', 'F5', 'E5', 'D5', 'C5', 0,
      'D5', 'F5', 'A5', 'G5', 'F5', 0, 'D5', 'C5',
      'A#4', 0, 'C5', 'D5', 0, 'A4', 0, 0
    ],
    bass: [
      'D2', 0, 'D3', 0, 'A#2', 0, 'C3', 0,
      'D2', 0, 'A2', 0, 'A#2', 0, 'A2', 0,
      'D2', 0, 'D3', 0, 'F2', 0, 'C3', 0,
      'A#2', 0, 'C3', 0, 'D2', 0, 0, 0
    ]
  },

  /* drowned: the field under water. slow, low, and it drags */
  drowned: {
    bpm: 72,
    hat: false,
    leadType: 'sine',
    leadVol: 0.085,
    lead: [
      'D5', 0, 0, 'F5', 0, 'E5', 0, 0,
      'D5', 0, 0, 'A4', 0, 'C5', 0, 0,
      'A#4', 0, 0, 'D5', 0, 'F5', 0, 0,
      'E5', 0, 0, 'D5', 0, 'C5', 0, 0
    ],
    bass: [
      'D2', 0, 0, 0, 0, 0, 'D2', 0,
      'A#1', 0, 0, 0, 'F2', 0, 0, 0,
      'D2', 0, 0, 0, 'A1', 0, 0, 0,
      'A#1', 0, 0, 0, 'C2', 0, 0, 0
    ]
  },

  /* husks: something standing in the field. sparse, and it watches */
  husks: {
    bpm: 88,
    hat: false,
    leadType: 'sawtooth',
    leadVol: 0.042,
    lead: [
      'A4', 0, 0, 0, 'C5', 0, 0, 'B4',
      'A4', 0, 0, 0, 'E4', 0, 'G4', 0,
      'F4', 0, 0, 'A4', 0, 0, 'C5', 0,
      'E4', 0, 0, 0, 'D4', 0, 'E4', 0
    ],
    bass: [
      'A1', 0, 0, 0, 'A1', 0, 0, 0,
      'F1', 0, 0, 0, 'E1', 0, 0, 0,
      'D1', 0, 0, 0, 'A1', 0, 0, 0,
      'E1', 0, 0, 0, 'A1', 0, 0, 0
    ]
  },

  /* bloom: the heart of the briar. dark, with one warm line in it */
  bloom: {
    bpm: 98,
    hat: false,
    leadType: 'triangle',
    leadVol: 0.07,
    lead: [
      'E5', 0, 'G5', 'B5', 0, 'A5', 'G5', 0,
      'F#5', 0, 'A5', 'C#6', 0, 'B5', 'A5', 0,
      'E5', 0, 'G5', 'B5', 0, 'C#6', 'B5', 'A5',
      'G5', 0, 'F#5', 'E5', 0, 'D5', 'E5', 0
    ],
    bass: [
      'E2', 0, 0, 0, 'B2', 0, 0, 0,
      'F#2', 0, 0, 0, 'A2', 0, 0, 0,
      'E2', 0, 0, 0, 'G2', 0, 0, 0,
      'B2', 0, 0, 0, 'E2', 0, 0, 0
    ]
  }
};
