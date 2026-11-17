import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { sample } from '../lib/utils.js';
import { Paper } from './Motion.jsx';
import { lockScroll } from '../lib/useSmoothScroll.js';
import { Logo } from './Icons.jsx';

const ease = [0.76, 0, 0.24, 1];

export default function Preloader() {
  const { exercises, ready, status } = useData();
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(() => {
    try {
      return sessionStorage.getItem('fx:loaded') === '1';
    } catch {
      return false;
    }
  });

  const tiles = useMemo(() => (exercises.length ? sample(exercises, 12, 3) : []), [exercises]);

  useEffect(() => {
    if (done) return;
    lockScroll(true);
    const c = animate(0, 82, { duration: 1.4, ease: 'easeOut', onUpdate: (v) => setCount(Math.round(v)) });
    return () => c.stop();
  }, [done]);

  useEffect(() => {
    if (done || (!ready && status !== 'error')) return;
    const c = animate(count, 100, {
      duration: 0.7,
      delay: 0.5,
      ease: 'easeInOut',
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => {
        setTimeout(() => {
          setDone(true);
          lockScroll(false);
          try {
            sessionStorage.setItem('fx:loaded', '1');
          } catch {
            /* ignore */
          }
        }, 250);
      },
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, status, done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="preloader" exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.9, ease } }} initial={{ clipPath: 'inset(0 0 0% 0)' }}>
          <div className="preloader-top">
            <span className="logo"><Logo /><span>Fit<em>nex</em></span></span>
            <span className="eyebrow">Loading 1,324 exercises</span>
          </div>
          <div className="preloader-grid">
            {tiles.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <Paper src={t.image} eager />
              </motion.div>
            ))}
          </div>
          <div>
            <div className="preloader-count">{count}%</div>
            <div className="preloader-bar"><motion.span style={{ scaleX: count / 100 }} /></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
