import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Counter, GlowCard, Magnetic, Marquee, Paper, Reveal, SplitText } from '../components/Motion.jsx';
import { Arrow, Plus } from '../components/Icons.jsx';
import { BODY_PARTS, sample } from '../lib/utils.js';

const ease = [0.22, 1, 0.36, 1];

export function Band() {
  const { exercises } = useData();
  const { t } = useLanguage();
  const imgs = useMemo(() => sample(exercises, 10, 77), [exercises]);
  const row = (offset) => (
    <>
      {BODY_PARTS.slice(0, 9).map((b, i) => (
        <span key={b.key}>
          {t(`part.${b.key}`, b.label)}
          {imgs[(i + offset) % (imgs.length || 1)] ? <Paper src={imgs[(i + offset) % imgs.length].image} gif={imgs[(i + offset) % imgs.length].gif} autoplay /> : <i className="star">✦</i>}
        </span>
      ))}
    </>
  );

  const pillars = [
    t('band.strength', 'Strength'),
    t('band.hypertrophy', 'Hypertrophy'),
    t('band.mobility', 'Mobility'),
    t('band.endurance', 'Endurance'),
    t('band.power', 'Power'),
    t('band.consistency', 'Consistency'),
  ];

  return (
    <div className="band">
      <Marquee duration={45}>{row(0)}</Marquee>
      <Marquee duration={50} reverse className="outline-row">
        <span className="outline" style={{ display: 'contents' }}>
          {pillars.map((w) => (
            <span key={w}>
              {w} <i className="star">✦</i>
            </span>
          ))}
        </span>
      </Marquee>
    </div>
  );
}

export function Stats() {
  const { facets } = useData();
  const { t } = useLanguage();
  const stats = [
    { n: 1324, s: '', l: t('stats.s1', 'Illustrated exercises with step-by-step instructions') },
    { n: facets.target.length || 19, s: '', l: t('stats.s2', 'Target muscles mapped across the body') },
    { n: facets.equipment.length || 28, s: '', l: t('stats.s3', 'Equipment types — from bodyweight to sled') },
    { n: 0, s: '', l: t('stats.s4', 'Accounts, ads or trackers. Zero.'), zero: true },
  ];
  return (
    <section className="section" style={{ paddingTop: 100, paddingBottom: 60 }}>
      <div className="container">
        <Reveal style={{ marginBottom: 40 }}>
          <span className="eyebrow">{t('stats.eyebrow', 'By the numbers')}</span>
        </Reveal>
        <div className="stats">
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 0.1} className="stat">
              <div className="num">
                {s.zero ? <span className="accent">0</span> : <Counter to={s.n} />}
                {!s.zero && <sup>+</sup>}
              </div>
              <p>{s.l}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const steps = [
    { t: t('how.step1_t', 'Find your moves'), d: t('how.step1_d', 'Search 1,324 exercises by muscle, equipment or name. Save favourites with a tap.') },
    { t: t('how.step2_t', 'Build the session'), d: t('how.step2_d', 'Add exercises, set your sets, reps and weights, reorder — or load a ready-made programme.') },
    { t: t('how.step3_t', 'Train & track'), d: t('how.step3_d', 'Go live: follow each exercise, tick sets, rest on the timer and log your volume.') },
  ];
  return (
    <section className="section" id="how" style={{ background: 'var(--bg-2)' }}>
      <div className="container">
        <div className="section-head">
          <div>
            <Reveal><span className="eyebrow">{t('how.eyebrow', 'How it works')}</span></Reveal>
            <SplitText className="display h2" lines={[t('how.title_1', 'Three steps.'), <span key="o" className="outline">{t('how.title_2', 'Zero friction.')}</span>]} />
          </div>
        </div>
        <div className="steps" ref={ref} style={{ marginTop: 60 }}>
          <div className="steps-line"><motion.span style={{ scaleX }} /></div>
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.15} style={{ display: 'flex' }}>
              <GlowCard className="step" style={{ flex: 1 }}>
                <div className="n">0{i + 1}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const [open, setOpen] = useState(0);
  const { t } = useLanguage();

  const QA = [
    [t('faq.q1', 'Is Fitnex really free?'), t('faq.a1', 'Yes. Every feature — the full library, the builder, live workout mode and history — is free. There is no premium tier and nothing to unlock.')],
    [t('faq.q2', 'Do I need an account?'), t('faq.a2', 'A free account takes about 30 seconds — just your name, email and a password. It keeps your workouts, favourites and history separate from anyone else using the same device.')],
    [t('faq.q3', 'Where do the exercises come from?'), t('faq.a3', 'The library contains 1,324 exercises, each with an anatomical illustration, target and secondary muscles, the equipment needed and step-by-step instructions in twelve languages.')],
    [t('faq.q4', 'Can I use it without a gym?'), t('faq.a4', 'Absolutely. Filter by “body weight” equipment in the library, or load the Home Burner programme for a zero-equipment session.')],
    [t('faq.q5', 'How does live workout mode work?'), t('faq.a5', 'Open the builder, press “Start workout” and Fitnex walks you through each exercise. Tick a set and the rest timer starts automatically. Finish to log the session to your history.')],
    [t('faq.q6', 'Will I lose my data if I clear my browser?'), t('faq.a6', 'Clearing site data removes your saved workouts. Keep the same browser, or export your JSON data backup from settings to keep your history safe.')],
  ];

  return (
    <section className="section" id="faq">
      <div className="container faq-wrap">
        <div>
          <Reveal><span className="eyebrow">{t('faq.eyebrow', 'FAQ')}</span></Reveal>
          <SplitText className="display h2" lines={[t('faq.title_1', 'Questions?'), <span key="a" className="accent">{t('faq.title_2', 'Answers.')}</span>]} />
          <Reveal delay={0.2}><p className="lead" style={{ marginTop: 20 }}>{t('faq.lead', 'Everything you need to know before your first session.')}</p></Reveal>
        </div>
        <div>
          {QA.map(([q, a], i) => (
            <Reveal key={q} delay={i * 0.05} className={`faq-item ${open === i ? 'open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {q}
                <span className="pm"><Plus width={18} height={18} /></span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div className="faq-a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease }}>
                    <p>{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  const { exercises } = useData();
  const ring = useMemo(() => sample(exercises, 14, 21), [exercises]);
  const { user } = useAuth();
  const { t } = useLanguage();
  return (
    <section className="cta">
      <div className="cta-orbit">
        {ring.map((e, i) => {
          const a = (360 / ring.length) * i;
          return (
            <Paper key={e.id} src={e.image} gif={e.gif} autoplay style={{ transform: `rotate(${a}deg) translate(470px) rotate(${-a}deg)` }} />
          );
        })}
      </div>
      <div className="cta-mask" />
      <div className="container cta-inner">
        <Reveal><span className="eyebrow">{t('cta.eyebrow', 'Your next session starts now')}</span></Reveal>
        <SplitText className="display h1" lines={[t('cta.title_1', 'Stop scrolling.'), <span key="a" className="accent">{t('cta.title_2', 'Start lifting.')}</span>]} />
        <Reveal delay={0.2}>
          <p className="lead">{t('cta.lead', 'Pick a programme, or build your own from 1,324 exercises. It takes less than a minute.')}</p>
        </Reveal>
        <Reveal delay={0.3}>
          <Magnetic>
            <Link to={user ? '/builder' : '/signup'} className="btn btn-primary" style={{ height: 64, padding: '0 36px', fontSize: 17 }}>
              {user ? t('cta.btn_build', 'Build my workout') : t('cta.btn_create', 'Create my free account')} <Arrow />
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
