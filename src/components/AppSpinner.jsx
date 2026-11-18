import React from 'react';

/**
 * Universal Page Shimmer Skeleton Component
 * Replaces circular spinners with a sleek, content-aware skeleton shimmer
 * while switching between pages and screens across the entire web app.
 */
export default function PageShimmer({ cardsCount = 6, variant = 'page', label = 'Loading page...' }) {
  return (
    <div className="page-shimmer-container" role="status" aria-live="polite" aria-label={label}>
      {variant === 'detail' ? (
        <div className="shimmer-detail-layout">
          <div className="shimmer-detail-left">
            <div className="shimmer-box shimmer-detail-image shimmer-fx" />
          </div>
          <div className="shimmer-detail-right">
            <div className="shimmer-box shimmer-line-pill shimmer-fx" style={{ width: 120, height: 24 }} />
            <div className="shimmer-box shimmer-line-title shimmer-fx" style={{ width: '80%', height: 40 }} />
            <div className="shimmer-box shimmer-line-meta shimmer-fx" style={{ width: '50%', height: 20 }} />
            <div className="shimmer-box shimmer-line-sub shimmer-fx" style={{ width: '100%', height: 16 }} />
            <div className="shimmer-box shimmer-line-sub shimmer-fx" style={{ width: '90%', height: 16 }} />
            <div className="shimmer-box shimmer-line-sub shimmer-fx" style={{ width: '70%', height: 16 }} />
            <div className="shimmer-tags-row">
              <div className="shimmer-box shimmer-chip shimmer-fx" style={{ width: 80, height: 32 }} />
              <div className="shimmer-box shimmer-chip shimmer-fx" style={{ width: 90, height: 32 }} />
              <div className="shimmer-box shimmer-chip shimmer-fx" style={{ width: 70, height: 32 }} />
            </div>
          </div>
        </div>
      ) : variant === 'grid' ? (
        <div className="shimmer-grid-block">
          {Array.from({ length: cardsCount }).map((_, i) => (
            <div key={i} className="shimmer-card">
              <div className="shimmer-box shimmer-card-thumb shimmer-fx" />
              <div className="shimmer-card-content">
                <div className="shimmer-box shimmer-card-title shimmer-fx" style={{ width: '75%', height: 18 }} />
                <div className="shimmer-card-pills">
                  <div className="shimmer-box shimmer-card-pill shimmer-fx" style={{ width: 50, height: 20 }} />
                  <div className="shimmer-box shimmer-card-pill shimmer-fx" style={{ width: 60, height: 20 }} />
                  <div className="shimmer-box shimmer-card-pill shimmer-fx" style={{ width: 55, height: 20 }} />
                </div>
                <div className="shimmer-card-footer">
                  <div className="shimmer-box shimmer-card-sub shimmer-fx" style={{ width: 80, height: 14 }} />
                  <div className="shimmer-box shimmer-card-btn shimmer-fx" style={{ width: 68, height: 28 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Header Title & Subtitle Shimmer */}
          <div className="shimmer-header-block">
            <div className="shimmer-box shimmer-line-pill shimmer-fx" style={{ width: 130, height: 22 }} />
            <div className="shimmer-box shimmer-line-title shimmer-fx" style={{ width: 'clamp(220px, 40%, 360px)', height: 38 }} />
            <div className="shimmer-box shimmer-line-sub shimmer-fx" style={{ width: 'clamp(240px, 55%, 480px)', height: 16 }} />
          </div>

          {/* Quick Toolbar / Search / Filter Pills Shimmer */}
          <div className="shimmer-toolbar-block">
            <div className="shimmer-box shimmer-search-bar shimmer-fx" />
            <div className="shimmer-filter-chips">
              <div className="shimmer-box shimmer-chip shimmer-fx" style={{ width: 64, height: 36 }} />
              <div className="shimmer-box shimmer-chip shimmer-fx" style={{ width: 88, height: 36 }} />
              <div className="shimmer-box shimmer-chip shimmer-fx" style={{ width: 76, height: 36 }} />
              <div className="shimmer-box shimmer-chip shimmer-fx" style={{ width: 94, height: 36 }} />
              <div className="shimmer-box shimmer-chip shimmer-fx" style={{ width: 72, height: 36 }} />
              <div className="shimmer-box shimmer-chip shimmer-fx" style={{ width: 82, height: 36 }} />
            </div>
          </div>

          {/* Responsive Card Grid Shimmer */}
          <div className="shimmer-grid-block">
            {Array.from({ length: cardsCount }).map((_, i) => (
              <div key={i} className="shimmer-card">
                <div className="shimmer-box shimmer-card-thumb shimmer-fx" />
                <div className="shimmer-card-content">
                  <div className="shimmer-box shimmer-card-title shimmer-fx" style={{ width: '75%', height: 18 }} />
                  <div className="shimmer-card-pills">
                    <div className="shimmer-box shimmer-card-pill shimmer-fx" style={{ width: 50, height: 20 }} />
                    <div className="shimmer-box shimmer-card-pill shimmer-fx" style={{ width: 60, height: 20 }} />
                    <div className="shimmer-box shimmer-card-pill shimmer-fx" style={{ width: 55, height: 20 }} />
                  </div>
                  <div className="shimmer-card-footer">
                    <div className="shimmer-box shimmer-card-sub shimmer-fx" style={{ width: 80, height: 14 }} />
                    <div className="shimmer-box shimmer-card-btn shimmer-fx" style={{ width: 68, height: 28 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
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
