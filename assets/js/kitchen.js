'use strict';
// ================= Dapur: tata letak, latar, mangkuk ikan, dan efek =================

const INK = '#3b2a20';

const View = {
  W: 0, H: 0, dpr: 1, bottom: 0, gap: 0, ui: 1,
  floorTop: 0, rowTop: 0, rowBot: 0,
  bowl: { x: 0, y: 0 }, home: { x: 0, y: 0 }, startX: 0,

  resize(W, H, bottom, gap = 0) {
    this.W = W; this.H = H; this.bottom = bottom; this.gap = gap;
    const ui = (this.ui = clamp(Math.min(W / 1100, bottom / 700), 0.6, 1.25));
    this.floorTop = Math.round(bottom * 0.5);
    this.rowTop = this.floorTop + Math.max(34 * ui, (bottom - this.floorTop) * 0.16);
    this.rowBot = clamp(bottom - gap - 14 * ui, this.rowTop + 110 * ui, bottom - 12);
    this.bowl = { x: Math.max(W * 0.15, 130 * ui + 30), y: this.rowY(1.8) };
    this.home = { x: this.bowl.x - 90 * ui, y: this.rowY(1.25) };
    this.startX = W + 50 * ui;
  },
  rowY(d) { return lerp(this.rowTop, this.rowBot, d / 3); },
  rowS(d) { return lerp(1, 1.22, d / 3) * this.ui; },
  endX() { return this.bowl.x + 52 * this.ui; },
};

// ---------- bentuk-bentuk kecil ----------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function starPath(ctx, x, y, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i / 10) * TAU - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function inked(ctx, fill, w = 2.5) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = w;
  ctx.strokeStyle = INK;
  ctx.stroke();
}
function fishShape(ctx, x, y, s, rot = 0, color = '#a9c4d6') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.quadraticCurveTo(-2, -10, 12, 0);
  ctx.quadraticCurveTo(-2, 10, -14, 0);
  ctx.moveTo(-12, 0);
  ctx.lineTo(-22, -7);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-22, 7);
  ctx.closePath();
  inked(ctx, color, 2 / s);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(6, -2, 1.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ================= Latar dapur =================
const Kitchen = {
  bg: null, clouds: [], t: 0,

  build() {
    const { W, bottom, floorTop, ui, dpr } = View;
    const c = (this.bg = this.bg || document.createElement('canvas'));
    c.width = Math.ceil(W * dpr);
    c.height = Math.ceil(bottom * dpr);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineJoin = 'round';
    g.lineCap = 'round';

    // dinding: atas polos, bawah ubin
    g.fillStyle = '#d4efe6';
    g.fillRect(0, 0, W, floorTop);
    const tileTop = floorTop - Math.min(bottom * 0.17, 130 * ui);
    g.fillStyle = '#f7fbf8';
    g.fillRect(0, tileTop, W, floorTop - tileTop);
    g.strokeStyle = 'rgba(59,42,32,0.08)';
    g.lineWidth = 1;
    const ts = 26 * ui;
    for (let y = tileTop + ts; y < floorTop; y += ts) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let x = 0, i = 0; x < W; x += ts, i++) { g.beginPath(); g.moveTo(x, tileTop); g.lineTo(x, floorTop); g.stroke(); }
    g.fillStyle = '#9ed5c4';
    g.fillRect(0, tileTop - 6 * ui, W, 6 * ui);

    this.buildWindow(g);
    this.buildShelf(g, tileTop);

    // plint dan lubang tikus
    const bh = 12 * ui;
    g.fillStyle = '#86c3b0';
    g.fillRect(0, floorTop - bh, W, bh);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(0, floorTop - bh, W, 2);
    for (const hx of [W * 0.8, W * 0.94]) {
      const hw = 30 * ui, hh = 30 * ui;
      g.beginPath();
      g.moveTo(hx - hw / 2, floorTop);
      g.lineTo(hx - hw / 2, floorTop - hh + hw / 2);
      g.arc(hx, floorTop - hh + hw / 2, hw / 2, Math.PI, 0);
      g.lineTo(hx + hw / 2, floorTop);
      g.closePath();
      g.fillStyle = '#4a382d';
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = '#6f5646';
      g.stroke();
    }

    // lantai kayu dengan sedikit perspektif
    g.fillStyle = '#f2cf98';
    g.fillRect(0, floorTop, W, bottom - floorTop);
    const fh = bottom - floorTop;
    let prev = floorTop;
    for (let i = 1; i <= 9; i++) {
      const y = floorTop + fh * Math.pow(i / 9, 1.35);
      if (i % 2) { g.fillStyle = '#efc98c'; g.fillRect(0, prev, W, y - prev); }
      g.fillStyle = 'rgba(176,122,62,0.35)';
      g.fillRect(0, y - 1, W, 1.5);
      const sw = (150 + i * 30) * ui;
      g.fillStyle = 'rgba(176,122,62,0.28)';
      for (let x = (i % 3) * sw * 0.33; x < W; x += sw) g.fillRect(x, prev, 1.5, y - prev);
      prev = y;
    }
    g.fillStyle = 'rgba(59,42,32,0.12)';
    g.fillRect(0, floorTop, W, 3);

    // cahaya matahari dari jendela
    const w = this.win;
    g.fillStyle = 'rgba(255,250,215,0.35)';
    g.beginPath();
    g.moveTo(w.x + w.w * 0.15 + fh * 0.25, floorTop + fh * 0.1);
    g.lineTo(w.x + w.w * 0.95 + fh * 0.25, floorTop + fh * 0.1);
    g.lineTo(w.x + w.w * 1.15 + fh * 0.75, bottom);
    g.lineTo(w.x + w.w * 0.2 + fh * 0.75, bottom);
    g.closePath();
    g.fill();

    // karpet bulat tempat Oyen jaga
    const rx = View.bowl.x - 26 * ui, ry = View.rowY(1.55);
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.ellipse(rx, ry, (150 - k * 30) * ui, (40 - k * 8) * ui, 0, 0, TAU);
      g.fillStyle = k % 2 ? '#fff4e0' : '#f6a8a0';
      g.fill();
    }
    g.beginPath();
    g.ellipse(rx, ry, 150 * ui, 40 * ui, 0, 0, TAU);
    g.lineWidth = 2.5;
    g.strokeStyle = 'rgba(59,42,32,0.55)';
    g.stroke();

    this.clouds = [0, 1, 2].map((i) => ({ x: Math.random(), y: 0.25 + i * 0.22, s: rand(0.7, 1.1), v: rand(0.008, 0.016) }));
  },

  buildWindow(g) {
    const { W, bottom, ui } = View;
    const w = Math.min(W * 0.27, 330 * ui), h = Math.min(bottom * 0.25, w * 0.72);
    const x = Math.round(W * 0.42 - w / 2), y = Math.round(Math.max(bottom * 0.13, 84 * ui));
    this.win = { x, y, w, h };
    // gorden
    const cw = w * 0.22;
    for (const side of [-1, 1]) {
      const cx = side < 0 ? x - cw * 0.7 : x + w - cw * 0.3;
      g.beginPath();
      g.moveTo(cx, y - 14 * ui);
      g.lineTo(cx + cw, y - 14 * ui);
      g.quadraticCurveTo(cx + cw * (side < 0 ? 0.6 : 0.4), y + h * 0.7, cx + cw * (side < 0 ? 0.85 : 0.15), y + h + 18 * ui);
      g.lineTo(cx + cw * (side < 0 ? 0.1 : 0.9), y + h + 18 * ui);
      g.quadraticCurveTo(cx + cw * 0.5, y + h * 0.4, cx, y - 14 * ui);
      g.closePath();
      inked(g, '#ffb4a2', 2.5);
    }
    // bingkai dan langit
    roundRect(g, x - 8 * ui, y - 8 * ui, w + 16 * ui, h + 16 * ui, 10 * ui);
    inked(g, '#fffaf0', 3);
    const sky = g.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#8fd3f6');
    sky.addColorStop(1, '#d3f1ff');
    roundRect(g, x, y, w, h, 6 * ui);
    g.fillStyle = sky;
    g.fill();
    // bukit kecil di luar
    g.save();
    roundRect(g, x, y, w, h, 6 * ui);
    g.clip();
    g.fillStyle = '#9fdc8f';
    g.beginPath();
    g.ellipse(x + w * 0.25, y + h * 1.05, w * 0.45, h * 0.32, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#86cf7a';
    g.beginPath();
    g.ellipse(x + w * 0.8, y + h * 1.1, w * 0.5, h * 0.36, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#fff3a8';
    g.beginPath();
    g.arc(x + w * 0.8, y + h * 0.25, h * 0.11, 0, TAU);
    g.fill();
    g.restore();
    // kusen tengah
    g.fillStyle = '#fffaf0';
    g.fillRect(x + w / 2 - 3 * ui, y, 6 * ui, h);
    g.fillRect(x, y + h / 2 - 3 * ui, w, 6 * ui);
    g.lineWidth = 2;
    g.strokeStyle = INK;
    g.strokeRect(x + w / 2 - 3 * ui, y, 6 * ui, h);
    g.strokeRect(x, y + h / 2 - 3 * ui, w, 6 * ui);
    // ambang jendela
    roundRect(g, x - 18 * ui, y + h + 6 * ui, w + 36 * ui, 10 * ui, 4 * ui);
    inked(g, '#fffaf0', 2.5);
  },

  buildShelf(g, tileTop) {
    const { W, ui } = View;
    const sw = Math.min(W * 0.24, 280 * ui);
    const sx = Math.round(W * 0.76 - sw / 2), sy = Math.round(tileTop - 70 * ui);
    // toples
    const jars = [['GULA', '#f6a04d'], ['KOPI', '#7c5a44'], ['GARAM', '#6bc4b5']];
    const jw = sw / 4.2;
    jars.forEach(([label, lid], i) => {
      const jx = sx + sw * 0.08 + i * jw * 1.3;
      const jh = jw * (1.15 - i * 0.1);
      roundRect(g, jx, sy - jh, jw, jh, 6 * ui);
      inked(g, 'rgba(232,246,250,0.95)', 2.5);
      g.fillStyle = ['#fffaf0', '#8a6248', '#ffffff'][i];
      g.fillRect(jx + 4 * ui, sy - jh * 0.55, jw - 8 * ui, jh * 0.5);
      roundRect(g, jx - 3 * ui, sy - jh - 9 * ui, jw + 6 * ui, 10 * ui, 3 * ui);
      inked(g, lid, 2.5);
      g.fillStyle = '#fffaf0';
      roundRect(g, jx + 4 * ui, sy - jh * 0.75, jw - 8 * ui, jh * 0.22, 3);
      g.fill();
      g.fillStyle = INK;
      g.font = `800 ${Math.max(7, 9 * ui)}px Nunito, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(label, jx + jw / 2, sy - jh * 0.64);
    });
    // pot tanaman
    const px = sx + sw * 0.86, ph = 30 * ui;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.ellipse(px + (i - 1.5) * 8 * ui, sy - ph - 14 * ui, 7 * ui, 16 * ui, (i - 1.5) * 0.45, 0, TAU);
      inked(g, '#7cc77a', 2);
    }
    g.beginPath();
    g.moveTo(px - 14 * ui, sy - ph);
    g.lineTo(px + 14 * ui, sy - ph);
    g.lineTo(px + 10 * ui, sy);
    g.lineTo(px - 10 * ui, sy);
    g.closePath();
    inked(g, '#e8896b', 2.5);
    // papan rak
    roundRect(g, sx - 10 * ui, sy, sw + 20 * ui, 12 * ui, 3 * ui);
    inked(g, '#c98b5a', 2.5);
    for (const bx of [sx + sw * 0.15, sx + sw * 0.85]) {
      g.beginPath();
      g.moveTo(bx, sy + 12 * ui);
      g.lineTo(bx, sy + 30 * ui);
      g.lineTo(bx + 16 * ui, sy + 12 * ui);
      g.closePath();
      inked(g, '#b77a4c', 2);
    }
  },

  update(dt) {
    this.t += dt;
    for (const c of this.clouds) { c.x += c.v * dt; if (c.x > 1.3) c.x = -0.3; }
  },

  draw(ctx) {
    const { W, bottom } = View;
    ctx.drawImage(this.bg, 0, 0, W, bottom);
    // awan bergerak di jendela
    const w = this.win;
    ctx.save();
    roundRect(ctx, w.x, w.y, w.w, w.h, 6);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    for (const c of this.clouds) {
      const cx = w.x + c.x * w.w, cy = w.y + c.y * w.h, r = w.h * 0.09 * c.s;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.arc(cx + r * 1.1, cy - r * 0.4, r * 1.2, 0, TAU);
      ctx.arc(cx + r * 2.2, cy, r * 0.9, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // kusen digambar ulang di atas awan
    const ui = View.ui;
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(w.x + w.w / 2 - 3 * ui, w.y, 6 * ui, w.h);
    ctx.fillRect(w.x, w.y + w.h / 2 - 3 * ui, w.w, 6 * ui);
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.strokeRect(w.x + w.w / 2 - 3 * ui, w.y, 6 * ui, w.h);
    ctx.strokeRect(w.x, w.y + w.h / 2 - 3 * ui, w.w, 6 * ui);

    // genangan susu (power-up melambat)
    if (Game.slowT > 0) {
      const a = Math.min(1, Game.slowT) * 0.85;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(59,42,32,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const y = View.rowY(1.5), x0 = View.bowl.x + 90 * ui;
      ctx.ellipse(x0 + (W - x0) * 0.45, y, (W - x0) * 0.42, (View.rowBot - View.rowTop) * 0.62, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  },

  // mangkuk ikan: jumlah ikan = sisa nyawa
  drawBowl(ctx, fish, max) {
    const { ui } = View;
    const { x, y } = View.bowl;
    const s = ui;
    // tumpukan ikan yang menyembul dari mangkuk
    const spots = [[-15, -25, -0.35], [14, -26, 0.4], [0, -29, 0.05], [-7, -36, -0.2], [9, -38, 0.25]];
    for (let i = 0; i < Math.min(fish, spots.length); i++) {
      const [fx, fy, r] = spots[i];
      fishShape(ctx, x + fx * s, y + fy * s, 1.05 * s, r, i % 2 ? '#b9d3e3' : '#a3c4d8');
    }
    // badan mangkuk
    ctx.beginPath();
    ctx.moveTo(x - 38 * s, y - 22 * s);
    ctx.quadraticCurveTo(x - 36 * s, y + 4 * s, x - 20 * s, y + 6 * s);
    ctx.lineTo(x + 20 * s, y + 6 * s);
    ctx.quadraticCurveTo(x + 36 * s, y + 4 * s, x + 38 * s, y - 22 * s);
    ctx.closePath();
    inked(ctx, '#6cb6e6', 3);
    ctx.beginPath();
    ctx.ellipse(x, y - 22 * s, 38 * s, 8 * s, 0, 0, TAU);
    inked(ctx, '#4f97c9', 3);
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(11 * s)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OYEN', x, y - 7 * s);
  },
};

// ================= Efek (sederhana dan bersih) =================
const FX = {
  puffs: [], stars: [], pops: [], swipes: [], yarns: [], flyFish: [],
  shake: 0,

  reset() {
    this.puffs.length = this.stars.length = this.pops.length = this.swipes.length = this.yarns.length = this.flyFish.length = 0;
    this.shake = 0;
  },
  puff(x, y, n = 5, size = 1) {
    for (let i = 0; i < n; i++) {
      this.puffs.push({ x: x + rand(-10, 10) * size, y: y + rand(-4, 2) * size, vx: rand(-40, 40) * size, vy: rand(-30, -5) * size, r: rand(5, 10) * size * View.ui, life: rand(0.35, 0.6), max: 0.6 });
    }
  },
  starBurst(x, y, n = 6) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.3, 0.3), v = rand(140, 260) * View.ui;
      this.stars.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, r: rand(5, 8) * View.ui, rot: rand(0, TAU), life: rand(0.4, 0.7), max: 0.7 });
    }
  },
  pop(x, y, text, color = '#f28c28', size = 20) {
    this.pops.push({ x, y, text, color, size, life: 1, max: 1 });
  },
  swipe(x, y) {
    this.swipes.push({ x, y, life: 0.3, max: 0.3 });
  },
  yarn(from, to, onHit) {
    this.yarns.push({ x: from.x, y: from.y, to, t: 0, onHit, sx: from.x, sy: from.y });
  },
  fishFly(from, to) {
    this.flyFish.push({ x0: from.x, y0: from.y, x1: to.x, y1: to.y, t: 0 });
  },

  update(dt) {
    for (const p of this.puffs) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.r += 18 * dt; }
    this.puffs = this.puffs.filter((p) => p.life > 0);
    for (const s of this.stars) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 500 * dt; s.rot += 8 * dt; }
    this.stars = this.stars.filter((s) => s.life > 0);
    for (const p of this.pops) { p.life -= dt; p.y -= 34 * dt; }
    this.pops = this.pops.filter((p) => p.life > 0);
    for (const s of this.swipes) s.life -= dt;
    this.swipes = this.swipes.filter((s) => s.life > 0);
    for (const y of this.yarns) {
      y.t += dt / 0.35;
      const tx = y.to.dead ? y.x : y.to.sx, ty = y.to.dead ? y.y : y.to.fy;
      y.x = lerp(y.sx, tx, Math.min(1, y.t));
      y.y = lerp(y.sy, ty, Math.min(1, y.t)) - Math.sin(Math.min(1, y.t) * Math.PI) * 30;
      if (y.t >= 1 && y.onHit) { y.onHit(); y.onHit = null; }
    }
    this.yarns = this.yarns.filter((y) => y.t < 1.15);
    for (const f of this.flyFish) f.t += dt / 0.45;
    this.flyFish = this.flyFish.filter((f) => f.t < 1);
    this.shake = Math.max(0, this.shake - dt * 30);
  },

  draw(ctx) {
    for (const p of this.puffs) {
      ctx.fillStyle = `rgba(255,255,255,${0.85 * clamp(p.life / p.max, 0, 1)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (const s of this.stars) {
      ctx.globalAlpha = clamp(s.life / s.max * 1.5, 0, 1);
      starPath(ctx, s.x, s.y, s.r, s.rot);
      inked(ctx, '#ffd15c', 1.5);
      ctx.globalAlpha = 1;
    }
    for (const s of this.swipes) {
      const k = 1 - s.life / s.max;
      ctx.strokeStyle = `rgba(59,42,32,${1 - k})`;
      ctx.lineWidth = 3.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(s.x + i * 8 - 10, s.y - 10, 22, 0.2 + k * 0.4, 1.3 + k * 0.4);
        ctx.stroke();
      }
    }
    for (const y of this.yarns) {
      ctx.beginPath();
      ctx.arc(y.x, y.y, 9 * View.ui, 0, TAU);
      inked(ctx, '#f28fa0', 2);
      ctx.strokeStyle = 'rgba(59,42,32,0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(y.x, y.y, 5 * View.ui, y.t * 9, y.t * 9 + 2.5);
      ctx.stroke();
    }
    for (const f of this.flyFish) {
      const x = lerp(f.x0, f.x1, f.t), y = lerp(f.y0, f.y1, f.t) - Math.sin(f.t * Math.PI) * 50;
      fishShape(ctx, x, y, View.ui, f.t * 8);
    }
  },

  drawPops(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const p of this.pops) {
      const a = clamp((p.life / p.max) * 1.8, 0, 1);
      const k = 1 - p.life / p.max;
      const sc = k < 0.12 ? lerp(0.5, 1.15, k / 0.12) : 1;
      ctx.font = `900 ${Math.round(p.size * sc * View.ui)}px Nunito, sans-serif`;
      ctx.globalAlpha = a;
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    }
  },
};
