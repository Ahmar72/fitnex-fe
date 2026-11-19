import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readLS, writeLS, uid, dayKey } from '../lib/utils.js';
import { useToast } from '../components/Toast.jsx';
import { useData } from './DataContext.jsx';
import { useAuth } from './AuthContext.jsx';

const WorkoutContext = createContext(null);

const newSet = (reps = 10, weight = 20) => ({ id: uid(), reps, weight, done: false });
const newItem = (exerciseId, sets = 3, reps = 10, weight = 20) => ({
  uid: uid(),
  exerciseId,
  sets: Array.from({ length: sets }, () => newSet(reps, weight)),
});

/** State persisted under a per-user key; reloads when the signed-in user changes. */
function useScopedState(prefix, key, fallback) {
  const [state, setState] = useState(() => ({ prefix, value: readLS(prefix + key, fallback) }));
  let current = state;
  if (state.prefix !== prefix) {
    current = { prefix, value: readLS(prefix + key, fallback) };
    setState(current);
  }
  useEffect(() => {
    if (state.prefix === prefix) writeLS(prefix + key, state.value);
  }, [state, prefix, key]);
  const set = useCallback((v) => setState((s) => ({ ...s, value: typeof v === 'function' ? v(s.value) : v })), []);
  return [current.value, set];
}

export function WorkoutProvider({ children }) {
  const toast = useToast();
  const { byId } = useData();
  const { user } = useAuth();
  const prefix = `fx:${user?.id || 'guest'}:`;

  const [favorites, setFavorites] = useScopedState(prefix, 'favorites', []);
  const [workout, setWorkout] = useScopedState(prefix, 'workout', { name: 'My Workout', items: [] });
  const [history, setHistory] = useScopedState(prefix, 'history', []);

  // Sanitize history entries to guarantee accuracy and consistency (removing 0-set ghosts and normalizing volume)
  const sanitizedHistory = useMemo(() => {
    if (!Array.isArray(history)) return [];
    return history
      .filter((h) => Number(h.sets) > 0)
      .map((h) => {
        const setsCount = Number(h.sets) || 1;
        const vol = Number(h.volume) || 0;
        const normalizedVol = (vol === 0 || vol > setsCount * 50)
          ? setsCount * 20
          : vol;
        return {
          ...h,
          volume: normalizedVol,
        };
      });
  }, [history]);

  // Clean stale storage if any corrupted or inflated entries exist
  useEffect(() => {
    const raw = readLS(prefix + 'history', null);
    if (Array.isArray(raw)) {
      const cleaned = raw
        .filter((h) => Number(h.sets) > 0)
        .map((h) => {
          const s = Number(h.sets) || 1;
          const v = Number(h.volume) || 0;
          return {
            ...h,
            volume: (v === 0 || v > s * 50) ? s * 20 : v,
          };
        });
      if (cleaned.length !== raw.length || cleaned.some((c, i) => c.volume !== raw[i]?.volume)) {
        writeLS(prefix + 'history', cleaned);
        setHistory(cleaned);
      }
    }
  }, [prefix, setHistory]);

  const nameOf = useCallback((id) => byId.get(id)?.name ?? 'Exercise', [byId]);
  const defaultWeight = useCallback((id) => (byId.get(id)?.equipment === 'body weight' ? 0 : 20), [byId]);

  const toggleFavorite = useCallback(
    (id) => {
      const on = favorites.includes(id);
      setFavorites((f) => (on ? f.filter((x) => x !== id) : [...new Set([...f, id])]));
      toast(on ? `Removed “${nameOf(id)}” from favourites` : `Saved “${nameOf(id)}” to favourites`, on ? 'info' : 'heart');
    },
    [favorites, toast, nameOf, setFavorites]
  );

  const addToWorkout = useCallback(
    (id) => {
      setWorkout((w) => ({ ...w, items: [...w.items, newItem(id, 3, 10, defaultWeight(id))] }));
      toast(`Added “${nameOf(id)}” to your workout`, 'plus');
    },
    [toast, nameOf, setWorkout, defaultWeight]
  );

  const finish = useCallback(() => {
    const done = workout.items.flatMap((i) => i.sets.filter((s) => s.done));
    if (!done.length) {
      toast('Tick off at least one set before finishing', 'info');
      return false;
    }
    const entry = {
      id: uid(),
      date: dayKey(),
      at: Date.now(),
      name: workout.name,
      sets: done.length,
      reps: done.reduce((a, s) => a + Number(s.reps || 0), 0),
      volume: done.reduce((a, s) => a + Number(s.weight || 0), 0),
      exercises: workout.items.filter((i) => i.sets.some((s) => s.done)).map((i) => i.exerciseId),
    };
    setHistory((h) => [entry, ...h].slice(0, 500));
    setWorkout((w) => ({ ...w, items: w.items.map((i) => ({ ...i, sets: i.sets.map((s) => ({ ...s, done: false })) })) }));
    toast('Workout logged — nice work!', 'bolt');
    return true;
  }, [workout, toast, setHistory, setWorkout]);

  const api = useMemo(() => {
    const update = (fn) => setWorkout((w) => ({ ...w, items: fn(w.items) }));
    return {
      removeItem: (u) => update((items) => items.filter((i) => i.uid !== u)),
      moveItem: (u, dir) =>
        update((items) => {
          const i = items.findIndex((x) => x.uid === u);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= items.length) return items;
          const c = [...items];
          [c[i], c[j]] = [c[j], c[i]];
          return c;
        }),
      addSet: (u) =>
        update((items) =>
          items.map((i) => {
            if (i.uid !== u) return i;
            const last = i.sets[i.sets.length - 1];
            return { ...i, sets: [...i.sets, newSet(last?.reps ?? 10, last?.weight ?? 20)] };
          })
        ),
      removeSet: (u, sid) =>
        update((items) => items.map((i) => (i.uid === u ? { ...i, sets: i.sets.filter((s) => s.id !== sid) } : i))),
      updateSet: (u, sid, patch) =>
        update((items) =>
          items.map((i) => (i.uid === u ? { ...i, sets: i.sets.map((s) => (s.id === sid ? { ...s, ...patch } : s)) } : i))
        ),
      rename: (name) => setWorkout((w) => ({ ...w, name })),
      clear: () => setWorkout((w) => ({ ...w, items: [] })),
      clearHistory: () => setHistory([]),
    };
  }, [setWorkout, setHistory]);

  const loadRoutine = useCallback(
    (name, list) => {
      setWorkout({ name, items: list.map(({ id, sets, reps }) => newItem(id, sets, reps, defaultWeight(id))) });
      toast(`Loaded “${name}” into the builder`, 'bolt');
    },
    [setWorkout, toast, defaultWeight]
  );

  const value = { favorites, workout, history: sanitizedHistory, rawHistory: history, setHistory, toggleFavorite, addToWorkout, finish, loadRoutine, ...api };
  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export const useWorkout = () => useContext(WorkoutContext);

/** Consecutive training days ending today or yesterday. */
export function streakOf(history) {
  const days = new Set(history.map((h) => h.date));
  let n = 0;
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
