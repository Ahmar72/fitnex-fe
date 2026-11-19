import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Counter, Magnetic, Paper, SplitText } from '../components/Motion.jsx';
import { Arrow, Play } from '../components/Icons.jsx';
import { asset, sample } from '../lib/utils.js';

const ease = [0.22, 1, 0.36, 1];

export default function Hero() {
  const { exercises } = useData();
  const { user } = useAuth();
  const { t } = useLanguage();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const wallY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const [delay] = useState(() => {
    try {
      return sessionStorage.getItem('fx:loaded') === '1' ? 0.4 : 2.6;
    } catch {
      return 2.6;
    }
  });

  const { cols, floatA, floatB } = useMemo(() => {
    if (!exercises.length) return { cols: [[], [], []] };
    const pool = sample(exercises, 30, 42);
    const pick = (n) => exercises.find((e) => e.name.toLowerCase() === n);
    return {
      cols: [pool.slice(0, 10), pool.slice(10, 20), pool.slice(20, 30)],
      floatA: pick('pull-up') || pool[1],
      floatB: pool[5],
    };
  }, [exercises]);

  return (
    <section className="hero" ref={ref}>
      <div className="hero-glow" />
      <div className="container hero-grid">
        <motion.div style={{ y: textY, opacity: fade }}>
          <motion.span className="eyebrow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.8 }}>
            {t('hero.eyebrow', 'Free forever · 30-second sign up · No ads')}
          </motion.span>
          <SplitText
            as="h1"
            className="display h1"
            animateNow
            delay={delay + 0.1}
            lines={[
              t('hero.title_1', 'Train'),
              t('hero.title_2', 'with'),
              <span className="accent" key="a">{t('hero.title_3', 'intent.')}</span>,
            ]}
          />
          <motion.p className="lead" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.5, duration: 0.9, ease }}>
            {t('hero.lead', 'Your workouts. Your weights. Your data. Fitnex pairs 1,324 animated exercises with a smart workout builder and a live training mode — free forever, and ready in 30 seconds.')}
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.65, duration: 0.9, ease }}>
            <Magnetic>
              <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary">
                {user ? t('hero.cta_dash', 'Go to dashboard') : t('hero.cta_start', 'Start free today')} <Arrow />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link to={user ? '/builder' : '/login'} className="btn btn-ghost">
                <Play /> {user ? t('hero.cta_builder', 'Build a workout') : t('hero.cta_signin', 'Sign in')}
              </Link>
            </Magnetic>
          </motion.div>
          <motion.div className="hero-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.9, duration: 1 }}>
            <div><strong><Counter to={1324} /></strong>{t('hero.stat_exercises', 'Exercises')}</div>
            <div><strong><Counter to={28} /></strong>{t('hero.stat_equipment', 'Equipment types')}</div>
            <div><strong><Counter to={12} /></strong>{t('hero.stat_languages', 'Languages')}</div>
          </motion.div>
        </motion.div>

        <div className="hero-visual">
          <motion.div className="hero-wall" style={{ y: wallY }} initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: delay - 0.2, duration: 1.4 }}>
            {cols.map((col, i) => (
              <div key={i} className={`wall-col ${i % 2 ? 'down' : ''}`}>
                <div className="wall-track" style={{ '--dur': `${36 + i * 8}s` }}>
                  {[...col, ...col].map((e, j) => (
                    <Paper key={`${e.id}-${j}`} src={e.image} gif={e.gif} autoplay alt="" />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
          {floatA && (
            <motion.div
              className="float-card"
              style={{ left: '-10%', top: '6%' }}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0, y: [0, -14, 0] }}
              transition={{ opacity: { delay: delay + 0.9 }, x: { delay: delay + 0.9, duration: 0.8 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
            >
              <Paper src={floatA.image} gif={floatA.gif} autoplay />
              <div>
                <b>{t('hero.new_pr', 'New PR!')}</b>
                <span className="muted" style={{ textTransform: 'capitalize' }}>{floatA.name} · +5 kg</span>
              </div>
            </motion.div>
          )}
          {floatB && (
            <motion.div
              className="float-card hide-s"
              style={{ right: '-2%', bottom: '14%' }}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0, y: [0, 12, 0] }}
              transition={{ opacity: { delay: delay + 1.1 }, x: { delay: delay + 1.1, duration: 0.8 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
            >
              <div>
                <div className="big">12,480</div>
                <span className="muted">{t('hero.kg_lifted', 'kg lifted this week')}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <div className="scroll-cue"><i />{t('hero.scroll', 'Scroll')}</div>
    </section>
  );
}
