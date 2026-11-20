import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import { Paper, Reveal } from '../components/Motion.jsx';
import { Arrow, ArrowLeft, Heart, Plus } from '../components/Icons.jsx';
import { asset, partMeta, sample } from '../lib/utils.js';
import PageShimmer from '../components/AppSpinner.jsx';

const ease = [0.22, 1, 0.36, 1];

export default function ExerciseDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { exercises, byId, ready } = useData();
  const { favorites, toggleFavorite, addToWorkout } = useWorkout();
  const { lang, t, translateSteps } = useLanguage();
  const [i18n, setI18n] = useState(null);

  const isFromPlan = Boolean(location.state?.fromPlan);
  const isFromRoutine = Boolean(location.state?.fromRoutine);
  const planName = location.state?.planName || location.state?.routineTitle;
  const scopedExerciseIds = location.state?.routineExerciseIds || location.state?.planExerciseIds;
  const isScoped = Boolean((isFromPlan || isFromRoutine) && Array.isArray(scopedExerciseIds) && scopedExerciseIds.length > 0);

  const ex = byId.get(id);

  useEffect(() => {
    setI18n(null);
    if (!id) return;
    let alive = true;
    fetch(asset(`data/steps/${id}.json`))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setI18n(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  const { prev, next, related } = useMemo(() => {
    if (!ex) return {};

    // When inside a routine or plan, cycle strictly through that schedule's exercises and don't suggest external exercises
    if (isScoped) {
      const scopedExercises = scopedExerciseIds
        .map((pid) => byId.get(pid))
        .filter(Boolean);

      if (scopedExercises.length > 0) {
        const curIdx = scopedExercises.findIndex((e) => e.id === ex.id);
        const resolvedIdx = curIdx >= 0 ? curIdx : 0;
        return {
          prev: scopedExercises[(resolvedIdx - 1 + scopedExercises.length) % scopedExercises.length],
          next: scopedExercises[(resolvedIdx + 1) % scopedExercises.length],
          related: [], // Suppress suggestions inside routine/plan
        };
      }
    }

    const idx = exercises.findIndex((e) => e.id === ex.id);
    const same = exercises.filter((e) => e.id !== ex.id && e.target === ex.target);
    return {
      prev: exercises[(idx - 1 + exercises.length) % exercises.length],
      next: exercises[(idx + 1) % exercises.length],
      related: sample(same, 4, Number(ex.id)),
    };
  }, [ex, exercises, isScoped, scopedExerciseIds, byId]);

  if (!ready) return <div className="detail"><PageShimmer variant="detail" /></div>;
  if (!ex) {
    return (
      <div className="nf">
        <div>
          <div className="display h2">Exercise not found</div>
          <Link to="/exercises" className="btn btn-primary" style={{ marginTop: 30 }}>Back to library <Arrow /></Link>
        </div>
      </div>
    );
  }

  const rawSteps = (i18n && i18n[lang]) || ex.steps;
  const steps = translateSteps(rawSteps, i18n);
  const fav = favorites.includes(ex.id);
  const part = partMeta(ex.bodyPart);

  return (
    <section className="detail">
      <div className="container">
        {/* Working Back Arrow Button: Always returns to specific referring page without disappearing on hover */}
        <div style={{ marginBottom: 18 }}>
          <button
            type="button"
            className="nav-back-pill"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(isFromPlan ? '/plans' : isFromRoutine ? '/dashboard' : '/exercises');
              }
            }}
          >
            <ArrowLeft width={15} height={15} />
            <span>Back{planName ? ` to ${planName}` : ''}</span>
          </button>
        </div>

        <div className="detail-grid">
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, scale: 0.92, clipPath: 'inset(10% 10% 10% 10% round 28px)' }}
            animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 28px)' }}
            transition={{ duration: 1, delay: 0.2, ease }}
            className="detail-media paper"
          >
            <motion.img
              src={asset(ex.gif)}
              alt={ex.name}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.4, delay: 0.2, ease }}
            />
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <span className="media-tag">{t('detail.target', 'Target')} · {ex.target}</span>
          </motion.div>

          <div>
            <motion.h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                margin: '0 0 14px',
                lineHeight: 1.25,
                color: 'var(--text)',
                textTransform: 'capitalize',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease }}
            >
              {ex.name}
            </motion.h1>

            <Reveal delay={0.45} className="spec">
              <div><small>{t('detail.target', 'Target')}</small><b>{ex.target}</b></div>
              <div><small>{t('detail.equipment', 'Equipment')}</small><b>{ex.equipment}</b></div>
              <div><small>{t('detail.body_part', 'Body part')}</small><b>{ex.bodyPart}</b></div>
            </Reveal>

            <Reveal delay={0.5} className="detail-actions">
              <button className="btn btn-primary" onClick={() => addToWorkout(ex.id)}><Plus /> {t('detail.add_workout', 'Add to workout')}</button>
              <button className={`btn btn-ghost`} onClick={() => toggleFavorite(ex.id)} style={fav ? { borderColor: 'var(--hot)', color: 'var(--hot)' } : undefined}>
                <Heart filled={fav} /> {fav ? t('detail.saved', 'Saved') : t('detail.save', 'Save')}
              </button>
            </Reveal>

            <div className="sub-title">
              <h2>{t('detail.how_to', 'How to do it')}</h2>
            </div>
            <AnimatePresence mode="wait">
              <motion.ol key={lang} className="steps-list" initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.15 } }} variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}>
                {steps.slice(0, 2).map((s, i) => (
                  <motion.li key={i} variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } } }}>
                    <span>{i + 1}</span>
                    <p>{s}</p>
                  </motion.li>
                ))}
              </motion.ol>
            </AnimatePresence>

            <div className="sub-title"><h2>{t('detail.muscles_worked', 'Muscles worked')}</h2></div>
            <Reveal className="muscles-overview">
              <div className="muscle-card primary">
                <div className="muscle-card-meta">
                  <span className="muscle-card-dot" />
                  <span className="muscle-card-role">{t('detail.primary_target', 'Primary Target')}</span>
                </div>
                <div className="muscle-card-name">{ex.target}</div>
              </div>

              {ex.secondary?.length > 0 && (
                <div className="muscle-card secondary">
                  <div className="muscle-card-meta">
                    <span className="muscle-card-dot" />
                    <span className="muscle-card-role">{t('detail.supporting_muscles', 'Supporting Muscles')}</span>
                  </div>
                  <div className="muscle-card-name">{ex.secondary.join(' · ')}</div>
                </div>
              )}
            </Reveal>
          </div>
        </div>

        {/* More for your muscle: Only shown when browsing general library, NOT inside a plan or routine */}
        {!isScoped && related?.length > 0 && (
          <>
            <div className="sub-title" style={{ marginTop: 90 }}>
              <h2>{t('detail.more_for', 'More for your')} {ex.target}</h2>
              <Link to={`/exercises?target=${encodeURIComponent(ex.target)}`} className="link-btn">{t('detail.see_all', 'See all →')}</Link>
            </div>
            <div className="related">
              {related.map((r, i) => <ExerciseCard key={r.id} ex={r} index={i} />)}
            </div>
          </>
        )}

        <div className="pager">
          {prev && (
            <Link to={`/exercises/${prev.id}`} state={location.state}>
              <Paper src={prev.image} />
              <div><small>← {t('detail.previous', 'Previous')}</small><b>{prev.name}</b></div>
            </Link>
          )}
          {next && (
            <Link to={`/exercises/${next.id}`} state={location.state} className="next">
              <Paper src={next.image} />
              <div><small>{t('detail.next', 'Next')} →</small><b>{next.name}</b></div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
