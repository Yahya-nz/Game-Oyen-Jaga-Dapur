'use strict';
// ================= Oyen, si kucing oren penjaga dapur =================

const ORANGE = '#f6a04d';
const ORANGE_D = '#e07a2e';
const FUR_W = '#fff6ea';
const PINK = '#f7a6b5';

// tiga pose dasar: duduk (S), mengendap (C), menerkam (P)
const POSE = {
  body:   { S: [-6, -40, 34, 36, 0], C: [-12, -26, 44, 24, 0.16], P: [-4, -46, 52, 21, -0.08] },
  haunch: { S: [-24, -20, 22, 19], C: [-36, -32, 20, 17], P: [-44, -42, 18, 12] },
  bpaw:   { S: [-8, -4], C: [-30, -5], P: [-68, -36] },
  sh1:    { S: [12, -38], C: [14, -24], P: [22, -48] },
  paw1:   { S: [14, -5], C: [34, -5], P: [64, -46] },
  sh2:    { S: [22, -36], C: [22, -22], P: [28, -44] },
  paw2:   { S: [27, -5], C: [46, -5], P: [70, -36] },
  head:   { S: [22, -84, 0], C: [40, -50, 0.06], P: [54, -60, -0.1] },
  chest:  { S: [14, -42, 14, 22], C: [22, -26, 14, 13], P: [24, -44, 16, 11] },
  tail0:  { S: [-36, -16], C: [-52, -34], P: [-54, -46] },
  tailA:  { S: [-70, -8], C: [-68, -56], P: [-82, -48] },
  tailB:  { S: [-82, -58], C: [-74, -86], P: [-100, -54] },
  tail1:  { S: [-58, -80], C: [-58, -100], P: [-118, -58] },
};
function pose(key, c, p) {
  const s = POSE[key].S, a = POSE[key].C, b = POSE[key].P;
  return s.map((v, i) => v + (a[i] - v) * c + (b[i] - v) * p);
}

function drawOyen(ctx, x, y, k, st) {
  const { c, p, face, eye, mouth, t, wig, run } = st;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k * face, k);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const lw = 3 / k;
  const wg = Math.sin(t * 32) * wig;

  // ekor
  const t0 = pose('tail0', c, p), tA = pose('tailA', c, p), tB = pose('tailB', c, p), t1 = pose('tail1', c, p);
  const sw = Math.sin(t * 2.2) * (1 - p) * 10 + wg * 6;
  ctx.beginPath();
  ctx.moveTo(t0[0] + wg * 3, t0[1]);
  ctx.bezierCurveTo(tA[0] + sw * 0.5, tA[1], tB[0] + sw, tB[1], t1[0] + sw * 1.4, t1[1] + Math.abs(sw) * 0.3);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 15;
  ctx.stroke();
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(t1[0] + sw * 1.4, t1[1] + Math.abs(sw) * 0.3, 4.5, 0, TAU);
  ctx.fillStyle = ORANGE_D;
  ctx.fill();

  // kaki belakang
  const run1 = run ? Math.sin(t * 40) * 10 : 0;
  const bp = pose('bpaw', c, p);
  ctx.beginPath();
  ctx.ellipse(bp[0] + run1, bp[1], 13, 5.5, 0, 0, TAU);
  inked(ctx, FUR_W, lw);
  const hn = pose('haunch', c, p);
  ctx.beginPath();
  ctx.ellipse(hn[0] + wg * 4, hn[1], hn[2], hn[3], 0, 0, TAU);
  inked(ctx, ORANGE, lw);

  // badan
  const bd = pose('body', c, p);
  const breath = 1 + Math.sin(t * 2.4) * 0.015 * (1 - p);
  ctx.save();
  ctx.translate(bd[0], bd[1]);
  ctx.rotate(bd[4] + wg * 0.04);
  ctx.beginPath();
  ctx.ellipse(0, 0, bd[2], bd[3] * breath, 0, 0, TAU);
  ctx.fillStyle = ORANGE;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = ORANGE_D;
  ctx.lineWidth = 6;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-bd[2] * 0.15 - i * 12, -bd[3] - 2);
    ctx.quadraticCurveTo(-bd[2] * 0.3 - i * 12, -bd[3] * 0.4, -bd[2] * 0.2 - i * 14, -bd[3] * 0.1);
    ctx.stroke();
  }
  ctx.restore();
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();

  // dada putih
  const ch = pose('chest', c, p);
  ctx.beginPath();
  ctx.ellipse(ch[0], ch[1], ch[2], ch[3], 0, 0, TAU);
  ctx.fillStyle = FUR_W;
  ctx.fill();

  // kaki depan
  const leg = (sh, pw, off) => {
    const a = pose(sh, c, p), b = pose(pw, c, p);
    const bx = b[0] + off, by = b[1];
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(bx, by - 4);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 15;
    ctx.stroke();
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(bx + 2, by - 1, 9, 5.5, 0, 0, TAU);
    inked(ctx, FUR_W, lw);
  };
  leg('sh2', 'paw2', run ? -run1 : 0);
  leg('sh1', 'paw1', run ? run1 * 0.8 : 0);

  // kepala
  const hd = pose('head', c, p);
  ctx.save();
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(hd[2]);
  // telinga
  const ear = (bx, by, tx, ty, ex, ey) => {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(tx - 4, ty + 2, tx, ty);
    ctx.quadraticCurveTo(tx + 3, ty + 4, ex, ey);
    ctx.closePath();
    inked(ctx, ORANGE, lw);
    ctx.beginPath();
    ctx.moveTo(bx + (ex - bx) * 0.25, by + (ey - by) * 0.25 - 2);
    ctx.lineTo(tx + (bx + ex) * 0.02, ty + 8);
    ctx.lineTo(ex - (ex - bx) * 0.2, ey - 3);
    ctx.closePath();
    ctx.fillStyle = PINK;
    ctx.fill();
  };
  ear(-24, -10, -18, -42, -2, -22);
  ear(2, -24, 16, -46, 26, -16);
  ctx.beginPath();
  ctx.ellipse(0, 0, 31, 27, 0, 0, TAU);
  ctx.fillStyle = ORANGE;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = ORANGE_D;
  ctx.lineWidth = 4.5;
  for (const sx of [-8, 0, 8]) {
    ctx.beginPath();
    ctx.moveTo(sx, -28);
    ctx.lineTo(sx + 1, -17);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(-26, 4, 9, 4, 0.4, 0, TAU);
  ctx.fillStyle = ORANGE_D;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // moncong
  ctx.beginPath();
  ctx.ellipse(17, 10, 14, 9.5, 0, 0, TAU);
  ctx.fillStyle = FUR_W;
  ctx.fill();
  // pipi merona
  ctx.fillStyle = 'rgba(255,140,150,0.4)';
  ctx.beginPath(); ctx.ellipse(-2, 9, 6, 3.5, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(30, 7, 4.5, 3, 0, 0, TAU); ctx.fill();

  // mata
  const eyeAt = (ex, ey, s) => {
    if (eye === 'blink' || eye === 'happy') {
      ctx.beginPath();
      if (eye === 'happy') ctx.arc(ex, ey + 2, 5 * s, Math.PI * 1.15, Math.PI * 1.85);
      else { ctx.moveTo(ex - 5 * s, ey); ctx.quadraticCurveTo(ex, ey + 3 * s, ex + 5 * s, ey); }
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = INK;
      ctx.stroke();
      return;
    }
    if (eye === 'dizzy') {
      ctx.beginPath();
      for (let a = 0; a < 9; a += 0.4) ctx.lineTo(ex + Math.cos(a + t * 10) * a * 0.75 * s, ey + Math.sin(a + t * 10) * a * 0.75 * s);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = INK;
      ctx.stroke();
      return;
    }
    const big = eye === 'wide' ? 1.18 : 1;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 6 * s * big, 7.6 * s * big, 0, 0, TAU);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex + 1.8 * s, ey - 2.6 * s, 2.3 * s * big, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(ex - 1.8 * s, ey + 2.4 * s, 1.1 * s, 0, TAU); ctx.fill();
    if (eye === 'angry') {
      ctx.beginPath();
      ctx.moveTo(ex - 7 * s, ey - 11 * s);
      ctx.lineTo(ex + 6 * s, ey - 7 * s);
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  };
  eyeAt(6, -3, 0.92);
  eyeAt(23, -4, 1);

  // hidung & mulut
  ctx.beginPath();
  ctx.moveTo(22, 3);
  ctx.lineTo(29, 3);
  ctx.lineTo(25.5, 7);
  ctx.closePath();
  ctx.fillStyle = '#f07f93';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 2;
  if (mouth === 'open' || mouth === 'hiss') {
    ctx.beginPath();
    ctx.ellipse(25, 14, 5, mouth === 'hiss' ? 6 : 4, 0, 0, TAU);
    ctx.fillStyle = '#c2455c';
    ctx.fill();
    ctx.stroke();
    if (mouth === 'hiss') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(21, 9); ctx.lineTo(23, 13); ctx.lineTo(24, 9); ctx.fill();
      ctx.beginPath(); ctx.moveTo(26, 9); ctx.lineTo(27.5, 13); ctx.lineTo(29, 9); ctx.fill();
    }
  } else if (mouth === 'smile') {
    ctx.beginPath();
    ctx.arc(25, 8, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(25.5, 7);
    ctx.quadraticCurveTo(24, 12, 20, 11);
    ctx.moveTo(25.5, 7);
    ctx.quadraticCurveTo(27, 12, 31, 10.5);
    ctx.stroke();
  }
  // kumis
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(59,42,32,0.75)';
  for (const [dy, ex, ey] of [[-1, 50, -3], [3, 51, 5]]) {
    ctx.beginPath(); ctx.moveTo(32, 6 + dy); ctx.lineTo(ex, ey); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

// ---------- pengendali gerak Oyen ----------
const Oyen = {
  x: 0, y: 0, face: 1, state: 'idle', t: 0,
  c: 0, p: 0, wig: 0, queue: [], jump: null, mood: '', moodT: 0, blinkT: 2, aimT: 0, hurtT: 0,

  reset() {
    this.x = View.home.x; this.y = View.home.y;
    this.state = 'idle'; this.face = 1; this.queue = []; this.jump = null;
    this.c = this.p = this.wig = 0; this.mood = ''; this.moodT = 0; this.hurtT = 0;
  },
  relayout() { if (this.state === 'idle' || this.state === 'aim') { this.x = View.home.x; this.y = View.home.y; } },

  aim(target) {
    if (this.state !== 'idle' && this.state !== 'aim') return;
    this.state = 'aim';
    this.aimT = 0.9;
    this.wig = Math.min(1, this.wig + 0.4);
    this.face = target.sx >= this.x ? 1 : -1;
  },
  pounce(target) {
    this.queue.push(target);
    if (this.state !== 'jump' && this.state !== 'bonk' && this.state !== 'zoom') this.next();
  },
  next() {
    let target = this.queue.shift();
    while (target && target.dead) target = this.queue.shift();
    if (!target) return this.goHome();
    const x1 = target.sx - (target.sx >= this.x ? 18 : -18) * View.ui * target.k;
    const y1 = target.fy + 2;
    const d = Math.hypot(x1 - this.x, y1 - this.y);
    const busy = this.queue.length > 0 ? 0.65 : 1;
    this.leap(x1, y1, clamp(d / 1700, 0.13, 0.3) * busy, target);
    if (!Game.quiet) Sound.whoosh();
  },
  leap(x1, y1, dur, target) {
    this.state = target ? 'jump' : 'back';
    this.jump = { x0: this.x, y0: this.y, x1, y1, t: 0, dur, target, h: clamp(Math.abs(x1 - this.x) * 0.25, 30, 140) * View.ui };
    this.face = x1 >= this.x ? 1 : -1;
  },
  goHome() {
    const d = Math.hypot(View.home.x - this.x, View.home.y - this.y);
    if (d < 4) { this.state = 'idle'; return; }
    this.leap(View.home.x, View.home.y, clamp(d / 1500, 0.18, 0.42), null);
  },
  zoomies(targets) {
    this.queue = [];
    this.zoom = { list: targets.slice(), i: 0 };
    this.state = 'zoom';
    this.zoomNext();
  },
  zoomNext() {
    const z = this.zoom;
    const tg = z.list[z.i++];
    if (!tg) { this.zoom = null; this.state = 'back'; return this.goHome(); }
    const x1 = tg.sx, y1 = tg.fy + 2;
    this.jump = { x0: this.x, y0: this.y, x1, y1, t: 0, dur: 0.11, target: tg, h: 18 * View.ui };
    this.face = x1 >= this.x ? 1 : -1;
  },
  hurt() { this.hurtT = 0.8; this.mood = ''; },
  angry() { this.mood = 'angry'; this.moodT = 0.9; },
  happy() { if (!this.mood) { this.mood = 'happy'; this.moodT = 0.7; } },

  update(dt) {
    this.t += dt;
    this.blinkT -= dt;
    if (this.blinkT < -0.12) this.blinkT = rand(2, 5);
    if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0) this.mood = ''; }
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.wig = Math.max(0, this.wig - dt * 1.4);
    let tc = 0, tp = 0;
    const s = this.state;
    if (s === 'aim') {
      tc = 1;
      this.aimT -= dt;
      if (this.aimT <= 0) this.state = 'idle';
    }
    if (s === 'jump' || s === 'back' || s === 'zoom') {
      const j = this.jump;
      j.t += dt / j.dur;
      const k = Math.min(1, j.t);
      this.x = lerp(j.x0, j.x1, k);
      this.y = lerp(j.y0, j.y1, k) - Math.sin(k * Math.PI) * j.h;
      tp = s === 'back' ? 0.55 : 1;
      if (j.t >= 1) {
        this.x = j.x1; this.y = j.y1;
        if (s === 'back') { this.state = 'idle'; this.face = 1; }
        else {
          if (j.target && !j.target.dead) j.target.knock(this.face);
          FX.puff(this.x, this.y, 4, 0.8);
          if (s === 'zoom') this.zoomNext();
          else { this.state = 'bonk'; this.bonkT = 0.07; }
        }
      }
    } else if (s === 'bonk') {
      tc = 0.5;
      this.bonkT -= dt;
      if (this.bonkT <= 0) {
        if (this.queue.length) this.next();
        else this.goHome();
      }
    }
    this.c = damp(this.c, tc, 20, dt);
    this.p = damp(this.p, tp, 22, dt);
  },

  draw(ctx) {
    const ui = View.ui;
    const depth = clamp((this.y - View.rowTop) / Math.max(1, View.rowBot - View.rowTop), -0.3, 1.2);
    const k = 1.22 * ui * lerp(0.9, 1.06, depth);
    const s = this.state;
    // bayangan di lantai
    const gy = this.jump && (s === 'jump' || s === 'back' || s === 'zoom') ? lerp(this.jump.y0, this.jump.y1, Math.min(1, this.jump.t)) : this.y;
    const lift = clamp((gy - this.y) / 120, 0, 1);
    ctx.fillStyle = 'rgba(59,42,32,0.16)';
    ctx.beginPath();
    ctx.ellipse(this.x - 6 * k, gy + 2, 48 * k * (1 - lift * 0.4), 9 * k * (1 - lift * 0.4), 0, 0, TAU);
    ctx.fill();
    // garis kecepatan
    if (s === 'jump' || s === 'zoom') {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const yy = this.y - (30 + i * 18) * k;
        ctx.beginPath();
        ctx.moveTo(this.x - this.face * (70 + i * 10) * k, yy);
        ctx.lineTo(this.x - this.face * (110 + i * 18) * k, yy);
        ctx.stroke();
      }
    }
    let eye = 'open', mouth = 'w';
    if (s === 'aim') eye = 'wide';
    if (s === 'jump' || s === 'zoom') { eye = 'wide'; mouth = 'open'; }
    if (s === 'bonk') { eye = 'happy'; mouth = 'open'; }
    if (s === 'back') { eye = 'happy'; mouth = 'smile'; }
    if (this.mood === 'happy') { eye = 'happy'; mouth = 'smile'; }
    if (this.mood === 'angry') { eye = 'angry'; mouth = 'hiss'; }
    if (this.hurtT > 0) { eye = 'dizzy'; mouth = 'open'; }
    if (eye === 'open' && this.blinkT < 0) eye = 'blink';
    drawOyen(ctx, this.x, this.y, k, {
      c: this.c, p: this.p, face: this.face, eye, mouth, t: this.t, wig: this.wig,
      run: s === 'zoom',
    });
    if (this.hurtT > 0) {
      for (let i = 0; i < 3; i++) {
        const a = this.t * 5 + (i / 3) * TAU;
        starPath(ctx, this.x + this.face * 22 * k + Math.cos(a) * 26 * k, this.y - 118 * k + Math.sin(a) * 7 * k, 5 * k, a);
        inked(ctx, '#ffd15c', 1.5);
      }
    }
    if (this.mood === 'angry') {
      ctx.font = `900 ${Math.round(26 * k)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f2545b';
      ctx.fillText('!!', this.x + this.face * 50 * k, this.y - 120 * k);
    }
  },
};
