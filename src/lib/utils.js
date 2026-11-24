import { translateSteps } from './translations.js';

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
 * Gets the current active language code from localStorage or user profile.
 */
export function getCurrentLanguage() {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fx:lang');
      if (saved) return saved;
      const rawUser = localStorage.getItem('fx_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u?.profile?.language) return u.profile.language;
      }
    }
  } catch {}
  return 'en';
}

/**
 * BCP-47 language codes for speech synthesis across all 12 languages.
 */
export const BCP47_BY_LANG = {
  en: 'en-US',
  ur: 'ur-PK',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  tr: 'tr-TR',
  ru: 'ru-RU',
  pl: 'pl-PL',
  hi: 'hi-IN',
  zh: 'zh-CN',
  ko: 'ko-KR',
};

/**
 * Standard workout voice guidelines cues translated for all 12 languages.
 */
export const CUE_TRANSLATIONS = {
  halfway: {
    en: 'Halfway there',
    ur: 'آدھا وقت مکمل ہو گیا',
    ur_deva: 'आधा समय पूरा हो गया',
    es: 'A mitad de camino',
    fr: 'À mi-chemin',
    de: 'Halbzeit',
    it: 'A metà strada',
    tr: 'Yarı yola geldiniz',
    ru: 'Половина пройдена',
    pl: 'W połowie drogi',
    hi: 'आधा समय पूरा हुआ',
    zh: '已经过半',
    ko: '절반 완료',
  },
  three: {
    en: 'Three',
    ur: 'تین',
    ur_deva: 'तीन',
    es: 'Tres',
    fr: 'Trois',
    de: 'Drei',
    it: 'Tre',
    tr: 'Üç',
    ru: 'Три',
    pl: 'Trzy',
    hi: 'तीन',
    zh: '三',
    ko: '셋',
  },
  two: {
    en: 'Two',
    ur: 'دو',
    ur_deva: 'दो',
    es: 'Dos',
    fr: 'Deux',
    de: 'Zwei',
    it: 'Due',
    tr: 'İki',
    ru: 'Два',
    pl: 'Dwa',
    hi: 'दो',
    zh: '二',
    ko: '둘',
  },
  one: {
    en: 'One',
    ur: 'ایک',
    ur_deva: 'एक',
    es: 'Uno',
    fr: 'Un',
    de: 'Eins',
    it: 'Uno',
    tr: 'Bir',
    ru: 'Один',
    pl: 'Jeden',
    hi: 'एक',
    zh: '一',
    ko: '하나',
  },
  set_done: {
    en: 'Done. Take rest and get ready for the next set.',
    ur: 'مکمل ہو گیا۔ آرام کریں اور اگلے سیٹ کے لیے تیار ہو جائیں۔',
    ur_deva: 'पूरा हुआ। आराम करें और अगले सेट के लिए तैयार हो जाएं।',
    es: 'Listo. Descansa y prepárate para la siguiente serie.',
    fr: 'Terminé. Reposez-vous et préparez-vous pour la série suivante.',
    de: 'Fertig. Mach eine Pause und mach dich für den nächsten Satz bereit.',
    it: 'Fatto. Riposati e preparati per la serie successiva.',
    tr: 'Tamamlandı. Dinlenin ve sonraki sete hazırlanın.',
    ru: 'Готово. Отдохните и приготовьтесь к следующему подходу.',
    pl: 'Gotowe. Odpocznij i przygotuj się do następnej serii.',
    hi: 'पूरा हुआ। आराम करें और अगले सेट के लिए तैयार हो जाएं।',
    zh: '完成。请休息并准备下一组。',
    ko: '완료되었습니다. 휴식을 취하고 다음 세트를 준비하세요.',
  },
  lang_changed: {
    en: 'Voice guidelines set to English.',
    ur: 'اردو میں آواز کی ہدایات فعال ہو گئیں۔',
    ur_deva: 'उर्दू में आवाज़ के निर्देश सक्रिय हो गए हैं।',
    es: 'Guía de voz activada en español.',
    fr: 'Guide vocal activé en français.',
    de: 'Sprachanweisungen auf Deutsch aktiviert.',
    it: 'Guida vocale attivata in italiano.',
    tr: 'Sesli rehber Türkçe olarak ayarlandı.',
    ru: 'Глосовые инструкции на русском языке включены.',
    pl: 'Wskazówki głosowe w języku polskim zostały włączone.',
    hi: 'हिन्दी में वॉयس निर्देश सक्रिय हो गए हैं।',
    zh: '语音指导已切换为中文。',
    ko: '한국어 음성 안내가 설정되었습니다.',
  },
  voice_enabled: {
    en: 'Voice guidelines enabled.',
    ur: 'آواز کی ہدایات فعال کر دی گئی ہیں۔',
    ur_deva: 'आवाज़ के निर्देश सक्रिय कर दिए गए हैं।',
    es: 'Guía de voz activada.',
    fr: 'Guide vocal activé.',
    de: 'Sprachanweisungen aktiviert.',
    it: 'Guida vocale attivata.',
    tr: 'Sesli rehber etkinleştirildi.',
    ru: 'Голосовые инструкции включены.',
    pl: 'Wskazówki głosowe włączone.',
    hi: 'वॉयس निर्देश सक्रिय हैं।',
    zh: '语音指导已开启。',
    ko: '음성 안내가 켜졌습니다.',
  },
};

/**
 * Resolves standard voice cue text into the requested language.
 */
export function resolveVoiceCueText(text, lang = getCurrentLanguage()) {
  if (!text) return '';
  const str = String(text).trim();
  const lower = str.toLowerCase();
  const l = lang || 'en';

  if (lower === 'halfway there' || lower === 'halfway') {
    return CUE_TRANSLATIONS.halfway[l] || CUE_TRANSLATIONS.halfway.en;
  }
  if (lower === 'three' || lower === '3') {
    return CUE_TRANSLATIONS.three[l] || CUE_TRANSLATIONS.three.en;
  }
  if (lower === 'two' || lower === '2') {
    return CUE_TRANSLATIONS.two[l] || CUE_TRANSLATIONS.two.en;
  }
  if (lower === 'one' || lower === '1') {
    return CUE_TRANSLATIONS.one[l] || CUE_TRANSLATIONS.one.en;
  }
  if (
    lower === 'done. take rest and get ready for the next set.' ||
    lower.startsWith('done. take rest') ||
    lower === 'set_done' ||
    lower === 'done'
  ) {
    return CUE_TRANSLATIONS.set_done[l] || CUE_TRANSLATIONS.set_done.en;
  }
  if (lower === 'lang_changed' || lower === 'language_changed') {
    return CUE_TRANSLATIONS.lang_changed[l] || CUE_TRANSLATIONS.lang_changed.en;
  }
  if (lower === 'voice_enabled' || lower === 'voice guidelines enabled') {
    return CUE_TRANSLATIONS.voice_enabled[l] || CUE_TRANSLATIONS.voice_enabled.en;
  }

  return str;
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
 * Translations for target muscles across all 12 supported languages.
 */
export const MUSCLE_TRANSLATIONS = {
  en: { pectorals: 'chest and pectorals', abs: 'abs and core', quads: 'quadriceps', lats: 'lat muscles', biceps: 'biceps', triceps: 'triceps', delts: 'shoulders', glutes: 'glutes', hamstrings: 'hamstrings', calves: 'calves', 'upper back': 'upper back', forearms: 'forearms', cardio: 'cardio endurance' },
  ur: { pectorals: 'سینے کے پٹھوں', abs: 'پیٹ اور کور', quads: 'رانوں کے پٹھوں', lats: 'کمر کے پٹھوں', biceps: 'بائیسپس', triceps: 'ٹرائی سیپس', delts: 'کندھوں', glutes: 'کولہوں کے پٹھوں', hamstrings: 'پچھلی رانوں', calves: 'پنڈلیوں', 'upper back': 'اوپری کمر', forearms: 'بازوؤں', cardio: 'اسٹیمینا' },
  es: { pectorals: 'pecho y pectorales', abs: 'abdomen y core', quads: 'cuádriceps', lats: 'dorsales', biceps: 'bíceps', triceps: 'tríceps', delts: 'hombros', glutes: 'glúteos', hamstrings: 'isquiotibiales', calves: 'pantorrillas', 'upper back': 'espalda superior', forearms: 'antebrazos', cardio: 'resistencia cardiovascular' },
  fr: { pectorals: 'pectoraux et poitrine', abs: 'abdominaux et gainage', quads: 'quadriceps', lats: 'dorsaux', biceps: 'biceps', triceps: 'triceps', delts: 'épaules', glutes: 'fessiers', hamstrings: 'ischio-jambiers', calves: 'mollets', 'upper back': 'haut du dos', forearms: 'avant-bras', cardio: 'endurance cardio' },
  de: { pectorals: 'Brustmuskulatur', abs: 'Bauch und Rumpf', quads: 'Oberschenkel', lats: 'Latissimus', biceps: 'Bizeps', triceps: 'Trizeps', delts: 'Schultern', glutes: 'Gesäßmuskeln', hamstrings: 'Beinbeuger', calves: 'Waden', 'upper back': 'oberen Rücken', forearms: 'Unterarme', cardio: 'Ausdauer' },
  it: { pectorals: 'pettorali e torace', abs: 'addominali e core', quads: 'quadricipiti', lats: 'dorsali', biceps: 'bicipiti', triceps: 'tricipiti', delts: 'spalle', glutes: 'glutei', hamstrings: 'femorali', calves: 'polpacci', 'upper back': 'parte alta della schiena', forearms: 'avambracci', cardio: 'resistenza cardiovascolare' },
  tr: { pectorals: 'göğüs kasları', abs: 'karın ve merkez bölge', quads: 'ön bacak kasları', lats: 'sırt kanat kasları', biceps: 'pazu', triceps: 'arka kol', delts: 'omuzlar', glutes: 'kalça', hamstrings: 'arka bacak', calves: 'kalf', 'upper back': 'üst sırt', forearms: 'ön kol', cardio: 'kardiyo' },
  ru: { pectorals: 'грудные мышцы', abs: 'мышцы пресса и кора', quads: 'квадрицепсы', lats: 'широчайшие мышцы спины', biceps: 'бицепсы', triceps: 'трицепсы', delts: 'плечи', glutes: 'ягодичные мышцы', hamstrings: 'бицепс бедра', calves: 'икры', 'upper back': 'верхнюю часть спины', forearms: 'предплечья', cardio: 'выносливость' },
  pl: { pectorals: 'mięśnie klatki piersiowej', abs: 'brzuch i mięśnie głębokie', quads: 'czworogłowe ud', lats: 'najszersze grzbietu', biceps: 'bicepsy', triceps: 'tricepsy', delts: 'barki', glutes: 'pośladki', hamstrings: 'kulszowo-goleniowe', calves: 'łydki', 'upper back': 'górną część pleców', forearms: 'przedramiona', cardio: 'wydolność' },
  hi: { pectorals: 'छाती की मांसपेशियों', abs: 'पेट और कोर', quads: 'जांघों की मांसपेशियों', lats: 'पीठ की मांसपेशियों', biceps: 'बाइसेप्स', triceps: 'ट्राइसेप्स', delts: 'कंधों', glutes: 'नितंब की मांसपेशियों', hamstrings: 'हैमस्ट्रिंग्स', calves: 'पिंडलियों', 'upper back': 'ऊपरी पीठ', forearms: 'अग्रभाग', cardio: 'सहनशक्ति' },
  zh: { pectorals: '胸大肌', abs: '腹部核心', quads: '股四头肌', lats: '背阔肌', biceps: '肱二头肌', triceps: '肱三头肌', delts: '肩部三角肌', glutes: '臀大肌', hamstrings: '腘绳肌', calves: '小腿肌群', 'upper back': '上背部', forearms: '前臂肌群', cardio: '心肺耐力' },
  ko: { pectorals: '가슴 근육', abs: '복근과 코어', quads: '대퇴사두근', lats: '광배근', biceps: '이두근', triceps: '삼두근', delts: '어깨 삼각근', glutes: '둔근', hamstrings: '햄스트링', calves: '종아리', 'upper back': '등 상부', forearms: '전완근', cardio: '심폐 지구력' }
};

/**
 * Translations for exercise equipment across all 12 supported languages.
 */
export const EQUIP_TRANSLATIONS = {
  en: { barbell: 'using a barbell', dumbbell: 'using dumbbells', 'body weight': 'with your bodyweight', cable: 'using cables', 'leverage machine': 'using a machine', band: 'using resistance bands', kettlebell: 'using a kettlebell', 'smith machine': 'on the smith machine' },
  ur: { barbell: 'باربل کے ساتھ', dumbbell: 'ڈمبلز کے ساتھ', 'body weight': 'جسمانی وزن کے ساتھ', cable: 'کیبل مشین کے ساتھ', 'leverage machine': 'مشین کے ساتھ', band: 'ریزسٹنس بینڈ کے ساتھ', kettlebell: 'کیٹل بیل کے ساتھ', 'smith machine': 'سمتھ مشین کے ساتھ' },
  es: { barbell: 'con barra', dumbbell: 'con mancuernas', 'body weight': 'con peso corporal', cable: 'con polea', 'leverage machine': 'en máquina', band: 'con banda de resistencia', kettlebell: 'con pesa rusa', 'smith machine': 'en máquina Smith' },
  fr: { barbell: 'avec une barre', dumbbell: 'avec des haltères', 'body weight': 'au poids du corps', cable: 'à la poulie', 'leverage machine': 'à la machine', band: 'avec élastique', kettlebell: 'avec kettlebell', 'smith machine': 'sur machine Smith' },
  de: { barbell: 'mit einer Langhantel', dumbbell: 'mit Kurzhanteln', 'body weight': 'mit eigenem Körpergewicht', cable: 'am Kabelzug', 'leverage machine': 'an der Maschine', band: 'mit Widerstandsband', kettlebell: 'mit Kettlebell', 'smith machine': 'an der Smith-Maschine' },
  it: { barbell: 'con bilanciere', dumbbell: 'con manubri', 'body weight': 'a corpo libero', cable: 'ai cavi', 'leverage machine': 'alla macchina', band: 'con elastico', kettlebell: 'con kettlebell', 'smith machine': 'al multipower' },
  tr: { barbell: 'halter ile', dumbbell: 'dambıl ile', 'body weight': 'vücut ağırlığınızla', cable: 'kablo ile', 'leverage machine': 'makinede', band: 'direnç bandı ile', kettlebell: 'girya ile', 'smith machine': 'Smith makinesinde' },
  ru: { barbell: 'со штангой', dumbbell: 'с гантелями', 'body weight': 'с собственным весом', cable: 'на блоке', 'leverage machine': 'на тренажере', band: 'с эспандером', kettlebell: 'с гирей', 'smith machine': 'в машине Смита' },
  pl: { barbell: 'ze sztangą', dumbbell: 'ze sztangielkami', 'body weight': 'z ciężarem własnego ciała', cable: 'na wyciągu', 'leverage machine': 'na maszynie', band: 'z gumą oporową', kettlebell: 'z odważnikiem kettlebell', 'smith machine': 'na suwnicy' },
  hi: { barbell: 'बारबेल के साथ', dumbbell: 'डम्बल के साथ', 'body weight': 'अपने शरीर के वजन के साथ', cable: 'केबल मशीन पर', 'leverage machine': 'जिम मशीन पर', band: 'रेजिस्टेंस बैंड के साथ', kettlebell: 'केटलबेल के साथ', 'smith machine': 'स्मिथ मशीन पर' },
  zh: { barbell: '使用杠铃', dumbbell: '使用哑铃', 'body weight': '使用自重', cable: '使用绳索', 'leverage machine': '使用器械', band: '使用弹力带', kettlebell: '使用壶铃', 'smith machine': '在史密斯架上' },
  ko: { barbell: '바벨을 사용하여', dumbbell: '덤벨을 사용하여', 'body weight': '맨몸으로', cable: '케이블 머신에서', 'leverage machine': '머신을 사용하여', band: '저항 밴드를 활용하여', kettlebell: '케틀벨을 사용하여', 'smith machine': '스미스 머신에서' }
};

/**
 * Selects the best natural-sounding voice matching the target language.
 * Prioritizes high-definition Natural/Neural voices to eliminate robotic tone and clutter.
 */
export function getVoiceForLanguage(lang = getCurrentLanguage()) {
  updateVoices();
  const list = cachedVoices.length ? cachedVoices : (window.speechSynthesis?.getVoices?.() || []);
  if (!list.length) return null;

  const target = (lang || 'en').toLowerCase().trim();
  const bcp47 = (BCP47_BY_LANG[target] || target).toLowerCase();
  const targetPrefix = target + '-';

  // Strict match by primary language subtag (e.g. 'ur-PK', 'es-ES', 'fr-FR', etc.)
  const matchingVoices = list.filter((v) => {
    const l = (v.lang || '').toLowerCase().replace('_', '-');
    const n = (v.name || '').toLowerCase();

    if (l === target || l.startsWith(targetPrefix) || l === bcp47) return true;

    // Check specific language name and dialect markers
    if (target === 'ur' && (n.includes('urdu') || n.includes('اردو') || n.includes('asad') || n.includes('uzma'))) return true;
    if (target === 'es' && (n.includes('spanish') || n.includes('español') || n.includes('castellano'))) return true;
    if (target === 'fr' && (n.includes('french') || n.includes('français'))) return true;
    if (target === 'de' && (n.includes('german') || n.includes('deutsch'))) return true;
    if (target === 'it' && (n.includes('italian') || n.includes('italiano'))) return true;
    if (target === 'tr' && (n.includes('turkish') || n.includes('türkçe'))) return true;
    if (target === 'ru' && (n.includes('russian') || n.includes('русский'))) return true;
    if (target === 'pl' && (n.includes('polish') || n.includes('polski'))) return true;
    if (target === 'hi' && (n.includes('hindi') || n.includes('हिन्दी'))) return true;
    if (target === 'zh' && (n.includes('chinese') || n.includes('mandarin') || n.includes('普通话') || n.includes('中文') || l.startsWith('zh-') || l.startsWith('cmn-'))) return true;
    if (target === 'ko' && (n.includes('korean') || n.includes('한국어') || n.includes('한국의'))) return true;
    if (target === 'en' && (n.includes('english') || l.startsWith('en-'))) return true;

    return false;
  });

  if (matchingVoices.length > 0) {
    // Score each candidate voice: prioritize smooth neural and natural cloud voices
    const scoreVoice = (v) => {
      let score = 0;
      const n = (v.name || '').toLowerCase();
      const l = (v.lang || '').toLowerCase().replace('_', '-');

      // Top tier: Modern Natural & Neural voices (Edge Online Natural, Azure Neural)
      if (n.includes('online (natural)') || n.includes('natural')) score += 100;
      else if (n.includes('neural')) score += 90;

      // High tier: Apple Premium & Enhanced voices (Safari / iOS / macOS)
      if (n.includes('premium')) score += 85;
      else if (n.includes('enhanced')) score += 75;

      // Google Chrome Cloud / High Quality voices
      if (n.includes('google')) score += 70;

      // Siri voices
      if (n.includes('siri')) score += 65;

      // Exact dialect match
      if (l === bcp47) score += 20;
      else if (l.startsWith(targetPrefix)) score += 15;

      // Demote legacy robotic desktop voices
      if (n.includes('desktop')) score -= 40;
      if (n.includes('espeak')) score -= 80;
      if (n.includes('zira') || n.includes('david')) score -= 30;

      return score;
    };

    matchingVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return matchingVoices[0];
  }

  // Language-specific fallbacks if exact BCP-47 tag is not registered:
  if (target === 'ur') {
    const urByName = list.find((v) => {
      const n = (v.name || '').toLowerCase();
      return n.includes('urdu') || n.includes('اردو') || n.includes('asad') || n.includes('uzma');
    });
    if (urByName) return urByName;

    // Chrome/Desktop fallback: Chrome lacks a built-in 'ur-PK' offline TTS engine, but includes Google हिन्दी (hi-IN).
    // Hindustani speech engines share identical phonology with Urdu and speak natural, fluent Urdu.
    const hiVoice = list.find((v) => {
      const l = (v.lang || '').toLowerCase().replace('_', '-');
      const n = (v.name || '').toLowerCase();
      return (l === 'hi' || l.startsWith('hi-') || n.includes('hindi') || n.includes('हिन्दी')) &&
             (n.includes('natural') || n.includes('neural') || n.includes('google') || n.includes('online'));
    }) || list.find((v) => {
      const l = (v.lang || '').toLowerCase().replace('_', '-');
      return l === 'hi' || l.startsWith('hi-');
    });
    if (hiVoice) return hiVoice;
  }

  if (target === 'en') {
    return getAttractiveVoice('en');
  }

  return null;
}

/**
 * Selects an attractive, natural-sounding voice for the workout guide.
 * Supports any language code, defaulting to English.
 */
export function getAttractiveVoice(lang = 'en') {
  updateVoices();
  const list = cachedVoices.length ? cachedVoices : (window.speechSynthesis?.getVoices?.() || []);
  if (!list.length) return null;

  if (lang !== 'en') {
    const langVoice = getVoiceForLanguage(lang);
    if (langVoice) return langVoice;
  }

  // Filter for English voices
  const enVoices = list.filter((v) => v.lang?.startsWith('en'));
  if (!enVoices.length) return list[0];

  // 1. High-quality natural / neural voices
  const natural = enVoices.find(
    (v) => v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online (Natural)')
  );
  if (natural) return natural;

  // 2. High-quality Google or Apple local voices
  const googleOrApple = enVoices.find(
    (v) =>
      v.name.includes('Google US English') ||
      v.name.includes('Google UK English') ||
      v.name.includes('Samantha') ||
      v.name.includes('Daniel') ||
      v.name.includes('Karen') ||
      v.name.includes('Alex')
  );
  if (googleOrApple) return googleOrApple;

  // 3. Clear Microsoft desktop local voices
  const msLocal = enVoices.find(
    (v) =>
      v.name.includes('David') ||
      v.name.includes('Mark') ||
      v.name.includes('Aria') ||
      v.name.includes('Jenny')
  );
  if (msLocal) return msLocal;

  const preferredEn = enVoices.find((v) => !v.name.includes('Zira'));
  if (preferredEn) return preferredEn;

  return enVoices[0] || list[0];
}

// Retain reference to active utterances to prevent V8 garbage collection bug in Chrome
let activeUtterances = [];

/**
 * Checks whether voice guidelines are enabled by user preference.
 */
export function isVoiceEnabled() {
  try {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('fx:voice-guidelines');
    if (stored !== null) return stored === 'true';
    const rawUser = localStorage.getItem('fx_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u?.profile?.voiceGuidelines !== undefined) {
        return Boolean(u.profile.voiceGuidelines);
      }
    }
  } catch {}
  return true;
}

/**
 * Sets voice guidelines enabled / disabled state and saves to localStorage.
 */
export function setVoiceEnabled(enabled) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fx:voice-guidelines', String(enabled));
      if (!enabled) {
        stopVoice();
      }
    }
  } catch {}
}

/**
 * Immediately halts and cancels all active and pending text-to-speech audio.
 */
export function stopVoice() {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
    activeUtterances = [];
  } catch (err) {
    console.warn('stopVoice exception:', err);
  }
}

/**
 * Maps Arabic Urdu vocabulary to Devanagari script for Hindustani TTS engines (such as Chrome's Google हिन्दी)
 * when a native Urdu TTS engine is not bundled in the user's browser.
 */
export const URDU_TO_DEVA_DICTIONARY = [
  ['ورزش:', 'वर्ज़िश:'],
  ['ورزش', 'वर्ज़िश'],
  ['اوپری کمر کے لیے', 'ऊपरी कमर के लिए'],
  ['رانوں کے پٹھوں کے لیے', 'रान के मसल्स के लिए'],
  ['سینے کے پٹھوں کے لیے', 'सीने के मसल्स के लिए'],
  ['پیٹ اور کور کے لیے', 'पेट और कोर के लिए'],
  ['کندھوں کے لیے', 'कंधों के लिए'],
  ['بائیسپس کے لیے', 'बाइसेप्स के लिए'],
  ['ٹرائی سیپس کے لیے', 'ट्राइसेप्स के लिए'],
  ['کولہوں کے پٹھوں کے لیے', 'कूल्हों के मसल्स के लिए'],
  ['پچھلی رانوں کے لیے', 'पिछली रान के लिए'],
  ['پنڈلیوں کے لیے', 'पिंडलियों के लिए'],
  ['بازوؤں کے لیے', 'बाज़ुओं के लिए'],
  ['اسٹیمینا کے لیے', 'स्टैमिना के लिए'],
  ['باربل کے ساتھ', 'बारबेल के साथ'],
  ['ڈمبلز کے ساتھ', 'डम्बल के साथ'],
  ['جسمانی وزن کے ساتھ', 'जिस्मानी वज़न के साथ'],
  ['کیبل مشین کے ساتھ', 'केबल मशीन के साथ'],
  ['مشین کے ساتھ', 'मशीन के साथ'],
  ['ریزسٹنس بینڈ کے ساتھ', 'रेसिस्टेंस बैंड के साथ'],
  ['کیٹل بیل کے ساتھ', 'केटलबेल के साथ'],
  ['سمتھ مشین کے ساتھ', 'स्मिथ मशीन के साथ'],
  ['اپنی کمر سیدھی رکھیں اور پیٹ کے عضلات کو سخت رکھیں۔', 'अपनी कमर सीधी रखें और पेट के मसल्स को टाइट रखें।'],
  ['گھٹنوں کو پیروں کی سیدھ میں رکھتے ہوئے نیچے جائیں، اور ایڑیوں پر زور دے کر واپس اوپر آئیں۔', 'घुटनों को पैरों की सीध में रखते हुए नीचे जाएं, और एड़ियों पर ज़ोर देकर वापस ऊपर आएं।'],
  ['وزن کو کنٹرول کے ساتھ سینے تک لائیں، اور کندھے پیچھے رکھتے ہوئے مضبوطی سے پش کریں۔', 'वज़न को कंट्रोल के साथ सीने तक लाएं, और कंधे पीछे रखते हुए मज़बूती से पुश करें।'],
  ['کہنیوں سے کھینچیں اور اوپر پہنچ کر کندھوں اور کمر کے پٹھوں کو سکیڑیں۔', 'कोहनियों से खींचें और ऊपर पहुंचकर कंधों और कमर के मसल्स को सिकोड़ें।'],
  ['کمر کو جھکائے بغیر وزن کو مکمل کنٹرول کے ساتھ سر کے اوپر پریس کریں۔', 'कमर को झुकाए बिना वज़न को पूरे कंट्रोल के साथ सिर के ऊपर प्रेस करें।'],
  ['کہنیوں کو پہلو میں جما کر رکھیں اور اوپر لے جا کر پٹھوں کو نچوڑیں۔', 'कोहनियों को पहलू में जमा कर रखें और ऊपर ले जाकर मसल्स को निचोड़ें।'],
  ['گردن کو جھٹکا دیے بغیر پیٹ کے پٹھوں سے کھینچیں اور توازن رکھیں۔', 'गर्दन को झटका दिए बिना पेट के मसल्स से खींचें और बैलेंस रखें।'],
  ['ہر ریپ کو مکمل کنٹرول اور درست رفتار کے ساتھ انجام دیں۔', 'हर रैप को पूरे कंट्रोल और सही स्पीड के साथ पूरा करें।'],
  ['زور لگاتے وقت سانس باہر نکالیں اور واپس آتے ہوئے اندر لیں۔', 'ज़ोर लगाते समय सांस बाहर निकालें और वापस आते हुए अंदर लें।'],
  ['اردو میں آواز کی ہدایات فعال ہو گئیں۔', 'उर्दू में आवाज़ के निर्देश सक्रिय हो गए हैं।'],
  ['آواز کی ہدایات فعال کر دی گئی ہیں۔', 'आवाज़ के निर्देश सक्रिय कर दिए गए हैं।'],
  ['آدھا وقت مکمل ہو گیا', 'आधा समय पूरा हो गया'],
  ['تین', 'तीन'],
  ['دو', 'दो'],
  ['ایک', 'एक'],
  ['مکمل ہو گیا۔ آرام کریں اور اگلے سیٹ کے لیے تیار ہو جائیں۔', 'पूरा हुआ। आराम करें और अगले सेट के लिए तैयार हो जाएं।'],
  ['۔', '।'],
  ['،', ',']
];

export function convertArabicUrduToDevanagari(text) {
  if (!text) return '';
  let res = String(text);
  for (const [ar, hi] of URDU_TO_DEVA_DICTIONARY) {
    res = res.split(ar).join(hi);
  }
  return res;
}

/**
 * Text-to-speech announcement for workouts (guidance, alerts, countdown).
 * Uses native Web Speech API in the user's selected language.
 */
export function speakVoice(text = '', options = {}) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    if (!isVoiceEnabled()) return;

    const synth = window.speechSynthesis;

    // Wake up synth if paused by browser
    if (synth.paused) {
      synth.resume();
    }

    // Always clear previous audio queue so voices never talk over each other or clutter
    synth.cancel();
    if (synth.paused) synth.resume();

    const lang = options.lang || getCurrentLanguage();
    const voice = getVoiceForLanguage(lang);
    const bcp47 = BCP47_BY_LANG[lang] || lang;

    // Detect if Urdu is synthesized using a Hindustani voice engine (e.g. Chrome's Google हिन्दी)
    const isUrduHindiEngine = Boolean(
      lang === 'ur' && voice && (voice.lang || '').toLowerCase().startsWith('hi')
    );

    const cueLang = isUrduHindiEngine ? 'ur_deva' : lang;
    let spokenText = resolveVoiceCueText(text, cueLang);

    if (isUrduHindiEngine) {
      spokenText = convertArabicUrduToDevanagari(spokenText);
    }

    const utterance = new SpeechSynthesisUtterance(String(spokenText).trim());

    // Natural human coach pace: measured, steady, articulate
    let rate = 0.94;
    if (options.rate) {
      rate = Math.min(Math.max(Number(options.rate) * 0.92, 0.88), 0.98);
    }
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = options.volume !== undefined ? options.volume : 1.0;

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || (isUrduHindiEngine ? 'hi-IN' : bcp47);
    } else {
      utterance.lang = bcp47;
    }

    // Keep active reference to prevent GC drops
    activeUtterances.push(utterance);
    utterance.onend = () => {
      activeUtterances = activeUtterances.filter((u) => u !== utterance);
    };
    utterance.onerror = (e) => {
      activeUtterances = activeUtterances.filter((u) => u !== utterance);
      console.warn('SpeechSynthesis error:', e);
    };

    synth.speak(utterance);
    if (synth.paused) synth.resume();
  } catch (err) {
    console.warn('speakVoice exception:', err);
  }
}

/**
 * Resolves translated target muscle for any exercise across all 12 languages.
 */
export function getTranslatedMuscle(target = '', lang = 'en') {
  const l = lang || 'en';
  const dict = MUSCLE_TRANSLATIONS[l] || MUSCLE_TRANSLATIONS.en;
  const raw = String(target || '').toLowerCase().trim();
  if (!raw) return dict.abs || 'core';

  if (dict[raw]) return dict[raw];

  // Common synonym mappings
  if (raw === 'chest' || raw === 'pectorals') return dict.pectorals;
  if (raw === 'back' || raw === 'upper back' || raw === 'lats') return dict['upper back'] || dict.lats;
  if (raw === 'quads' || raw === 'quadriceps' || raw === 'thighs' || raw === 'legs') return dict.quads;
  if (raw === 'shoulders' || raw === 'delts' || raw === 'deltoids') return dict.delts;
  if (raw === 'abs' || raw === 'waist' || raw === 'core' || raw === 'abdominals') return dict.abs;
  if (raw === 'biceps' || raw === 'arms') return dict.biceps;
  if (raw === 'triceps') return dict.triceps;
  if (raw === 'glutes' || raw === 'butt') return dict.glutes;
  if (raw === 'hamstrings') return dict.hamstrings;
  if (raw === 'calves') return dict.calves;
  if (raw === 'forearms') return dict.forearms;
  if (raw === 'cardio') return dict.cardio;

  return dict.abs || raw;
}

/**
 * Resolves translated equipment for any exercise across all 12 languages.
 */
export function getTranslatedEquipment(equip = '', lang = 'en') {
  const l = lang || 'en';
  const dict = EQUIP_TRANSLATIONS[l] || EQUIP_TRANSLATIONS.en;
  const raw = String(equip || '').toLowerCase().trim();
  if (!raw || raw === 'body weight' || raw === 'bodyweight' || raw === 'none') {
    return dict['body weight'];
  }
  if (raw.includes('barbell')) return dict.barbell;
  if (raw.includes('dumbbell')) return dict.dumbbell;
  if (raw.includes('cable')) return dict.cable;
  if (raw.includes('band')) return dict.band;
  if (raw.includes('kettlebell')) return dict.kettlebell;
  if (raw.includes('smith')) return dict['smith machine'];
  if (raw.includes('machine') || raw.includes('leverage')) return dict['leverage machine'];

  return dict['body weight'];
}

/**
 * Resolves biomechanical movement pattern from exercise attributes.
 */
export function getMovementPattern(ex) {
  if (!ex) return 'default';
  const name = (ex.name || '').toLowerCase();
  const target = (ex.target || '').toLowerCase();
  const bodyPart = (ex.bodyPart || '').toLowerCase();

  if (target === 'quads' || target === 'glutes' || target === 'hamstrings' || target === 'calves' || bodyPart === 'legs' || name.includes('squat') || name.includes('lunge') || name.includes('leg press')) {
    return 'legs';
  }
  if (target === 'pectorals' || target === 'chest' || bodyPart === 'chest' || name.includes('bench') || name.includes('push up') || name.includes('pushup') || name.includes('chest press') || name.includes('dip')) {
    return 'chest';
  }
  if (target === 'lats' || target === 'upper back' || bodyPart === 'back' || name.includes('row') || name.includes('pull up') || name.includes('pullup') || name.includes('pulldown') || name.includes('deadlift')) {
    return 'back';
  }
  if (target === 'delts' || target === 'shoulders' || bodyPart === 'shoulders' || name.includes('overhead') || name.includes('military press') || name.includes('shoulder press') || name.includes('lateral raise')) {
    return 'shoulders';
  }
  if (target === 'biceps' || target === 'triceps' || target === 'forearms' || bodyPart === 'arms' || name.includes('curl') || name.includes('triceps extension') || name.includes('skull crusher')) {
    return 'arms';
  }
  if (target === 'abs' || target === 'core' || bodyPart === 'waist' || name.includes('crunch') || name.includes('sit-up') || name.includes('plank') || name.includes('leg raise')) {
    return 'abs';
  }
  return 'default';
}

/**
 * Comprehensive voice instructions across all 12 supported languages.
 * Covers Exercise Name, Target Muscle, Equipment, Posture, Biomechanics, and Breathing.
 */
export const EXERCISE_GUIDELINES_BY_LANG = {
  en: {
    title: (name) => `${name}.`,
    focus: (muscle, equip) => `Targeting your ${muscle}, ${equip}.`,
    posture: 'Keep your back straight and brace your core.',
    movements: {
      legs: 'Lower your hips with control, keeping knees aligned, then drive firmly up through your heels.',
      chest: 'Lower with control toward your chest, then press firmly up while keeping your shoulders back.',
      back: 'Pull with your elbows and squeeze your shoulder blades firmly together at the peak.',
      shoulders: 'Press smoothly overhead with full control, without arching your lower back.',
      arms: 'Keep your elbows stationary at your sides and squeeze hard at the peak contraction.',
      abs: 'Engage your abdominal wall and control the movement without pulling on your neck.',
      default: 'Execute each repetition with full control, steady tempo, and full range of motion.'
    },
    breathing: 'Exhale as you push or lift, and inhale smoothly on the return.'
  },
  ur: {
    title: (name) => `ورزش: ${name}۔`,
    focus: (muscle, equip) => `${muscle} کے لیے، ${equip}۔`,
    posture: 'اپنی کمر سیدھی رکھیں اور پیٹ کے عضلات کو سخت رکھیں۔',
    movements: {
      legs: 'گھٹنوں کو پیروں کی سیدھ میں رکھتے ہوئے نیچے جائیں، اور ایڑیوں پر زور دے کر واپس اوپر آئیں۔',
      chest: 'وزن کو کنٹرول کے ساتھ سینے تک لائیں، اور کندھے پیچھے رکھتے ہوئے مضبوطی سے پش کریں۔',
      back: 'کہنیوں سے کھینچیں اور اوپر پہنچ کر کندھوں اور کمر کے پٹھوں کو سکیڑیں۔',
      shoulders: 'کمر کو جھکائے بغیر وزن کو مکمل کنٹرول کے ساتھ سر کے اوپر پریس کریں۔',
      arms: 'کہنیوں کو پہلو میں جما کر رکھیں اور اوپر لے جا کر پٹھوں کو نچوڑیں۔',
      abs: 'گردن کو جھٹکا دیے بغیر پیٹ کے پٹھوں سے کھینچیں اور توازن رکھیں۔',
      default: 'ہر ریپ کو مکمل کنٹرول اور درست رفتار کے ساتھ انجام دیں۔'
    },
    breathing: 'زور لگاتے وقت سانس باہر نکالیں اور واپس آتے ہوئے اندر لیں۔'
  },
  es: {
    title: (name) => `Ejercicio: ${name}.`,
    focus: (muscle, equip) => `Trabajando ${muscle}, ${equip}.`,
    posture: 'Mantén la espalda recta y activa el abdomen en todo momento.',
    movements: {
      legs: 'Baja las caderas con control alineando las rodillas con los pies, y empuja con fuerza desde los talones.',
      chest: 'Baja con control hacia el pecho y empuja con firmeza manteniendo los hombros hacia atrás.',
      back: 'Tira con los codos y aprieta las escápulas con fuerza en el punto máximo.',
      shoulders: 'Empuja por encima de la cabeza con control total, sin arquear la zona lumbar.',
      arms: 'Mantén los codos pegados a los costados y aprieta el músculo en la parte superior.',
      abs: 'Activa la pared abdominal y sube suavemente sin tirar del cuello ni balancearte.',
      default: 'Realiza cada repetición con ritmo controlado y rango completo de movimiento.'
    },
    breathing: 'Exhala durante el esfuerzo e inhala suavemente al regresar.'
  },
  fr: {
    title: (name) => `Exercice: ${name}.`,
    focus: (muscle, equip) => `Ciblant les ${muscle}, ${equip}.`,
    posture: 'Gardez le dos droit et engagez votre sangle abdominale.',
    movements: {
      legs: 'Descendez les hanches avec contrôle en gardant les genoux alignés, puis poussez fermement sur vos talons.',
      chest: 'Descendez le poids avec contrôle vers la poitrine, puis poussez fermement en gardant les épaules en arrière.',
      back: 'Tirez avec les coudes et serrez fermement les omoplates au sommet du mouvement.',
      shoulders: 'Développez au-dessus de la tête avec un contrôle total, sans cambrer le bas du dos.',
      arms: 'Gardez les coudes fixes contre le corps et contractez fort au sommet.',
      abs: 'Contractez les abdominaux et enroulez le torse sans tirer sur la nuque.',
      default: 'Exécutez chaque répétition avec un tempo régulier et un contrôle total.'
    },
    breathing: "Expirez à l'effort et inspirez en contrôlant la descente."
  },
  de: {
    title: (name) => `Übung: ${name}.`,
    focus: (muscle, equip) => `Für ${muscle}, ${equip}.`,
    posture: 'Halte den Rücken gerade und spanne die Bauchmuskeln fest an.',
    movements: {
      legs: 'Senke die Hüften kontrolliert ab, Knie in einer Linie mit den Zehen, und drücke dich kraftvoll über die Fersen hoch.',
      chest: 'Senke das Gewicht kontrolliert zur Brust und drücke es kraftvoll nach oben, Schultern hinten fixiert.',
      back: 'Ziehe aus den Ellbogen und ziehe die Schulterblätter am höchsten Punkt fest zusammen.',
      shoulders: 'Drücke das Gewicht kontrolliert über den Kopf, ohne ins Hohlkreuz zu fallen.',
      arms: 'Halte die Ellbogen fest am Körper und spanne den Muskel am höchsten Punkt fest an.',
      abs: 'Spanne den Bauch an und bewege dich gleichmäßig, ohne am Nacken zu ziehen.',
      default: 'Führe jede Wiederholung mit voller Kontrolle und sauberer Technik aus.'
    },
    breathing: 'Atme bei Anstrengung aus und bei der Rückkehr ruhig ein.'
  },
  it: {
    title: (name) => `Esercizio: ${name}.`,
    focus: (muscle, equip) => `Mirato a ${muscle}, ${equip}.`,
    posture: 'Mantieni la schiena dritta e contrai saldamente il core.',
    movements: {
      legs: 'Scendi con il bacino controllando le ginocchia in linea con i piedi, poi spingi forte sui talloni per risalire.',
      chest: 'Scendi lentamente verso il petto e spingi verso lalto tenendo le spalle arretrate.',
      back: 'Tira con i gomiti e stringi forte le scapole nel punto di massima contrazione.',
      shoulders: 'Spingi sopra la testa con pieno controllo, senza inarcare la parte bassa della schiena.',
      arms: 'Tieni i gomiti fermi vicino ai fianchi e contrai al massimo nel punto più alto.',
      abs: "Attiva l'addome e fletti il busto senza tirare con il collo.",
      default: 'Esegui ogni ripetizione con ritmo fluido e pieno controllo del movimento.'
    },
    breathing: 'Espira durante la fase di spinta e inspira nel ritorno.'
  },
  tr: {
    title: (name) => `Egzersiz: ${name}.`,
    focus: (muscle, equip) => `${muscle} bölgesini hedefleyin, ${equip}.`,
    posture: 'Sırtınızı dik tutun ve karın kaslarınızı sıkı tutun.',
    movements: {
      legs: 'Dizlerinizi ayak uçlarınızla aynı hizada tutarak kontrollü çökün ve topuklarınızdan güç alarak kalkın.',
      chest: 'Ağırlığı göğsünüze doğru kontrollü indirin, omuzları geride tutarak güçlüce itin.',
      back: 'Dirseklerinizden çekin ve zirvede kürek kemiklerinizi kuvvetlice birbirine sıkıştırın.',
      shoulders: 'Belinizi bükmeden ağırlığı başınızın üzerine tam kontrolle itin.',
      arms: 'Dirseklerinizi sabit tutun ve tepe noktasında kaslarınızı sıkın.',
      abs: 'Boynunuzdan çekmeden karın kaslarınızı sıkarak hareketi tamamlayın.',
      default: 'Her tekrarı kontrollü bir tempo ve tam hareket açısıyla yapın.'
    },
    breathing: 'Zorlanırken nefes verin, geri dönerken nefes alın.'
  },
  ru: {
    title: (name) => `Упражнение: ${name}.`,
    focus: (muscle, equip) => `Направлено на ${muscle}, ${equip}.`,
    posture: 'Держите спину ровно и напрягите мышцы живота.',
    movements: {
      legs: 'Опускайтесь под контролем, колени на одной линии со стопами, затем мощно отталкивайтесь пятками вверх.',
      chest: 'Плавно опускайте вес к груди и уверенно выжимайте вверх, сводя лопатки назад.',
      back: 'Тяните локтями и плотно сводите лопатки в верхней точке движения.',
      shoulders: 'Жмите над головой под полным контролем, не прогибая поясницу.',
      arms: 'Прижмите локти к корпусу и прожимайте мышцы в верхней точке амплитуды.',
      abs: 'Напрягайте пресс и скручивайтесь плавно, не напрягая шею.',
      default: 'Выполняйте каждое повторение плавно, с полным контролем техники.'
    },
    breathing: 'Выдыхайте на усилии и вдыхайте при возвращении в исходное положение.'
  },
  pl: {
    title: (name) => `Ćwiczenie: ${name}.`,
    focus: (muscle, equip) => `Działa na ${muscle}, ${equip}.`,
    posture: 'Trzymaj proste plecy i napnij mięśnie brzucha.',
    movements: {
      legs: 'Schodź w dół pod pełną kontrolą z kolanami w linii stóp, a następnie dynamicznie wybijaj się z pięt.',
      chest: 'Opuszczaj ciężar powoli do klatki i wypychaj pewnie w górę, ściągając łopatki.',
      back: 'Prowadź ruch łokciami i zepnij mocno łopatki w szczytowym momencie.',
      shoulders: 'Wyciskaj nad głowę z pełną kontrolą, bez wyginania odcinka lędźwiowego.',
      arms: 'Trzymaj łokcie blisko tułowia i mocno dopinaj mięsień w górnej fazie.',
      abs: 'Napnij mięśnie brzucha i unoś tułów bez ciągnięcia za kark.',
      default: 'Wykonuj każde powtórzenie w kontrolowanym tempie i z pełnym zakresem ruchu.'
    },
    breathing: 'Zrób wydech przy wysiłku i spokojny wdech przy powrocie.'
  },
  hi: {
    title: (name) => `व्यायाम: ${name}।`,
    focus: (muscle, equip) => `${muscle} के लिए, ${equip}।`,
    posture: 'अपनी पीठ सीधी रखें और कोर को बिल्कुल टाइट रखें।',
    movements: {
      legs: 'घुटनों को पंजों की सीध में रखते हुए नीचे जाएं, और एड़ियों पर जोर देकर ऊपर उठें।',
      chest: 'वजन को धीरे-धीरे छाती तक लाएं और कंधों को पीछे रखते हुए मजबूती से ऊपर धकेलें।',
      back: 'कोहनियों से पीछे खींचें और ऊपर पहुंचकर पीठ की मांसपेशियों को अच्छी तरह सिकोड़ें।',
      shoulders: 'कमर को मोड़े बिना वजन को पूरे नियंत्रण के साथ सिर के ऊपर उठाएं।',
      arms: 'कोहनियों को शरीर से सटाकर रखें और ऊपर ले जाकर मांसपेशियों को टाइट करें।',
      abs: 'गर्दन पर जोर डाले बिना पेट की मांसपेशियों से शरीर को ऊपर उठाएं।',
      default: 'प्रत्येक रैप को पूरी गति और सही नियंत्रण के साथ पूरा करें।'
    },
    breathing: 'जोर लगाते समय सांस छोड़ें और प्रारंभिक स्थिति में आते हुए सांस लें।'
  },
  zh: {
    title: (name) => `训练动作：${name}。`,
    focus: (muscle, equip) => `主要锻炼${muscle}，${equip}。`,
    posture: '挺直背部，腹部核心全程收紧。',
    movements: {
      legs: '屈膝下蹲时膝盖与脚尖方向一致，下放到底后脚跟发力稳步推起。',
      chest: '控制节奏下放至胸前，背部收紧，发力平稳推起。',
      back: '肘部贴紧带力后拉，在顶峰处主动夹紧背部肌群。',
      shoulders: '核心收紧，平稳向上推举过头顶，避免腰部反弓。',
      arms: '肘部固定在身体两侧，在动作顶点用力收缩肌肉。',
      abs: '收紧腹肌主动卷起躯干，避免用脖子过度借力。',
      default: '每个动作保持匀速节奏与完整幅度，稳定发力。'
    },
    breathing: '发力时呼气，回放时平稳吸气。'
  },
  ko: {
    title: (name) => `운동 종목: ${name}.`,
    focus: (muscle, equip) => `${muscle} 집중 강화, ${equip}.`,
    posture: '허리를 곧게 펴고 코어에 단단히 힘을 주세요.',
    movements: {
      legs: '무릎과 발끝 방향을 일치시키며 천천히 내려갔다가, 발뒤꿈치로 지면을 밀며 올라오세요.',
      chest: '가슴 위치까지 무게를 통제하며 내리고, 어깨를 뒤로 고정한 채 힘차게 밀어 올리세요.',
      back: '팔꿈치로 당기며 수축 정점에서 견갑골을 강하게 모아주세요.',
      shoulders: '허리가 꺾이지 않도록 코어를 잡고, 머리 위로 일정하게 들어 올리세요.',
      arms: '팔꿈치를 몸 옆에 고정하고 정점에서 근육을 쥐어짜듯 수축하세요.',
      abs: '목을 당기지 말고 복근의 힘만으로 상체를 부드럽게 말아 올리세요.',
      default: '모든 반복을 일정한 템포와 정확한 가동 범위로 수행하세요.'
    },
    breathing: '힘을 줄 때 숨을 내쉬고, 돌아올 때 부드럽게 들이마시세요.'
  }
};

/**
 * Generates comprehensive, natural voice guidelines for an exercise in the user's chosen language.
 * Instructs with everything as in the English guidelines: Exercise name, target muscle,
 * equipment, posture, biomechanical movement cue, and steady breathing.
 */
export function getExerciseVoiceOverview(ex, lang = getCurrentLanguage()) {
  if (!ex) return '';
  const resolvedLang = lang || getCurrentLanguage() || 'en';
  const rawName = (ex.name || 'Exercise').trim();
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const pattern = getMovementPattern(ex);
  const muscle = getTranslatedMuscle(ex.target || ex.bodyPart, resolvedLang);
  const equip = getTranslatedEquipment(ex.equipment, resolvedLang);

  const cfg = EXERCISE_GUIDELINES_BY_LANG[resolvedLang] || EXERCISE_GUIDELINES_BY_LANG.en;
  const movement = cfg.movements[pattern] || cfg.movements.default;

  const parts = [
    cfg.title(name),
    cfg.focus(muscle, equip),
    cfg.posture,
    movement,
    cfg.breathing
  ];

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
