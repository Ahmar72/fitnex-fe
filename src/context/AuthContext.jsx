import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readLS, writeLS, uid } from '../lib/utils.js';

/*
 * Client-side authentication.
 * Users live in localStorage; passwords are never stored — only a salted PBKDF2-SHA256 hash.
 * The session lives in localStorage ("remember me") or sessionStorage (this tab only).
 * Swap these functions for real API calls when a backend exists.
 */

const AuthContext = createContext(null);
const USERS = 'fx:users';
const SESSION = 'fx:session';

const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPassword(password, saltHex) {
  const salt = saltHex || toHex(crypto.getRandomValues(new Uint8Array(16)));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' },
    key,
    256
  );
  return { salt, hash: toHex(bits) };
}

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

const publicUser = (u) =>
  u
    ? {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar || null,
        profile: u.profile,
        createdAt: u.createdAt,
      }
    : null;

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => readLS(USERS, []));
  const [session, setSession] = useState(readSession);

  useEffect(() => writeLS(USERS, users), [users]);

  const user = useMemo(() => publicUser(users.find((u) => u.id === session?.userId)), [users, session]);

  const startSession = (userId, remember) => {
    const s = { userId, at: Date.now() };
    try {
      sessionStorage.removeItem(SESSION);
      localStorage.removeItem(SESSION);
      (remember ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(s));
    } catch {
      /* storage blocked: session stays in memory */
    }
    setSession(s);
  };

  const signup = useCallback(
    async ({ name, email, password, profile }) => {
      const mail = email.trim().toLowerCase();
      if (users.some((u) => u.email === mail)) throw new Error('An account with this email already exists.');
      const { salt, hash } = await hashPassword(password);
      const u = { id: uid(), name: name.trim(), email: mail, salt, hash, profile: profile || {}, createdAt: new Date().toISOString() };
      setUsers((list) => [...list, u]);
      startSession(u.id, true);
      return publicUser(u);
    },
    [users]
  );

  const login = useCallback(
    async (email, password, remember = true) => {
      const u = users.find((x) => x.email === email.trim().toLowerCase());
      if (!u) throw new Error('No account found with that email.');
      const { hash } = await hashPassword(password, u.salt);
      if (hash !== u.hash) throw new Error('Incorrect password. Please try again.');
      startSession(u.id, remember);
      return publicUser(u);
    },
    [users]
  );

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION);
      localStorage.removeItem(SESSION);
    } catch {
      /* ignore */
    }
    setSession(null);
  }, []);

  const updateUser = useCallback(
    (patch) => {
      if (!session) return;
      if (patch.email) {
        const mail = patch.email.trim().toLowerCase();
        if (users.some((u) => u.email === mail && u.id !== session.userId)) throw new Error('That email is already in use.');
        patch = { ...patch, email: mail };
      }
      setUsers((list) =>
        list.map((u) => (u.id === session.userId ? { ...u, ...patch, profile: { ...u.profile, ...(patch.profile || {}) } } : u))
      );
    },
    [session, users]
  );

  const changePassword = useCallback(
    async (current, next) => {
      const u = users.find((x) => x.id === session?.userId);
      if (!u) throw new Error('Not signed in.');
      const { hash } = await hashPassword(current, u.salt);
      if (hash !== u.hash) throw new Error('Your current password is incorrect.');
      const fresh = await hashPassword(next);
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, ...fresh } : x)));
    },
    [users, session]
  );

  const deleteAccount = useCallback(() => {
    if (!session) return;
    const id = session.userId;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`fx:${id}:`))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setUsers((list) => list.filter((u) => u.id !== id));
    logout();
  }, [session, logout]);

  const value = { user, signup, login, logout, updateUser, changePassword, deleteAccount };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
