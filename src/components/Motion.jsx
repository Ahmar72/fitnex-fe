import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { asset } from '../lib/utils.js';

const ease = [0.22, 1, 0.36, 1];

/** Fade-up on scroll into view. */
export function Reveal({ children, delay = 0, y = 40, className, as = 'div', once = true, ...rest }) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.9, delay, ease }}
      {...rest}
    >
      {children}
    </M>
  );
}

/** Masked line-by-line headline reveal. `lines` is an array of strings or nodes. */
export function SplitText({ lines, className, delay = 0, stagger = 0.09, as = 'h2', animateNow = false }) {
  const Tag = motion[as];
  const variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const word = {
    hidden: { y: '110%', rotate: 4 },
    show: { y: '0%', rotate: 0, transition: { duration: 1, ease } },
  };
  const trigger = animateNow ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px -40px 0px' } };
  return (
    <Tag className={className} initial="hidden" variants={variants} {...trigger}>
      {lines.map((line, i) => (
        <span className="split-line" key={i}>
          <motion.span className="split-word" variants={word}>
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Element that gently pulls towards the cursor. */
export function Magnetic({ children, strength = 0.35 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-block' }} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </motion.div>
  );
}

/** Counts up to `to` when scrolled into view. */
export function Counter({ to, duration = 2, suffix = '', format = true }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
      setVal(to * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref}>
      {format ? Math.round(val).toLocaleString('en-US') : Math.round(val)}
      {suffix}
    </span>
  );
}

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Exercise media on a paper surface.
 * - `src`: static thumbnail (always rendered, so there is never a blank frame)
 * - `gif`: animation layered on top while active
 * - `play`: force the animation on (e.g. parent card hovered)
 * - `autoplay`: animate whenever the element is on screen ("touch" = only on touch devices)
 * The GIF is unmounted when inactive so off-screen animations cost nothing.
 */
export function Paper({ src, gif, play = false, autoplay = false, alt = '', className = '', children, eager = false, style, ...rest }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [gifReady, setGifReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const wantsAuto = autoplay === 'touch' ? !canHover() : !!autoplay;

  useEffect(() => {
    if (!gif || !wantsAuto || !ref.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [gif, wantsAuto]);

  const active = !!gif && (play || (wantsAuto && visible));
  useEffect(() => {
    if (!active) setGifReady(false);
  }, [active]);

  return (
    <div ref={ref} className={`paper ${className}`} style={style} {...rest}>
      {src && (
        <img
          src={asset(src)}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded && !(active && gifReady) ? 1 : 0, transition: 'opacity .5s ease, transform .7s cubic-bezier(.22,1,.36,1)' }}
        />
      )}
      {active && (
        <img
          className="gif-layer"
          src={asset(gif)}
          alt=""
          aria-hidden="true"
          onLoad={() => setGifReady(true)}
          style={{ opacity: gifReady ? 1 : 0 }}
        />
      )}
      {children}
    </div>
  );
}

/** Card with a cursor-following glow and subtle 3D tilt. */
export function GlowCard({ children, className = '', tilt = 6, ...rest }) {
  const ref = useRef(null);
  const rx = useSpring(0, { stiffness: 150, damping: 15 });
  const ry = useSpring(0, { stiffness: 150, damping: 15 });
  const move = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    ry.set((px - 0.5) * tilt);
    rx.set(-(py - 0.5) * tilt);
  };
  const leave = () => {
    rx.set(0);
    ry.set(0);
  };
  return (
    <motion.div
      ref={ref}
      className={`card ${className}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onPointerMove={move}
      onPointerLeave={leave}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Marquee({ children, duration = 30, reverse = false, className = '', pausable = false }) {
  return (
    <div className={`marquee ${reverse ? 'reverse' : ''} ${className}`} style={{ '--dur': `${duration}s` }}>
      <div className={`marquee-track ${pausable ? 'pausable' : ''}`}>{children}</div>
      <div className={`marquee-track ${pausable ? 'pausable' : ''}`} aria-hidden="true">{children}</div>
    </div>
  );
}
