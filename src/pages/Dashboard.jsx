import { useEffect, useMemo } from 'react';
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
import { PLANS } from '../lib/plansData.js';
import { getActivePlanWithProgression } from '../lib/progressionEngine.js';
import { dayKey, fmt, sample, title, readLS, writeLS } from '../lib/utils.js';

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

const DEFAULT_PLAN_BY_GOAL = {
  muscle: 'muscle-building',
  fat: 'weight-loss',
  strength: 'boulder-shoulders',
  fit: 'abs-building',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { exercises, byId, findByName, ready } = useData();
  const { history, favorites, workout, loadRoutine } = useWorkout();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const profile = user?.profile || {};
  const goal = goalOf(profile.goal);
  const first = user?.name ? user.name.split(' ')[0] : 'Athlete';

  // Anchor strictly to the plan chosen by the user at the time of registration/onboarding
  const registeredPlanId = profile.registeredPlanId || DEFAULT_PLAN_BY_GOAL[profile.goal || 'muscle'] || 'muscle-building';

  // Record and read dedicated progress for the user's registration plan
  const registeredProgress = useMemo(() => {
    const reg = readLS(`fx:reg-plan-progress:${registeredPlanId}`, null) || readLS('fx:registered-plan-progress', null);
    if (reg && reg.planId === registeredPlanId) return reg;
    const active = readLS('fx:active-plan-data', null);
    if (active && active.planId === registeredPlanId) return active;
    return {
      planId: registeredPlanId,
      currentDayIndex: 0,
      completedDates: [],
    };
  }, [registeredPlanId]);

  const plan = useMemo(() => {
    if (!ready) return null;
    return getActivePlanWithProgression({
      activePlanData: registeredProgress,
      profile: { ...profile, activePlanId: registeredPlanId },
      PLANS,
      byId,
    });
  }, [ready, registeredProgress, profile, registeredPlanId, byId]);

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
    if (!plan || !plan.items?.length) return;
    loadRoutine(plan.name, plan.items.map(({ ex, sets, reps }) => ({ id: ex.id, sets, reps })), {
      planId: registeredPlanId,
      isRegistrationPlan: true,
    });
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
                <span className="dash-icon"><s.icon /></span>
                <b><Counter to={s.n} duration={1.4} /></b>
                <span>{s.l}</span>
              </GlowCard>
            </Reveal>
          ))}
        </div>

        <div className="dash-grid">
          <Reveal className="span-8" style={{ display: 'flex' }}>
            <GlowCard className="plan-card" style={{ flex: 1 }} tilt={3}>
              <div className="plan-top">
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className="tag" style={{ margin: 0 }}>
                      {t('dash.todays_plan', 'Today’s plan')} · Week {plan?.currentWeek || 1}
                    </span>
                    {plan?.weekProgression?.tag && (
                      <span className="chip" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
                        {plan.weekProgression.tag}
                      </span>
                    )}
                    <span className="chip" style={{ fontSize: '11px', fontWeight: 700 }}>
                      ⏱️ {plan?.setDuration || 40}s / set
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '4px 0 6px', textTransform: 'capitalize' }}>
                    {plan?.name || 'Today’s Workout'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0, lineHeight: 1.45 }}>
                    {plan?.blurb || 'Customized daily progression for your active program.'}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={startPlan} style={{ flexShrink: 0 }}>
                  {t('dash.load_start', 'Load & start')} <Arrow />
                </button>
              </div>
              <div className="plan-media">
                {plan?.items?.map(({ ex, sets, reps }, i) => (
                  <motion.div key={ex.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, ease }}>
                    <Link to={`/exercises/${ex.id}`} className="plan-item">
                      <Paper src={ex.image} gif={ex.gif} autoplay />
                      <b>{ex.name}</b>
                      <span>{sets} × {reps}</span>
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
                  <text x="60" y="67" textAnchor="middle" fill="var(--text)" fontSize="22" fontWeight="800" fontFamily="var(--body)">{Math.round(ratio * 100)}%</text>
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
              <span className="tag">{t('dash.consistency', 'Consistency · 20 weeks')}</span>
              <h3>{t('dash.heatmap', 'Training heatmap')}</h3>
              <div className="heat" style={{ paddingTop: 18 }}>
                {heat.map((v, i) => (
                  <i key={i} title={v ? `${v} sets` : ''} style={{ background: v === 0 ? 'var(--heat-0)' : v < 6 ? 'var(--heat-1)' : v < 15 ? 'var(--heat-2)' : 'var(--heat-3)' }} />
                ))}
              </div>
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
