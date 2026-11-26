import React from 'react';

/**
 * Universal Screen-Aware Page Shimmer Component
 * 
 * Provides clean, simplified, component-aligned skeleton views matching the exact
 * cards and components of the screen being loaded:
 * - Dashboard: 4 stat cards, active routine banner, goal ring, heatmap & chart cards
 * - Library / Exercises: Search & filter bar + compact 4-card exercise grid
 * - Plans: Programs header + active program card + 3 catalog plan cards
 * - Builder: Workout name header + builder exercise items with set rows
 * - Nutrition: Macro target summary + category chips + 3 meal cards
 * - Profile: Avatar hero card + grouped iOS-style settings cards
 * 
 * Designed to fit comfortably within the screen with generous margins (never touching corners)
 * and strictly minimal component counts to prevent visual overload.
 */
export default function PageShimmer({
  variant = 'page',
  route = '',
  cardsCount = 4,
  label = 'Loading view...',
}) {
  // Infer variant from route pathname if variant is generic
  const effectiveVariant = React.useMemo(() => {
    if (variant && variant !== 'page') return variant;
    const p = route || (typeof window !== 'undefined' ? window.location?.pathname || '' : '');
    if (p === '/' || p.startsWith('/dashboard')) return 'dashboard';
    if (p.startsWith('/plans')) return 'plans';
    if (p.startsWith('/builder')) return 'builder';
    if (p.startsWith('/nutrition')) return 'nutrition';
    if (p.startsWith('/profile')) return 'profile';
    if (p.startsWith('/library') || p.startsWith('/exercises')) return 'library';
    return 'page';
  }, [variant, route]);

  return (
    <div className="container page-shimmer-wrapper" role="status" aria-live="polite" aria-label={label}>
      <div className={`page-shimmer-container variant-${effectiveVariant}`}>
        {effectiveVariant === 'dashboard' ? (
          /* ============================================================
             Dashboard Screen Skeleton: Exact match with Dashboard components
             ============================================================ */
          <div className="shimmer-dash-layout">
            {/* Top Greeting line */}
            <div className="shimmer-header-simple">
              <div className="shimmer-box shimmer-fx" style={{ width: 110, height: 18, borderRadius: 999 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: 'clamp(200px, 35%, 280px)', height: 32, borderRadius: 10 }} />
            </div>

            {/* 4 Top Stat Cards */}
            <div className="shimmer-dash-stats">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shimmer-card shimmer-stat-card">
                  <div className="shimmer-stat-body">
                    <div className="shimmer-box shimmer-fx" style={{ width: '55%', height: 26, borderRadius: 6 }} />
                    <div className="shimmer-box shimmer-fx" style={{ width: '85%', height: 13, borderRadius: 4, marginTop: 6 }} />
                  </div>
                  <div className="shimmer-box shimmer-fx shimmer-stat-icon" />
                </div>
              ))}
            </div>

            {/* Middle Row: Active Routine Banner (span-8) + Weekly Goal (span-4) */}
            <div className="shimmer-dash-grid">
              <div className="shimmer-card shimmer-span-8">
                <div className="shimmer-routine-top">
                  <div>
                    <div className="shimmer-box shimmer-fx" style={{ width: 140, height: 18, borderRadius: 6 }} />
                    <div className="shimmer-box shimmer-fx" style={{ width: 220, height: 13, borderRadius: 4, marginTop: 6 }} />
                  </div>
                  <div className="shimmer-box shimmer-fx" style={{ width: 90, height: 30, borderRadius: 8 }} />
                </div>
                {/* 5 Small Exercise Preview Chips */}
                <div className="shimmer-routine-chips">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="shimmer-routine-item">
                      <div className="shimmer-box shimmer-fx shimmer-item-thumb" />
                      <div className="shimmer-box shimmer-fx" style={{ width: '80%', height: 12, borderRadius: 4, marginTop: 4 }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="shimmer-card shimmer-span-4 shimmer-goal-card">
                <div className="shimmer-box shimmer-fx" style={{ width: 100, height: 16, borderRadius: 6 }} />
                <div className="shimmer-goal-content">
                  <div className="shimmer-box shimmer-fx shimmer-goal-ring" />
                  <div className="shimmer-goal-text">
                    <div className="shimmer-box shimmer-fx" style={{ width: 80, height: 20, borderRadius: 6 }} />
                    <div className="shimmer-box shimmer-fx" style={{ width: 110, height: 13, borderRadius: 4, marginTop: 4 }} />
                  </div>
                </div>
              </div>

              {/* Lower Row: Sets per day (span-6) + Heatmap card (span-6) */}
              <div className="shimmer-card shimmer-span-6 shimmer-chart-card">
                <div className="shimmer-box shimmer-fx" style={{ width: 110, height: 16, borderRadius: 6 }} />
                <div className="shimmer-box shimmer-fx" style={{ width: 160, height: 12, borderRadius: 4, marginTop: 4, marginBottom: 16 }} />
                <div className="shimmer-bars-row">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="shimmer-bar-col">
                      <div className="shimmer-box shimmer-fx shimmer-bar" style={{ height: `${30 + (i * 12) % 60}%` }} />
                      <div className="shimmer-box shimmer-fx" style={{ width: 18, height: 10, borderRadius: 4, marginTop: 6 }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="shimmer-card shimmer-span-6 shimmer-heatmap-card">
                <div className="shimmer-box shimmer-fx" style={{ width: 130, height: 16, borderRadius: 6 }} />
                <div className="shimmer-box shimmer-fx" style={{ width: 180, height: 12, borderRadius: 4, marginTop: 4, marginBottom: 16 }} />
                <div className="shimmer-box shimmer-fx shimmer-heatmap-grid" />
              </div>
            </div>
          </div>
        ) : effectiveVariant === 'library' ? (
          /* ============================================================
             Exercise Library Skeleton: Search bar + 4 compact cards
             ============================================================ */
          <div className="shimmer-library-layout">
            <div className="shimmer-header-simple">
              <div className="shimmer-box shimmer-fx" style={{ width: 110, height: 18, borderRadius: 999 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: 260, height: 32, borderRadius: 10 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: 340, height: 14, borderRadius: 6 }} />
            </div>

            {/* Search & Filter Bar */}
            <div className="shimmer-card shimmer-toolbar-clean">
              <div className="shimmer-box shimmer-fx shimmer-search-bar" />
              <div className="shimmer-filter-chips">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="shimmer-box shimmer-fx shimmer-chip" style={{ width: 68 + i * 10, height: 30 }} />
                ))}
              </div>
            </div>

            {/* Exactly 4 Clean Exercise Cards (not overloaded) */}
            <div className="shimmer-grid-block">
              {Array.from({ length: Math.min(4, cardsCount) }).map((_, i) => (
                <div key={i} className="shimmer-card shimmer-exercise-card">
                  <div className="shimmer-box shimmer-card-thumb shimmer-fx" />
                  <div className="shimmer-card-content">
                    <div className="shimmer-box shimmer-card-title shimmer-fx" style={{ width: '80%', height: 18 }} />
                    <div className="shimmer-card-pills">
                      <div className="shimmer-box shimmer-card-pill shimmer-fx" style={{ width: 55, height: 18 }} />
                      <div className="shimmer-box shimmer-card-pill shimmer-fx" style={{ width: 65, height: 18 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : effectiveVariant === 'plans' ? (
          /* ============================================================
             Training Plans Skeleton: Programs header + 3 plan cards
             ============================================================ */
          <div className="shimmer-plans-layout">
            <div className="shimmer-header-simple">
              <div className="shimmer-box shimmer-fx" style={{ width: 120, height: 18, borderRadius: 999 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: 280, height: 32, borderRadius: 10 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: 360, height: 14, borderRadius: 6 }} />
            </div>

            {/* Category Filter Pills */}
            <div className="shimmer-filter-chips" style={{ margin: '4px 0 12px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shimmer-box shimmer-fx shimmer-chip" style={{ width: 75 + i * 10, height: 32 }} />
              ))}
            </div>

            {/* Active Plan Banner Card */}
            <div className="shimmer-card shimmer-plan-active-banner">
              <div className="shimmer-box shimmer-fx shimmer-plan-hero-thumb" />
              <div className="shimmer-plan-banner-text">
                <div className="shimmer-box shimmer-fx" style={{ width: 100, height: 16, borderRadius: 999 }} />
                <div className="shimmer-box shimmer-fx" style={{ width: '70%', height: 26, borderRadius: 8 }} />
                <div className="shimmer-box shimmer-fx" style={{ width: '90%', height: 14, borderRadius: 4 }} />
              </div>
            </div>

            {/* 3 Program Cards */}
            <div className="shimmer-grid-block">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="shimmer-card shimmer-program-card">
                  <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 140, borderRadius: 12 }} />
                  <div className="shimmer-box shimmer-fx" style={{ width: '75%', height: 18, borderRadius: 6, marginTop: 10 }} />
                  <div className="shimmer-box shimmer-fx" style={{ width: '50%', height: 13, borderRadius: 4, marginTop: 6 }} />
                </div>
              ))}
            </div>
          </div>
        ) : effectiveVariant === 'builder' ? (
          /* ============================================================
             Workout Builder Skeleton: Top header + 2 workout cards
             ============================================================ */
          <div className="shimmer-builder-layout">
            <div className="shimmer-builder-header">
              <div>
                <div className="shimmer-box shimmer-fx" style={{ width: 180, height: 28, borderRadius: 8 }} />
                <div className="shimmer-box shimmer-fx" style={{ width: 120, height: 14, borderRadius: 4, marginTop: 6 }} />
              </div>
              <div className="shimmer-box shimmer-fx" style={{ width: 110, height: 36, borderRadius: 999 }} />
            </div>

            <div className="shimmer-card shimmer-builder-panel">
              <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 42, borderRadius: 10 }} />
            </div>

            <div className="shimmer-builder-items">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="shimmer-card shimmer-builder-item-card">
                  <div className="shimmer-builder-item-top">
                    <div className="shimmer-box shimmer-fx" style={{ width: 160, height: 20, borderRadius: 6 }} />
                    <div className="shimmer-box shimmer-fx" style={{ width: 70, height: 20, borderRadius: 999 }} />
                  </div>
                  <div className="shimmer-builder-sets-rows">
                    <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 28, borderRadius: 6 }} />
                    <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 28, borderRadius: 6, marginTop: 6 }} />
                    <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 28, borderRadius: 6, marginTop: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : effectiveVariant === 'nutrition' ? (
          /* ============================================================
             Nutrition Skeleton: Macro targets + Category chips + 3 meals
             ============================================================ */
          <div className="shimmer-nutrition-layout">
            <div className="shimmer-header-simple">
              <div className="shimmer-box shimmer-fx" style={{ width: 130, height: 18, borderRadius: 999 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: 280, height: 32, borderRadius: 10 }} />
            </div>

            {/* Macro Targets Bar */}
            <div className="shimmer-card shimmer-macro-bar">
              <div className="shimmer-box shimmer-fx" style={{ width: '50%', height: 16, borderRadius: 6 }} />
              <div className="shimmer-macro-chips">
                <div className="shimmer-box shimmer-fx" style={{ width: 100, height: 36, borderRadius: 10 }} />
                <div className="shimmer-box shimmer-fx" style={{ width: 90, height: 36, borderRadius: 10 }} />
                <div className="shimmer-box shimmer-fx" style={{ width: 85, height: 36, borderRadius: 10 }} />
              </div>
            </div>

            {/* Category filter pills */}
            <div className="shimmer-filter-chips">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shimmer-box shimmer-fx shimmer-chip" style={{ width: 70 + i * 8, height: 30 }} />
              ))}
            </div>

            {/* 3 Meal Cards */}
            <div className="shimmer-grid-block">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="shimmer-card shimmer-meal-card">
                  <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 150, borderRadius: 12 }} />
                  <div className="shimmer-box shimmer-fx" style={{ width: '70%', height: 18, borderRadius: 6, marginTop: 10 }} />
                  <div className="shimmer-card-pills" style={{ marginTop: 8 }}>
                    <div className="shimmer-box shimmer-fx" style={{ width: 50, height: 18, borderRadius: 999 }} />
                    <div className="shimmer-box shimmer-fx" style={{ width: 60, height: 18, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : effectiveVariant === 'profile' ? (
          /* ============================================================
             Profile & Settings Skeleton: Hero card + 2 grouped sections
             ============================================================ */
          <div className="shimmer-profile-layout">
            <div className="shimmer-card shimmer-profile-hero">
              <div className="shimmer-box shimmer-fx shimmer-profile-avatar" />
              <div className="shimmer-profile-hero-text">
                <div className="shimmer-box shimmer-fx" style={{ width: 160, height: 24, borderRadius: 8 }} />
                <div className="shimmer-box shimmer-fx" style={{ width: 220, height: 14, borderRadius: 4, marginTop: 6 }} />
              </div>
            </div>

            <div className="shimmer-card shimmer-settings-section">
              <div className="shimmer-box shimmer-fx" style={{ width: 120, height: 18, borderRadius: 6, marginBottom: 14 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 38, borderRadius: 8, marginBottom: 8 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 38, borderRadius: 8, marginBottom: 8 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 38, borderRadius: 8 }} />
            </div>

            <div className="shimmer-card shimmer-settings-section">
              <div className="shimmer-box shimmer-fx" style={{ width: 140, height: 18, borderRadius: 6, marginBottom: 14 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 38, borderRadius: 8, marginBottom: 8 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 38, borderRadius: 8 }} />
            </div>
          </div>
        ) : (
          /* Default minimal clean view */
          <div className="shimmer-default-layout">
            <div className="shimmer-header-simple">
              <div className="shimmer-box shimmer-fx" style={{ width: 100, height: 18, borderRadius: 999 }} />
              <div className="shimmer-box shimmer-fx" style={{ width: 240, height: 28, borderRadius: 8 }} />
            </div>
            <div className="shimmer-grid-block">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="shimmer-card">
                  <div className="shimmer-box shimmer-fx" style={{ width: '100%', height: 130, borderRadius: 10 }} />
                  <div className="shimmer-box shimmer-fx" style={{ width: '70%', height: 16, borderRadius: 4, marginTop: 10 }} />
                  <div className="shimmer-box shimmer-fx" style={{ width: '50%', height: 12, borderRadius: 4, marginTop: 6 }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { PageShimmer as AppSpinner };

export function TopProgressBar({ active }) {
  if (!active) return null;
  return (
    <div className="top-progress-bar-wrap" aria-hidden="true">
      <div className="top-progress-bar-line" />
    </div>
  );
}
