import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import { Reveal, SplitText } from '../components/Motion.jsx';
import { Arrow, ArrowLeft, Grid, ListIcon, Search, X } from '../components/Icons.jsx';
import { BODY_PARTS, partMeta } from '../lib/utils.js';

export default function Library() {
  const { exercises, facets, ready } = useData();
  const { favorites } = useWorkout();
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const deferred = useDeferredValue(query);
  const input = useRef(null);
  const gridTopRef = useRef(null);

  // Cards per page setting (selectable: 12, 24, 48, 96, default 24)
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('fx:library-page-size'));
      if ([12, 24, 48, 96].includes(saved)) return saved;
    } catch {}
    return 24;
  });

  const handlePageSizeChange = (newSize) => {
    const size = Number(newSize);
    setPageSize(size);
    setCurrentPage(1);
    try {
      localStorage.setItem('fx:library-page-size', String(size));
    } catch {}
  };

  // View Mode: 'grid' or 'list' (persisted in localStorage)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('fx:library-view-mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleToggleView = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('fx:library-view-mode', mode);
    } catch {}
  };

  const part = params.get('part') || '';
  const eq = params.get('eq') || '';
  const target = params.get('target') || '';
  const fav = params.get('fav') === '1';
  const sort = params.get('sort') || 'az';

  // Reliable independent page state
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset to page 1 ONLY when an actual filter or query changes
  const prevFiltersRef = useRef({ deferred, part, eq, target, fav, sort });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.deferred !== deferred ||
      prev.part !== part ||
      prev.eq !== eq ||
      prev.target !== target ||
      prev.fav !== fav ||
      prev.sort !== sort
    ) {
      setCurrentPage(1);
      prevFiltersRef.current = { deferred, part, eq, target, fav, sort };
    }
  }, [deferred, part, eq, target, fav, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedExercises = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return results.slice(start, start + pageSize);
  }, [results, safePage, pageSize]);

  const handlePageChange = (newPage) => {
    const valid = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(valid);
    if (gridTopRef.current) {
      const rect = gridTopRef.current.getBoundingClientRect();
      const targetY = rect.top + window.scrollY - 100;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safePage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages];
  }, [totalPages, safePage]);

  const counts = Object.fromEntries(facets.bodyPart);
  const active = part || eq || target || fav || deferred;
  const reset = () => {
    setQuery('');
    setParams({}, { replace: true });
    setCurrentPage(1);
  };

  return (
    <>
      <section className="page-head" style={{ paddingBottom: 20 }}>
        <div className="container">
          <h1 className="display h1" style={{ whiteSpace: 'nowrap', margin: 0, textTransform: 'uppercase' }}>
            <span className="accent">1,324</span> {t('lib.title_1', 'Ways')} {t('lib.title_2', 'to Move')}
          </h1>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 100 }}>
        <div className="toolbar">
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
        </div>

        {/* ONE Master White Card containing exercises catalogue and pagination */}
        <div className="library-main-card">
          <div ref={gridTopRef} className="results-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span>
                {t('lib.showing', 'Showing')}{' '}
                <strong>{results.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, results.length)}</strong>{' '}
                {t('lib.of', 'of')} <strong>{results.length.toLocaleString()}</strong> {t('lib.exercises', 'exercises')}
                {part && <> in <strong>{t(`part.${part}`, partMeta(part).label)}</strong></>}
              </span>
              {active && <button className="link-btn" onClick={reset}>{t('lib.clear_filters', 'Clear all filters')}</button>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Option to select how many cards to show on a page */}
              <div className="cards-per-page-selector" title="Select cards to show per page">
                <span className="selector-label">Per page:</span>
                <div className="selector-pills">
                  {[12, 24, 48, 96].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`selector-pill-btn ${pageSize === num ? 'active' : ''}`}
                      onClick={() => handlePageSizeChange(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="view-mode-toggle" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleToggleView('grid')}
                  title="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid width={15} height={15} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => handleToggleView('list')}
                  title="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <ListIcon width={15} height={15} />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {!ready ? (
            <div className="loader-dots"><i /><i /><i /></div>
          ) : results.length === 0 ? (
            <div className="empty">
              <div className="display">{t('lib.no_reps', 'No reps here.')}</div>
              <p>{fav ? 'You haven’t saved any favourites yet — tap the heart on any exercise.' : t('lib.no_reps_desc', 'Nothing matches those filters. Try a broader search.')}</p>
              <button className="btn btn-primary" onClick={reset} style={{ marginTop: 20 }}>{t('lib.reset_filters', 'Reset filters')}</button>
            </div>
          ) : (
            <>
              {/* Smooth & catchy GPU-accelerated view toggle animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  className={viewMode === 'list' ? 'ex-list' : 'ex-grid'}
                  initial={{ opacity: 0, y: 12, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.985 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  {paginatedExercises.map((e, i) => (
                    <ExerciseCard key={e.id} ex={e} index={i} viewMode={viewMode} />
                  ))}
                </motion.div>
              </AnimatePresence>

              {totalPages > 1 && (
                <div className="pagination-bar">
                  <div className="pagination-info">
                    Showing <strong>{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, results.length)}</strong> of <strong>{results.length.toLocaleString()}</strong> exercises (Page {safePage} of {totalPages})
                  </div>
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={safePage === 1}
                      onClick={() => handlePageChange(safePage - 1)}
                      aria-label="Previous page"
                    >
                      <ArrowLeft width={14} height={14} /> Prev
                    </button>

                    <div className="pagination-pages">
                      {pageNumbers.map((p, idx) =>
                        p === '...' ? (
                          <span key={`el-${idx}`} className="pagination-ellipsis">…</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            className={`pagination-num-btn ${safePage === p ? 'active' : ''}`}
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={safePage === totalPages}
                      onClick={() => handlePageChange(safePage + 1)}
                      aria-label="Next page"
                    >
                      Next <Arrow width={14} height={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
