import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Logo, Dumbbell, Heart, Grid, LogOut, Settings, Sun, Moon } from './Icons.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from './Toast.jsx';
import { lockScroll } from '../lib/useSmoothScroll.js';
import { Marquee } from './Motion.jsx';

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export function AnnouncementBar() {
  const { t } = useLanguage();
  const items = (
    <>
      <span><b>{t('announce.item1', 'New · Animated exercise demos for all 1,324 moves')}</b></span>
      <span>✦</span>
      <span><b>{t('announce.item2', 'Live workout mode with auto rest timer')}</b></span>
      <span>✦</span>
      <span><b>{t('announce.item3', 'Free forever · No ads · No tracking')}</b></span>
      <span>✦</span>
    </>
  );
  return (
    <div className="announce">
      <Marquee duration={28}>{items}</Marquee>
    </div>
  );
}

function UserMenu({ user, onLogout }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return (
    <div className="user-menu" ref={ref}>
      <button className="avatar" onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open}>
        {initials(user.name)}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="menu-pop"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="menu-user">
              <span className="avatar sm">{initials(user.name)}</span>
              <div>
                <b>{user.name}</b>
                <span>{user.email}</span>
              </div>
            </div>
            <Link to="/dashboard"><Grid /> {t('nav.dashboard', 'Dashboard')}</Link>
            <Link to="/builder"><Dumbbell /> {t('nav.builder', 'Workout builder')}</Link>
            <Link to="/exercises?fav=1"><Heart /> {t('nav.favorites', 'Favourites')}</Link>
            <Link to="/profile"><Settings /> {t('nav.profile', 'Profile & settings')}</Link>
            <button onClick={onLogout} className="danger-link"><LogOut /> {t('nav.logout', 'Sign out')}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { workout, favorites } = useWorkout();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(null);
  const location = useLocation();

  const publicLinks = [
    { to: '/#features', label: t('nav.features', 'Features') },
    { to: '/#explore', label: t('nav.exercises', 'Exercises') },
    { to: '/#programs', label: t('nav.programs', 'Programs') },
    { to: '/#faq', label: t('nav.faq', 'FAQ') },
  ];
  const appLinks = [
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard') },
    { to: '/exercises', label: t('nav.library', 'Library') },
    { to: '/builder', label: t('nav.builder', 'Builder') },
    { to: '/#programs', label: t('nav.programs', 'Programs') },
  ];
  const links = user ? appLinks : publicLinks;

  useMotionValueEvent(scrollY, 'change', (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(v > 30);
    setHidden(v > prev && v > 300 && !open);
  });

  useEffect(() => setOpen(false), [location.pathname, location.hash]);
  useEffect(() => {
    lockScroll(open);
  }, [open]);

  const doLogout = () => {
    logout();
    toast('Signed out — see you soon', 'info');
    navigate('/');
  };

  const isActive = (to) =>
    to.startsWith('/#') ? location.pathname === '/' && location.hash === to.slice(1) : location.pathname.startsWith(to);

  return (
    <>
      <motion.header
        className={`nav ${scrolled ? 'scrolled' : ''}`}
        animate={{ y: hidden ? -110 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ top: scrolled ? 0 : 38 }}
      >
        <div className="nav-inner">
          <Link to={user ? '/dashboard' : '/'} className="logo" aria-label="Fitnex home">
            <Logo /><span>Fit<em>nex</em></span>
          </Link>
          <nav className="nav-links" onPointerLeave={() => setHover(null)}>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={`nav-link ${isActive(l.to) ? 'active' : ''}`} onPointerEnter={() => setHover(l.to)}>
                {(hover === l.to || (!hover && isActive(l.to))) && (
                  <motion.span layoutId="nav-pill" className="pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            {user ? (
              <>
                <Link to="/exercises?fav=1" className="icon-btn hide-m" style={{ position: 'relative' }} aria-label={t('nav.favorites', 'Favourites')}>
                  <Heart />
                  {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
                </Link>
                <Link to="/builder" className="icon-btn" style={{ position: 'relative' }} aria-label={t('nav.builder', 'Workout builder')}>
                  <Dumbbell />
                  <AnimatePresence>
                    {workout.items.length > 0 && (
                      <motion.span key={workout.items.length} className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        {workout.items.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
                <UserMenu user={user} onLogout={doLogout} />
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm hide-m">{t('nav.login', 'Sign in')}</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">{t('nav.get_started', 'Start free')}</Link>
              </>
            )}
            <button
              className="icon-btn theme-btn"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun /> : <Moon />}
            </button>
            <button className={`icon-btn burger ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              <span /><span />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav>
              {[...links, ...(user ? [{ to: '/profile', label: t('nav.profile', 'Profile') }] : [{ to: '/login', label: t('nav.login', 'Sign in') }])].map((l, i) => (
                <div key={l.to} style={{ overflow: 'hidden' }}>
                  <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                    <Link to={l.to} className="big">{l.label}</Link>
                  </motion.div>
                </div>
              ))}
            </nav>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mobile-foot">
              <button
                className="btn btn-ghost"
                onClick={toggleTheme}
                style={{ width: '100%', justifyContent: 'flex-start', gap: 12 }}
              >
                {isDark ? <Sun /> : <Moon />} {isDark ? 'Light' : 'Dark'}
              </button>
              {user ? (
                <button className="btn btn-ghost" onClick={doLogout}><LogOut /> {t('nav.logout', 'Sign out')}</button>
              ) : (
                <Link to="/signup" className="btn btn-primary">{t('cta.btn_create', 'Create free account')}</Link>
              )}
              <span className="muted">{t('footer.tagline', '1,324 animated exercises in your pocket.')}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
