import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { Paper, SplitText } from '../components/Motion.jsx';
import { sample } from '../lib/utils.js';

export default function Showcase() {
  const { exercises } = useData();
  const section = useRef(null);
  const track = useRef(null);
  const [dist, setDist] = useState(0);

  // One standout exercise for each of the main target muscles.
  const items = useMemo(() => {
    const targets = ['pectorals', 'lats', 'delts', 'biceps', 'triceps', 'quads', 'glutes', 'hamstrings', 'abs', 'calves', 'upper back', 'forearms'];
    return targets
      .map((t, i) => sample(exercises.filter((e) => e.target === t), 1, 100 + i)[0])
      .filter(Boolean);
  }, [exercises]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDist(Math.max(0, track.current.scrollWidth - window.innerWidth + 40));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [items.length]);

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const x = useTransform(smooth, [0, 1], [0, -dist]);

  return (
    <section ref={section} className="hscroll" style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className="hscroll-sticky">
        <div className="hscroll-head" style={{ margin: '0 auto 40px', width: '100%' }}>
          <div>
            <span className="eyebrow">Muscle by muscle</span>
            <SplitText className="display h2" lines={['Twelve muscles.', <span key="o" className="outline">Endless variations.</span>]} />
          </div>
          <div className="hscroll-progress"><motion.span style={{ scaleX: smooth }} /></div>
        </div>
        <motion.div ref={track} className="hscroll-track" style={{ x }}>
          {items.map((e, i) => (
            <Link key={e.id} to={`/exercises/${e.id}`} className="show-card" data-cursor="Open">
              <motion.div whileHover={{ y: -10, rotate: i % 2 ? 1.5 : -1.5 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <Paper src={e.image} gif={e.gif} autoplay alt={e.name}>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="tgt">{e.target}</span>
                </Paper>
              </motion.div>
              <h4>{e.name}</h4>
              <p>{e.equipment} · {e.bodyPart}</p>
            </Link>
          ))}
          <div style={{ width: 'var(--gutter)', flex: 'none' }} />
        </motion.div>
      </div>
    </section>
  );
}
