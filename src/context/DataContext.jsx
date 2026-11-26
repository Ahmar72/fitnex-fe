import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { asset } from '../lib/utils.js';
import { api } from '../lib/api.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let alive = true;

    async function loadExercises() {
      try {
        // Attempt loading from live backend API first
        const data = await api.exercises.getAll({ limit: 1400 });
        api.exercises.getFacets().catch(() => {});
        const list = Array.isArray(data) ? data : data?.items || data?.exercises || [];
        if (alive && list.length > 0) {
          setExercises(list);
          setStatus('ready');
          return;
        }
      } catch {
        // Fallback to local asset if backend is temporarily unreachable
      }

      try {
        const res = await fetch(asset('data/exercises.json'));
        if (!res.ok) throw new Error(res.statusText);
        const localData = await res.json();
        if (alive) {
          setExercises(localData);
          setStatus('ready');
        }
      } catch {
        if (alive) setStatus('error');
      }
    }

    loadExercises();

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => {
    const list = Array.isArray(exercises) ? exercises : [];
    const byId = new Map(list.map((e) => [String(e.id || e._id), e]));
    const count = (k) => {
      const m = new Map();
      list.forEach((e) => {
        const val = e[k];
        if (val) m.set(val, (m.get(val) || 0) + 1);
      });
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    return {
      exercises: list,
      byId,
      status,
      ready: status === 'ready',
      facets: {
        bodyPart: count('bodyPart'),
        equipment: count('equipment'),
        target: count('target'),
      },
      findByName: (name) => list.find((e) => e?.name?.toLowerCase() === name?.toLowerCase()),
    };
  }, [exercises, status]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
