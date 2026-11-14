'use strict';
// ================= Keyboard di layar: panduan jari, keyboard sentuh, dan peta salah ketik =================

const ROWS = {
  digits: '1234567890'.split(''),
  top: 'qwertyuiop'.split(''),
  home: 'asdfghjkl'.split(''),
  bottom: 'zxcvbnm'.split(''),
};

const FINGERS = {
  lp: { name: 'kelingking kiri', keys: '1qaz' },
  lr: { name: 'jari manis kiri', keys: '2wsx' },
  lm: { name: 'jari tengah kiri', keys: '3edc' },
  li: { name: 'telunjuk kiri', keys: '45rtfgvb' },
  ri: { name: 'telunjuk kanan', keys: '67yuhjnm' },
  rm: { name: 'jari tengah kanan', keys: '8ik' },
  rr: { name: 'jari manis kanan', keys: '9ol' },
  rp: { name: 'kelingking kanan', keys: '0p' },
};
const FINGER_OF = {};
for (const f in FINGERS) for (const c of FINGERS[f].keys) FINGER_OF[c] = f;

const Keyboard = {
  el: null,
  keys: {},
  mode: 'off',      // 'off' | 'guide' | 'touch'
  shift: false,     // shift sekali tekan (keyboard sentuh)
  onKey: null,
  nextEl: [],

  init(el, onKey) {
    this.el = el;
    this.onKey = onKey;
    el.addEventListener('pointerdown', (ev) => {
      const b = ev.target.closest('.key');
      if (!b || this.mode !== 'touch') return;
      ev.preventDefault();
      this.press(b);
    });
    el.addEventListener('contextmenu', (ev) => ev.preventDefault());
  },

  // susun ulang tombol sesuai kebutuhan mode/pelajaran
  build(opt = {}) {
    const touch = this.mode === 'touch';
    this.opt = opt;
    this.keys = {};
    const el = this.el;
    el.innerHTML = '';
    el.className = 'kb ' + this.mode;
    const row = (list, cls = '') => {
      const r = document.createElement('div');
      r.className = 'kb-row ' + cls;
      for (const k of list) r.appendChild(this.makeKey(k));
      el.appendChild(r);
      return r;
    };
    if (opt.digits) row(ROWS.digits, 'digits');
    row(ROWS.top);
    row(ROWS.home, 'home');
    const bottom = ROWS.bottom.slice();
    if (opt.caps) { bottom.unshift('shiftL'); bottom.push('shiftR'); }
    if (touch && !opt.caps) bottom.push('back');
    row(bottom, 'bottom');
    if (touch) row(opt.caps ? ['back', 'zoom'] : ['zoom'], 'actions');
    this.setNext(this.nextChar);
  },

  makeKey(k) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'key';
    b.tabIndex = -1;
    b.dataset.k = k;
    const labels = { shiftL: '⇧', shiftR: '⇧', back: '⌫', zoom: 'ZOOMIES!' };
    b.textContent = labels[k] || k;
    if (k === 'zoom') b.classList.add('wide', 'special');
    else if (k === 'back' || k.startsWith('shift')) b.classList.add('mod');
    const f = FINGER_OF[k] || (k === 'shiftL' ? 'lp' : k === 'shiftR' ? 'rp' : null);
    if (f) b.dataset.f = f;
    if (k === 'f' || k === 'j') b.classList.add('bump');
    this.keys[k] = b;
    return b;
  },

  press(b) {
    const k = b.dataset.k;
    b.classList.remove('down');
    void b.offsetWidth;
    b.classList.add('down');
    if (k === 'shiftL' || k === 'shiftR') {
      this.shift = !this.shift;
      this.el.classList.toggle('shifted', this.shift);
      return;
    }
    let out = k;
    if (k.length === 1 && this.shift) {
      out = k.toUpperCase();
      this.shift = false;
      this.el.classList.remove('shifted');
    }
    if (this.onKey) this.onKey(out);
  },

  // tandai tombol berikutnya yang harus ditekan
  setNext(ch) {
    this.nextChar = ch;
    for (const e of this.nextEl) e.classList.remove('next');
    this.nextEl = [];
    if (!ch || this.mode === 'off') return;
    const lower = ch.toLowerCase();
    const k = this.keys[lower];
    if (k) { k.classList.add('next'); this.nextEl.push(k); }
    if (ch !== lower) {
      // huruf besar: shift di tangan yang berlawanan
      const f = FINGER_OF[lower] || 'li';
      const s = this.keys[f[0] === 'l' ? 'shiftR' : 'shiftL'];
      if (s) { s.classList.add('next'); this.nextEl.push(s); }
    }
  },

  flash(ch, ok) {
    const k = this.keys[(ch || '').toLowerCase()];
    if (!k) return;
    const cls = ok ? 'hit' : 'bad';
    k.classList.remove('hit', 'bad');
    void k.offsetWidth;
    k.classList.add(cls);
  },

  finger(ch) {
    if (!ch) return '';
    const f = FINGER_OF[ch.toLowerCase()];
    if (!f) return '';
    let s = FINGERS[f].name;
    if (ch !== ch.toLowerCase()) s += ' + Shift ' + (f[0] === 'l' ? 'kanan' : 'kiri');
    return s;
  },

  // peta tombol yang sering meleset (layar hasil)
  heatmap(el, miss, hit) {
    el.innerHTML = '';
    let max = 1;
    for (const c in miss) max = Math.max(max, miss[c]);
    const rows = [ROWS.top, ROWS.home, ROWS.bottom];
    if (Object.keys(miss).some((c) => /[0-9]/.test(c)) || Object.keys(hit).some((c) => /[0-9]/.test(c))) rows.unshift(ROWS.digits);
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'hm-row';
      for (const c of r) {
        const k = document.createElement('div');
        k.className = 'hm-key';
        const m = miss[c] || 0;
        const used = (hit[c] || 0) + m;
        if (m) {
          const a = 0.3 + 0.7 * (m / max);
          k.classList.add('miss');
          k.style.background = `rgba(242, 84, 91, ${a})`;
          k.innerHTML = `${c}<small>${m}</small>`;
        } else {
          k.textContent = c;
          if (used) k.classList.add('ok');
        }
        row.appendChild(k);
      }
      el.appendChild(row);
    }
  },
};
