import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import { Reveal, SplitText } from '../components/Motion.jsx';
import { Search, X } from '../components/Icons.jsx';
import { BODY_PARTS, partMeta } from '../lib/utils.js';

const PAGE = 36;

export default function Library() {
  const { exercises, facets, ready } = useData();
  const { favorites } = useWorkout();
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const deferred = useDeferredValue(query);
  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef(null);
  const input = useRef(null);

  const part = params.get('part') || '';
  const eq = params.get('eq') || '';
  const target = params.get('target') || '';
  const fav = params.get('fav') === '1';
  const sort = params.get('sort') || 'az';

  const set = (k, v) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (v) p.set(k, v);
        else p.delete(k);
        return p;
      },
      { replace: true }
    );
  };

  // keep ?q in the URL in sync with the search box
  useEffect(() => {
    const t = setTimeout(() => set('q', deferred.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferred]);

  // "/" focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo(() => {
    const tokens = deferred.toLowerCase().split(/\s+/).filter(Boolean);
    let list = exercises.filter((e) => {
      if (part && e.bodyPart !== part) return false;
      if (eq && e.equipment !== eq) return false;
      if (target && e.target !== target) return false;
      if (fav && !favorites.includes(e.id)) return false;
      if (tokens.length) {
        const hay = `${e.name} ${e.target} ${e.equipment} ${e.bodyPart} ${e.secondary.join(' ')}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      }
      return true;
    });
    if (sort === 'za') list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === 'id') list = [...list].sort((a, b) => a.id.localeCompare(b.id));
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [exercises, deferred, part, eq, target, fav, favorites, sort]);

  useEffect(() => setVisible(PAGE), [deferred, part, eq, target, fav, sort]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisible((v) => v + PAGE);
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [results.length]);

  const counts = Object.fromEntries(facets.bodyPart);
  const active = part || eq || target || fav || deferred;
  const reset = () => {
    setQuery('');
    setParams({}, { replace: true });
  };

  return (
    <>
      <section className="page-head">
        <div className="container">
          <Reveal><span className="eyebrow">{t('lib.eyebrow', 'Exercise library')}</span></Reveal>
          <SplitText as="h1" className="display h1" animateNow delay={0.3} lines={[<span key="a"><span className="accent">1,324</span> {t('lib.title_1', 'ways')}</span>, t('lib.title_2', 'to move.')]} />
          <Reveal delay={0.4}>
            <p className="lead">{t('lib.lead', 'Search by name, muscle or equipment. Tap the heart to save, the plus to add to your workout.')}</p>
          </Reveal>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 120 }}>
        <motion.div className="toolbar" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}>
          <div className="toolbar-row">
            <label className="search">
              <Search />
              <input ref={input} className="input" placeholder={t('lib.search_placeholder', 'Search exercises, muscles, equipment…')} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search exercises" />
              {query ? (
                <button className="kbd" onClick={() => setQuery('')} aria-label="Clear search" style={{ display: 'grid', placeItems: 'center' }}><X width={12} height={12} /></button>
              ) : (
                <span className="kbd">/</span>
              )}
            </label>
            <select className="input" value={eq} onChange={(e) => set('eq', e.target.value)} aria-label={t('lib.equipment', 'Equipment')}>
              <option value="">{t('lib.all', 'All')} {t('lib.equipment', 'equipment')}</option>
              {facets.equipment.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
            </select>
            <select className="input" value={target} onChange={(e) => set('target', e.target.value)} aria-label={t('lib.target', 'Target muscle')}>
              <option value="">{t('lib.all', 'All')} {t('lib.target', 'muscles')}</option>
              {facets.target.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
            </select>
            <select className="input" value={sort} onChange={(e) => set('sort', e.target.value === 'az' ? '' : e.target.value)} aria-label="Sort" style={{ flexBasis: 150 }}>
              <option value="az">{t('lib.sort_az', 'A → Z')}</option>
              <option value="za">{t('lib.sort_za', 'Z → A')}</option>
              <option value="id">{t('lib.sort_id', 'Catalogue #')}</option>
            </select>
            <button className={`toggle ${fav ? 'on' : ''}`} onClick={() => set('fav', fav ? '' : '1')} aria-pressed={fav}>
              <span className="sw" /> {t('nav.favorites', 'Favourites')} ({favorites.length})
            </button>
          </div>
          <div className="filter-chips">
            <button className={`fchip ${!part ? 'active' : ''}`} onClick={() => set('part', '')}>
              {!part && <motion.span className="bg" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 28 }} />}
              <span>{t('lib.all', 'All')}</span> <small>{exercises.length}</small>
            </button>
            {BODY_PARTS.filter((b) => counts[b.key]).map((b) => (
              <button key={b.key} className={`fchip ${part === b.key ? 'active' : ''}`} onClick={() => set('part', b.key)}>
                {part === b.key && <motion.span className="bg" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 28 }} />}
                <span>{t(`part.${b.key}`, b.label)}</span> <small>{counts[b.key]}</small>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="results-bar">
          <span>
            {t('lib.showing', 'Showing')} <strong>{Math.min(visible, results.length)}</strong> {t('lib.of', 'of')} <strong>{results.length}</strong> {t('lib.exercises', 'exercises')}
            {part && <> in <strong>{t(`part.${part}`, partMeta(part).label)}</strong></>}
          </span>
          {active && <button className="link-btn" onClick={reset}>{t('lib.clear_filters', 'Clear all filters')}</button>}
        </div>

        {!ready ? (
          <div className="loader-dots"><i /><i /><i /></div>
        ) : results.length === 0 ? (
          <motion.div className="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="display">{t('lib.no_reps', 'No reps here.')}</div>
            <p>{fav ? 'You haven’t saved any favourites yet — tap the heart on any exercise.' : t('lib.no_reps_desc', 'Nothing matches those filters. Try a broader search.')}</p>
            <button className="btn btn-primary" onClick={reset} style={{ marginTop: 20 }}>{t('lib.reset_filters', 'Reset filters')}</button>
          </motion.div>
        ) : (
          <motion.div layout className="ex-grid">
            <AnimatePresence mode="popLayout">
              {results.slice(0, visible).map((e, i) => <ExerciseCard key={e.id} ex={e} index={i} />)}
            </AnimatePresence>
          </motion.div>
        )}
        {visible < results.length && (
          <div ref={sentinel} className="loader-dots"><i /><i /><i /></div>
        )}
      </section>
    </>
  );
}
