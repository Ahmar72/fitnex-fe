import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { GlowCard, Paper, SplitText, Reveal } from '../components/Motion.jsx';
import { Lock } from '../components/Icons.jsx';
import { BODY_PARTS, sample, seeded } from '../lib/utils.js';

const ease = [0.22, 1, 0.36, 1];

function ImageShuffle({ pool }) {
  const [cells, setCells] = useState(() => (pool && pool.length ? pool.slice(0, 8) : []));
  useEffect(() => {
    if (!pool || pool.length < 9) return;
    setCells(pool.slice(0, 8));
    let n = 8;
    const id = setInterval(() => {
      setCells((c) => {
        if (!c || !c.length) return c;
        const next = [...c];
        next[Math.floor(Math.random() * c.length)] = pool[n++ % pool.length];
        return next;
      });
    }, 1600);
    return () => clearInterval(id);
  }, [pool]);
  return (
    <div className="mini-grid">
      {cells.map((e, i) => (
        e && (
        <div key={e.id || i} style={{ position: 'relative', aspectRatio: 1 }}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={e.id}
              initial={{ opacity: 0, scale: 0.7, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotateY: -90 }}
              transition={{ duration: 0.6, ease }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Paper src={e.image} gif={e.gif} autoplay alt={e.name} style={{ width: '100%', height: '100%', borderRadius: 14 }} />
            </motion.div>
          </AnimatePresence>
        </div>
        )
      ))}
    </div>
  );
}

function ProgressChart() {
  const pts = [40, 42.5, 42.5, 45, 47.5, 47.5, 50, 52.5, 55, 55, 57.5, 60];
  const W = 400;
  const H = 150;
  const max = 64;
  const min = 36;
  const xy = pts.map((p, i) => [(i / (pts.length - 1)) * W, H - ((p - min) / (max - min)) * H]);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = xy[xy.length - 1];
  return (
    <div className="chart">
      <svg viewBox={`0 -10 ${W} ${H + 30}`}>
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" x2={W} y1={(H / 3) * i} y2={(H / 3) * i} stroke="var(--line)" strokeDasharray="4 6" />
        ))}
        <motion.path
          d={`${d} L${W},${H} L0,${H} Z`}
          fill="url(#area)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2, duration: 1 }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        <motion.circle cx={last[0]} cy={last[1]} r="6" fill="var(--accent)" initial={{ scale: 0 }} whileInView={{ scale: [0, 1.4, 1] }} viewport={{ once: true }} transition={{ delay: 2 }} />
        <motion.text x={last[0] - 6} y={last[1] - 16} textAnchor="end" fill="var(--text)" fontSize="16" fontWeight="800" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 2.2 }}>
          60 kg · +50%
        </motion.text>
      </svg>
    </div>
  );
}

function RestTimer() {
  const [t, setT] = useState(90);
  useEffect(() => {
    const id = setInterval(() => setT((v) => (v <= 0 ? 90 : v - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const C = 2 * Math.PI * 52;
  return (
    <div className="timer-wrap">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" stroke="var(--ring-track)" strokeWidth="10" fill="none" />
        <circle
          cx="60" cy="60" r="52" stroke="var(--accent)" strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - t / 90)} transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <text x="60" y="68" textAnchor="middle" fill="var(--text)" fontSize="26" fontWeight="900" fontFamily="Big Shoulders Display">
          {Math.floor(t / 60)}:{String(t % 60).padStart(2, '0')}
        </text>
      </svg>
      <p>Auto-starts when you tick a set. Vibrates and chimes when it’s time to lift again.</p>
    </div>
  );
}

const PLATES = [
  { w: 25, c: '#ff5b35', h: 100 },
  { w: 20, c: '#3ad2ff', h: 96 },
  { w: 15, c: '#ffd23a', h: 88 },
  { w: 10, c: '#a6ff8f', h: 76 },
  { w: 5, c: '#f4f4ef', h: 62 },
  { w: 2.5, c: '#b48cff', h: 50 },
  { w: 1.25, c: '#cfcfca', h: 42 },
];

function PlateMath() {
  const [kg, setKg] = useState(100);
  const plates = useMemo(() => {
    let side = (kg - 20) / 2;
    const out = [];
    for (const p of PLATES) {
      while (side >= p.w - 1e-9) {
        out.push(p);
        side -= p.w;
      }
    }
    return out;
  }, [kg]);
  const side = (list, dir) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: dir }}>
      <AnimatePresence>
        {list.map((p, i) => (
          <motion.div
            key={`${p.w}-${i}`}
            className="plate"
            style={{ background: p.c, height: p.h, width: p.w >= 10 ? 16 : 11 }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {p.w >= 10 ? p.w : ''}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  return (
    <div className="plate-calc">
      <div className="plate-input">
        <input type="range" min="20" max="220" step="2.5" value={kg} onChange={(e) => setKg(Number(e.target.value))} aria-label="Bar weight" />
        <output>{kg} kg</output>
      </div>
      <div className="barbell">
        <div className="sleeve" />
        {side(plates, 'row-reverse')}
        <div className="shaft" />
        {side(plates, 'row')}
        <div className="sleeve" />
      </div>
    </div>
  );
}

function BalanceBars({ facets }) {
  const rows = BODY_PARTS.filter((b) => b.key !== 'neck').slice(0, 6).map((b) => ({ ...b, n: facets.find(([k]) => k === b.key)?.[1] || 0 }));
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <motion.div className="bars" initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -40px 0px' }}>
      {rows.map((r, i) => (
        <div className="bar-row" key={r.key}>
          <span>{r.label}</span>
          <div className="bar-track">
            <motion.div
              className="bar-fill"
              style={{ background: r.color, width: `${(r.n / max) * 100}%` }}
              variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.2, delay: i * 0.08, ease } } }}
            />
          </div>
          <span style={{ textAlign: 'right' }}>{r.n}</span>
        </div>
      ))}
    </motion.div>
  );
}

function Heatmap() {
  const cells = useMemo(() => {
    const r = seeded(11);
    return Array.from({ length: 7 * 22 }, () => {
      const v = r();
      return v < 0.42 ? 0 : v < 0.65 ? 1 : v < 0.85 ? 2 : 3;
    });
  }, []);
  const colors = ['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)'];
  return (
    <div className="heat">
      {cells.map((c, i) => (
        <motion.i
          key={i}
          style={{ background: colors[c] }}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: (Math.floor(i / 7) + (i % 7)) * 0.025, duration: 0.3 }}
        />
      ))}
    </div>
  );
}

const LANGS = ['English', 'Español', 'Français', 'Italiano', 'Türkçe', 'Русский', 'Polski', 'हिन्दी', '中文', '한국어'];
function Languages() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % LANGS.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ marginTop: 'auto', paddingTop: 20, height: 90, position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={i}
          className="display"
          style={{ fontSize: 64, color: 'var(--accent)', position: 'absolute', bottom: 0 }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          {LANGS[i]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Features() {
  const { exercises, facets } = useData();
  const { t } = useLanguage();
  const pool = useMemo(() => (exercises.length ? sample(exercises, 60, 9) : []), [exercises]);

  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head">
          <div>
            <Reveal><span className="eyebrow">{t('features.eyebrow', 'Features')}</span></Reveal>
            <SplitText className="display h2" lines={[t('features.title_1', 'Built on'), <span key="g" className="outline">{t('features.title_2', 'the gym floor.')}</span>]} />
          </div>
          <Reveal delay={0.2}>
            <p className="lead">{t('features.lead', 'Every feature exists because it saved time between sets. No fluff, no feeds, no paywalls — just the tools that make you stronger.')}</p>
          </Reveal>
        </div>

        <div className="bento">
          <Reveal className="span-7 row-2" style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('feat.lib_tag', 'Library')}</span>
              <h3>{t('feat.lib_title', 'Every exercise, illustrated.')}</h3>
              <p>{t('feat.lib_desc', '1,324 movements with anatomical illustrations, target muscles and step-by-step instructions in twelve languages.')}</p>
              {pool.length > 0 && <ImageShuffle pool={pool} />}
            </GlowCard>
          </Reveal>
          <Reveal className="span-5" delay={0.1} style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('feat.prog_tag', 'Progression')}</span>
              <h3>{t('feat.prog_title', 'Overload, visualised.')}</h3>
              <p>{t('feat.prog_desc', 'Watch your working weight climb week after week.')}</p>
              <ProgressChart />
            </GlowCard>
          </Reveal>
          <Reveal className="span-5" delay={0.15} style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('feat.timer_tag', 'Rest timer')}</span>
              <h3>{t('feat.timer_title', 'Never guess your rest.')}</h3>
              <RestTimer />
            </GlowCard>
          </Reveal>
          <Reveal className="span-4" style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('feat.plate_tag', 'Plate math · try it')}</span>
              <h3>{t('feat.plate_title', 'Load the bar in seconds.')}</h3>
              <PlateMath />
            </GlowCard>
          </Reveal>
          <Reveal className="span-4" delay={0.1} style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('feat.balance_tag', 'Muscle balance')}</span>
              <h3>{t('feat.balance_title', 'See what you skip.')}</h3>
              <BalanceBars facets={facets.bodyPart} />
            </GlowCard>
          </Reveal>
          <Reveal className="span-4" delay={0.2} style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('feat.consist_tag', 'Consistency')}</span>
              <h3>{t('feat.consist_title', 'A year at a glance.')}</h3>
              <p>{t('feat.consist_desc', 'Every session becomes a square. Fill the grid.')}</p>
              <Heatmap />
            </GlowCard>
          </Reveal>
          <Reveal className="span-8" style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('feat.priv_tag', 'Privacy')}</span>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Lock width={30} height={30} /> {t('feat.priv_title', 'Private by default.')}
              </h3>
              <p>{t('feat.priv_desc', 'Workouts, favourites and history live in your browser. No sign-up, no analytics, no ads. Ever.')}</p>
              <div className="privacy-visual">
                {['Local-first', 'No telemetry', 'No ads', 'Works offline', 'Your data, your device'].map((t, i) => (
                  <motion.span
                    key={t}
                    className="chip"
                    style={{ height: 38, fontSize: 14, padding: '0 16px' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i, ease }}
                  >
                    <span className="dot" style={{ background: 'var(--accent)' }} />
                    {t}
                  </motion.span>
                ))}
              </div>
            </GlowCard>
          </Reveal>
          <Reveal className="span-4" delay={0.1} style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('feat.lang_tag', 'Multilingual')}</span>
              <h3>{t('feat.lang_title', 'Speaks your language.')}</h3>
              <p>{t('feat.lang_desc', 'Instructions in 12 languages.')}</p>
              <Languages />
            </GlowCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
