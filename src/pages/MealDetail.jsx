import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMealById, MEALS } from '../data/meals.js';
import { ArrowLeft, ArrowUpRight } from '../components/Icons.jsx';
import { PLANS } from '../lib/plansData.js';
import { readLS } from '../lib/utils.js';

export default function MealDetail() {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const meal = useMemo(() => getMealById(mealId), [mealId]);

  const [servings, setServings] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Active Plan determination
  const activePlanData = useMemo(() => readLS('fx:active-plan-data', null), []);
  const activePlan = useMemo(() => {
    if (!activePlanData?.planId) return null;
    return PLANS.find((p) => p.id === activePlanData.planId) || null;
  }, [activePlanData]);

  // Plan-specific or goal-specific brief explaining why and for which muscle group this meal helps
  const planBrief = useMemo(() => {
    if (!meal) return null;
    const target = (activePlan?.targetMuscle || (meal.targetMuscles || []).join(' ')).toLowerCase();
    const userGoal = activePlan ? (activePlan.key === 'weight-loss' ? 'fat' : 'muscle') : (readLS('fx:user', null)?.profile?.goal || 'muscle');

    if (activePlan) {
      if (target.includes('abs') || target.includes('core')) {
        return `Tailored for ${activePlan.name}: Provides ${meal.macros.protein}g protein to rebuild core muscle fibers after your abdominal training, with ${meal.macros.calories} kcal to stay lean and avoid bloating around the waist.`;
      }
      if (target.includes('arm') || target.includes('bicep') || target.includes('tricep')) {
        return `Tailored for ${activePlan.name}: Supplies ${meal.macros.protein}g protein to support biceps and triceps recovery and repair micro-tears from arm workouts.`;
      }
      if (target.includes('chest')) {
        return `Tailored for ${activePlan.name}: Delivers ${meal.macros.protein}g protein and complex carbs to refuel chest and pectoral muscle groups following heavy pressing movements.`;
      }
      if (target.includes('back')) {
        return `Tailored for ${activePlan.name}: Replenishes glycogen stores with ${meal.macros.protein}g protein to accelerate lat and upper back repair after pulling exercises.`;
      }
      if (target.includes('leg') || target.includes('quad')) {
        return `Tailored for ${activePlan.name}: Gives ${meal.macros.protein}g protein and clean carbs to repair quad and hamstring tissues after strenuous leg workouts.`;
      }
      return `Tailored for ${activePlan.name}: Provides ${meal.macros.protein}g protein to support recovery for ${activePlan.targetMuscle} training.`;
    }

    // Goal-specific brief
    if (userGoal === 'fat') {
      return `Targeted for your Fat Loss goal: ${meal.macros.protein}g high-satiety protein with only ${meal.macros.calories} kcal helps maintain lean mass while staying comfortably in your caloric deficit.`;
    }
    if (userGoal === 'strength') {
      return `Targeted for your Strength goal: ${meal.macros.protein}g protein and clean glycogen fuel replenishes energy stores for heavy compound overloading.`;
    }
    if (userGoal === 'fit') {
      return `Targeted for your Stay Fit goal: ${meal.macros.protein}g protein paired with balanced micronutrients supports full-body recovery and daily vitality.`;
    }
    return `Targeted for your Muscle Building goal: ${meal.macros.protein}g protein delivers complete essential amino acids to stimulate muscle protein synthesis across ${(meal.targetMuscles || []).join(' and ')}.`;
  }, [activePlan, meal]);

  if (!meal) {
    return (
      <div className="meal-not-found">
        <h2>Meal not found</h2>
        <p>The meal you are looking for does not exist or has been moved.</p>
        <Link to="/nutrition" className="btn btn-primary">
          Back to Nutrition
        </Link>
      </div>
    );
  }

  // Similar meals in the same category
  const similarMeals = useMemo(() => {
    return MEALS.filter((m) => m.category === meal.category && m.id !== meal.id).slice(0, 3);
  }, [meal]);

  // Scaled macros
  const scaledCalories = Math.round(meal.macros.calories * servings);
  const scaledProtein = Math.round(meal.macros.protein * servings);
  const scaledCarbs = Math.round(meal.macros.carbs * servings);
  const scaledFat = Math.round(meal.macros.fat * servings);
  const scaledFiber = Math.round(meal.macros.fiber * servings);

  // Macro calorie contributions (Protein 4 kcal/g, Carbs 4 kcal/g, Fat 9 kcal/g)
  const proteinCals = scaledProtein * 4;
  const carbsCals = scaledCarbs * 4;
  const fatCals = scaledFat * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals || 1;
  const proteinPct = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsPct = Math.round((carbsCals / totalMacroCals) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  return (
    <div className="meal-detail-page">
      {/* Navigation Breadcrumb */}
      <div className="meal-detail-nav">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/nutrition'))}
          className="nav-back-pill"
          aria-label="Back to previous page"
        >
          <ArrowLeft width={16} height={16} />
          <span>Back</span>
        </button>
        <div className="meal-nav-cat">
          <span className="cat-pill">{meal.category}</span>
          <span className="prep-pill">{meal.prepTime} min prep</span>
        </div>
      </div>

      {/* Hero Section: Photo + Essential Details */}
      <header className="meal-detail-hero">
        <div className="meal-detail-media">
          {!imgLoaded && <div className="meal-detail-img-skeleton" aria-hidden="true" />}
          <img
            src={meal.image}
            alt={meal.name}
            className={`meal-detail-img ${imgLoaded ? 'loaded' : ''}`}
            onLoad={() => setImgLoaded(true)}
          />
          <div className="meal-detail-overlay-chip">
            <span className="calorie-badge">{scaledCalories} kcal</span>
            <span className="protein-badge">{scaledProtein}g Protein</span>
          </div>
        </div>

        <div className="meal-detail-intro">
          <h1 className="meal-detail-title">{meal.name}</h1>
          <p className="meal-detail-brief">{meal.brief}</p>

          {/* Effective for: in a column without tags, simple text */}
          <div className="meal-effective-col">
            <span className="effective-label">Effective for:</span>
            <span className="effective-text">{meal.targetMuscles.join(', ')}</span>
          </div>

          {/* Servings Multiplier */}
          <div className="servings-selector-box">
            <span className="servings-lbl">Servings / Meal Prep:</span>
            <div className="servings-buttons">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`servings-btn ${servings === n ? 'active' : ''}`}
                  onClick={() => setServings(n)}
                >
                  {n}x {n > 1 ? 'meals' : 'meal'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Clean Nutrition Breakdown Strip */}
      <section className="meal-macros-section" aria-label="Nutritional Summary">
        <div className="section-header-compact">
          <h2>Nutrition Breakdown</h2>
          <span className="serving-note">Values scaled for {servings} {servings > 1 ? 'servings' : 'serving'}</span>
        </div>

        <div className="macros-stat-grid">
          <div className="macro-card cals">
            <span className="macro-card-val">{scaledCalories}</span>
            <span className="macro-card-unit">kcal</span>
            <span className="macro-card-title">Calories</span>
          </div>
          <div className="macro-card protein">
            <span className="macro-card-val">{scaledProtein}</span>
            <span className="macro-card-unit">grams</span>
            <span className="macro-card-title">Protein</span>
          </div>
          <div className="macro-card carbs">
            <span className="macro-card-val">{scaledCarbs}</span>
            <span className="macro-card-unit">grams</span>
            <span className="macro-card-title">Carbs</span>
          </div>
          <div className="macro-card fat">
            <span className="macro-card-val">{scaledFat}</span>
            <span className="macro-card-unit">grams</span>
            <span className="macro-card-title">Fats</span>
          </div>
          <div className="macro-card fiber">
            <span className="macro-card-val">{scaledFiber}</span>
            <span className="macro-card-unit">grams</span>
            <span className="macro-card-title">Fiber</span>
          </div>
        </div>

        {/* Macro Ratio Distribution Bar */}
        <div className="macro-ratio-wrap">
          <div className="macro-ratio-header">
            <div className="macro-ratio-title-group">
              <span className="macro-ratio-title">Macronutrient Energy Distribution</span>
              <span className="macro-servings-badge">
                {servings}x {servings > 1 ? 'Servings' : 'Serving'} · {scaledCalories} kcal
              </span>
            </div>
            <div className="ratio-legend">
              <span className="leg-item">
                <span className="leg-dot prot" />
                Protein: <strong>{scaledProtein}g</strong> ({proteinPct}%)
              </span>
              <span className="leg-item">
                <span className="leg-dot carb" />
                Carbs: <strong>{scaledCarbs}g</strong> ({carbsPct}%)
              </span>
              <span className="leg-item">
                <span className="leg-dot fat" />
                Fat: <strong>{scaledFat}g</strong> ({fatPct}%)
              </span>
            </div>
          </div>
          <div className="macro-bar-track">
            <div
              className="macro-bar-fill protein"
              style={{ width: `${proteinPct}%` }}
              title={`Protein: ${scaledProtein}g (${proteinPct}%)`}
            />
            <div
              className="macro-bar-fill carbs"
              style={{ width: `${carbsPct}%` }}
              title={`Carbs: ${scaledCarbs}g (${carbsPct}%)`}
            />
            <div
              className="macro-bar-fill fat"
              style={{ width: `${fatPct}%` }}
              title={`Fat: ${scaledFat}g (${fatPct}%)`}
            />
          </div>
        </div>
      </section>

        {/* Detailed Ingredients Table */}
        <section className="meal-ingredients-section" aria-label="Ingredients Breakdown">
          <div className="section-header-compact">
            <div>
              <h2>Ingredients &amp; Exact Gram Weights</h2>
              <p className="ingredients-subtitle">
                Accurately weighed for precise calorie and macronutrient tracking.
              </p>
            </div>
            <span className="ingredients-count-tag">
              {meal.ingredients.length} items
            </span>
          </div>

          <div className="ingredients-table-wrap">
            <table className="ingredients-table">
              <thead>
                <tr>
                  <th scope="col" className="col-idx">#</th>
                  <th scope="col" className="col-name">Ingredient</th>
                  <th scope="col" className="col-weight">Weight (per serving)</th>
                  <th scope="col" className="col-total">
                    Total Weight ({servings}x)
                  </th>
                </tr>
              </thead>
              <tbody>
                {meal.ingredients.map((ing, idx) => {
                  const totalWeight = ing.weight * servings;
                  return (
                    <tr key={ing.name}>
                      <td className="col-idx">{idx + 1}</td>
                      <td className="col-name">
                        <strong>{ing.name}</strong>
                      </td>
                      <td className="col-weight">
                        {ing.weight} {ing.unit}
                      </td>
                      <td className="col-total">
                        <span className="total-weight-pill">
                          {totalWeight} {ing.unit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Similar Meals in Category */}
        {similarMeals.length > 0 && (
          <section className="similar-meals-section">
            <div className="section-header-compact">
              <h2>More High-Protein {meal.category.toUpperCase()} Ideas</h2>
              <Link to="/nutrition" className="similar-view-all">
                Browse all meals <ArrowUpRight width={14} height={14} />
              </Link>
            </div>
            <div className="similar-meals-grid">
              {similarMeals.map((sm) => (
                <Link key={sm.id} to={`/nutrition/${sm.id}`} className="similar-card">
                  <img src={sm.image} alt={sm.name} className="similar-card-img" loading="lazy" />
                  <div className="similar-card-body">
                    <h4>{sm.name}</h4>
                    <div className="similar-macros">
                      <span>{sm.macros.protein}g protein</span> · <span>{sm.macros.calories} kcal</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }
