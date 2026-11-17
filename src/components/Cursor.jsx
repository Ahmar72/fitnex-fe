import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 350, damping: 30, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 350, damping: 30, mass: 0.6 });
  const [state, setState] = useState({ hover: false, label: '', down: false });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setEnabled(fine);
    if (!fine) return;
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target.closest?.('a, button, [data-cursor], input, select, label');
      const label = e.target.closest?.('[data-cursor]')?.getAttribute('data-cursor') || '';
      setState((s) => (s.hover === !!t && s.label === label ? s : { ...s, hover: !!t, label }));
    };
    const down = () => setState((s) => ({ ...s, down: true }));
    const up = () => setState((s) => ({ ...s, down: false }));
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [x, y]);

  if (!enabled) return null;
  const big = !!state.label;
  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} animate={{ scale: state.hover ? 0 : 1 }} />
      <motion.div
        className="cursor-ring"
        style={{ x: rx, y: ry }}
        animate={{
          scale: state.down ? 0.8 : big ? 2.2 : state.hover ? 1.5 : 1,
          backgroundColor: big ? 'var(--accent)' : state.hover ? 'var(--accent-soft)' : 'transparent',
          borderColor: big ? 'transparent' : 'var(--accent)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        <span style={{ fontSize: 5, opacity: big ? 1 : 0 }}>{state.label}</span>
      </motion.div>
    </>
  );
}
