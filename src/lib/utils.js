export const asset = (p = '') => {
  if (!p) return '';
  const clean = p.startsWith('/') ? p.replace(/^\/+/, '') : p;
  const rawBase = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  return `${base}${clean}`;
};

export const title = (s = '') => s.replace(/\b\w/g, (c) => c.toUpperCase());

export const BODY_PARTS = [
  { key: 'chest', label: 'Chest', color: '#ff5b35' },
  { key: 'back', label: 'Back', color: '#3ad2ff' },
  { key: 'shoulders', label: 'Shoulders', color: '#ffb52e' },
  { key: 'upper arms', label: 'Arms', color: '#ff5e1a' },
  { key: 'lower arms', label: 'Forearms', color: '#a6ff8f' },
  { key: 'upper legs', label: 'Legs', color: '#b48cff' },
  { key: 'lower legs', label: 'Calves', color: '#ff7ad9' },
  { key: 'waist', label: 'Core', color: '#5effc9' },
  { key: 'cardio', label: 'Cardio', color: '#ff3d6e' },
  { key: 'neck', label: 'Neck', color: '#9aa4ff' },
];
export const partMeta = (key) =>
  BODY_PARTS.find((b) => b.key === key) || { key, label: title(key), color: '#ff5e1a' };

// Deterministic pseudo-random generator so "random" picks are stable across renders.
export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sample(arr, n, seed = 7) {
  const r = seeded(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n));

export function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — app keeps working in memory */
  }
}

export const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export function playChimeSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch {
    /* ignore audio policy errors */
  }
}
