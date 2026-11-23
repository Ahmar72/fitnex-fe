import { createContext, useContext, useEffect, useState, useRef } from 'react';

const ThemeContext = createContext(null);
const THEME_KEY = 'fx:theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const currentThemeRef = useRef(theme);
  const isTransitioningRef = useRef(false);
  const pendingThemeRef = useRef(null);
  const activeAnimRef = useRef(null);
  const lastToggleTimeRef = useRef(0);

  useEffect(() => {
    currentThemeRef.current = theme;
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const applyThemeWithTransition = (nextTheme, e) => {
    isTransitioningRef.current = true;
    currentThemeRef.current = nextTheme;

    // If View Transitions API is supported, animate using circular reveal clip-path
    if (
      typeof document !== 'undefined' &&
      document.startViewTransition &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const themeBtn = document.querySelector('.header-theme-toggle');
      const rect = themeBtn ? themeBtn.getBoundingClientRect() : null;
      const x = e?.clientX ?? (rect ? rect.left + rect.width / 2 : window.innerWidth - 60);
      const y = e?.clientY ?? (rect ? rect.top + rect.height / 2 : 40);

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      let transition;
      try {
        transition = document.startViewTransition(() => {
          setTheme(nextTheme);
          document.documentElement.setAttribute('data-theme', nextTheme);
          try {
            localStorage.setItem(THEME_KEY, nextTheme);
          } catch {}
        });
      } catch (err) {
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
        try {
          localStorage.setItem(THEME_KEY, nextTheme);
        } catch {}
        isTransitioningRef.current = false;
        return;
      }

      transition.ready
        .then(() => {
          try {
            const clipPath = [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ];
            const anim = document.documentElement.animate(
              {
                clipPath: clipPath,
              },
              {
                duration: 440,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            );
            activeAnimRef.current = anim;
            anim.onfinish = () => {
              activeAnimRef.current = null;
            };
            anim.oncancel = () => {
              activeAnimRef.current = null;
            };
          } catch (animErr) {
            // Silently ignore if pseudo-element was removed
          }
        })
        .catch(() => {
          // Gracefully catch AbortError if transition was aborted
        });

      transition.finished
        .catch(() => {})
        .finally(() => {
          if (activeAnimRef.current) {
            try {
              activeAnimRef.current.cancel();
            } catch {}
            activeAnimRef.current = null;
          }
          isTransitioningRef.current = false;

          // If another toggle occurred while transitioning, execute the queued theme change
          if (pendingThemeRef.current && pendingThemeRef.current !== currentThemeRef.current) {
            const queued = pendingThemeRef.current;
            pendingThemeRef.current = null;
            applyThemeWithTransition(queued, null);
          } else {
            pendingThemeRef.current = null;
          }
        });
    } else {
      // Smooth CSS transition fallback
      document.documentElement.classList.add('theme-transitioning');
      setTheme(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch {}
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
        isTransitioningRef.current = false;
        if (pendingThemeRef.current && pendingThemeRef.current !== currentThemeRef.current) {
          const queued = pendingThemeRef.current;
          pendingThemeRef.current = null;
          applyThemeWithTransition(queued, null);
        } else {
          pendingThemeRef.current = null;
        }
      }, 440);
    }
  };

  const toggleTheme = (e) => {
    // Prevent ultra-rapid re-triggering under 100ms
    const now = performance.now();
    if (now - lastToggleTimeRef.current < 100) {
      return;
    }
    lastToggleTimeRef.current = now;

    const baseTheme = pendingThemeRef.current || currentThemeRef.current;
    const nextTheme = baseTheme === 'dark' ? 'light' : 'dark';

    // If an animation/transition is already running, queue the desired final state
    // so we never create overlapping view transitions that crash Chromium
    if (isTransitioningRef.current) {
      pendingThemeRef.current = nextTheme;
      return;
    }

    applyThemeWithTransition(nextTheme, e);
  };

  // Global 'd' keyboard shortcut to toggle dark/light mode with animation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Never switch themes if key is repeating (held down)
      if (e.repeat) return;

      // Never switch themes if user is typing in ANY field in the system
      const isInputLike = (el) => {
        if (!el || typeof el.getAttribute !== 'function') return false;
        const tag = el.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
        if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') return true;
        if (el.getAttribute('role') === 'textbox' || el.getAttribute('role') === 'searchbox') return true;
        return !!el.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"], [role="searchbox"], .search, label');
      };

      if (
        isInputLike(e.target) ||
        isInputLike(document.activeElement) ||
        (e.composedPath && e.composedPath().some(isInputLike))
      ) {
        return;
      }

      if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleTheme(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const value = {
    theme,
    setTheme: (newTheme) => {
      currentThemeRef.current = newTheme;
      setTheme(newTheme);
    },
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
