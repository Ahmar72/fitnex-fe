import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export function useSmoothScroll() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    ref.current = lenis;
    window.__lenis = lenis;
    let id;
    const raf = (t) => {
      lenis.raf(t);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      ref.current = null;
      window.__lenis = null;
    };
  }, []);
  return ref;
}

export const lockScroll = (on) => {
  const l = window.__lenis;
  if (l) on ? l.stop() : l.start();
  document.documentElement.style.overflow = on ? 'hidden' : '';
};
