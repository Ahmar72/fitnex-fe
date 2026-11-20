import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from './Icons.jsx';
import { playChimeSound } from '../lib/utils.js';
import { lockScroll } from '../lib/useSmoothScroll.js';
import { FRONT_MUSCLES, BACK_MUSCLES } from 'body-muscles';

/**
 * Anatomical Body Muscle Map (Front & Back Views)
 * Uses high-precision medical-grade vector coordinates from body-muscles,
 * perfectly matching the fitness tracking anatomical design.
 */
function BodyMuscleMap({ trainedMuscles = [], trainedTargets = [] }) {
  const activeIds = useMemo(() => {
    // If specific targets are provided, use them directly so only exact muscles are highlighted
    const rawTerms = trainedTargets.length > 0 ? trainedTargets : trainedMuscles;
    const terms = rawTerms.map((t) => String(t || '').trim().toLowerCase());
    const ids = new Set();

    terms.forEach((term) => {
      // 1. Abs / Abdominals (Rectus Abdominis only)
      if (term === 'abs' || term === 'abdominals' || term === 'rectus abdominis') {
        ids.add('abs-upper-left');
        ids.add('abs-upper-right');
        ids.add('abs-lower-left');
        ids.add('abs-lower-right');
      } else if (term.includes('oblique')) {
        ids.add('obliques-left');
        ids.add('obliques-right');
      } else if (term.includes('serratus')) {
        ids.add('serratus-anterior-left');
        ids.add('serratus-anterior-right');
      } else if (term.includes('hip flexor') || term.includes('hip-flexor')) {
        ids.add('hip-flexor-left');
        ids.add('hip-flexor-right');
      } else if (term === 'waist' || term === 'core') {
        // Fallback for generic 'waist' or 'core' only when no specific target is given
        ids.add('abs-upper-left');
        ids.add('abs-upper-right');
        ids.add('abs-lower-left');
        ids.add('abs-lower-right');
      }

      // 2. Chest / Pectorals
      if (term.includes('pec') || term === 'chest') {
        ids.add('chest-upper-left');
        ids.add('chest-upper-right');
        ids.add('chest-lower-left');
        ids.add('chest-lower-right');
      }

      // 3. Arms: Biceps vs Triceps vs Forearms (Exact, never all arms!)
      if (term === 'biceps' || term === 'bicep') {
        ids.add('biceps-left');
        ids.add('biceps-right');
      }
      if (term === 'triceps' || term === 'tricep') {
        ids.add('triceps-long-left');
        ids.add('triceps-lateral-left');
        ids.add('triceps-long-right');
        ids.add('triceps-lateral-right');
      }
      if (term.includes('forearm') || term === 'lower arms') {
        ids.add('forearm-left');
        ids.add('forearm-right');
        ids.add('forearm-flexors-left');
        ids.add('forearm-extensors-left');
        ids.add('forearm-flexors-right');
        ids.add('forearm-extensors-right');
      }
      if ((term === 'upper arms' || term === 'arms') && !terms.some((t) => t.includes('bicep') || t.includes('tricep'))) {
        ids.add('biceps-left');
        ids.add('biceps-right');
        ids.add('triceps-long-left');
        ids.add('triceps-long-right');
      }

      // 4. Shoulders / Delts
      if (term.includes('delt') || term === 'shoulders' || term === 'shoulder') {
        ids.add('shoulder-front-left');
        ids.add('shoulder-front-right');
        ids.add('shoulder-side-left');
        ids.add('shoulder-side-right');
        ids.add('deltoid-rear-left');
        ids.add('deltoid-rear-right');
      }

      // 5. Back: Lats vs Traps vs Spine / Lower Back vs Upper Back
      if (term === 'lats' || term.includes('latissimus')) {
        ids.add('lats-upper-left');
        ids.add('lats-mid-left');
        ids.add('lats-lower-left');
        ids.add('lats-upper-right');
        ids.add('lats-mid-right');
        ids.add('lats-lower-right');
      }
      if (term.includes('trap')) {
        ids.add('traps-upper-left');
        ids.add('traps-mid-left');
        ids.add('traps-lower-left');
        ids.add('traps-upper-right');
        ids.add('traps-mid-right');
        ids.add('traps-lower-right');
      }
      if (term.includes('spine') || term.includes('lower back') || term.includes('erector')) {
        ids.add('spine');
        ids.add('lower-back-erectors-left');
        ids.add('lower-back-ql-left');
        ids.add('lower-back-erectors-right');
        ids.add('lower-back-ql-right');
      }
      if (term === 'upper back') {
        ids.add('traps-mid-left');
        ids.add('traps-lower-left');
        ids.add('traps-mid-right');
        ids.add('traps-lower-right');
        ids.add('lats-upper-left');
        ids.add('lats-upper-right');
      }
      if (term === 'back' && !terms.some((t) => t.includes('lat') || t.includes('trap') || t.includes('spine') || t.includes('upper back'))) {
        ids.add('lats-upper-left');
        ids.add('lats-upper-right');
        ids.add('lats-mid-left');
        ids.add('lats-mid-right');
        ids.add('traps-lower-left');
        ids.add('traps-lower-right');
      }

      // 6. Legs: Quads vs Hamstrings vs Glutes vs Calves vs Adductors
      if (term === 'quads' || term === 'quadriceps') {
        ids.add('quads-left');
        ids.add('quads-right');
      }
      if (term === 'hamstrings' || term === 'hamstring') {
        ids.add('hamstrings-medial-left');
        ids.add('hamstrings-lateral-left');
        ids.add('hamstrings-medial-right');
        ids.add('hamstrings-lateral-right');
      }
      if (term.includes('glute')) {
        ids.add('gluteus-medius-left');
        ids.add('gluteus-maximus-left');
        ids.add('gluteus-medius-right');
        ids.add('gluteus-maximus-right');
      }
      if (term.includes('calf') || term.includes('calves')) {
        ids.add('calves-gastroc-medial-left');
        ids.add('calves-gastroc-lateral-left');
        ids.add('calves-soleus-left');
        ids.add('calves-gastroc-medial-right');
        ids.add('calves-gastroc-lateral-right');
        ids.add('calves-soleus-right');
      }
      if (term.includes('adductor')) {
        ids.add('adductors-left');
        ids.add('adductors-right');
      }
      if (term.includes('abductor')) {
        ids.add('gluteus-medius-left');
        ids.add('gluteus-medius-right');
      }
      if (term.includes('tibialis')) {
        ids.add('tibialis-anterior-left');
        ids.add('tibialis-anterior-right');
      }
      if (term.includes('neck') || term.includes('levator')) {
        ids.add('neck-left');
        ids.add('neck-right');
      }
      if (term === 'upper legs' && !terms.some((t) => t.includes('quad') || t.includes('hamstring') || t.includes('glute'))) {
        ids.add('quads-left');
        ids.add('quads-right');
        ids.add('hamstrings-medial-left');
        ids.add('hamstrings-lateral-left');
      }
      if (term === 'lower legs' && !terms.some((t) => t.includes('calf') || t.includes('calves'))) {
        ids.add('calves-gastroc-medial-left');
        ids.add('calves-gastroc-lateral-left');
      }

      // Cardio: light quad + calf
      if (term.includes('cardio') || term.includes('cardiovascular')) {
        ids.add('quads-left');
        ids.add('quads-right');
        ids.add('calves-gastroc-medial-left');
        ids.add('calves-gastroc-medial-right');
      }
    });

    return ids;
  }, [trainedMuscles, trainedTargets]);

  return (
    <div className="workout-muscle-map-wrap">
      {/* Front View */}
      <div className="muscle-map-figure">
        <span className="figure-label">Front</span>
        <svg viewBox="0 0 35 93" className="figure-svg" aria-label="Front body muscle map">
          {FRONT_MUSCLES.map((m) => (
            <path
              key={m.id}
              d={m.path}
              className={`muscle-path ${activeIds.has(m.id) ? 'active' : ''}`}
            />
          ))}
        </svg>
      </div>

      {/* Back View */}
      <div className="muscle-map-figure">
        <span className="figure-label">Back</span>
        <svg viewBox="37 0 35 93" className="figure-svg" aria-label="Back body muscle map">
          {BACK_MUSCLES.map((m) => (
            <path
              key={m.id}
              d={m.path}
              className={`muscle-path ${activeIds.has(m.id) ? 'active' : ''}`}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function WorkoutCompleteModal({ isOpen, onClose, data }) {
  useEffect(() => {
    if (isOpen) {
      playChimeSound();
      lockScroll(true);
      const onKeyDown = (e) => {
        if (e.key === 'Escape') onClose?.();
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        lockScroll(false);
        window.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const durationMin = data?.durationMinutes ?? Math.max(1, Math.round((data?.durationSecs || 0) / 60));
  const volumeKg = data?.volume ? new Intl.NumberFormat('en-US').format(Math.round(data.volume)) : '0';
  const setsTotal = data?.setsCount ?? 0;
  const workSetsTotal = data?.workSetsCount ?? setsTotal;
  const calories = data?.caloriesBurned ?? data?.calories ?? Math.round(setsTotal * 18 + durationMin * 6);
  const prs = data?.prsCount ?? '—';
  const trainedMuscles = data?.trainedMuscles || [];
  const trainedTargets = data?.trainedTargets || [];
  const displayTargets = trainedTargets.length > 0 ? trainedTargets : trainedMuscles;

  return (
    <AnimatePresence>
      <div className="workout-complete-overlay" data-lenis-prevent="true" role="dialog" aria-modal="true" aria-label="Workout Complete">
        <motion.div
          className="workout-complete-card"
          data-lenis-prevent="true"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Top Close Button */}
          <button
            type="button"
            className="workout-complete-close-btn"
            onClick={onClose}
            aria-label="Close workout summary"
          >
            <X width={16} height={16} />
          </button>

          {/* Trophy Header */}
          <div className="workout-complete-trophy-wrap">
            <Trophy width={22} height={22} />
          </div>

          <h2 className="workout-complete-title">Workout complete!</h2>

          {/* 4 Stat Tiles */}
          <div className="workout-complete-stats-grid">
            <div className="complete-stat-tile">
              <span className="stat-tile-label">Duration</span>
              <b className="stat-tile-value">{durationMin} min</b>
            </div>

            <div className="complete-stat-tile">
              <span className="stat-tile-label">Volume</span>
              <b className="stat-tile-value">{volumeKg} kg</b>
            </div>

            <div className="complete-stat-tile">
              <span className="stat-tile-label">Sets</span>
              <b className="stat-tile-value">{setsTotal} sets · {workSetsTotal} work</b>
            </div>

            <div className="complete-stat-tile">
              <span className="stat-tile-label">Calories</span>
              <b className="stat-tile-value">{calories > 0 ? `${calories} kcal` : prs}</b>
            </div>
          </div>

          {/* Big Green Action Button */}
          <button
            type="button"
            className="workout-complete-nice-btn"
            onClick={onClose}
          >
            Nice!
          </button>

          {/* Targeted Muscles Breakdown */}
          <div className="workout-complete-trained-section">
            <h4 className="trained-muscles-title">What you just trained</h4>
            <div className="trained-effect-callout">
              Targeted Impact: <b style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{displayTargets.join(', ') || 'Targeted Muscle Groups'}</b>
            </div>

            {displayTargets.length > 0 && (
              <div className="trained-tags-row">
                {displayTargets.map((m, idx) => (
                  <span key={idx} className="trained-muscle-tag" style={{ textTransform: 'capitalize' }}>
                    {m}
                  </span>
                ))}
              </div>
            )}

            {/* Anatomical Human Body Vector Map */}
            <BodyMuscleMap trainedMuscles={trainedMuscles} trainedTargets={trainedTargets} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
