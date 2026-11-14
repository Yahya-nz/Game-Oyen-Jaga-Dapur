'use strict';
// ================= Tikus-tikus pencuri ikan, plus label katanya =================

const MTYPES = {
  cicit:   { name: 'Cicit',     color: '#b8b2c6', size: 1,    T: 14, len: [3, 5],  steal: 1, pts: 1 },
  gesit:   { name: 'Si Gesit',  color: '#c99a72', size: 0.95, T: 9,  len: [2, 4],  steal: 1, pts: 1.2, board: true },
  gembul:  { name: 'Pak Gembul', color: '#a39bb2', size: 1.45, T: 21, len: [7, 11], steal: 2, pts: 1.5 },
  ketapel: { name: 'Si Ketapel', color: '#b8b2c6', size: 1.05, T: 18, len: [4, 6],  steal: 1, pts: 1.4, shooter: true },
  tumpuk:  { name: 'Tiga Sekawan', color: '#b8b2c6', size: 1.2, T: 14, len: [5, 7], steal: 1, pts: 1.3, splits: 2 },
  kacang:  { name: 'Kacang',    color: '#8bc34a', size: 0.5,  T: 4,  len: [1, 1],  steal: 0, pts: 0.6, bullet: true },
  raja:    { name: 'Raja Tikus Got', color: '#8e8299', size: 2.7, T: 46, len: [0, 0], steal: 2, pts: 3, boss: true },
};
const GOLD = '#ffc93c';

let mouseId = 0;

class Mouse {
  constructor(type, text, opt = {}) {
    this.id = ++mouseId;
    this.type = type;
    this.T = MTYPES[type];
    this.text = text;
    this.done = 0;
    this.miss = 0;
    this.missT = 0;
    this.u = opt.u || 0;
    this.time = opt.time || this.T.T;
    this.row = opt.row != null ? opt.row : 1;
    this.hover = opt.hover || 0;
    this.gold = !!opt.gold;
    this.dead = false;
    this.state = 'run';     // run | caught | knocked | flee
    this.spawnT = 0;
    this.phase = rand(0, TAU);
    this.flinch = 0;
    this.shots = 0;
    this.shootT = rand(1.4, 2.2);
    this.pull = 0;
    this.patches = 0;
    if (this.T.boss) {
      this.words = opt.words;
      this.seg = 0;
      this.text = this.words[0];
    }
    if (this.T.bullet) {
      this.from = opt.from;
      this.to = opt.to;
    }
    this.place(0);
  }

  get first() { return this.text[this.done]; }
  get targetable() { return !this.dead && (this.state === 'run' || this.state === 'flee') && this.done < this.text.length; }

  update(dt, mul, t) {
    this.spawnT += dt;
    this.missT = Math.max(0, this.missT - dt);
    this.flinch = Math.max(0, this.flinch - dt * 5);
    this.pull = Math.max(0, this.pull - dt * 2.5);
    if (this.state === 'run') {
      let du = (dt / this.time) * mul;
      if (this.hover && this.u >= this.hover) du = 0;
      this.u += du;
    } else if (this.state === 'flee') {
      this.fx += this.fv * dt * mul;
      if (this.fx > View.W + 80) this.dead = true;
    } else if (this.state === 'knocked') {
      this.kx += this.kvx * dt;
      this.ky += this.kvy * dt;
      this.kvy += 1500 * dt;
      this.spin += this.kvs * dt;
      this.koT -= dt;
      if (this.koT <= 0 || this.ky > View.H + 100) this.dead = true;
    }
    this.place(t);
  }

  // posisi di layar: sx = tengah badan, fy = kaki, sy = atas kepala (patokan label)
  place(t) {
    const k = (this.k = View.rowS(this.row) * this.T.size);
    if (this.T.bullet) {
      const u = clamp(this.u, 0, 1);
      this.sx = lerp(this.from.x, this.to.x, u);
      this.fy = lerp(this.from.y, this.to.y, u) - Math.sin(u * Math.PI) * 60 * View.ui;
      this.sy = this.fy - 10 * k;
      return;
    }
    if (this.state === 'flee') {
      this.sx = this.fx;
    } else if (this.state === 'caught') {
      // diam di tempat menunggu terkaman
    } else if (this.state === 'knocked') {
      this.sx = this.kx;
      this.fy = this.ky;
      this.sy = this.fy - 46 * k;
      return;
    } else {
      this.sx = lerp(View.startX, View.endX(), clamp(this.u, 0, 1));
    }
    this.fy = View.rowY(this.row);
    this.sy = this.fy - (this.T.boss ? 62 : 46) * k;
  }

  // dipukul Oyen: terlempar sambil berputar
  knock(dir = 1) {
    if (this.T.boss && !this.defeated) {
      // raja cuma benjol, belum kabur
      this.flinch = 1;
      FX.starBurst(this.sx, this.sy + 14, 6);
      FX.puff(this.sx, this.fy, 4, this.k * 0.6);
      FX.shake = 5;
      if (!Game.quiet) Sound.bonk(1.6);
      return;
    }
    this.state = 'knocked';
    this.kx = this.sx;
    this.ky = this.fy;
    this.kvx = (this.T.boss ? 240 : 420) * dir * View.ui + rand(-60, 60);
    this.kvy = -rand(520, 700) * View.ui;
    this.kvs = rand(10, 16) * (dir > 0 ? 1 : -1);
    this.spin = 0;
    this.koT = 1.4;
    FX.starBurst(this.sx, this.fy - 24 * this.k, this.T.boss ? 12 : 6);
    FX.puff(this.sx, this.fy, 5, this.k);
    if (!Game.quiet) Sound.bonk(this.T.boss ? 1.5 : this.k);
  }

  // sampai di mangkuk: ambil ikan lalu kabur ke kanan
  steal() {
    this.state = 'flee';
    this.fx = this.sx;
    this.fv = 520 * View.ui;
    this.carry = true;
    this.done = 0;
    this.miss = 0;
  }

  draw(ctx, t) {
    if (this.T.bullet) return this.drawPea(ctx, t);
    const k = this.k;
    const fade = clamp(this.spawnT / 0.25, 0, 1);
    ctx.save();
    ctx.globalAlpha = fade;
    if (this.state !== 'knocked') {
      ctx.fillStyle = 'rgba(59,42,32,0.16)';
      ctx.beginPath();
      ctx.ellipse(this.sx, this.fy + 1, 26 * k, 6 * k, 0, 0, TAU);
      ctx.fill();
    }
    ctx.translate(this.sx, this.fy);
    if (this.state === 'knocked') {
      ctx.translate(0, -20 * k);
      ctx.rotate(this.spin);
      ctx.translate(0, 20 * k);
    }
    const shake = this.flinch > 0 ? Math.sin(t * 70) * 2.5 * this.flinch : 0;
    ctx.translate(shake, 0);
    const dir = this.state === 'flee' ? -1 : 1; // menghadap kiri (1) atau kanan (-1)
    ctx.scale(k * dir, k);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const lw = 2.4 / k;
    const running = this.state === 'flee' || (this.state === 'run' && !(this.hover && this.u >= this.hover));
    const step = running ? Math.sin(t * 18 + this.phase) : 0;
    const type = this.type;

    if (type === 'tumpuk') this.drawCoat(ctx, t, lw, step);
    else this.drawBody(ctx, t, lw, step, running);

    // ikan curian di mulut
    if (this.carry) fishShape(ctx, -36, -14, 0.8, 0.3);
    ctx.restore();

    if (this.state === 'caught') {
      ctx.font = `900 ${Math.round(24 * k)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText('!', this.sx, this.sy - 4);
      ctx.fillStyle = '#f2545b';
      ctx.fillText('!', this.sx, this.sy - 4);
    }
    if (this.state === 'knocked') {
      for (let i = 0; i < 3; i++) {
        const a = t * 7 + (i / 3) * TAU;
        starPath(ctx, this.sx + Math.cos(a) * 20 * k, this.sy + Math.sin(a) * 6 * k, 5 * k, a);
        inked(ctx, '#ffd15c', 1.3);
      }
    }
  }

  drawBody(ctx, t, lw, step, running) {
    const T = this.T;
    const boss = T.boss;
    const fat = this.type === 'gembul' || boss;
    const col = T.color;
    const knocked = this.state === 'knocked';
    // ekor
    ctx.beginPath();
    ctx.moveTo(20, -10);
    const w = Math.sin(t * 6 + this.phase) * 6;
    ctx.bezierCurveTo(40, -6 + w, 48, -24 - w, 62, -18 + w);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = '#f2a3b3';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    // jubah raja
    if (boss) {
      ctx.beginPath();
      ctx.moveTo(-6, -36);
      ctx.quadraticCurveTo(26, -40, 34, -6);
      ctx.lineTo(4, -4);
      ctx.closePath();
      inked(ctx, '#d94f5c', lw);
    }
    // papan seluncur
    if (T.board) {
      ctx.beginPath();
      ctx.moveTo(-26, -2); ctx.lineTo(22, -2); ctx.quadraticCurveTo(28, -2, 28, -7);
      ctx.moveTo(-26, -2); ctx.quadraticCurveTo(-32, -2, -32, -7);
      ctx.lineWidth = 5;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f2545b';
      ctx.stroke();
      for (const wx of [-16, 14]) { ctx.beginPath(); ctx.arc(wx, 3, 4, 0, TAU); inked(ctx, '#fff3c4', 1.6); }
    }
    // kaki
    const lift = T.board ? 6 : 0;
    for (const [fx, ph] of [[10, 0], [-10, Math.PI]]) {
      const s = running && !T.board ? Math.sin(t * 18 + this.phase + ph) : 0;
      ctx.beginPath();
      ctx.ellipse(fx + s * 5, -2 - lift - Math.max(0, s) * 3, 6, 3.5, 0, 0, TAU);
      inked(ctx, '#f2a3b3', lw * 0.8);
    }
    // badan
    const bob = running ? Math.abs(step) * 1.5 : 0;
    const brx = fat ? 28 : 22, bry = fat ? 19 : 14;
    ctx.beginPath();
    ctx.ellipse(2, -14 - lift - bob - (fat ? 4 : 0), brx, bry, 0, 0, TAU);
    inked(ctx, col, lw);
    ctx.beginPath();
    ctx.ellipse(-4, -9 - lift - bob - (fat ? 3 : 0), brx * 0.55, bry * 0.5, 0, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
    // keju emas di punggung
    if (this.gold) {
      ctx.beginPath();
      ctx.moveTo(-2, -28 - lift - bob); ctx.lineTo(22, -24 - lift - bob); ctx.lineTo(14, -40 - lift - bob);
      ctx.closePath();
      inked(ctx, GOLD, lw);
      ctx.fillStyle = 'rgba(200,140,20,0.6)';
      ctx.beginPath(); ctx.arc(10, -29 - lift - bob, 2.2, 0, TAU); ctx.fill();
      if (Math.sin(t * 6 + this.phase) > 0.6) { starPath(ctx, 24, -42 - lift, 3.5, t); ctx.fillStyle = '#fff6c4'; ctx.fill(); }
    }
    // ketapel
    if (T.shooter) {
      const pull = this.pull;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.moveTo(-30, -6 - lift); ctx.lineTo(-30, -22);
      ctx.moveTo(-30, -22); ctx.lineTo(-36, -32);
      ctx.moveTo(-30, -22); ctx.lineTo(-24, -32);
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#8b5a3c';
      ctx.beginPath();
      ctx.moveTo(-36, -31); ctx.lineTo(-30 + pull * 14, -24); ctx.lineTo(-24, -31);
      ctx.stroke();
    }
    // kepala
    const hy = -22 - lift - bob - (fat ? 8 : 0);
    const hx = fat ? -24 : -20;
    ctx.beginPath();
    ctx.arc(hx + 8, hy - 12, 9.5, 0, TAU);   // telinga
    inked(ctx, col, lw);
    ctx.beginPath();
    ctx.arc(hx + 8, hy - 12, 5.5, 0, TAU);
    ctx.fillStyle = '#f7b7c3';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 12, hy - 8);
    ctx.quadraticCurveTo(hx - 16, hy - 12, hx - 15, hy + 3);
    ctx.quadraticCurveTo(hx - 2, hy + 12, hx + 12, hy + 6);
    ctx.closePath();
    inked(ctx, col, lw);
    // topi / bandana / mahkota
    if (T.board) {
      ctx.beginPath();
      ctx.arc(hx + 2, hy - 6, 9, Math.PI * 1.05, Math.PI * 1.95);
      ctx.closePath();
      inked(ctx, '#f2545b', lw);
    }
    if (T.shooter) {
      ctx.fillStyle = '#4cc38a';
      ctx.fillRect(hx - 8, hy - 9, 20, 5);
      ctx.beginPath(); ctx.moveTo(hx + 12, hy - 7); ctx.lineTo(hx + 20, hy - 12); ctx.lineTo(hx + 19, hy - 3); ctx.closePath(); ctx.fill();
    }
    if (boss) {
      const tilt = Math.min(this.patches, 4) * 0.12;
      ctx.save();
      ctx.translate(hx, hy - 12);
      ctx.rotate(-0.15 + tilt);
      if (this.seg < this.words.length - 0) {
        ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(-11, -12); ctx.lineTo(-5, -6); ctx.lineTo(0, -14); ctx.lineTo(5, -6); ctx.lineTo(11, -12); ctx.lineTo(10, 0);
        ctx.closePath();
        inked(ctx, GOLD, lw);
      }
      ctx.restore();
    }
    // mata
    const eyeX = hx - 6, eyeY = hy - 2;
    if (knocked) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.moveTo(eyeX - 3, eyeY - 3); ctx.lineTo(eyeX + 3, eyeY + 3);
      ctx.moveTo(eyeX + 3, eyeY - 3); ctx.lineTo(eyeX - 3, eyeY + 3);
      ctx.stroke();
    } else if (this.carry) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY + 1, 3.2, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      const big = this.flinch > 0 || this.state === 'caught' ? 1.35 : 1;
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 2.8 * big, 3.6 * big, 0, 0, TAU);
      ctx.fillStyle = INK;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(eyeX - 0.8, eyeY - 1.4, 1.1, 0, TAU); ctx.fill();
      if (boss || this.type === 'gembul') {
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        ctx.beginPath();
        ctx.moveTo(eyeX - 5, eyeY - 7); ctx.lineTo(eyeX + 4, eyeY - 5);
        ctx.stroke();
      }
    }
    // hidung & kumis
    ctx.beginPath();
    ctx.arc(hx - 15, hy + 2, 2.6, 0, TAU);
    ctx.fillStyle = '#f07f93';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(59,42,32,0.7)';
    ctx.beginPath();
    ctx.moveTo(hx - 12, hy + 3); ctx.lineTo(hx - 24, hy);
    ctx.moveTo(hx - 12, hy + 4); ctx.lineTo(hx - 23, hy + 6);
    ctx.stroke();
    // senyum licik / gigi emas raja
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.arc(hx - 8, hy + 3, 3.5, 0.2, Math.PI * 0.8);
    ctx.stroke();
    if (boss) {
      ctx.fillStyle = GOLD;
      ctx.fillRect(hx - 9, hy + 5.5, 2.4, 3);
    }
    // plester tiap kena pukul (raja)
    if (boss && this.patches) {
      const spots = [[hx + 2, hy - 2, 0.6], [6, -22, -0.4], [-6, -8, 0.3], [16, -14, 0.9], [hx - 4, hy + 8, -0.2], [0, -30, 0.1]];
      for (let i = 0; i < Math.min(this.patches, spots.length); i++) {
        const [px, py, r] = spots[i];
        ctx.save();
        ctx.translate(px, py - lift);
        ctx.rotate(r);
        roundRect(ctx, -7, -2.5, 14, 5, 2);
        inked(ctx, '#ffd8b0', 1);
        ctx.restore();
      }
    }
    // keringat saat sedang diketik
    if (this.flinch > 0.2 && !knocked) {
      ctx.beginPath();
      ctx.moveTo(hx + 14, hy - 20);
      ctx.quadraticCurveTo(hx + 18, hy - 12, hx + 14, hy - 10);
      ctx.quadraticCurveTo(hx + 10, hy - 12, hx + 14, hy - 20);
      inked(ctx, '#9fdcf5', 1.2);
    }
  }

  // tiga tikus menyamar pakai jas panjang
  drawCoat(ctx, t, lw, step) {
    const bob = Math.abs(step) * 1.5;
    // ekor-ekor yang nongol
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, -4); ctx.quadraticCurveTo(24, 0 + step * 3, 30, -8);
    ctx.stroke();
    ctx.strokeStyle = '#f2a3b3';
    ctx.lineWidth = 2;
    ctx.stroke();
    for (const fx of [-8, 6]) {
      ctx.beginPath();
      ctx.ellipse(fx + step * 3, -2, 6, 3.5, 0, 0, TAU);
      inked(ctx, '#f2a3b3', lw * 0.8);
    }
    roundRect(ctx, -16, -62 - bob, 30, 58, 8);
    inked(ctx, '#d9b98a', lw);
    ctx.strokeStyle = 'rgba(59,42,32,0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-1, -60 - bob); ctx.lineTo(-1, -6);
    ctx.stroke();
    for (const by of [-48, -36, -24]) { ctx.beginPath(); ctx.arc(-5, by - bob, 1.8, 0, TAU); ctx.fillStyle = INK; ctx.fill(); }
    // mata yang ngintip dari celah jas
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(-6, -30 - bob, 1.8, 0, TAU); ctx.arc(-1, -30 - bob, 1.8, 0, TAU); ctx.fill();
    // kepala atas pakai topi
    const hx = -10, hy = -70 - bob;
    ctx.beginPath(); ctx.arc(hx + 9, hy - 8, 7.5, 0, TAU); inked(ctx, this.T.color, lw);
    ctx.beginPath();
    ctx.moveTo(hx + 12, hy - 6);
    ctx.quadraticCurveTo(hx - 14, hy - 10, hx - 13, hy + 3);
    ctx.quadraticCurveTo(hx - 2, hy + 11, hx + 12, hy + 6);
    ctx.closePath();
    inked(ctx, this.T.color, lw);
    roundRect(ctx, hx - 8, hy - 20, 18, 9, 3);
    inked(ctx, '#6b4a3a', lw);
    ctx.fillRect(hx - 13, hy - 12, 28, 3);
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(hx - 5, hy - 1, 2.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(hx - 13, hy + 2, 2.2, 0, TAU); ctx.fillStyle = '#f07f93'; ctx.fill();
  }

  drawPea(ctx, t) {
    const r = 9 * View.ui;
    ctx.fillStyle = 'rgba(59,42,32,0.12)';
    ctx.beginPath();
    ctx.ellipse(this.sx, lerp(this.from.y, this.to.y, clamp(this.u, 0, 1)) + 2, r, r * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.sx, this.fy, r, 0, TAU);
    inked(ctx, '#8bc34a', 2.2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(this.sx - r * 0.35, this.fy - r * 0.35, r * 0.3, 0, TAU); ctx.fill();
  }
}

// ---------- label kata di atas kepala tikus ----------
const Labels = {
  layout(list, lock) {
    const ui = View.ui;
    const placed = [];
    const out = [];
    const sorted = list.slice().sort((a, b) => (b === lock) - (a === lock) || b.u - a.u);
    const topLimit = 96 * ui;
    for (const e of sorted) {
      if (!e.targetable) continue;
      const size = Math.round((e.T.bullet ? 15 : e.T.boss ? 22 : 18) * clamp(ui, 0.75, 1.2) * (e === lock ? 1.1 : 1));
      const cw = size * 0.6;
      const w = cw * e.text.length + size * 0.9;
      const h = size * 1.5;
      const x = clamp(e.sx, w / 2 + 6, View.W - w / 2 - 6);
      const y0 = e.sy - h * 0.6;
      let y = Math.max(y0, topLimit);
      for (let tries = 0; tries < 8; tries++) {
        const hit = placed.find((p) => Math.abs(p.x - x) < (p.w + w) / 2 + 4 && Math.abs(p.y - y) < (p.h + h) / 2 + 2);
        if (!hit) break;
        y = hit.y - (hit.h + h) / 2 - 3;
        if (y < topLimit) y = hit.y + (hit.h + h) / 2 + 3;
      }
      const L = { e, x, y, w, h, size, cw, moved: Math.abs(y - y0) > h * 0.6 };
      placed.push(L);
      out.push(L);
    }
    return out.reverse();
  },

  draw(ctx, labels, lock, t) {
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (const L of labels) {
      const e = L.e;
      const locked = e === lock;
      const x0 = L.x - L.w / 2, y0 = L.y - L.h / 2;
      ctx.globalAlpha = clamp(e.spawnT / 0.3, 0, 1);
      if (L.moved) {
        ctx.strokeStyle = 'rgba(59,42,32,0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(L.x, L.y + L.h / 2); ctx.lineTo(e.sx, e.sy); ctx.stroke();
      }
      // bayangan tebal ala stiker
      roundRect(ctx, x0, y0 + 3, L.w, L.h, L.h * 0.32);
      ctx.fillStyle = INK;
      ctx.fill();
      roundRect(ctx, x0, y0, L.w, L.h, L.h * 0.32);
      ctx.fillStyle = e.gold ? '#fff1b8' : e.state === 'flee' ? '#ffe1e3' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = locked ? 3 : 2;
      ctx.strokeStyle = locked ? '#f28c28' : INK;
      ctx.stroke();

      ctx.font = `800 ${L.size}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
      const tx = x0 + L.size * 0.45;
      const shake = e.missT > 0 ? Math.sin(t * 90) * 2.5 : 0;
      for (let i = 0; i < e.text.length; i++) {
        if (i < e.done) ctx.fillStyle = '#f6b26b';
        else if (i === e.done && locked && e.missT > 0) ctx.fillStyle = '#f2545b';
        else ctx.fillStyle = INK;
        ctx.fillText(e.text[i], tx + i * L.cw + shake, L.y + 1);
      }
      if (locked && e.done < e.text.length) {
        ctx.fillStyle = e.missT > 0 ? '#f2545b' : '#f28c28';
        ctx.fillRect(tx + e.done * L.cw + shake, L.y + L.size * 0.55, L.cw * 0.9, 3);
      }
      ctx.globalAlpha = 1;
    }
  },
};
