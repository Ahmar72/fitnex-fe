import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import { Reveal, SplitText } from '../components/Motion.jsx';
import { Arrow, ArrowLeft, Grid, ListIcon, Search, X, Heart, Plus } from '../components/Icons.jsx';
import { asset, BODY_PARTS, partMeta } from '../lib/utils.js';
import PageShimmer from '../components/AppSpinner.jsx';

export default function Library() {
  const { exercises, facets, ready } = useData();
  const { favorites, toggleFavorite, addToWorkout } = useWorkout();
  const { t, lang, translateSteps } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const input = useRef(null);
  const gridTopRef = useRef(null);

  // Cards per page setting (selectable: 5-25 cards per page, default 20)
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('fx:library-page-size'));
      if ([5, 10, 15, 20, 25].includes(saved)) return saved;
    } catch {}
    return 20;
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

  // keep ?q in the URL in sync with the search box without reloading or disrupting typing
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = query.trim();
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          const current = p.get('q') || '';
          if (trimmed === current) return prev;
          if (trimmed) p.set('q', trimmed);
          else p.delete('q');
          return p;
        },
        { replace: true }
      );
    }, 400);
    return () => clearTimeout(t);
  }, [query, setParams]);

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
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
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
  }, [exercises, query, part, eq, target, fav, favorites, sort]);

  // Reset to page 1 ONLY when an actual filter or query changes
  const prevFiltersRef = useRef({ query, part, eq, target, fav, sort });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.query !== query ||
      prev.part !== part ||
      prev.eq !== eq ||
      prev.target !== target ||
      prev.fav !== fav ||
      prev.sort !== sort
    ) {
      setCurrentPage(1);
      prevFiltersRef.current = { query, part, eq, target, fav, sort };
    }
  }, [query, part, eq, target, fav, sort]);

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
  const active = part || eq || target || fav || query;
  const reset = () => {
    setQuery('');
    setParams({}, { replace: true });
    setCurrentPage(1);
  };

  return (
    <>
      <section className="container" style={{ paddingTop: 24, paddingBottom: 100 }}>
        <div className="toolbar">
          <div className="toolbar-row">
            <label className="search">
              <Search className="search-icon" />
              <input ref={input} className="input" placeholder={t('lib.search_placeholder', 'Search exercises, muscles, equipment…')} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search exercises" />
              {query ? (
                <button type="button" className="search-clear-btn" onClick={() => setQuery('')} aria-label="Clear search">
                  <X width={13} height={13} />
                </button>
              ) : (
                <span className="kbd">/</span>
              )}
            </label>
            <select className="input" value={eq} onChange={(e) => set('eq', e.target.value)} aria-label={t('lib.equipment', 'Equipment')}>
              <option value="">{t('lib.all', 'All')} {t('lib.equipment', 'equipment')}</option>
              {facets.equipment.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
            </select>
            <select className="input" value={part} onChange={(e) => set('part', e.target.value)} aria-label="Body Part">
              <option value="">{t('lib.all', 'All')} Body Parts ({exercises.length})</option>
              {BODY_PARTS.filter((b) => counts[b.key]).map((b) => (
                <option key={b.key} value={b.key}>
                  {t(`part.${b.key}`, b.label)} ({counts[b.key]})
                </option>
              ))}
            </select>
            <select className="input" value={target} onChange={(e) => set('target', e.target.value)} aria-label={t('lib.target', 'Target muscle')}>
              <option value="">{t('lib.all', 'All')} {t('lib.target', 'muscles')}</option>
              {facets.target.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
            </select>
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

          {!ready ? (
            <PageShimmer variant="grid" cardsCount={pageSize || 8} />
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
                  {/* In img2 just show page data not of exercises */}
                  <div className="pagination-info">
                    Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
                  </div>

                  <div className="pagination-controls">
                    {/* Dropdown at the bottom from 5-25 cards per page */}
                    <div className="pagination-size-wrap">
                      <span className="pagination-size-label">Per page:</span>
                      <select
                        className="pagination-size-select"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        aria-label="Cards per page"
                      >
                        <option value={5}>5 cards</option>
                        <option value={10}>10 cards</option>
                        <option value={15}>15 cards</option>
                        <option value={20}>20 cards</option>
                        <option value={25}>25 cards</option>
                      </select>
                    </div>

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
