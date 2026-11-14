'use strict';
// ================= Suara dan musik ceria (disintesis, tanpa file audio) =================

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Progresi C mayor: C - Am - F - G
const CHORDS = [
  { tones: [60, 64, 67], bass: 48 },
  { tones: [57, 60, 64], bass: 45 },
  { tones: [57, 60, 65], bass: 41 },
  { tones: [55, 59, 62], bass: 43 },
];
const ARP = [0, 2, 1, 2, 0, 2, 1, 2];

const Sound = {
  ctx: null,
  running: false,
  intensity: 0,
  bpm: 104,
  step: 0,
  nextTime: 0,
  chordLog: [{ t: 0, i: 0 }],

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(comp).connect(ctx.destination);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = Settings.sfx ? 0.85 : 0;
    this.sfx.connect(this.master);
    this.musicOut = ctx.createGain();
    this.musicOut.gain.value = Settings.music ? 0.32 : 0;
    this.musicLP = ctx.createBiquadFilter();
    this.musicLP.type = 'lowpass';
    this.musicLP.frequency.value = 14000;
    this.musicLP.connect(this.musicOut).connect(this.master);
    // gema tipis untuk marimba
    this.echo = ctx.createDelay(1);
    this.echo.delayTime.value = 0.18;
    const fb = ctx.createGain(); fb.gain.value = 0.25;
    this.echoWet = ctx.createGain(); this.echoWet.gain.value = 0.18;
    this.echo.connect(fb).connect(this.echo);
    this.echo.connect(this.echoWet).connect(this.master);
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },

  setSfx(on) {
    Settings.sfx = on; saveSettings();
    if (this.ctx) this.sfx.gain.setTargetAtTime(on ? 0.85 : 0, this.ctx.currentTime, 0.03);
  },
  setMusic(on) {
    Settings.music = on; saveSettings();
    if (this.ctx) this.musicOut.gain.setTargetAtTime(on ? 0.32 : 0, this.ctx.currentTime, 0.1);
  },
  setPaused(p) {
    if (this.ctx) this.musicLP.frequency.setTargetAtTime(p ? 500 : 14000, this.ctx.currentTime, 0.15);
  },
  setSlow(s) {
    if (this.ctx) this.musicLP.frequency.setTargetAtTime(s ? 1500 : 14000, this.ctx.currentTime, 0.2);
  },
  setIntensity(level, bpm) {
    this.intensity = level;
    if (bpm) this.bpm = bpm;
  },

  // ---------- sekuenser musik ----------
  startMusic() {
    if (!this.ctx || this.running) return;
    this.running = true;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.schedule(), 25);
  },
  stopMusic() { this.running = false; clearInterval(this.timer); },
  schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += 60 / this.bpm / 4;
      this.step = (this.step + 1) % 64;
    }
  },
  playStep(step, t) {
    const s = step % 16;
    const ci = Math.floor(step / 16) % 4;
    const ch = CHORDS[ci];
    if (s === 0) {
      this.chordLog.push({ t, i: ci });
      if (this.chordLog.length > 6) this.chordLog.shift();
    }
    if (!Settings.music) return;
    const lvl = this.intensity;
    if (s % 2 === 0) {
      const n = ch.tones[ARP[(s / 2) % 8]] + 12;
      this.marimba(n, t, lvl ? 0.09 : 0.07, this.musicLP);
    }
    if (s === 0 || s === 8) this.marimba(ch.tones[0], t, 0.05, this.musicLP);
    if (lvl >= 1) {
      if (s === 0 || s === 8) { this.bass(ch.bass, t); this.kick(t); }
      if (s === 14) this.bass(ch.bass + 7, t);
      if (s === 4 || s === 12) this.snap(t);
      if (s % 2 === 1 || lvl >= 2) this.shaker(t, s % 4 === 2 ? 0.05 : 0.025);
      if (lvl >= 2 && s === 10) this.kick(t);
    }
  },
  marimba(m, t, vol, dest) {
    const ctx = this.ctx;
    const f = mtof(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 4;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(vol * 0.35, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g); o2.connect(g2);
    g.connect(dest || this.sfx);
    g2.connect(dest || this.sfx);
    if (!dest || dest === this.sfx) g.connect(this.echo);
    o.start(t); o.stop(t + 0.4); o2.start(t); o2.stop(t + 0.1);
  },
  bass(m, t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g).connect(this.musicLP);
    o.start(t); o.stop(t + 0.34);
  },
  kick(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(this.musicLP);
    o.start(t); o.stop(t + 0.22);
  },
  noiseHit(t, type, freq, q, vol, dur, dest) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5, dur + 0.02);
  },
  shaker(t, vol) { this.noiseHit(t, 'highpass', 6500, 0.7, vol, 0.05, this.musicLP); },
  snap(t) { this.noiseHit(t, 'bandpass', 2300, 2, 0.16, 0.07, this.musicLP); },

  chordNow() {
    if (!this.ctx) return CHORDS[0];
    const now = this.ctx.currentTime;
    let i = this.chordLog[0].i;
    for (const c of this.chordLog) if (c.t <= now) i = c.i;
    return CHORDS[i];
  },

  // ---------- efek ----------
  tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfx);
    o.start(t); o.stop(t + dur + 0.02);
  },
  sweep(dur, vol, f0, f1, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t, Math.random() * 0.4, dur + 0.05);
  },

  // nada tiap huruf ikut akor musik, naik terus sepanjang kata
  key(i) {
    if (!this.ctx) return;
    const ch = this.chordNow();
    const seq = [ch.tones[0], ch.tones[1], ch.tones[2], ch.tones[0] + 12, ch.tones[1] + 12, ch.tones[2] + 12, ch.tones[0] + 24];
    this.marimba(seq[i % seq.length] + 12, this.ctx.currentTime, 0.2);
  },
  wrong() {
    this.tone(260, 0.16, 'sine', 0.14, 170);
    this.tone(130, 0.08, 'triangle', 0.08);
  },
  lock() { if (this.ctx) this.marimba(96, this.ctx.currentTime, 0.05); },
  whoosh() { this.sweep(0.18, 0.2, 500, 2600); },
  bonk(size = 1) {
    this.tone(520 / Math.sqrt(size), 0.13, 'sine', 0.35, 170 / Math.sqrt(size));
    this.tone(1000, 0.03, 'triangle', 0.08);
    this.tone(1900, 0.07, 'sine', 0.07, 2700, 0.05);
    this.tone(2700, 0.07, 'sine', 0.06, 2000, 0.12);
  },
  shoot() { this.tone(900, 0.09, 'sine', 0.08, 380); },
  popPea() { this.tone(650, 0.06, 'sine', 0.12, 1300); },
  peaHit() { this.tone(320, 0.12, 'sine', 0.2, 120); },
  steal() {
    for (let k = 0; k < 3; k++) this.tone(2200, 0.06, 'sine', 0.05, 2700, k * 0.08);
    if (!this.ctx) return;
    const ctx = this.ctx;
    const notes = [392, 370, 349, 330];
    notes.forEach((f, k) => {
      const t = ctx.currentTime + 0.22 + k * 0.17;
      const dur = k === 3 ? 0.45 : 0.16;
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f / 2;
      if (k === 3) {
        const lfo = ctx.createOscillator(); lfo.frequency.value = 6;
        const lg = ctx.createGain(); lg.gain.value = 4;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(t); lfo.stop(t + dur);
      }
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp).connect(g).connect(this.sfx);
      o.start(t); o.stop(t + dur + 0.02);
    });
  },
  waveStart() {
    if (!this.ctx) return;
    [60, 64, 67, 72, 76].forEach((m, k) => this.marimba(m + 12, this.ctx.currentTime + k * 0.07, 0.14));
  },
  tuba(freqs, durs, vol = 0.18) {
    if (!this.ctx) return;
    let t = this.ctx.currentTime;
    freqs.forEach((f, k) => {
      const o = this.ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
      g.gain.setValueAtTime(vol, t + durs[k] * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + durs[k]);
      o.connect(lp).connect(g).connect(this.sfx);
      o.start(t); o.stop(t + durs[k] + 0.02);
      t += durs[k] + 0.04;
    });
  },
  bossAlarm() { this.tuba([98, 92, 82], [0.22, 0.22, 0.6]); },
  spawnBoss() { this.tuba([73, 69], [0.3, 0.7], 0.15); },
  power() {
    if (!this.ctx) return;
    [72, 76, 79, 84, 88].forEach((m, k) => this.marimba(m + 12, this.ctx.currentTime + k * 0.05, 0.12));
  },
  zoomies() {
    this.tone(500, 0.7, 'sine', 0.12, 2000);
    for (let k = 0; k < 10; k++) this.sweep(0.05, 0.12, 2500, 3500, k * 0.07);
  },
  meow(low = false) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const p = low ? 0.75 : 1;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(520 * p, t);
    o.frequency.linearRampToValueAtTime(760 * p, t + 0.14);
    o.frequency.linearRampToValueAtTime(470 * p, t + 0.5);
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 4;
    f1.frequency.setValueAtTime(700, t);
    f1.frequency.linearRampToValueAtTime(1150, t + 0.15);
    f1.frequency.linearRampToValueAtTime(650, t + 0.5);
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 5;
    f2.frequency.setValueAtTime(1800, t);
    f2.frequency.linearRampToValueAtTime(2500, t + 0.15);
    f2.frequency.linearRampToValueAtTime(1500, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
    g.gain.setValueAtTime(0.5, t + 0.32);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(f1).connect(g);
    o.connect(f2).connect(g);
    g.connect(this.sfx);
    o.start(t); o.stop(t + 0.58);
  },
  click() { if (this.ctx) this.marimba(79, this.ctx.currentTime, 0.08); },
  tick() { if (this.ctx) this.marimba(91, this.ctx.currentTime, 0.08); },
  over() {
    if (!this.ctx) return;
    [67, 64, 60, 55].forEach((m, k) => this.marimba(m, this.ctx.currentTime + k * 0.2, 0.16));
    setTimeout(() => this.meow(true), 850);
  },
  win() {
    if (!this.ctx) return;
    [60, 64, 67, 72, 67, 72, 76].forEach((m, k) => this.marimba(m + 12, this.ctx.currentTime + k * 0.08, 0.13));
  },
};
