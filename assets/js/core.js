'use strict';
// ================= Fungsi bantu, penyimpanan, dan pengaturan =================

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const fmt = (n) => Math.round(n).toLocaleString('id-ID');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// localStorage bisa diblokir (mode privat, dsb.), jadi semua dibungkus try/catch.
const Store = {
  prefix: 'oyen:',
  get(key, def) {
    try {
      const v = localStorage.getItem(this.prefix + key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify(val)); } catch (e) { /* abaikan */ }
  },
};

const Settings = Object.assign(
  { lang: 'id', level: 'normal', guide: true, sfx: true, music: true },
  Store.get('settings', {})
);
function saveSettings() { Store.set('settings', Settings); }

// Catatan: rekor, riwayat sesi, dan statistik tiap tombol
const Records = {
  data: Object.assign(
    { bestScore: 0, bestWave: 0, bestSprint: 0, lessons: {}, history: [], keys: {}, sessions: 0 },
    Store.get('records', {})
  ),
  save() { Store.set('records', this.data); },
  addHistory(entry) {
    this.data.history.push(entry);
    if (this.data.history.length > 40) this.data.history.shift();
    this.data.sessions++;
  },
  mergeKeys(hit, miss) {
    const k = this.data.keys;
    for (const c in hit) { (k[c] = k[c] || [0, 0])[0] += hit[c]; }
    for (const c in miss) { (k[c] = k[c] || [0, 0])[1] += miss[c]; }
  },
  // huruf yang paling sering meleset (butuh cukup data)
  weakKeys(n = 6) {
    const list = [];
    for (const c in this.data.keys) {
      const [hit, miss] = this.data.keys[c];
      const total = hit + miss;
      if (total < 8 || !/^[a-z]$/.test(c)) continue;
      list.push({ c, rate: (miss + 0.5) / (total + 4), miss });
    }
    list.sort((a, b) => b.rate - a.rate);
    return list.filter((x) => x.miss > 0 && x.rate > 0.03).slice(0, n);
  },
  totalKeys() {
    let t = 0;
    for (const c in this.data.keys) t += this.data.keys[c][0] + this.data.keys[c][1];
    return t;
  },
};
