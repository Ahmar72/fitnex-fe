import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import MealCard from '../components/MealCard.jsx';
import {
  MEALS,
  MEAL_CATEGORIES,
  mealsByCategory,
  recommendedMeals,
} from '../data/meals.js';

export default function Nutrition() {
  const { user } = useAuth();
  const { workout } = useWorkout();

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedGoal, setSelectedGoal] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine user's active goal and trained muscles
  const userGoal = user?.profile?.goal || 'muscle';

  // Extract trained muscles from workout items if any
  const trainedMuscles = useMemo(() => {
    if (!workout?.items || workout.items.length === 0) {
      return ['chest', 'back', 'upper legs'];
    }
    const muscles = new Set();
    workout.items.forEach((item) => {
      const ex = item.exercise;
      if (ex?.target) muscles.add(ex.target.toLowerCase());
      if (ex?.bodyPart) muscles.add(ex.bodyPart.toLowerCase());
    });
    return Array.from(muscles);
  }, [workout]);

  // Recommended meals tailored to user's goal & muscles
  const recommended = useMemo(() => {
    return recommendedMeals(userGoal, trainedMuscles, 4);
  }, [userGoal, trainedMuscles]);

  // Filtered meals list
  const filteredMeals = useMemo(() => {
    let list = mealsByCategory(activeCategory);

    if (selectedGoal !== 'all') {
      list = list.filter((m) => m.goal.includes(selectedGoal));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.brief.toLowerCase().includes(q) ||
          m.targetMuscles.some((tm) => tm.toLowerCase().includes(q)) ||
          m.ingredients.some((ing) => ing.name.toLowerCase().includes(q)) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeCategory, selectedGoal, searchQuery]);

  return (
    <div className="nutrition-page">
      {/* Top Hero Banner */}
      <header className="nutrition-hero">
        <div className="nutrition-hero-copy">
          <p className="nutrition-subtitle">
            Scientifically planned, high-protein meals structured to fuel your workouts, maximize
            recovery for targeted muscle groups, and hit your daily macro targets.
          </p>
        </div>

        <div className="nutrition-stats-strip">
          <div className="nutri-stat-item">
            <span className="nutri-stat-val">28</span>
            <span className="nutri-stat-lbl">Curated Meals</span>
          </div>
          <div className="nutri-stat-item">
            <span className="nutri-stat-val">30–55g</span>
            <span className="nutri-stat-lbl">Protein / Meal</span>
          </div>
          <div className="nutri-stat-item">
            <span className="nutri-stat-val">100%</span>
            <span className="nutri-stat-lbl">Whole Foods</span>
          </div>
        </div>
      </header>

      {/* Personalized Recommendation Shelf */}
      <section className="nutrition-rec-shelf" aria-labelledby="rec-meals-title">
        <div className="rec-shelf-header">
          <div>
            <div className="rec-shelf-tag">
              <span className="rec-dot" />
              Tailored for your goal: <strong>{userGoal.toUpperCase()}</strong>
            </div>
            <h2 id="rec-meals-title" className="rec-shelf-title">
              Recommended For Today's Recovery
            </h2>
          </div>
          <p className="rec-shelf-hint">
            Based on your target muscles ({trainedMuscles.slice(0, 3).join(', ')})
          </p>
        </div>

        <div className="rec-shelf-grid">
          {recommended.map((meal) => (
            <MealCard key={`rec-${meal.id}`} meal={meal} isRecommended={true} />
          ))}
        </div>
      </section>

      {/* Meal Explorer & Filter Section */}
      <section className="nutrition-catalog-section">
          <div className="catalog-toolbar">
            {/* Category tabs */}
            <div className="catalog-tabs" role="tablist" aria-label="Meal Categories">
              {MEAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  role="tab"
                  aria-selected={activeCategory === cat.key}
                  className={`catalog-tab-btn ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Controls: Search & Goal Filter */}
            <div className="catalog-filters">
              <div className="catalog-search-wrap">
                <svg
                  className="catalog-search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search meals, ingredients, or muscles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="catalog-search-input"
                />
                {searchQuery && (
                  <button
                    className="catalog-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="catalog-goal-select"
                aria-label="Filter by fitness goal"
              >
                <option value="all">All Goals</option>
                <option value="muscle">Muscle Hypertrophy</option>
                <option value="strength">Strength &amp; Power</option>
                <option value="fat">Fat Loss &amp; Lean</option>
                <option value="fit">Endurance &amp; Fitness</option>
              </select>
            </div>
          </div>

          {/* Results count info */}
          <div className="catalog-results-bar">
            <span>
              Showing <strong>{filteredMeals.length}</strong> {filteredMeals.length === 1 ? 'meal' : 'meals'}
              {activeCategory !== 'all' && ` in ${activeCategory}`}
              {selectedGoal !== 'all' && ` for ${selectedGoal}`}
            </span>
          </div>

          {/* Main Meals Grid */}
          {filteredMeals.length > 0 ? (
            <div className="meals-grid">
              {filteredMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          ) : (
            <div className="meals-empty-state">
              <span className="empty-icon">🍽️</span>
              <h3>No matching meals found</h3>
              <p>Try searching for a different ingredient or resetting your category filter.</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setActiveCategory('all');
                  setSelectedGoal('all');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }
