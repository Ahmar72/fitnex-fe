import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from './Icons.jsx';

export default function MealCard({ meal, isRecommended = false, recBadge = null }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={`/nutrition/${meal.id}`} className="meal-card-link">
      <article className={`meal-card ${isRecommended ? 'meal-card-recommended' : ''}`}>
        <div className="meal-card-thumb-wrap">
          {!imgLoaded && !imgError && (
            <div className="meal-card-skeleton" aria-hidden="true" />
          )}
          {imgError ? (
            <div className="meal-card-placeholder">
              <span className="meal-card-placeholder-icon">🥗</span>
              <span className="meal-card-placeholder-text">{meal.name}</span>
            </div>
          ) : (
            <img
              src={meal.image}
              alt={meal.name}
              className={`meal-card-thumb ${imgLoaded ? 'loaded' : ''}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}

          <div className="meal-card-badges">
            <span className="meal-cat-badge">{meal.category}</span>
          </div>

          <div className="meal-card-time-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{meal.prepTime}m prep</span>
          </div>
        </div>

        <div className="meal-card-content">
          <div className="meal-card-header">
            <h3 className="meal-card-title">{meal.name}</h3>
            <span className="meal-card-arrow" aria-hidden="true">
              <ArrowUpRight width={16} height={16} />
            </span>
          </div>

          {meal.targetMuscles && meal.targetMuscles.length > 0 && (
            <div className="meal-card-muscles">
              <span className="meal-muscle-label">Best for:</span>
              {meal.targetMuscles.slice(0, 3).map((m) => (
                <span key={m} className="meal-muscle-chip">{m}</span>
              ))}
            </div>
          )}

          <div className="meal-card-macros-row">
            <div className="meal-macro-pill protein">
              <span className="macro-val">{meal.macros.protein}g</span>
              <span className="macro-lbl">Protein</span>
            </div>
            <div className="meal-macro-pill calories">
              <span className="macro-val">{meal.macros.calories}</span>
              <span className="macro-lbl">kcal</span>
            </div>
            <div className="meal-macro-pill carbs">
              <span className="macro-val">{meal.macros.carbs}g</span>
              <span className="macro-lbl">Carbs</span>
            </div>
            <div className="meal-macro-pill fat">
              <span className="macro-val">{meal.macros.fat}g</span>
              <span className="macro-lbl">Fat</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
