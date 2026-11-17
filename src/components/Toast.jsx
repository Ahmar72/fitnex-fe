import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bolt, Heart, Info, Plus } from './Icons.jsx';

const ToastContext = createContext(() => {});
const ICONS = { heart: Heart, plus: Plus, bolt: Bolt, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const lastToastRef = useRef({ message: '', time: 0 });
  const timerRef = useRef(null);

  const push = useCallback((message, icon = 'info') => {
    if (!message) return;
    const now = Date.now();

    // Prevent duplicate toast if identical message is triggered within 1500ms
    if (lastToastRef.current.message === message && now - lastToastRef.current.time < 1500) {
      return;
    }
    lastToastRef.current = { message, time: now };

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const id = Math.random().toString(36).slice(2);
    // Display only 1 active toast so multiple responses never stack or clutter
    setToasts([{ id, message, icon }]);

    timerRef.current = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence mode="wait">
          {toasts.map((t) => {
            const I = ICONS[t.icon] || Info;
            return (
              <motion.div
                key={t.id}
                layout
                className="toast"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <i>{t.icon === 'heart' ? <Heart filled /> : <I />}</i>
                {t.message}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
