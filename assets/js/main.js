'use strict';
// ================= Mulai: ukuran layar, input, dan loop utama =================

const canvas = $('game');
const ctx = canvas.getContext('2d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function layout() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const kb = $('kb');
  const kbH = kb.classList.contains('hidden') ? 0 : kb.offsetHeight;
  document.documentElement.style.setProperty('--kb-h', kbH + 'px');
  const hb = $('hud-bottom');
  const zb = $('zoom-box');
  const gap = hb.classList.contains('hidden') ? 0
    : Math.max(hb.querySelector('.target-wrap').offsetHeight, zb.classList.contains('hidden') ? 0 : zb.offsetHeight) + 14;
  View.dpr = dpr;
  View.resize(W, H, H - kbH, gap);
  Kitchen.build();
  Oyen.relayout();
}

// ---------- gambar satu frame ----------
function render(t) {
  const { W, H, dpr, bottom } = View;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#fff3df';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  const sh = FX.shake * (reduceMotion ? 0.2 : 1);
  if (sh > 0.1) ctx.translate(rand(-sh, sh), rand(-sh, sh));

  Kitchen.draw(ctx);

  // urutkan dari belakang ke depan supaya tumpukannya benar
  const items = [];
  items.push({ y: View.bowl.y, draw: () => Kitchen.drawBowl(ctx, Game.mode === 'serbuan' ? Game.fish : LIVES, LIVES) });
  for (const e of Game.enemies) if (!e.dead && !e.T.bullet) items.push({ y: e.state === 'knocked' ? 1e5 : e.fy, draw: () => e.draw(ctx, t) });
  const oy = Oyen.jump && (Oyen.state === 'jump' || Oyen.state === 'back' || Oyen.state === 'zoom')
    ? lerp(Oyen.jump.y0, Oyen.jump.y1, Math.min(1, Oyen.jump.t)) + 1 : Oyen.y + 1;
  items.push({ y: oy, draw: () => Oyen.draw(ctx) });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();
  for (const e of Game.enemies) if (!e.dead && e.T.bullet) e.draw(ctx, t);

  FX.draw(ctx);
  const list = Game.enemies.filter((e) => e.targetable);
  Labels.draw(ctx, Labels.layout(list, Game.lock), Game.lock, t);
  FX.drawPops(ctx);
  ctx.restore();

  if (Game.state === 'menu') {
    // demo di belakang menu sedikit diredupkan supaya teks menu tetap jelas
    ctx.fillStyle = 'rgba(255,243,223,0.15)';
    ctx.fillRect(0, 0, W, bottom);
  }
}

// ---------- input ----------
function onKey(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (!k || k === 'Dead' || k === 'Process' || k === 'Unidentified') return;

  if (e.getModifierState) $('caps').classList.toggle('hidden', !e.getModifierState('CapsLock') || Game.state !== 'play');

  // ada keyboard fisik: matikan keyboard sentuh
  if (UI.touch && (k.length === 1 || k === 'Backspace')) {
    UI.touch = false;
    document.body.classList.remove('touch');
    if (Game.state === 'play' || Game.state === 'paused') UI.setHud(true, Game.mode, Game.lesson);
  }

  const scr = UI.screen;
  if (scr === 'scr-title') {
    const m = { 1: 'serbuan', 2: 'latihan', 3: 'sprint' }[k];
    if (m) { e.preventDefault(); UI.chooseMode(m); }
    return;
  }
  if (scr === 'scr-lessons') {
    if (k === 'Escape') { e.preventDefault(); Sound.click(); UI.showTitle(); return; }
    const i = parseInt(k, 10) - 1;
    const L = LESSONS[i];
    const btn = document.querySelectorAll('#lesson-list .lesson')[i];
    if (L && btn && !btn.disabled) {
      e.preventDefault();
      Sound.click();
      UI.begin('latihan', L);
    }
    return;
  }
  if (scr === 'scr-pause') {
    if (k === 'Escape') { e.preventDefault(); UI.resume(); }
    return;
  }
  if (scr === 'scr-results') {
    if (k === 'Enter') { e.preventDefault(); UI.restart(); }
    else if (k === 'Escape') { e.preventDefault(); UI.toMenu(); }
    return;
  }
  if (Game.state !== 'play') return;
  if (k === 'Escape') { e.preventDefault(); UI.pause(); return; }
  if (k === 'Enter') { e.preventDefault(); Game.zoomies(); return; }
  if (k === 'Backspace') { e.preventDefault(); Game.backspace(); return; }
  if (k === 'Tab') { e.preventDefault(); return; }
  if (k.length === 1) {
    e.preventDefault();
    if (e.repeat) return;
    Game.input(k);
  }
}

function onTouchKey(k) {
  Sound.init();
  if (Game.state !== 'play') return;
  if (k === 'back') Game.backspace();
  else if (k === 'zoom') Game.zoomies();
  else Game.input(k);
}

// ---------- boot ----------
UI.touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
document.body.classList.toggle('touch', UI.touch);
Keyboard.init($('kb'), onTouchKey);
UI.init();
layout();
Game.startDemo();
UI.showTitle();

window.addEventListener('keydown', onKey);
window.addEventListener('resize', () => layout());
window.addEventListener('blur', () => UI.pause());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    UI.pause();
    if (Sound.ctx) Sound.ctx.suspend();
  } else if (Sound.ctx) {
    Sound.ctx.resume();
  }
});
const wake = () => { Sound.init(); Sound.startMusic(); };
window.addEventListener('pointerdown', wake, { once: true });
window.addEventListener('keydown', wake, { once: true });

if (document.fonts && document.fonts.load) {
  Promise.all([
    document.fonts.load('800 20px "JetBrains Mono"'),
    document.fonts.load('900 20px Nunito'),
  ]).then(() => Kitchen.build()).catch(() => {});
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  Game.update(dt);
  Oyen.update(dt);
  Kitchen.update(dt);
  FX.update(dt);
  render(now / 1000);
  UI.update(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
