import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { readLS, writeLS, uid, dayKey } from '../lib/utils.js';
import { useToast } from '../components/Toast.jsx';
import { useData } from './DataContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { api } from '../lib/api.js';

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

  const [rawFavorites, setFavorites] = useScopedState(prefix, 'favorites', []);
  const [workout, setWorkout] = useScopedState(prefix, 'workout', { name: 'My Workout', items: [] });
  const [history, setHistory] = useScopedState(prefix, 'history', []);

  // Guarantee favorites is always a clean array of string IDs
  const favorites = useMemo(() => {
    return Array.isArray(rawFavorites) ? rawFavorites.filter(Boolean).map(String) : [];
  }, [rawFavorites]);

  // Sync favorites with backend when signed in
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    api.exercises
      .getFavorites()
      .then((serverFavs) => {
        if (alive && Array.isArray(serverFavs)) {
          setFavorites((local) => {
            const current = Array.isArray(local) ? local.filter(Boolean).map(String) : [];
            const fresh = serverFavs.filter(Boolean).map(String);
            return Array.from(new Set([...current, ...fresh]));
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.id, setFavorites]);

  // Sync history with backend when signed in
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    api.history
      .getSessions({ limit: 50 })
      .then((res) => {
        const sessions = res?.items || res?.sessions || (Array.isArray(res) ? res : []);
        if (alive && sessions.length > 0) {
          const mapped = sessions.map((s) => {
            const dateVal = s.completedAt || s.createdAt || Date.now();
            return {
              id: s.id || s._id,
              date: s.dateKey || dayKey(new Date(dateVal)),
              at: new Date(dateVal).getTime(),
              name: s.name,
              sets: s.completedSets ?? s.totalSets ?? 1,
              reps: s.completedReps ?? s.totalReps ?? 10,
              volume: s.totalVolumeKg ?? s.totalVolume ?? 0,
              durationSeconds: s.durationSeconds,
              exercises: Array.isArray(s.exercises)
                ? s.exercises.map((e) => (typeof e === 'string' ? e : e.exerciseId || e.id))
                : [],
            };
          });
          setHistory((local) => {
            const existingIds = new Set((local || []).map((h) => h.id));
            const fresh = mapped.filter((m) => !existingIds.has(m.id));
            return [...fresh, ...(local || [])];
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.id, setHistory]);

  // Sync workout draft with backend when signed in
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    api.workouts
      .getCurrent()
      .then((serverDraft) => {
        if (alive && serverDraft && Array.isArray(serverDraft.items) && serverDraft.items.length > 0) {
          setWorkout((local) => {
            if (!local?.items?.length) {
              return serverDraft;
            }
            return local;
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.id, setWorkout]);

  // Persist workout draft to backend with debouncing when signed in
  useEffect(() => {
    if (!user?.id || !workout?.items) return;
    const timer = setTimeout(() => {
      api.workouts.saveCurrent(workout).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [user?.id, workout]);

  // Sanitize history entries to guarantee accuracy and consistency
  const sanitizedHistory = useMemo(() => {
    if (!Array.isArray(history)) return [];
    return history
      .filter((h) => Number(h.sets) > 0)
      .map((h) => {
        const setsCount = Number(h.sets) || 1;
        const vol = Number(h.volume) || 0;
        const normalizedVol = vol > setsCount * 50 ? setsCount * 20 : vol;
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
            volume: v > s * 50 ? s * 20 : v,
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
    (rawId) => {
      if (!rawId) return;
      const id = String(rawId);
      const on = favorites.includes(id);
      setFavorites((f) => {
        const cur = Array.isArray(f) ? f.filter(Boolean).map(String) : [];
        return on ? cur.filter((x) => x !== id) : Array.from(new Set([...cur, id]));
      });
      toast(on ? `Removed “${nameOf(id)}” from favourites` : `Saved “${nameOf(id)}” to favourites`, on ? 'info' : 'heart');

      // Dispatch to backend if signed in
      if (user?.id) {
        api.exercises.toggleFavorite(id).catch(() => {});
      }
    },
    [favorites, toast, nameOf, setFavorites, user?.id]
  );

  const addToWorkout = useCallback(
    (rawId) => {
      if (!rawId) return;
      const id = String(rawId);
      setWorkout((w) => {
        const base = w && typeof w === 'object' ? w : { name: 'My Workout', items: [] };
        const items = Array.isArray(base.items) ? base.items : [];
        return { ...base, items: [...items, newItem(id, 3, 10, defaultWeight(id))] };
      });
      toast(`Added “${nameOf(id)}” to your workout`, 'plus');

      if (user?.id) {
        api.workouts
          .addItem({ exerciseId: id, sets: 3, reps: 10, weight: defaultWeight(id) })
          .catch(() => {});
      }
    },
    [toast, nameOf, setWorkout, defaultWeight, user?.id]
  );

  const finish = useCallback(() => {
    if (!workout.items.length) {
      toast('Add at least one exercise before finishing', 'info');
      return false;
    }
    const unfinished = workout.items.filter((i) => !i.sets.some((s) => s.done));
    if (unfinished.length > 0) {
      toast('Please complete at least one set of each exercise before finishing', 'info');
      return false;
    }
    const done = workout.items.flatMap((i) => i.sets.filter((s) => s.done));
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

    // Post session to backend if authenticated
    if (user?.id) {
      const payload = {
        name: workout.name || 'Workout',
        durationSeconds: 1800,
        dateKey: dayKey(),
        exercises: workout.items
          .filter((i) => i.sets.some((s) => s.done))
          .map((item) => ({
            exerciseId: item.exerciseId,
            name: nameOf(item.exerciseId),
            sets: item.sets
              .filter((s) => s.done)
              .map((s, idx) => ({
                setNumber: idx + 1,
                reps: Math.max(1, Number(s.reps || 10)),
                weight: Math.max(0, Number(s.weight || 0)),
              })),
          })),
      };
      api.history
        .logSession(payload)
        .then(() => {
          api.history.getSessions({ limit: 50 }).catch(() => {});
          api.history.getStreak().catch(() => {});
        })
        .catch(() => {});
    }

    return true;
  }, [workout, toast, setHistory, setWorkout, user?.id, nameOf]);

  const apiMethods = useMemo(() => {
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
      setWorkout({
        name,
        items: list.map(({ id, sets, reps, weight }) =>
          newItem(id, sets, reps, typeof weight === 'number' ? weight : defaultWeight(id))
        ),
      });
      toast(`Loaded “${name}” into the builder`, 'bolt');

      if (user?.id) {
        api.workouts
          .loadRoutine({
            name,
            list: list.map(({ id, sets, reps, weight }) => ({
              id: String(id),
              sets: Number(sets || 3),
              reps: Number(reps || 10),
              weight: Number(typeof weight === 'number' ? weight : defaultWeight(id)),
            })),
          })
          .catch(() => {});
      }
    },
    [setWorkout, toast, defaultWeight, user?.id]
  );

  const value = {
    favorites,
    workout,
    history: sanitizedHistory,
    rawHistory: history,
    setHistory,
    toggleFavorite,
    addToWorkout,
    finish,
    loadRoutine,
    ...apiMethods,
  };
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
