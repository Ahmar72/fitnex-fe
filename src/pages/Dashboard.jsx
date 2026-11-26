import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useWorkout, streakOf } from '../context/WorkoutContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Counter, GlowCard, Paper, Reveal, SplitText } from '../components/Motion.jsx';
import { Arrow, Bolt, Dumbbell, Flame, Heart, Play, Trophy } from '../components/Icons.jsx';
import { ROUTINES } from '../sections/Programs.jsx';
import { goalOf, routineFor } from '../lib/goals.js';
import { getGoalWorkoutForToday, DIFFICULTY_CALIBRATION } from '../lib/progressionEngine.js';
import { dayKey, fmt, sample, title, readLS, writeLS } from '../lib/utils.js';
import { api } from '../lib/api.js';
import TrainingHeatmap from '../components/TrainingHeatmap.jsx';

const ease = [0.22, 1, 0.36, 1];
const FOCUS = {
  muscle: ['chest', 'upper arms', 'shoulders', 'back'],
  fat: ['cardio', 'waist', 'upper legs'],
  strength: ['upper legs', 'back', 'chest'],
  fit: ['waist', 'upper legs', 'back', 'cardio'],
};

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Late night grind' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { exercises, byId, findByName, ready } = useData();
  const { history, favorites, workout, loadRoutine } = useWorkout();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const profile = user?.profile || {};
  const goal = goalOf(profile.goal);
  const first = user?.name ? user.name.split(' ')[0] : 'Athlete';

  // Live dashboard summary from backend API
  const [dashboardSummary, setDashboardSummary] = useState(null);
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    api.dashboard
      .getSummary()
      .then((data) => {
        if (alive && data) setDashboardSummary(data);
      })
      .catch(() => {});

    api.history.getStreak().catch(() => {});
    api.history.getSessions({ limit: 6 }).catch(() => {});
    api.plans.getActive().catch(() => {});

    return () => {
      alive = false;
    };
  }, [user?.id]);

  // The Dashboard routine is strictly driven by the user's primary goal chosen at onboarding or updated in Profile
  const userGoal = profile.goal || 'muscle';
  const goalObj = goalOf(userGoal);

  // Record and read dedicated progress for the user's goal routine (independent from /plans)
  const goalProgress = useMemo(() => {
    return readLS(`fx:goal-progress:${userGoal}`, { currentDayIndex: 0, completedDates: [] });
  }, [userGoal]);

  const goalWorkout = useMemo(() => {
    if (!ready) return null;
    return getGoalWorkoutForToday({
      profile,
      goalProgress,
      byId,
      exercises,
    });
  }, [ready, profile, goalProgress, byId, exercises]);

  const stats = useMemo(() => {
    const volume = history.reduce((a, h) => a + (Number(h.volume) || 0), 0);
    const sets = history.reduce((a, h) => a + (h.sets || 0), 0);
    const week = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      week.push({ key, label: d.toLocaleDateString('en-US', { weekday: 'short' }), sets: history.filter((h) => h.date === key).reduce((a, h) => a + h.sets, 0) });
    }
    const daysThisWeek = week.filter((d) => d.sets > 0).length;
    return { volume, sets, streak: streakOf(history), week, daysThisWeek };
  }, [history]);

  const heat = useMemo(() => {
    const byDay = {};
    history.forEach((h) => (byDay[h.date] = (byDay[h.date] || 0) + h.sets));
    const out = [];
    const t = new Date();
    for (let i = 7 * 20 - 1; i >= 0; i--) {
      const d = new Date(t);
      d.setDate(d.getDate() - i);
      out.push(byDay[dayKey(d)] || 0);
    }
    return out;
  }, [history]);

  const maxSets = Math.max(10, ...stats.week.map((d) => d.sets));
  const target = profile.days || 3;
  const C = 2 * Math.PI * 52;
  const ratio = Math.min(1, stats.daysThisWeek / target);

  const startPlan = () => {
    if (!goalWorkout || !goalWorkout.items?.length) return;
    const routineTitle = `${goalObj.label} Routine`;
    loadRoutine(
      routineTitle,
      goalWorkout.items.map(({ id, sets, reps, weight }) => ({
        id,
        sets,
        reps,
        weight,
      })),
      {
        goal: userGoal,
        isGoalRoutine: true,
      }
    );
    navigate('/builder');
  };

  if (!user) return <div className="page-fallback" />;

  return (
    <section className="dash">
      <div className="container">
        <div className="dash-head">
          <div>
            <h1 className="dash-title" style={{ margin: '0 0 6px', fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              {t('dash.hey', 'Hey')} {first}, <span className="accent">{t('dash.lets_train', 'let’s train.')}</span>
            </h1>
          </div>
          <div className="dash-cta">
            <button className="btn btn-primary" onClick={startPlan}><Play /> {t('dash.start_now', 'Start today’s plan')}</button>
          </div>
        </div>

        <div className="dash-stats">
          {[
            { icon: Bolt, n: history.length, l: t('dash.total_workouts', 'Workouts logged') },
            { icon: Dumbbell, n: stats.volume, l: t('dash.total_volume', 'Total kg lifted') },
            { icon: Flame, n: stats.streak, l: t('dash.streak', 'Day streak') },
            { icon: Heart, n: favorites.length, l: t('dash.saved', 'Favourite exercises') },
          ].map((s, i) => (
            <Reveal key={s.l} delay={0.1 * i} style={{ display: 'flex' }}>
              <GlowCard className="dash-stat" style={{ flex: 1 }}>
                <div className="dash-stat-info">
                  <b className="dash-stat-val"><Counter to={s.n} duration={1.4} /></b>
                  <span className="dash-stat-label">{s.l}</span>
                </div>
                <span className="dash-icon"><s.icon /></span>
              </GlowCard>
            </Reveal>
          ))}
        </div>

        <div className="dash-grid">
          <Reveal className="span-8" style={{ display: 'flex' }}>
            <GlowCard className="plan-card" style={{ flex: 1 }} tilt={3}>
              <div className="plan-top">
                <div style={{ flex: 1, minWidth: 240 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px', textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
                    {goalObj.label} Routine
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                    {userGoal === 'fat'
                      ? 'Daily exercises calibrated for fat burn and core definition.'
                      : userGoal === 'muscle'
                      ? 'Hypertrophy-focused sets to build lean muscle mass.'
                      : userGoal === 'strength'
                      ? 'Compound movements for progressive overload and power.'
                      : 'Balanced functional exercises for daily health and conditioning.'}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={startPlan} style={{ flexShrink: 0 }}>
                  {t('dash.load_start', 'Load & start')} <Arrow />
                </button>
              </div>
              <div className="plan-media">
                {goalWorkout?.items?.map(({ ex, sets, reps, weight, isBodyweight }, i) => (
                  <motion.div key={ex.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, ease }}>
                    <Link
                      to={`/exercises/${ex.id}`}
                      state={{
                        fromRoutine: true,
                        routineTitle: `${goalObj.label} Routine`,
                        routineExerciseIds: goalWorkout.items.map((it) => it.ex.id),
                        planExerciseIds: goalWorkout.items.map((it) => it.ex.id),
                      }}
                      className="plan-item"
                    >
                      <Paper src={ex.image} gif={ex.gif} autoplay />
                      <b>{ex.name}</b>
                      <span>{sets} × {reps} {isBodyweight ? '· Bodyweight' : `· ${weight}kg`}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          </Reveal>

          <Reveal className="span-4" delay={0.1} style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('dash.weekly_goal', 'Weekly goal')}</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '4px 0 8px', textTransform: 'none' }}>{stats.daysThisWeek} {t('dash.of_days', 'of')} {target} {t('dash.days', 'days')}</h3>
              <div className="ring-wrap">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" stroke="var(--ring-track)" strokeWidth="12" fill="none" />
                  <motion.circle
                    cx="60" cy="60" r="52" stroke="var(--accent)" strokeWidth="12" fill="none" strokeLinecap="round"
                    strokeDasharray={C} transform="rotate(-90 60 60)"
                    initial={{ strokeDashoffset: C }} whileInView={{ strokeDashoffset: C * (1 - ratio) }} viewport={{ once: true }}
                    transition={{ duration: 1.4, ease }}
                  />
                  <text x="60" y="68" textAnchor="middle" fill="var(--text)" fontSize="24" fontWeight="800" fontFamily="var(--body)">{Math.round(ratio * 100)}%</text>
                </svg>
                <p>{ratio >= 1 ? 'Weekly target smashed. Recovery matters too!' : `${target - stats.daysThisWeek} more session${target - stats.daysThisWeek === 1 ? '' : 's'} to hit your target this week.`}</p>
              </div>
            </GlowCard>
          </Reveal>

          <Reveal className="span-6" style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <span className="tag">{t('dash.last_7_days', 'Last 7 days')}</span>
              <h3>{t('dash.sets_day', 'Sets per day')}</h3>
              <div className="week-bars">
                {stats.week.map((d, i) => (
                  <div key={d.key} className={`wb ${d.key === dayKey() ? 'today' : ''}`}>
                    <div className="wb-track">
                      <motion.i initial={{ height: 0 }} whileInView={{ height: `${(d.sets / maxSets) * 100}%` }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.8, ease }} />
                    </div>
                    <small>{d.sets || ''}</small>
                    <span>{d.label}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          </Reveal>

          <Reveal className="span-6" delay={0.1} style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }}>
              <TrainingHeatmap history={history} t={t} />
            </GlowCard>
          </Reveal>

          <Reveal className="span-12" style={{ display: 'flex' }}>
            <GlowCard style={{ flex: 1 }} tilt={0}>
              <div className="plan-top">
                <div>
                  <span className="tag">{t('dash.history', 'History')}</span>
                  <h3>{t('dash.recent_workouts', 'Recent workouts')}</h3>
                </div>
                <Link to="/builder" className="link-btn">{t('dash.open_builder', 'Open builder')} →</Link>
              </div>
              {history.length === 0 ? (
                <div className="dash-empty">
                  <p>{t('dash.no_workouts', 'No workouts logged yet. Start a session in the Builder!')}</p>
                </div>
              ) : (
                <div className="recent">
                  {history.slice(0, 6).map((h) => (
                    <div key={h.id} className="recent-row">
                      <div className="recent-media">
                        {h.exercises.slice(0, 3).map((id) => byId.get(id) && <Paper key={id} src={byId.get(id).image} />)}
                      </div>
                      <div className="grow">
                        <b>{h.name}</b>
                        <span>{new Date(h.at || h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <span className="chip">{h.exercises.length} exercises</span>
                      <span className="chip">{h.sets} sets</span>
                      <span className="chip">{fmt(h.volume)} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </GlowCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
