import { useState, useEffect, Suspense } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Logo,
  Grid,
  Target,
  Dumbbell,
  Bolt,
  Heart,
  User,
  LogOut,
  MenuIcon,
  SidebarIcon,
  X,
  Sun,
  Moon,
  SaladIcon,
} from './Icons.jsx';
import PageShimmer, { TopProgressBar } from './AppSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from './Toast.jsx';
import { lockScroll } from '../lib/useSmoothScroll.js';

export const userInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { workout, favorites } = useWorkout();
  const { t, isRtl } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Desktop collapsed rail state (persisted)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('fx:sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile / tablet off-canvas drawer open state
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fx:sidebar-collapsed', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Smooth page navigation indicator when switching between screens
  const [navigating, setNavigating] = useState(false);

  // Close mobile drawer on route change, scroll to top & briefly show loading transition
  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo(0, 0);
    setNavigating(true);
    const timer = setTimeout(() => setNavigating(false), 240);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      lockScroll(true);
      const onKeyDown = (e) => {
        if (e.key === 'Escape') setDrawerOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        lockScroll(false);
        window.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [drawerOpen]);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    logout();
    toast('Signed out — see you soon', 'info');
    navigate('/');
  };

  // Dynamic view title for the header
  const getHeaderTitle = () => {
    const p = location.pathname;
    const isFav = location.search.includes('fav=1');
    if (p === '/dashboard') return t('header.dashboard', 'Dashboard');
    if (p === '/plans' || p.startsWith('/plans/')) return t('header.plans', 'Workout Plans');
    if (p === '/exercises') return isFav ? t('header.favorites', 'Favourites') : t('header.library', 'Exercise Library');
    if (p.startsWith('/exercises/')) return t('header.detail', 'Exercise Details');
    if (p === '/builder') return t('header.builder', 'Workout Builder');
    if (p === '/profile') return t('header.profile', 'Profile');
    if (p === '/nutrition' || p.startsWith('/nutrition/')) return t('header.nutrition', 'Nutrition');
    return 'Fitnex';
  };

  const navItems = [
    {
      to: '/dashboard',
      label: t('nav.dashboard', 'Dashboard'),
      icon: Grid,
      isActive: location.pathname === '/dashboard',
    },
    {
      to: '/plans',
      label: t('nav.plans', 'Plans'),
      icon: Target,
      isActive: location.pathname === '/plans' || location.pathname.startsWith('/plans/'),
    },
    {
      to: '/exercises',
      label: t('nav.library', 'Exercise Library'),
      icon: Dumbbell,
      isActive:
        (location.pathname === '/exercises' && !location.search.includes('fav=1')) ||
        location.pathname.startsWith('/exercises/'),
    },
    {
      to: '/builder',
      label: t('nav.builder', 'Workout Builder'),
      icon: Bolt,
      badge: workout?.items?.length > 0 ? workout.items.length : null,
      isActive: location.pathname === '/builder',
    },
    {
      to: '/exercises?fav=1',
      label: t('nav.favorites', 'Favourites'),
      icon: Heart,
      badge: favorites?.length > 0 ? favorites.length : null,
      isActive: location.pathname === '/exercises' && location.search.includes('fav=1'),
    },
    {
      to: '/nutrition',
      label: t('nav.nutrition', 'Nutrition'),
      icon: SaladIcon,
      isActive: location.pathname === '/nutrition' || location.pathname.startsWith('/nutrition/'),
    },
    {
      to: '/profile',
      label: t('nav.profile', 'Profile'),
      icon: User,
      isActive: location.pathname === '/profile',
    },
  ];

  return (
    <div
      className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${
        drawerOpen ? 'drawer-open' : ''
      }`}
    >
      {/* ============================================================
          1. Desktop / Tablet Sidebar (Fixed)
          ============================================================ */}
      <aside className="app-sidebar" aria-label="Main Navigation">
        {/* Brand / Logo Header */}
        <div className="sidebar-brand">
          <Link to="/dashboard" className="sidebar-logo" aria-label="Fitnex Dashboard">
            <span className="logo-symbol">
              <Logo />
            </span>
            {!collapsed && (
              <div className="brand-text">
                <span className="brand-name">FITNEX</span>
              </div>
            )}
          </Link>
        </div>

        {/* Primary Nav Links */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="nav-item">
                  <Link
                    to={item.to}
                    className={`nav-link ${item.isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                    aria-current={item.isActive ? 'page' : undefined}
                  >
                    <span className="nav-icon-wrap">
                      {item.icon === Heart ? (
                        <Heart width={20} height={20} filled={favorites?.length > 0} />
                      ) : (
                        <Icon width={20} height={20} />
                      )}
                      {collapsed && item.badge && <span className="nav-dot highlight" />}
                    </span>
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="nav-badge highlight">{item.badge}</span>
                    )}
                    {item.isActive && <span className="active-pill" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer: User Card & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Link to="/profile" className="user-info-link" title="Open profile">
              <div className="sidebar-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || 'Profile'} className="sidebar-avatar-img" />
                ) : (
                  userInitials(user?.name)
                )}
              </div>
              {!collapsed && (
                <div className="user-text">
                  <span className="user-name">{user?.name || 'User'}</span>
                  <span className="user-email">{user?.email || ''}</span>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                type="button"
                className="sidebar-logout-btn"
                onClick={handleLogout}
                title={t('nav.logout', 'Log out')}
                aria-label={t('nav.logout', 'Log out')}
              >
                <LogOut width={16} height={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================================
          2. Mobile Off-Canvas Drawer (Slide-in)
          ============================================================ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
            >
              <div className="drawer-header">
                <Link to="/dashboard" className="sidebar-logo" onClick={() => setDrawerOpen(false)}>
                  <span className="logo-symbol">
                    <Logo />
                  </span>
                  <div className="brand-text">
                    <span className="brand-name">FITNEX</span>
                  </div>
                </Link>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X width={20} height={20} />
                </button>
              </div>

              <nav className="drawer-nav">
                <ul className="nav-list">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to} className="nav-item">
                        <Link
                          to={item.to}
                          className={`nav-link ${item.isActive ? 'active' : ''}`}
                          onClick={() => setDrawerOpen(false)}
                        >
                          <span className="nav-icon-wrap">
                            {item.icon === Heart ? (
                              <Heart width={20} height={20} filled={favorites?.length > 0} />
                            ) : (
                              <Icon width={20} height={20} />
                            )}
                          </span>
                          <span className="nav-label">{item.label}</span>
                          {item.badge && <span className="nav-badge highlight">{item.badge}</span>}
                          {item.isActive && <span className="active-pill" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="drawer-footer">
                <div className="sidebar-user">
                  <Link
                    to="/profile"
                    className="user-info-link"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <div className="sidebar-avatar">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user?.name || 'Profile'} className="sidebar-avatar-img" />
                      ) : (
                        userInitials(user?.name)
                      )}
                    </div>
                    <div className="user-text">
                      <span className="user-name">{user?.name || 'User'}</span>
                      <span className="user-email">{user?.email || ''}</span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="sidebar-logout-btn"
                    onClick={handleLogout}
                    title={t('nav.logout', 'Log out')}
                  >
                    <LogOut width={16} height={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================
          3. App Workspace Header (Top Bar)
          ============================================================ */}
      <div className="app-workspace">
        <TopProgressBar active={navigating} />
        <header className="app-header">
          <div className="app-header-left">
            {/* Hamburger button on mobile / tablet */}
            <button
              type="button"
              className="header-icon-btn mobile-menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon width={22} height={22} />
            </button>

            {/* Desktop collapse sidebar toggle button */}
            <button
              type="button"
              className="header-icon-btn desktop-only"
              onClick={toggleCollapsed}
              title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <SidebarIcon width={20} height={20} />
            </button>

            <h1 className="header-view-title">{getHeaderTitle()}</h1>
          </div>

          <div className="app-header-right">
            {/* Dark / Light Mode Toggle Button (along with profile button, shortcut: 'D') */}
            <button
              type="button"
              className="header-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mode (Press 'D')`}
              aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            >
              {isDark ? <Sun width={18} height={18} /> : <Moon width={18} height={18} />}
            </button>

            {/* User Avatar linking to Profile */}
            <Link to="/profile" className="header-user-chip" title="Go to Profile">
              <div className="chip-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || 'Profile'} className="chip-avatar-img" />
                ) : (
                  userInitials(user?.name)
                )}
              </div>
              <span className="chip-name">{user?.name?.split(' ')[0] || 'User'}</span>
            </Link>
          </div>
        </header>

        {/* ============================================================
            4. Main App Content with Smooth Shimmer Loading Navigation
            ============================================================ */}
        <main className="app-main" id="main-content">
          <Suspense fallback={<PageShimmer route={location.pathname} label={t('common.loading', 'Loading...')} />}>
            {navigating ? (
              <PageShimmer route={location.pathname} label={t('common.loading', 'Loading...')} />
            ) : (
              <div className="app-view-content" key={location.pathname}>
                {children || <Outlet />}
              </div>
            )}
          </Suspense>
        </main>
      </div>

      {/* ============================================================
          5. Mobile Bottom Navigation Bar (Screens < 768px)
          ============================================================ */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <div className="mobile-nav-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`mob-nav-item ${item.isActive ? 'active' : ''}`}
                aria-label={item.label}
              >
                <div className="mob-icon-wrap">
                  {item.icon === Heart ? (
                    <Heart width={20} height={20} filled={favorites?.length > 0} />
                  ) : (
                    <Icon width={20} height={20} />
                  )}
                  {item.badge && <span className="mob-badge">{item.badge}</span>}
                </div>
                <span className="mob-nav-label">{item.label}</span>
                {item.isActive && <span className="mob-active-indicator" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
