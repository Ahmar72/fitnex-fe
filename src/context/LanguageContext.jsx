import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { TRANSLATIONS, translateSteps } from '../lib/translations.js';

const LanguageContext = createContext(null);
export const LANG_KEY = 'fx:lang';

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'pl', label: 'Polish', native: 'Polski' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ko', label: 'Korean', native: '한국어' },
];

export function LanguageProvider({ children }) {
  const { user, updateUser } = useAuth();

  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
      if (user?.profile?.language && LANGUAGES.some((l) => l.code === user.profile.language)) {
        return user.profile.language;
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  // Sync if user profile language updates
  useEffect(() => {
    if (user?.profile?.language && user.profile.language !== lang) {
      if (LANGUAGES.some((l) => l.code === user.profile.language)) {
        setLangState(user.profile.language);
      }
    }
  }, [user?.profile?.language, lang]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLanguage = (newLang) => {
    if (!LANGUAGES.some((l) => l.code === newLang)) return;
    setLangState(newLang);
    try {
      localStorage.setItem(LANG_KEY, newLang);
      document.documentElement.setAttribute('lang', newLang);
      document.documentElement.setAttribute('dir', newLang === 'ur' ? 'rtl' : 'ltr');
    } catch {
      /* ignore */
    }
    if (user && updateUser) {
      try {
        updateUser({ profile: { language: newLang } });
      } catch {
        /* ignore */
      }
    }
  };

  const t = useCallback(
    (key, fallback = '') => {
      const dict = TRANSLATIONS[lang] || {};
      const enDict = TRANSLATIONS.en || {};
      return dict[key] || enDict[key] || fallback || key;
    },
    [lang]
  );

  const currentLanguage = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const value = {
    lang,
    setLanguage,
    currentLanguage,
    languages: LANGUAGES,
    t,
    translateSteps: (steps, i18nData) => translateSteps(steps, lang, i18nData),
    isRtl: lang === 'ur',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
