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

/**
 * Authentic marathon / sports referee whistle burst.
 * Uses Web Audio API dual-oscillator acoustic beating (2620Hz + 2890Hz)
 * modulated with a 32Hz pea-flutter LFO and bandpass cavity resonance.
 */
export function playWhistleSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const duration = 0.52;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.24, now + 0.04);
    masterGain.gain.setValueAtTime(0.24, now + duration - 0.09);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    masterGain.connect(ctx.destination);

    // Bandpass resonant cavity filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2750, now);
    filter.Q.setValueAtTime(3.8, now);
    filter.connect(masterGain);

    // Dual tone oscillators creating the classic referee flutter beat
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2620, now);
    osc2.frequency.setValueAtTime(2890, now);

    // Pea flutter / air turbulence LFO (32 Hz)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(32, now);
    lfoGain.gain.setValueAtTime(130, now);
    lfo.connect(osc1.frequency);
    lfo.connect(osc2.frequency);

    osc1.connect(filter);
    osc2.connect(filter);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    lfo.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    setTimeout(() => {
      try { ctx.close(); } catch {}
    }, (duration + 0.25) * 1000);
  } catch (err) {
    /* AudioContext policy or unsupported */
  }
}

/**
 * Cached voices for instant, synchronous access.
 */
let cachedVoices = [];
function updateVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const v = window.speechSynthesis.getVoices();
    if (v && v.length) cachedVoices = v;
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

/**
 * Selects an attractive, natural-sounding voice for the workout guide.
 * Prioritizes high-definition neural/natural voices (Edge/Chrome/Safari).
 */
export function getAttractiveVoice() {
  updateVoices();
  const list = cachedVoices.length ? cachedVoices : (window.speechSynthesis?.getVoices?.() || []);
  if (!list.length) return null;

  // 1. Natural / Neural Microsoft Online voices (best clarity and tone)
  const natural = list.find(
    (v) =>
      v.lang?.startsWith('en') &&
      (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online'))
  );
  if (natural) return natural;

  // 2. High-quality Google or Apple voices
  const googleOrApple = list.find(
    (v) =>
      v.name.includes('Google US English') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Samantha') ||
      v.name.includes('Aria') ||
      v.name.includes('Jenny')
  );
  if (googleOrApple) return googleOrApple;

  // 3. Any standard English voice except older robotic Zira
  const standardEn = list.find((v) => v.lang?.startsWith('en') && !v.name.includes('Zira'));
  if (standardEn) return standardEn;

  // 4. Fallback
  return list.find((v) => v.lang?.startsWith('en')) || list[0] || null;
}

/**
 * Text-to-speech announcement for workouts (guidance, alerts, countdown).
 * Uses native Web Speech API with tuned attractive voice.
 */
export function speakVoice(text = '', options = {}) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    if (!options.queue) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.98;
    utterance.pitch = options.pitch || 1.02;
    utterance.volume = options.volume !== undefined ? options.volume : 1.0;
    utterance.lang = 'en-US';

    const voice = getAttractiveVoice();
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  } catch {
    /* speech synthesis unavailable or blocked */
  }
}

/**
 * Generates a concise, attractive 1-2 sentence overview for an exercise.
 * Says the name first, followed by clear overview guidance.
 */
export function getExerciseVoiceOverview(ex) {
  if (!ex) return '';
  const rawName = (ex.name || 'Exercise').trim();
  // Capitalize name properly for speech phrasing
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  let guidance = '';
  if (Array.isArray(ex.steps) && ex.steps.length > 0) {
    const s1 = (ex.steps[0] || '').trim();
    const s2 = (ex.steps[1] || '').trim();
    if (s1 && s1.length < 55 && s2) {
      guidance = `${s1} ${s2}`;
    } else {
      guidance = s1;
    }
  }

  if (!guidance) {
    const target = ex.target ? `targeting your ${ex.target}` : '';
    const equip = ex.equipment && ex.equipment !== 'body weight' ? `using ${ex.equipment}` : 'with your bodyweight';
    guidance = `Perform this exercise with controlled form ${target} ${equip}. Keep your core engaged throughout.`;
  }

  // Ensure clean punctuation
  guidance = guidance.replace(/\s+/g, ' ').trim();
  if (!guidance.endsWith('.')) guidance += '.';

  return `${name}. ${guidance}`;
}
