'use strict';
// ================= Tampilan: HUD, layar menu, hasil, dan catatan perkembangan =================

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FISH_SVG = '<svg viewBox="0 0 34 20" aria-hidden="true"><path d="M3 10Q13 0 25 10Q13 20 3 10Z"/><path d="M23 10L32 3 30 10 32 17Z"/><circle cx="19" cy="8.5" r="1.6" class="eye"/></svg>';
const PAW_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="16" rx="6" ry="5"/><circle cx="5" cy="9" r="2.6"/><circle cx="9.5" cy="5" r="2.6"/><circle cx="14.5" cy="5" r="2.6"/><circle cx="19" cy="9" r="2.6"/></svg>';

const UI = {
  screen: 'scr-title',
  touch: false,
  bannerT: 0,
  displayScore: 0,
  hud: {},

  init() {
    this.el = {
      hud: $('hud'), hudBottom: $('hud-bottom'), score: $('score'), mult: $('mult'), stage: $('stage'),
      wpm: $('wpm'), acc: $('acc'), fish: $('fish'), zoomBox: $('zoom-box'),
      zoomFill: $('zoom-fill'), zoomCharges: $('zoom-charges'),
      target: $('target'), finger: $('finger'), banner: $('banner'), bannerTitle: $('banner-title'),
      bannerSub: $('banner-sub'), toasts: $('toasts'), boss: $('bossbar'), bossWords: $('boss-words'),
      kb: $('kb'),
    };
    this.el.fish.innerHTML = FISH_SVG.repeat(LIVES);
    this.el.zoomCharges.innerHTML = PAW_SVG + PAW_SVG;

    document.querySelectorAll('[data-mode]').forEach((b) =>
      b.addEventListener('click', () => this.chooseMode(b.dataset.mode)));
    $('btn-back').addEventListener('click', () => { Sound.click(); this.showTitle(); });
    $('btn-pause').addEventListener('click', () => this.pause());
    $('btn-sound').addEventListener('click', () => this.toggleAllSound());
    $('btn-resume').addEventListener('click', () => this.resume());
    $('btn-restart').addEventListener('click', () => this.restart());
    $('btn-quit').addEventListener('click', () => this.toMenu());
    $('btn-again').addEventListener('click', () => this.restart());
    $('btn-menu').addEventListener('click', () => this.toMenu());

    document.querySelectorAll('.seg').forEach((seg) => {
      seg.addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        Settings[seg.dataset.set] = b.dataset.v;
        saveSettings();
        Sound.click();
        this.syncSettings();
        if (seg.dataset.set === 'lang') { Words.setup(null, Settings.lang); this.renderLessons(); }
      });
    });
    document.querySelectorAll('.tog').forEach((t) => {
      t.addEventListener('click', () => {
        const k = t.dataset.set;
        if (k === 'music') Sound.setMusic(!Settings.music);
        else if (k === 'sfx') Sound.setSfx(!Settings.sfx);
        else { Settings[k] = !Settings[k]; saveSettings(); }
        Sound.click();
        this.syncSettings();
      });
    });
    this.syncSettings();
    this.renderLessons();
    this.renderProgress();
  },

  syncSettings() {
    document.querySelectorAll('.seg').forEach((seg) => {
      seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', Settings[seg.dataset.set] === b.dataset.v));
    });
    document.querySelectorAll('.tog').forEach((t) => {
      const on = !!Settings[t.dataset.set];
      t.classList.toggle('on', on);
      t.setAttribute('aria-pressed', on);
    });
    $('btn-sound').classList.toggle('off', !Settings.music && !Settings.sfx);
  },

  toggleAllSound() {
    const on = !(Settings.music || Settings.sfx);
    Sound.setMusic(on);
    Sound.setSfx(on);
    this.syncSettings();
  },

  // ---------- layar ----------
  show(id) {
    for (const s of ['scr-title', 'scr-lessons', 'scr-pause', 'scr-results']) $(s).classList.toggle('hidden', s !== id);
    this.screen = id;
  },

  showTitle() {
    this.show('scr-title');
    this.setHud(false);
    this.renderProgress();
    this.focusFirst('#scr-title .mode');
  },

  chooseMode(mode) {
    Sound.init();
    Sound.startMusic();
    Sound.click();
    if (mode === 'latihan') {
      this.show('scr-lessons');
      this.renderLessons();
      this.focusFirst('#lesson-list .lesson:not([disabled])');
      return;
    }
    this.begin(mode, null);
  },

  begin(mode, lesson) {
    this.lastMode = mode;
    this.lastLesson = lesson;
    this.show(null);
    this.setHud(true, mode, lesson);
    Game.start(mode, lesson);
    this.displayScore = 0;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  },

  restart() {
    Sound.click();
    this.begin(this.lastMode, this.lastLesson);
  },

  toMenu() {
    Sound.click();
    Game.quit();
    this.showTitle();
  },

  pause() {
    if (Game.state !== 'play') return;
    Game.state = 'paused';
    Sound.setPaused(true);
    this.show('scr-pause');
    this.focusFirst('#btn-resume');
  },
  resume() {
    if (Game.state !== 'paused') return;
    Game.state = 'play';
    Sound.setPaused(false);
    this.show(null);
  },

  focusFirst(sel) {
    if (this.touch) return;
    setTimeout(() => { const el = document.querySelector(sel); if (el) el.focus({ preventScroll: true }); }, 30);
  },

  setHud(on, mode, lesson) {
    this.el.hud.classList.toggle('hidden', !on);
    this.el.hudBottom.classList.toggle('hidden', !on);
    this.el.banner.classList.add('hidden');
    this.el.toasts.innerHTML = '';
    if (!on) {
      this.bossBar(null);
      Keyboard.mode = 'off';
      this.el.kb.classList.add('hidden');
    } else {
      const serbuan = mode === 'serbuan';
      document.body.classList.toggle('no-zoom', !serbuan);
      this.el.zoomBox.classList.toggle('hidden', !serbuan);
      $('fish-box').classList.toggle('hidden', !serbuan);
      Keyboard.mode = this.touch ? 'touch' : Settings.guide ? 'guide' : 'off';
      this.el.kb.classList.toggle('hidden', Keyboard.mode === 'off');
      Keyboard.build({ digits: lesson && lesson.digits, caps: lesson && lesson.caps });
    }
    this.hud = {};
    layout();
  },

  // ---------- HUD per frame ----------
  update(dt) {
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      if (this.bannerT <= 0) this.el.banner.classList.add('hidden');
    }
    if (Game.state !== 'play' && Game.state !== 'paused' && Game.state !== 'over') return;
    const h = this.hud;
    const s = Game.stats;
    const set = (key, val, fn) => { if (h[key] !== val) { h[key] = val; fn(val); } };

    this.displayScore = damp(this.displayScore, Game.score, 10, dt);
    if (Math.abs(this.displayScore - Game.score) < 1) this.displayScore = Game.score;
    set('score', Math.round(this.displayScore), (v) => { this.el.score.textContent = fmt(v); });
    set('mult', Game.mult + ':' + Game.combo, () => {
      this.el.mult.textContent = Game.mult > 1 ? `x${Game.mult} • ${Game.combo} beruntun` : Game.combo ? `${Game.combo} beruntun` : '';
      this.el.mult.classList.toggle('hot', Game.mult > 1);
    });

    let stage = '';
    if (Game.mode === 'serbuan') stage = Game.wave % 5 === 0 ? `Gelombang ${Game.wave} • Raja` : `Gelombang ${Game.wave}`;
    else if (Game.mode === 'latihan') stage = `${Math.min(s.words, Game.goal)} / ${Game.goal} kata`;
    else if (Game.mode === 'sprint') stage = Game.clockOn ? `${Math.ceil(Game.timeLeft)} detik` : 'Mulai ketik!';
    set('stage', stage, (v) => {
      this.el.stage.textContent = v;
      this.el.stage.classList.toggle('urgent', Game.mode === 'sprint' && Game.clockOn && Game.timeLeft <= 10);
    });

    const wpm = s.typingTime > 3 ? Math.round(s.correct / 5 / (s.typingTime / 60)) : null;
    set('wpm', wpm, (v) => { this.el.wpm.textContent = v == null ? '--' : v; });
    const acc = s.correct + s.wrong ? Math.round((s.correct / (s.correct + s.wrong)) * 100) : 100;
    set('acc', acc, (v) => { this.el.acc.textContent = v + '%'; });

    if (Game.mode === 'serbuan') {
      set('fish', Game.fish, (v) => {
        [...this.el.fish.children].forEach((f, i) => f.classList.toggle('lost', i >= v));
        this.el.fish.classList.toggle('low', v <= 1);
      });
      const z = Game.zoom;
      set('zoom', Math.floor(z.meter) + ':' + z.charges, () => {
        this.el.zoomFill.style.width = (z.charges >= 2 ? 100 : z.meter) + '%';
        [...this.el.zoomCharges.children].forEach((c, i) => c.classList.toggle('on', i < z.charges));
        this.el.zoomBox.classList.toggle('ready', z.charges > 0);
      });
    }

    // kata yang sedang dikunci, ditampilkan besar di bawah
    const lock = Game.lock;
    let shown = lock;
    if (!shown) {
      const list = Game.alive().filter((e) => e.spawnT > 0.3 && !e.T.bullet);
      shown = list.sort((a, b) => (b.state === 'flee') - (a.state === 'flee') || b.u - a.u)[0] || null;
    }
    const key = shown ? `${shown.id}:${shown.done}:${shown.text}:${!!lock}:${shown.missT > 0}` : '';
    set('target', key, () => this.renderTarget(shown, !!lock));
    if (Game.boss) set('boss', Game.boss.seg + ':' + Game.boss.done, () => this.bossBar(Game.boss));
  },

  renderTarget(e, locked) {
    const t = this.el.target;
    if (!e) {
      t.innerHTML = '';
      this.el.finger.textContent = '';
      Keyboard.setNext(null);
      return;
    }
    const txt = e.text;
    let html = '';
    for (let i = 0; i < txt.length; i++) {
      const cls = i < e.done ? 'd' : i === e.done ? 'n' : '';
      html += `<span class="${cls}">${esc(txt[i])}</span>`;
    }
    t.innerHTML = html;
    t.classList.toggle('locked', locked);
    t.classList.toggle('miss', e.missT > 0);
    const next = txt[e.done];
    this.el.finger.textContent = Settings.guide || this.touch ? (locked || this.touch ? '' : 'terdekat • ') + Keyboard.finger(next) : '';
    Keyboard.setNext(next);
  },

  bossBar(e) {
    const el = this.el.boss;
    if (!e) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    this.el.bossWords.innerHTML = e.words.map((w, i) => {
      if (i < e.seg) return `<span class="w d">${esc(w)}</span>`;
      if (i > e.seg) return `<span class="w">${esc(w)}</span>`;
      return `<span class="w n"><b>${esc(w.slice(0, e.done))}</b>${esc(w.slice(e.done))}</span>`;
    }).join(' ');
    el.style.setProperty('--hp', 1 - e.seg / e.words.length);
  },

  banner(title, sub, kind = '') {
    const b = this.el.banner;
    this.el.bannerTitle.textContent = title;
    this.el.bannerSub.textContent = sub || '';
    b.className = 'hidden ' + kind;
    void b.offsetWidth;
    b.className = kind;
    this.bannerT = 2.3;
  },

  toast(text, color = '#f28c28') {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = text;
    d.style.setProperty('--c', color);
    this.el.toasts.appendChild(d);
    while (this.el.toasts.children.length > 3) this.el.toasts.firstChild.remove();
    setTimeout(() => d.remove(), 2200);
  },

  missFlash() {
    const t = this.el.target;
    t.classList.remove('shake');
    void t.offsetWidth;
    t.classList.add('shake');
  },

  fishHit() {
    const f = $('fish-box');
    f.classList.remove('hit');
    void f.offsetWidth;
    f.classList.add('hit');
  },

  // ---------- pelajaran ----------
  renderLessons() {
    const list = $('lesson-list');
    const R = Records.data;
    const enough = Records.totalKeys() >= 150 && Records.weakKeys(3).length >= 2;
    list.innerHTML = '';
    LESSONS.forEach((L, i) => {
      const b = document.createElement('button');
      b.className = 'lesson';
      b.type = 'button';
      const best = R.lessons[L.id];
      let desc = L.desc;
      if (L.weak) desc = enough ? 'Huruf: ' + Records.weakKeys(6).map((x) => x.c.toUpperCase()).join(' ') : 'Main dulu beberapa kali biar ketahuan huruf mana yang sering meleset';
      b.innerHTML = `<kbd>${i + 1}</kbd><b>${esc(L.name)}</b><span>${esc(desc)}</span>${best ? `<em>Terbaik ${best} WPM</em>` : ''}`;
      if (L.weak && !enough) b.disabled = true;
      b.addEventListener('click', () => { Sound.click(); this.begin('latihan', L); });
      list.appendChild(b);
    });
  },

  // ---------- catatan perkembangan di layar judul ----------
  renderProgress() {
    const R = Records.data;
    $('rec-serbuan').textContent = R.bestScore ? `Rekor ${fmt(R.bestScore)} • gelombang ${R.bestWave}` : 'Belum ada rekor';
    $('rec-sprint').textContent = R.bestSprint ? `Terbaik ${R.bestSprint} WPM` : 'Belum ada rekor';
    const lessons = Object.keys(R.lessons).length;
    $('rec-latihan').textContent = lessons ? `${lessons} dari ${LESSONS.length} pelajaran dicoba` : '7 pelajaran, mulai dari baris tengah';
    const box = $('progress');
    const hist = R.history.slice(-16);
    if (hist.length < 2) {
      box.innerHTML = '<p class="muted">Grafik WPM-mu muncul di sini setelah main dua kali.</p>';
      return;
    }
    const w = 220, h = 50, max = Math.max(20, ...hist.map((x) => x.w)) * 1.1;
    const pts = hist.map((x, i) => [(i / (hist.length - 1)) * w, h - (x.w / max) * h]);
    const line = pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
    const last = hist[hist.length - 1];
    const avg = Math.round(hist.reduce((a, x) => a + x.w, 0) / hist.length);
    box.innerHTML = `
      <div class="spark-head"><span>Perkembangan WPM</span><span>terakhir <b>${last.w}</b> • rata-rata <b>${avg}</b></span></div>
      <svg viewBox="-4 -4 ${w + 8} ${h + 8}" class="spark" aria-label="Grafik WPM ${hist.length} sesi terakhir">
        <polyline points="0,${h} ${line} ${w},${h}" class="area"/>
        <polyline points="${line}" class="ln"/>
        ${pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6"/>`).join('')}
      </svg>`;
  },

  // ---------- layar hasil ----------
  showResults(r) {
    this.setHud(false);
    this.show('scr-results');
    const titles = {
      serbuan: 'Ikannya habis!',
      latihan: r.done ? 'Latihan beres!' : 'Latihan dihentikan',
      sprint: 'Waktu habis!',
    };
    $('res-title').textContent = titles[r.mode];
    $('res-sub').textContent = r.mode === 'latihan' ? r.lesson.name
      : r.mode === 'serbuan' ? `${LEVELS[Settings.level].label} • ${Settings.lang === 'id' ? 'Indonesia' : 'English'}`
      : (Settings.lang === 'id' ? 'Bahasa Indonesia' : 'English');
    $('res-best').classList.toggle('hidden', !(r.best.score || r.best.wpm));
    $('res-best').textContent = r.best.score ? 'Rekor skor baru!' : 'WPM terbaik baru!';

    const big = $('res-big');
    if (r.mode === 'serbuan') {
      big.innerHTML = `<div class="big"><b>${fmt(r.score)}</b><small>skor</small></div>
        <div class="big"><b>${Math.round(r.wpm)}</b><small>WPM</small></div>
        <div class="big"><b>${Math.round(r.acc)}%</b><small>akurasi</small></div>`;
    } else {
      big.innerHTML = `<div class="big main"><b>${Math.round(r.wpm)}</b><small>WPM</small></div>
        <div class="big"><b>${Math.round(r.acc)}%</b><small>akurasi</small></div>
        <div class="big"><b>${r.words}</b><small>kata</small></div>`;
    }
    const stats = r.mode === 'serbuan'
      ? [[r.wave, 'gelombang'], [r.words, 'tikus ditangkap'], [r.combo, 'beruntun terbaik'], [r.bosses, 'Raja kabur']]
      : [[r.combo, 'beruntun terbaik'], [fmt(r.score), 'skor']];
    $('res-stats').innerHTML = stats.map(([v, l]) => `<div><b>${v}</b><small>${l}</small></div>`).join('');

    Keyboard.heatmap($('heatmap'), r.keyMiss, r.keyHit);
    $('heat-note').textContent = Object.keys(r.keyMiss).length ? 'Makin merah, makin sering meleset.' : 'Nggak ada yang meleset. Mantap!';
    const words = Object.entries(r.wordMiss).sort((a, b) => b[1] - a[1]).slice(0, 5);
    $('res-words-box').classList.toggle('hidden', !words.length);
    $('res-words').innerHTML = words.map(([w, n]) => `<li><span>${esc(w)}</span><small>${n}x</small></li>`).join('');
    $('res-tip').textContent = this.tip(r);
    this.focusFirst('#btn-again');
  },

  tip(r) {
    const weak = Object.entries(r.keyMiss).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
    const rowName = (c) => ROWS.top.includes(c) ? 'Baris Atas' : ROWS.bottom.includes(c) ? 'Baris Bawah' : ROWS.home.includes(c) ? 'Baris Tengah' : 'Angka';
    if (r.words < 3) return 'Ketik huruf pertama kata di atas tikus mana saja, lalu habiskan katanya. Oyen langsung nerkam.';
    if (r.acc < 85) return 'Akurasimu masih di bawah 85%. Pelan-pelan dulu, kecepatan bakal naik sendiri kalau jarinya sudah hafal tempat.';
    if (weak.length) return `Huruf yang paling sering meleset: ${weak.map((c) => c.toUpperCase()).join(', ')}. Coba Latihan Jari bagian ${rowName(weak[0])}, atau "Huruf Lemahku".`;
    if (r.wpm < 25) return 'Taruh telunjuk di F dan J (ada tonjolan kecilnya), lalu usahakan nggak lihat keyboard.';
    if (r.wpm < 45) return 'Sudah lumayan cepat! Coba tingkat Jago, atau kejar rekor di Uji 60 Detik.';
    return 'Jarimu cepat banget. Coba bahasa English atau tingkat Jago buat tantangan baru.';
  },
};
