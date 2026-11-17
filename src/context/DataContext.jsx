import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { asset } from '../lib/utils.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let alive = true;
    fetch(asset('data/exercises.json'))
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        setExercises(d);
        setStatus('ready');
      })
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    const count = (k) => {
      const m = new Map();
      exercises.forEach((e) => m.set(e[k], (m.get(e[k]) || 0) + 1));
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    return {
      exercises,
      byId,
      status,
      ready: status === 'ready',
      facets: {
        bodyPart: count('bodyPart'),
        equipment: count('equipment'),
        target: count('target'),
      },
      findByName: (name) => exercises.find((e) => e.name.toLowerCase() === name.toLowerCase()),
    };
  }, [exercises, status]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
