'use strict';
// ================= Aturan main: mode, gelombang, mengetik, skor =================

const LIVES = 5;

const LEVELS = {
  santai: { label: 'Santai', speed: 0.72, len: -1, active: -1 },
  normal: { label: 'Normal', speed: 1, len: 0, active: 0 },
  jago:   { label: 'Jago', speed: 1.3, len: 1, active: 2 },
};

const WAVE_INTRO = {
  1: 'Ketik kata di atas tikus, Oyen yang nerkam!',
  2: 'Si Gesit datang: naik skateboard, larinya kencang',
  3: 'Pak Gembul: badannya besar, katanya panjang',
  4: 'Si Ketapel: ketik huruf di kacangnya biar Oyen nggak pusing',
  6: 'Tiga Sekawan: kalau jasnya copot, kabur jadi dua',
};

const POWERS = {
  ikan:    { name: 'IKAN +1', color: '#2bb3a3' },
  susu:    { name: 'SUSU TUMPAH, TIKUS KEPLESET', color: '#5aa9e6' },
  benang:  { name: 'BOLA BENANG', color: '#f2779a' },
  zoomies: { name: 'ZOOMIES +1', color: '#f28c28' },
};

const Game = {
  state: 'menu',        // menu | play | paused | over
  mode: 'demo',         // demo | serbuan | latihan | sprint
  lesson: null,
  enemies: [],
  lock: null,
  boss: null,
  t: 0,
  quiet: true,

  reset() {
    this.enemies = [];
    this.lock = null;
    this.boss = null;
    this.score = 0;
    this.fish = LIVES;
    this.combo = 0;
    this.wave = 0;
    this.waveState = 'none';
    this.waveTimer = 0;
    this.spawnTimer = 0.6;
    this.toSpawn = 0;
    this.slowT = 0;
    this.chainT = 0;
    this.zoom = { meter: 0, charges: 0 };
    this.goal = 0;
    this.timeLeft = 0;
    this.clockOn = false;
    this.finished = false;
    this.stats = {
      correct: 0, wrong: 0, words: 0, perfect: 0, bestCombo: 0, stolen: 0, bosses: 0,
      keyHit: {}, keyMiss: {}, wordMiss: {}, typingTime: 0,
    };
    FX.reset();
    Oyen.reset();
  },

  start(mode, lesson) {
    this.mode = mode;
    this.lesson = mode === 'latihan' ? lesson : null;
    this.diff = mode === 'serbuan' ? LEVELS[Settings.level] : LEVELS.normal;
    this.quiet = false;
    Words.setup(this.lesson, Settings.lang);
    this.reset();
    this.state = 'play';
    if (mode === 'serbuan') {
      this.beginWave(1);
    } else if (mode === 'latihan') {
      this.goal = 30;
      UI.banner(lesson.name, lesson.desc);
      this.spawnTimer = 1.2;
    } else if (mode === 'sprint') {
      this.timeLeft = 60;
      UI.banner('Uji 60 Detik', 'Waktu jalan begitu kamu mulai mengetik');
      this.spawnTimer = 1;
    }
    Sound.setIntensity(1, 112);
    Sound.setPaused(false);
    Sound.setSlow(false);
    Sound.meow();
  },

  startDemo() {
    this.mode = 'demo';
    this.state = 'menu';
    this.quiet = true;
    this.lesson = null;
    this.diff = LEVELS.normal;
    Words.setup(null, Settings.lang);
    this.reset();
    this.demoT = 1;
    Sound.setIntensity(0, 100);
    Sound.setPaused(false);
    Sound.setSlow(false);
  },

  // ---------- gelombang ----------
  speedOf(n) { return Math.min(2.1, 1 + (n - 1) * 0.05) * this.diff.speed; },

  beginWave(n) {
    this.wave = n;
    this.waveState = 'intro';
    this.waveTimer = 2.4;
    this.waveC0 = this.stats.correct;
    this.waveW0 = this.stats.wrong;
    const boss = n % 5 === 0;
    this.toSpawn = boss ? 0 : Math.min(5 + n * 2, 30) + this.diff.active * 2;
    this.spawnTimer = 0.3;
    if (boss) {
      UI.banner('Raja Tikus Got!', 'Ketik peribahasanya kata demi kata', 'boss');
      Sound.bossAlarm();
    } else {
      UI.banner('Gelombang ' + n, WAVE_INTRO[n] || (n % 5 === 4 ? 'Raja Tikus Got datang setelah ini' : 'Makin cepat, makin banyak'));
      Sound.waveStart();
    }
    Sound.setIntensity(boss || n >= 9 ? 2 : 1, boss ? 118 : Math.min(122, 110 + n * 1.2));
  },

  maxActive() {
    if (this.mode === 'latihan') return this.lesson && this.lesson.id === 'tengah' ? 2 : 3;
    if (this.mode === 'sprint') return 4;
    if (this.mode === 'demo') return 3;
    return Math.max(2, Math.min(3 + Math.floor(this.wave * 0.7), 11) + this.diff.active);
  },

  alive() { return this.enemies.filter((e) => e.targetable); },

  firstSet() {
    const s = new Set();
    for (const e of this.enemies) if (e.targetable) s.add(e.text[e.done].toLowerCase());
    return s;
  },

  // pilih jalur yang paling lega supaya label tidak bertumpuk
  pickRow(textLen) {
    const travel = View.startX - View.endX();
    const hoverMode = this.mode === 'latihan' || this.mode === 'sprint';
    let best = -1, bestFree = -1;
    for (const r of shuffle([0, 1, 2, 3])) {
      let free = travel;
      let busy = false;
      for (const e of this.enemies) {
        if (e.dead || e.T.bullet || e.state === 'knocked' || Math.abs(e.row - r) > 0.6) continue;
        if (hoverMode) busy = true;
        if (e.state === 'flee') { free = Math.min(free, Math.max(0, View.startX - e.sx)); continue; }
        free = Math.min(free, e.u * travel);
      }
      if (busy) continue;
      if (free > bestFree) { bestFree = free; best = r; }
    }
    const need = (textLen * 11 + 60) * View.ui;
    return bestFree >= need ? best : -1;
  },

  chooseType() {
    const n = this.wave;
    const shooters = this.enemies.filter((e) => !e.dead && e.type === 'ketapel').length;
    const w = {
      cicit: 10,
      gesit: n >= 2 ? 3 + n * 0.4 : 0,
      gembul: n >= 3 ? 1.5 + n * 0.2 : 0,
      ketapel: n >= 4 && shooters < 2 ? 1.2 + n * 0.1 : 0,
      tumpuk: n >= 6 ? 1.5 + n * 0.12 : 0,
    };
    let sum = 0;
    for (const k in w) sum += w[k];
    let r = Math.random() * sum;
    for (const k in w) { r -= w[k]; if (r <= 0) return k; }
    return 'cicit';
  },

  spawn(type, opt = {}) {
    const T = MTYPES[type];
    let [lo, hi] = T.len;
    let speed = 1;
    let hover = 0;
    if (this.mode === 'serbuan') {
      const g = Math.floor((this.wave - 1) / 3);
      if (type === 'cicit') { lo += Math.floor(g / 2); hi += g; }
      if (type === 'gesit') hi = Math.min(5, hi + Math.floor(g / 2));
      if (type === 'gembul' || type === 'tumpuk') { lo += Math.floor(g / 3); hi += Math.floor(g / 2); }
      lo += this.diff.len; hi += this.diff.len;
      speed = this.speedOf(this.wave);
      if (type === 'ketapel') hover = rand(0.3, 0.5);
    } else if (this.mode === 'latihan') {
      lo = 3; hi = 6;
      if (this.lesson.digits) { lo = 2; hi = 5; }
      hover = rand(0.35, 0.75);
      speed = 1.7;
    } else if (this.mode === 'sprint') {
      lo = 3; hi = 7;
      hover = rand(0.3, 0.8);
      speed = 1.9;
    } else {
      lo = 3; hi = 7;
      speed = 1.3;
    }
    lo = Math.max(2, Math.min(lo, 10));
    hi = Math.max(lo, Math.min(hi, 12));
    const text = opt.text || Words.pick(lo, hi, this.firstSet());
    let row = opt.row;
    if (row == null) {
      row = this.pickRow(text.length);
      if (row < 0) return null;
    }
    const gold = opt.gold != null ? opt.gold : this.mode === 'serbuan' && this.wave >= 2 && Math.random() < 0.07;
    const e = new Mouse(type, text, { time: T.T / speed, row, gold, hover, u: opt.u });
    if (opt.u) e.spawnT = 0.3;
    this.enemies.push(e);
    return e;
  },

  spawnBoss() {
    const idx = this.wave / 5 - 1;
    const words = Words.proverb(idx).split(' ');
    const e = new Mouse('raja', null, { words, time: MTYPES.raja.T / (this.diff.speed * (1 + idx * 0.08)), row: 1.6, u: 0.16 });
    e.spawnT = 0.3;
    this.boss = e;
    this.enemies.push(e);
    this.minionT = 3;
    Sound.spawnBoss();
    FX.shake = 6;
    UI.bossBar(e);
  },

  firePea(e) {
    e.pull = 1;
    const ch = Words.char(this.firstSet());
    const from = { x: e.sx - 30 * e.k, y: e.fy - 28 * e.k };
    const to = { x: Oyen.x + 10 * View.ui, y: Oyen.y - 70 * View.ui };
    const p = new Mouse('kacang', ch, { from, to, row: e.row, time: MTYPES.kacang.T / Math.min(1.5, this.speedOf(this.wave)) });
    p.spawnT = 0.3;
    this.enemies.push(p);
    if (!this.quiet) Sound.shoot();
  },

  // ---------- update ----------
  update(dt) {
    this.t += dt;
    if (this.state === 'paused') return;
    let mul = 1;
    if (this.slowT > 0) {
      this.slowT -= dt;
      mul = 0.45;
      if (this.slowT <= 0) Sound.setSlow(false);
    }
    if (this.chainT > 0) this.chainT -= dt;
    if (this.state === 'play') this.updateFlow(dt);
    else if (this.state === 'menu') this.updateDemo(dt);
    else if (this.state === 'over') mul = 0.3;

    let active = false;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.update(dt, mul, this.t);
      if (e.state === 'caught') {
        e.caughtT = (e.caughtT || 0) + dt;
        if (e.caughtT > 1.3) e.knock(1);
      }
      if (e.T.shooter && e.state === 'run' && this.state === 'play') this.updateShooter(e, dt);
      if (e.targetable && e.spawnT > 0.2) active = true;
      if (e.state === 'run' && e.u >= 1) this.reach(e);
    }
    if (this.state === 'play' && active && (this.mode !== 'sprint' || this.clockOn)) this.stats.typingTime += dt;
    if (this.lock && !this.lock.targetable) this.lock = null;
    this.enemies = this.enemies.filter((e) => !e.dead);
  },

  updateFlow(dt) {
    const m = this.mode;
    if (m === 'serbuan') {
      if (this.waveState === 'intro') {
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
          this.waveState = 'fight';
          if (this.wave % 5 === 0) this.spawnBoss();
        }
      } else if (this.waveState === 'fight') {
        if (this.boss) {
          this.minionT -= dt;
          const minions = this.alive().filter((e) => !e.T.boss && !e.T.bullet).length;
          if (this.minionT <= 0 && minions < 2 + Math.floor(this.wave / 10)) {
            if (this.spawn(Math.random() < 0.6 ? 'cicit' : 'gesit')) this.minionT = rand(2.6, 3.8) / this.diff.speed;
            else this.minionT = 0.4;
          }
        } else {
          this.spawnTimer -= dt;
          const n = this.alive().filter((e) => !e.T.bullet).length;
          if (this.toSpawn > 0 && this.spawnTimer <= 0 && n < this.maxActive()) {
            if (this.spawn(this.chooseType())) {
              this.toSpawn--;
              this.spawnTimer = Math.max(0.65, 2.4 - this.wave * 0.12) / this.diff.speed * rand(0.7, 1.3);
            } else this.spawnTimer = 0.3;
          }
          const busy = this.enemies.some((e) => !e.dead && e.state !== 'knocked');
          if (this.toSpawn <= 0 && !busy) this.waveClear();
        }
      } else if (this.waveState === 'clear') {
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) this.beginWave(this.wave + 1);
      }
    } else if (m === 'latihan' || m === 'sprint') {
      if (m === 'sprint' && this.clockOn) {
        const before = Math.ceil(this.timeLeft);
        this.timeLeft -= dt;
        const now = Math.ceil(this.timeLeft);
        if (now !== before && now <= 5 && now > 0) Sound.tick();
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.finish(true); return; }
      }
      this.spawnTimer -= dt;
      const remaining = m === 'latihan' ? this.goal - this.stats.words - this.alive().length : 99;
      if (this.spawnTimer <= 0 && this.alive().length < this.maxActive() && remaining > 0) {
        this.spawn(Math.random() < 0.75 ? 'cicit' : 'gesit');
        this.spawnTimer = m === 'sprint' ? 0.35 : 0.9;
      }
    }
  },

  waveClear() {
    this.waveState = 'clear';
    this.waveTimer = 2;
    const c = this.stats.correct - this.waveC0;
    const w = this.stats.wrong - this.waveW0;
    const acc = c + w ? c / (c + w) : 1;
    let sub = `Akurasi ${Math.round(acc * 100)}%`;
    if (acc >= 0.97 && c > 10) {
      const bonus = 300 + this.wave * 50;
      this.score += bonus;
      sub += ` • bonus rapi +${bonus}`;
    }
    UI.banner('Gelombang ' + this.wave + ' beres!', sub, 'clear');
    Oyen.happy();
    Sound.win();
  },

  updateShooter(e, dt) {
    if (!e.hover || e.u < e.hover) return;
    e.shootT -= dt;
    if (e.shootT <= 0) {
      if (e.shots >= 3) { e.hover = 0; return; }
      e.shots++;
      e.shootT = rand(2.4, 3.4) / this.speedOf(this.wave);
      this.firePea(e);
    }
  },

  // ---------- demo di layar judul ----------
  updateDemo(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.alive().length < this.maxActive()) {
      this.spawn(pick(['cicit', 'cicit', 'gesit', 'gembul', 'tumpuk']));
      this.spawnTimer = rand(1.2, 2.2);
    }
    this.demoT -= dt;
    if (this.demoT <= 0) {
      this.demoT = rand(0.1, 0.22);
      let e = this.lock;
      if (!e) {
        const list = this.alive().filter((x) => x.u > 0.3);
        if (!list.length) return;
        e = list.sort((a, b) => b.u - a.u)[0];
        this.demoT += 0.3;
      }
      this.input(e.text[e.done]);
    }
  },

  // ---------- mengetik ----------
  same(a, b) { return this.lesson && this.lesson.caps ? a === b : a.toLowerCase() === b.toLowerCase(); },

  findTarget(ch, bulletsOnly) {
    let best = null;
    for (const e of this.enemies) {
      if (!e.targetable || (bulletsOnly && !e.T.bullet)) continue;
      if (!this.same(ch, e.text[e.done])) continue;
      const prio = e.state === 'flee' ? 2 : e.u; // pencuri yang kabur didahulukan
      if (!best || prio > best.prio) best = { e, prio };
    }
    return best && best.e;
  },

  input(ch) {
    if (this.state !== 'play' && this.state !== 'menu') return;
    if (ch === ' ') return;
    if (this.state === 'play' && this.mode === 'sprint' && !this.clockOn) {
      if (!this.findTarget(ch) && !this.lock) return;
      this.clockOn = true;
    }
    const e = this.lock;
    if (e && e.targetable) {
      if (this.same(ch, e.text[e.done])) return this.hitLetter(e);
      const b = this.findTarget(ch, true);
      if (b) return this.hitLetter(b);
      return this.mistake(e, ch);
    }
    const t = this.findTarget(ch);
    if (t) {
      if (!t.T.bullet) {
        this.lock = t;
        if (!this.quiet) Sound.lock();
      }
      this.hitLetter(t);
    } else {
      this.mistake(null, ch);
    }
  },

  countKey(ch, ok) {
    if (this.quiet || !ch) return;
    const k = ch.toLowerCase();
    const m = ok ? this.stats.keyHit : this.stats.keyMiss;
    m[k] = (m[k] || 0) + 1;
  },

  get mult() {
    const c = this.combo;
    return c >= 30 ? 5 : c >= 18 ? 4 : c >= 9 ? 3 : c >= 4 ? 2 : 1;
  },

  hitLetter(e) {
    const ch = e.text[e.done];
    e.done++;
    e.flinch = 1;
    if (!e.T.bullet) Oyen.aim(e);
    if (!this.quiet) {
      this.stats.correct++;
      this.countKey(ch, true);
      this.score += 5 * this.mult;
      this.charge(0.9);
      Sound.key(e.done - 1);
      Keyboard.flash(ch, true);
    }
    if (e.done >= e.text.length) this.complete(e);
  },

  mistake(e, typed) {
    if (this.quiet) return;
    this.stats.wrong++;
    this.combo = 0;
    if (e) {
      e.miss++;
      e.missT = 0.25;
      this.countKey(e.text[e.done], false);
      this.stats.wordMiss[e.text] = (this.stats.wordMiss[e.text] || 0) + 1;
    }
    Sound.wrong();
    Keyboard.flash(typed, false);
    UI.missFlash();
    if (this.lesson && this.lesson.caps && typed !== typed.toUpperCase() && this.t - (this.shiftHintT || -9) > 4) {
      const up = typed.toUpperCase();
      if ((e && e.text[e.done] === up) || this.alive().some((x) => x.text[x.done] === up)) {
        this.shiftHintT = this.t;
        UI.toast('Tahan Shift untuk huruf besar', '#f2779a');
      }
    }
  },

  backspace() {
    if (this.state !== 'play' || !this.lock) return;
    this.lock.done = 0;
    this.lock = null;
    Sound.click();
  },

  complete(e) {
    const perfect = e.miss === 0;
    if (e === this.lock) this.lock = null;
    if (e.T.boss) return this.bossWord(e, perfect);
    if (e.T.bullet) {
      e.dead = true;
      FX.swipe(e.sx, e.fy);
      FX.puff(e.sx, e.fy, 4, 0.6);
      if (!this.quiet) {
        this.score += Math.round(15 * this.mult);
        Sound.popPea();
      }
      return;
    }
    if (!this.quiet) {
      this.stats.words++;
      if (perfect) { this.combo++; this.stats.perfect++; this.charge(3); }
      this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
      if (this.combo > 0 && this.combo % 10 === 0) Oyen.happy();
    }
    const len = e.text.length;
    let pts = (len * 10 + Math.round((1 - clamp(e.u, 0, 1)) * len * 8)) * e.T.pts;
    if (perfect) pts += len * 5;
    if (e.gold) pts *= 2;
    pts = Math.round(pts * this.mult);
    const rescued = e.state === 'flee';
    this.catchMouse(e);
    if (!this.quiet) {
      this.score += pts;
      FX.pop(e.sx, e.sy - 18 * View.ui, rescued ? 'Ikan balik!' : '+' + fmt(pts), rescued ? '#2bb3a3' : e.gold ? '#e0a100' : '#f28c28', rescued ? 20 : 18);
      if (rescued) {
        this.fish = Math.min(LIVES, this.fish + (e.stole || 1));
        FX.fishFly({ x: e.sx, y: e.fy - 20 }, { x: View.bowl.x, y: View.bowl.y - 20 });
      }
      if (e.gold) this.powerUp(e);
    }
    if (e.T.splits) this.split(e);
    if (this.chainT > 0 && !e.chained) this.chain(e);
    if (this.mode === 'latihan' && this.stats.words >= this.goal) this.finish(true);
  },

  // tandai tertangkap; Oyen yang nanti memukulnya sampai terlempar
  catchMouse(e) {
    e.state = 'caught';
    e.caughtT = 0;
    e.carry = false;
    Oyen.pounce(e);
  },

  split(e) {
    for (let i = 0; i < e.T.splits; i++) {
      const row = clamp(e.row + (i ? 1 : -1), 0, 3);
      const c = this.spawn('cicit', { text: Words.pick(2, 3, this.firstSet()), u: Math.max(0.05, e.u + (i ? 0.03 : -0.03)), row, gold: false });
      if (c) c.time = MTYPES.gesit.T / this.speedOf(this.wave);
    }
  },

  // bola benang menggelinding ke 2 tikus terdekat, mengurangi 2 huruf
  chain(src) {
    const list = this.alive().filter((e) => !e.T.boss && e !== src)
      .sort((a, b) => Math.abs(a.sx - src.sx) - Math.abs(b.sx - src.sx))
      .slice(0, 2);
    for (const e of list) {
      FX.yarn({ x: src.sx, y: src.fy }, e, () => {
        if (!e.targetable) return;
        e.done = Math.min(e.text.length, e.done + 2);
        e.flinch = 1;
        if (e.done >= e.text.length) { e.chained = true; this.complete(e); }
      });
    }
  },

  bossWord(e, perfect) {
    if (!this.quiet) {
      this.stats.words++;
      if (perfect) { this.combo++; this.stats.perfect++; this.charge(3); }
      this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
      const pts = Math.round((60 + e.text.length * 12) * this.mult);
      this.score += pts;
      FX.pop(e.sx, e.sy - 20, '+' + fmt(pts), '#f28c28', 20);
    }
    e.seg++;
    e.patches++;
    Oyen.pounce(e);
    if (e.seg >= e.words.length) {
      this.bossDown(e);
    } else {
      e.text = e.words[e.seg];
      e.done = 0;
      e.miss = 0;
      e.u = Math.max(0, e.u - 0.06);
      UI.bossBar(e);
    }
  },

  bossDown(e) {
    e.defeated = true;
    e.state = 'caught';
    e.caughtT = -0.6;
    this.boss = null;
    UI.bossBar(null);
    this.stats.bosses++;
    const bonus = 1000 + this.wave * 120;
    this.score += bonus;
    this.fish = Math.min(LIVES, this.fish + 1);
    for (const m of this.alive()) if (!m.T.bullet) this.catchMouse(m); else m.dead = true;
    UI.banner('Raja Tikus Got kabur!', `+${fmt(bonus)} poin • ikan +1`, 'clear');
    Oyen.happy();
    Sound.win();
    setTimeout(() => Sound.meow(), 500);
    this.waveState = 'clear';
    this.waveTimer = 3.2;
  },

  // ---------- zoomies (Enter) ----------
  charge(v) {
    if (this.mode !== 'serbuan' || this.quiet) return;
    const z = this.zoom;
    if (z.charges >= 2) { z.meter = 100; return; }
    z.meter += v;
    if (z.meter >= 100) {
      z.meter -= 100;
      z.charges++;
      UI.toast('ZOOMIES SIAP • tekan Enter', '#f28c28');
      Sound.power();
      if (z.charges >= 2) z.meter = 100;
    }
  },

  zoomies() {
    if (this.state !== 'play' || this.mode !== 'serbuan') return;
    if (this.zoom.charges <= 0) { UI.toast('Zoomies belum terisi', '#f2779a'); return; }
    this.zoom.charges--;
    if (this.zoom.charges < 2 && this.zoom.meter >= 100) this.zoom.meter = 0;
    this.lock = null;
    Sound.zoomies();
    UI.toast('MODE ZOOMIES!', '#f28c28');
    const path = [];
    for (const e of this.alive()) {
      if (e.T.bullet) { e.dead = true; FX.puff(e.sx, e.fy, 3, 0.6); continue; }
      if (e.T.boss) {
        e.done = e.text.length;
        this.bossWord(e, false);
        path.push(e);
        continue;
      }
      const pts = Math.round(e.text.length * 8 * this.mult);
      this.score += pts;
      FX.pop(e.sx, e.sy - 18, '+' + pts, '#f28c28', 16);
      if (e.state === 'flee') this.fish = Math.min(LIVES, this.fish + (e.stole || 1));
      e.state = 'caught';
      e.caughtT = -1;
      e.carry = false;
      path.push(e);
      if (e.T.splits) this.split(e);
    }
    path.sort((a, b) => a.sx - b.sx);
    if (path.length) Oyen.zoomies(path);
  },

  powerUp(e) {
    const opts = ['susu', 'benang'];
    if (this.fish < LIVES) opts.push('ikan', 'ikan');
    if (this.zoom.charges < 2) opts.push('zoomies');
    const p = pick(opts);
    if (p === 'susu') { this.slowT = 7; Sound.setSlow(true); }
    if (p === 'benang') this.chainT = 10;
    if (p === 'ikan') {
      this.fish = Math.min(LIVES, this.fish + 1);
      FX.fishFly({ x: e.sx, y: e.fy - 20 }, { x: View.bowl.x, y: View.bowl.y - 20 });
    }
    if (p === 'zoomies') { this.zoom.charges++; if (this.zoom.charges >= 2) this.zoom.meter = 100; }
    UI.toast(POWERS[p].name, POWERS[p].color);
    Sound.power();
  },

  // ---------- tikus sampai di mangkuk ----------
  reach(e) {
    if (e.T.bullet) {
      e.dead = true;
      FX.puff(e.sx, e.fy, 5, 0.7);
      if (this.state === 'play' && !this.quiet) {
        Oyen.hurt();
        this.combo = 0;
        FX.pop(Oyen.x, Oyen.y - 130 * View.ui, 'Aduh!', '#f2545b', 18);
        Sound.peaHit();
      }
      return;
    }
    if (e.T.boss) {
      e.u = 0.4;
      e.done = 0;
      if (this.lock === e) this.lock = null;
      this.loseFish(e, 2);
      return;
    }
    if (this.state !== 'play' || this.mode !== 'serbuan' || this.quiet) {
      e.steal();
      return;
    }
    const n = this.loseFish(e, e.T.steal);
    e.steal();
    e.stole = n;
  },

  loseFish(e, n) {
    if (this.quiet || this.state !== 'play') return 0;
    const lost = Math.min(n, this.fish);
    this.fish -= lost;
    this.stats.stolen += lost;
    this.combo = 0;
    FX.fishFly({ x: View.bowl.x, y: View.bowl.y - 20 }, { x: e.sx, y: e.fy - 20 });
    FX.pop(View.bowl.x, View.bowl.y - 70 * View.ui, `-${lost} ikan`, '#f2545b', 20);
    FX.shake = 6;
    Oyen.angry();
    Sound.steal();
    UI.fishHit();
    if (this.fish <= 0) this.gameOver();
    return lost;
  },

  gameOver() {
    this.state = 'over';
    this.lock = null;
    Sound.over();
    Sound.setIntensity(0, 96);
    UI.bossBar(null);
    setTimeout(() => this.finish(false), 1500);
  },

  // ---------- selesai: hitung hasil, simpan rekor ----------
  finish(done) {
    if (this.finished) return;
    this.finished = true;
    this.state = 'over';
    this.lock = null;
    const s = this.stats;
    const wpm = s.correct / 5 / (Math.max(s.typingTime, 1) / 60);
    const acc = s.correct + s.wrong ? (s.correct / (s.correct + s.wrong)) * 100 : 100;
    const R = Records.data;
    const res = {
      mode: this.mode, lesson: this.lesson, done,
      score: this.score, wave: this.wave, wpm, acc,
      words: s.words, combo: s.bestCombo, bosses: s.bosses, stolen: s.stolen,
      keyHit: s.keyHit, keyMiss: s.keyMiss, wordMiss: s.wordMiss, best: {},
    };
    if (this.mode === 'serbuan') {
      res.best.score = this.score > R.bestScore && this.score > 0;
      R.bestScore = Math.max(R.bestScore, this.score);
      R.bestWave = Math.max(R.bestWave, this.wave);
    } else if (this.mode === 'sprint') {
      res.best.wpm = wpm > R.bestSprint && wpm > 0;
      R.bestSprint = Math.max(R.bestSprint, Math.round(wpm));
    } else if (this.mode === 'latihan' && done) {
      const id = this.lesson.id;
      res.best.wpm = !R.lessons[id] || wpm > R.lessons[id];
      R.lessons[id] = Math.max(R.lessons[id] || 0, Math.round(wpm));
    }
    if (s.correct >= 10) {
      Records.addHistory({ m: this.mode, l: this.lesson ? this.lesson.id : '', w: Math.round(wpm), a: Math.round(acc), s: this.score, d: Date.now() });
    }
    Records.mergeKeys(s.keyHit, s.keyMiss);
    Records.save();
    Sound.setIntensity(0, 96);
    if (done) Sound.win();
    UI.showResults(res);
  },

  quit() {
    UI.bossBar(null);
    this.startDemo();
  },
};
