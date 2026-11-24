import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readLS, writeLS } from '../lib/utils.js';
import { api, tokenStorage } from '../lib/api.js';

const AuthContext = createContext(null);
const USERS = 'fx:users';
const SESSION = 'fx:session';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function passwordChecks(pw = '') {
  return [
    { label: 'At least 8 characters', ok: pw.length >= 8 },
    { label: 'Upper & lower case letters', ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { label: 'A number', ok: /\d/.test(pw) },
    { label: 'A symbol', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}

const readSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION) || 'null') || readLS(SESSION, null);
  } catch {
    return readLS(SESSION, null);
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from Backend on initial mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const userData = await api.auth.getMe();
        if (isMounted && userData) {
          const u = {
            id: userData.id || userData._id,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar || null,
            role: userData.role || 'user',
            isEmailVerified: userData.isEmailVerified ?? false,
            preferredLanguage: userData.preferredLanguage || 'en',
            profile: userData.profile || {},
          };
          setCurrentUser(u);
          setSession({ userId: u.id, at: Date.now() });
        }
      } catch (err) {
        // Token expired or invalid
        tokenStorage.clearTokens();
        sessionStorage.removeItem(SESSION);
        localStorage.removeItem(SESSION);
        if (isMounted) {
          setCurrentUser(null);
          setSession(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const startSession = (u, accessToken, refreshToken, remember = true) => {
    tokenStorage.setTokens(accessToken, refreshToken, remember);
    const s = { userId: u.id, at: Date.now() };
    try {
      sessionStorage.removeItem(SESSION);
      localStorage.removeItem(SESSION);
      (remember ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(s));
    } catch {
      /* storage blocked */
    }
    setSession(s);
    setCurrentUser(u);
  };

  /**
   * Register new user via Backend
   */
  const signup = useCallback(
    async ({ name, email, password, profile }) => {
      const res = await api.auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const u = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role || 'user',
        avatar: null,
        isEmailVerified: false,
        profile: profile || {},
        createdAt: new Date().toISOString(),
      };

      if (res.accessToken) {
        startSession(u, res.accessToken, res.refreshToken, true);
      }

      return { ...u, needsVerification: true };
    },
    [],
  );

  /**
   * Authenticate user with credentials
   */
  const login = useCallback(
    async (email, password, remember = true) => {
      const res = await api.auth.login({
        email: email.trim().toLowerCase(),
        password,
      });

      const u = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role || 'user',
        avatar: res.user.avatar || null,
        isEmailVerified: res.user.isEmailVerified ?? true,
        preferredLanguage: res.user.preferredLanguage || 'en',
        profile: res.user.profile || {},
      };

      startSession(u, res.accessToken, res.refreshToken, remember);
      return u;
    },
    [],
  );

  /**
   * Verify email using 6-digit OTP code
   */
  const verifyEmail = useCallback(async (email, token) => {
    const res = await api.auth.verifyEmail({
      email: email.trim().toLowerCase(),
      token: token.trim(),
    });

    if (res?.accessToken && res?.user) {
      const u = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role || 'user',
        avatar: null,
        isEmailVerified: true,
        preferredLanguage: res.user.preferredLanguage || 'en',
        profile: {},
      };
      startSession(u, res.accessToken, res.refreshToken, true);
    } else {
      setCurrentUser((prev) => (prev ? { ...prev, isEmailVerified: true } : prev));
    }
    return res;
  }, []);

  /**
   * Resend 6-digit verification OTP code
   */
  const resendVerification = useCallback(async (email) => {
    return api.auth.resendVerification({
      email: email.trim().toLowerCase(),
    });
  }, []);

  /**
   * Request password reset code
   */
  const forgotPassword = useCallback(async (email) => {
    return api.auth.forgotPassword({
      email: email.trim().toLowerCase(),
    });
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token, newPassword) => {
    return api.auth.resetPassword({
      token: token.trim(),
      newPassword,
    });
  }, []);

  /**
   * Logout user and revoke tokens
   */
  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore network errors on logout */
    } finally {
      tokenStorage.clearTokens();
      try {
        sessionStorage.removeItem(SESSION);
        localStorage.removeItem(SESSION);
      } catch {
        /* ignore */
      }
      setSession(null);
      setCurrentUser(null);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateUser = useCallback(
    async (patch) => {
      try {
        const updated = await api.users.updateProfile(patch);
        setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev));
      } catch (err) {
        // Fallback local update if offline
        setCurrentUser((prev) => (prev ? { ...prev, ...patch, profile: { ...prev.profile, ...(patch.profile || {}) } } : prev));
      }
    },
    [],
  );

  const value = {
    user: currentUser,
    loading,
    signup,
    login,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
