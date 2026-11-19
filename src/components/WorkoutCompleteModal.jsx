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
    const allTerms = [...trainedMuscles, ...trainedTargets].map((t) => String(t || '').toLowerCase());
    const ids = new Set();

    allTerms.forEach((term) => {
      // Chest / Pectorals
      if (term.includes('chest') || term.includes('pec')) {
        ids.add('chest-upper-left');
        ids.add('chest-upper-right');
        ids.add('chest-lower-left');
        ids.add('chest-lower-right');
      }

      // Waist / Core / Abs / Obliques
      if (term.includes('waist') || term.includes('core') || term.includes('ab') || term.includes('oblique')) {
        ids.add('abs-upper-left');
        ids.add('abs-upper-right');
        ids.add('abs-lower-left');
        ids.add('abs-lower-right');
        ids.add('serratus-anterior-left');
        ids.add('serratus-anterior-right');
        ids.add('obliques-left');
        ids.add('obliques-right');
        ids.add('hip-flexor-left');
        ids.add('hip-flexor-right');
      }

      // Back / Lats / Traps / Spine / Upper Back
      if (term.includes('back') || term.includes('lat') || term.includes('trap') || term.includes('spine')) {
        ids.add('traps-upper-left');
        ids.add('traps-mid-left');
        ids.add('traps-lower-left');
        ids.add('traps-upper-right');
        ids.add('traps-mid-right');
        ids.add('traps-lower-right');
        ids.add('lats-upper-left');
        ids.add('lats-mid-left');
        ids.add('lats-lower-left');
        ids.add('lats-upper-right');
        ids.add('lats-mid-right');
        ids.add('lats-lower-right');
        ids.add('spine');
        ids.add('lower-back-erectors-left');
        ids.add('lower-back-ql-left');
        ids.add('lower-back-erectors-right');
        ids.add('lower-back-ql-right');
      }

      // Shoulders / Delts
      if (term.includes('shoulder') || term.includes('delt')) {
        ids.add('shoulder-front-left');
        ids.add('shoulder-front-right');
        ids.add('shoulder-side-left');
        ids.add('shoulder-side-right');
        ids.add('deltoid-rear-left');
        ids.add('deltoid-rear-right');
        ids.add('traps-upper-left');
        ids.add('traps-upper-right');
      }

      // Arms / Biceps / Triceps / Forearms
      if (term.includes('arm') || term.includes('bicep') || term.includes('tricep') || term.includes('forearm')) {
        if (term.includes('bicep') || !term.includes('tricep')) {
          ids.add('biceps-left');
          ids.add('biceps-right');
        }
        if (term.includes('tricep') || !term.includes('bicep')) {
          ids.add('triceps-long-left');
          ids.add('triceps-lateral-left');
          ids.add('triceps-long-right');
          ids.add('triceps-lateral-right');
        }
        ids.add('forearm-left');
        ids.add('forearm-right');
        ids.add('forearm-flexors-left');
        ids.add('forearm-extensors-left');
        ids.add('forearm-flexors-right');
        ids.add('forearm-extensors-right');
      }

      // Legs / Quads / Hamstrings / Glutes / Calves
      if (
        term.includes('leg') ||
        term.includes('quad') ||
        term.includes('hamstring') ||
        term.includes('glute') ||
        term.includes('calf') ||
        term.includes('calves') ||
        term.includes('adductor')
      ) {
        if (
          term.includes('quad') ||
          (!term.includes('hamstring') && !term.includes('glute') && !term.includes('calf') && !term.includes('calves'))
        ) {
          ids.add('quads-left');
          ids.add('quads-right');
          ids.add('adductors-left');
          ids.add('adductors-right');
          ids.add('tibialis-anterior-left');
          ids.add('tibialis-anterior-right');
        }
        if (term.includes('glute') || term.includes('leg')) {
          ids.add('gluteus-medius-left');
          ids.add('gluteus-maximus-left');
          ids.add('gluteus-medius-right');
          ids.add('gluteus-maximus-right');
        }
        if (term.includes('hamstring') || term.includes('leg')) {
          ids.add('hamstrings-medial-left');
          ids.add('hamstrings-lateral-left');
          ids.add('hamstrings-medial-right');
          ids.add('hamstrings-lateral-right');
        }
        if (term.includes('calf') || term.includes('calves') || term.includes('leg')) {
          ids.add('calves-gastroc-medial-left');
          ids.add('calves-gastroc-lateral-left');
          ids.add('calves-soleus-left');
          ids.add('calves-gastroc-medial-right');
          ids.add('calves-gastroc-lateral-right');
          ids.add('calves-soleus-right');
          ids.add('tibialis-anterior-left');
          ids.add('tibialis-anterior-right');
        }
      }

      // Cardio
      if (term.includes('cardio')) {
        ids.add('quads-left');
        ids.add('quads-right');
        ids.add('calves-gastroc-medial-left');
        ids.add('calves-gastroc-medial-right');
        ids.add('abs-upper-left');
        ids.add('abs-upper-right');
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

  return (
    <AnimatePresence>
      <div className="workout-complete-overlay" role="dialog" aria-modal="true" aria-label="Workout Complete">
        <motion.div
          className="workout-complete-card"
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
            <Trophy width={34} height={34} />
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

            {trainedMuscles.length > 0 && (
              <div className="trained-tags-row">
                {trainedMuscles.map((m, idx) => (
                  <span key={idx} className="trained-muscle-tag">
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
