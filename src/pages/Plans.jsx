import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  Target,
  Bolt,
  Check,
  Search,
  ArrowLeft,
  Play,
  Flame,
  Dumbbell,
  ArrowUpRight,
  X,
  Trophy,
  Ruler,
  ChevronRight,
  Clock,
} from '../components/Icons.jsx';
import { PLANS, PLAN_CATEGORIES } from '../lib/plansData.js';
import { asset, dayKey, readLS, writeLS, playChimeSound, partMeta } from '../lib/utils.js';

/**
 * Calculates current week days (Monday - Sunday) with calendar dates and relative time status.
 */
function getWeekCalendarDays() {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = (currentDayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const todayMid = new Date(now);
  todayMid.setHours(0, 0, 0, 0);

  return dayNames.map((name, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    d.setHours(0, 0, 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayNum}`;

    const isToday = d.getTime() === todayMid.getTime();
    const isPast = d.getTime() < todayMid.getTime();
    const isFuture = d.getTime() > todayMid.getTime();

    return {
      dayName: name,
      abbr: name.slice(0, 3),
      dateNumber: d.getDate(),
      monthName: d.toLocaleDateString(undefined, { month: 'short' }),
      dateKey,
      isToday,
      isPast,
      isFuture,
    };
  });
}

const formatDigitalTime = (secs = 0) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function Plans() {
  const { byId, ready } = useData();
  const { loadRoutine, setHistory, history } = useWorkout();
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  // Search & Filter state
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Plan state (null = catalog view, plan object = detail view)
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Calendar days of current week
  const weekDays = useMemo(() => getWeekCalendarDays(), []);

  // Today's calendar day
  const todayCalendarDay = useMemo(() => {
    return weekDays.find((d) => d.isToday) || weekDays[0];
  }, [weekDays]);

  // Active selected day in the interactive calendar
  const [activeDateKey, setActiveDateKey] = useState(todayCalendarDay.dateKey);

  // Completed plan workout days map: { [planId:dateKey]: { completedAt, exercisesCount, ... } }
  const [completedDays, setCompletedDays] = useState(() => {
    return readLS('fx:completed-plan-days', {});
  });

  // Saved plan onboarding profiles: { [planId]: { weight, height, level, ... } }
  const [planProfiles, setPlanProfiles] = useState(() => {
    return readLS('fx:plan-profiles', {});
  });

  // Active program continuous progress state: { planId, currentDayIndex, lastWorkoutDate, completedDates }
  const [activePlanData, setActivePlanData] = useState(() => {
    return readLS('fx:active-plan-data', null);
  });

  // Plan Onboarding Questions Wizard Modal state
  const [onboardingPlan, setOnboardingPlan] = useState(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    weight: user?.profile?.weight || '72',
    weightUnit: 'kg',
    height: user?.profile?.height || '178',
    heightUnit: 'cm',
    level: user?.profile?.level || 'intermediate',
    daysPerWeek: 4,
    primaryGoal: 'hypertrophy',
  });

  // Dedicated Guided Live Workout Session state
  const [liveWorkoutSession, setLiveWorkoutSession] = useState(null);
  // Full-screen dedicated workout completion summary state
  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState(null);

  // Active program object resolved from activePlanData
  const activePlan = useMemo(() => {
    if (!activePlanData?.planId) return null;
    return PLANS.find((p) => p.id === activePlanData.planId) || null;
  }, [activePlanData]);

  // Active calendar day object
  const activeCalendarDay = useMemo(() => {
    return weekDays.find((d) => d.dateKey === activeDateKey) || todayCalendarDay;
  }, [weekDays, activeDateKey, todayCalendarDay]);

  // Current day's routine from the selected plan schedule
  const currentDayRoutine = useMemo(() => {
    if (!selectedPlan) return null;
    return (
      selectedPlan.schedule.find((s) => s.day === activeCalendarDay.dayName) ||
      selectedPlan.schedule.find((s) => !s.isRest) ||
      selectedPlan.schedule[0]
    );
  }, [selectedPlan, activeCalendarDay]);

  // Resolved exercise objects for current day
  const routineExercises = useMemo(() => {
    if (!currentDayRoutine || currentDayRoutine.isRest) return [];
    return currentDayRoutine.exerciseIds
      .map((id) => byId.get(id))
      .filter(Boolean);
  }, [currentDayRoutine, byId]);

  // Get workout completions count for a specific date (supports multiple sessions per day)
  const getDayWorkoutCount = useCallback((dateKey, planId = selectedPlan?.id) => {
    if (!planId) return 0;
    const key = `${planId}:${dateKey}`;
    const directRecord = completedDays[key];
    let directCount = 0;
    if (typeof directRecord?.count === 'number') {
      directCount = directRecord.count;
    } else if (directRecord) {
      directCount = 1;
    }

    const historyCount = (history || []).filter(
      (h) => h.date === dateKey && (h.planId === planId || h.name?.includes(selectedPlan?.name || ''))
    ).length;

    return Math.max(directCount, historyCount);
  }, [completedDays, history, selectedPlan]);

  // Check if a specific calendar day is completed for a plan
  const isDayDone = useCallback((dateKey, planId = selectedPlan?.id) => {
    return getDayWorkoutCount(dateKey, planId) > 0;
  }, [getDayWorkoutCount]);

  // Check if active day is completed
  const isActiveDayCompleted = isDayDone(activeCalendarDay.dateKey);

  // Determine active day: strictly keep synced with today's live calendar date
  const determineActiveDay = useCallback((plan) => {
    setActiveDateKey(todayCalendarDay.dateKey);
  }, [todayCalendarDay]);

  // Select plan handler: opens onboarding questions if not yet configured, otherwise opens plan
  const handleSelectPlan = (plan) => {
    if (!planProfiles[plan.id]) {
      setOnboardingPlan(plan);
      setOnboardingStep(1);
      setOnboardingData({
        weight: user?.profile?.weight || '72',
        weightUnit: 'kg',
        height: user?.profile?.height || '178',
        heightUnit: 'cm',
        level: user?.profile?.level || plan.level?.toLowerCase() || 'intermediate',
        daysPerWeek: 4,
        primaryGoal: 'hypertrophy',
      });
      return;
    }

    setSelectedPlan(plan);
    determineActiveDay(plan);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Complete onboarding wizard and activate plan
  const handleCompleteOnboarding = () => {
    if (!onboardingPlan) return;
    const plan = onboardingPlan;

    const updatedProfiles = {
      ...planProfiles,
      [plan.id]: {
        ...onboardingData,
        completedAt: Date.now(),
      },
    };
    setPlanProfiles(updatedProfiles);
    writeLS('fx:plan-profiles', updatedProfiles);

    const newActivePlan = {
      planId: plan.id,
      planName: plan.name,
      startedAt: Date.now(),
      currentDayIndex: 0,
      lastWorkoutDate: null,
      completedDates: [],
    };
    setActivePlanData(newActivePlan);
    writeLS('fx:active-plan-data', newActivePlan);

    if (user && updateUser) {
      updateUser({
        profile: {
          ...(user.profile || {}),
          weight: Number(onboardingData.weight) || user?.profile?.weight,
          height: Number(onboardingData.height) || user?.profile?.height,
          level: onboardingData.level,
        },
      });
    }

    toast(`Program personalized for ${plan.name}! Let's start training.`, 'bolt');
    setOnboardingPlan(null);
    setSelectedPlan(plan);
    determineActiveDay(plan);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered plans catalog list
  const filteredPlans = useMemo(() => {
    return PLANS.filter((plan) => {
      const matchCategory =
        activeCategory === 'all' ||
        plan.key === activeCategory ||
        (activeCategory === 'abs' && plan.key === 'abs') ||
        (activeCategory === 'muscle-building' && plan.key === 'muscle-building') ||
        (activeCategory === 'weight-loss' && plan.key === 'weight-loss');

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        plan.name.toLowerCase().includes(q) ||
        plan.targetMuscle.toLowerCase().includes(q) ||
        plan.tagline.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  // Start Workout: initiates Dedicated Guided Live Workout Screen
  const handleStartWorkout = () => {
    if (!selectedPlan || !currentDayRoutine || currentDayRoutine.isRest) return;

    const restDuration = Number(user?.profile?.rest || readLS('fx:rest-timer', 60)) || 60;

    const initialSets = {};
    routineExercises.forEach((ex) => {
      initialSets[ex.id] = [
        { id: 1, reps: 10, weight: 20, done: false },
        { id: 2, reps: 10, weight: 20, done: false },
        { id: 3, reps: 10, weight: 20, done: false },
        { id: 4, reps: 10, weight: 20, done: false },
      ];
    });

    setLiveWorkoutSession({
      plan: selectedPlan,
      dayRoutine: currentDayRoutine,
      dateKey: activeCalendarDay.dateKey,
      dayName: activeCalendarDay.dayName,
      exercises: routineExercises,
      currentExIdx: 0, // Starts from 1st exercise!
      setsMap: initialSets,
      activeTimer: null,
      restDuration,
      startTime: Date.now(),
      elapsedSeconds: 0,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Elapsed workout timer effect
  useEffect(() => {
    if (!liveWorkoutSession) return;
    const timer = setInterval(() => {
      setLiveWorkoutSession((prev) => (prev ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [Boolean(liveWorkoutSession)]);

  // Track timer transitions to trigger audio chime and single toast without side-effects in state updaters
  const timerTransitionRef = useRef({ mode: null, setIdx: null });
  useEffect(() => {
    const curTimer = liveWorkoutSession?.activeTimer;
    const prev = timerTransitionRef.current;

    if (!curTimer) {
      if (prev.mode === 'rest') {
        playChimeSound();
        toast('Rest completed! Ready for next set.', 'bolt');
      }
    } else if (curTimer.mode === 'rest' && prev.mode === 'set') {
      playChimeSound();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([120, 60, 120]);
      }
      toast(`Set ${curTimer.setIdx + 1} completed! Rest timer started.`, 'bolt');
    }

    timerTransitionRef.current = curTimer
      ? { mode: curTimer.mode, setIdx: curTimer.setIdx }
      : { mode: null, setIdx: null };
  }, [liveWorkoutSession?.activeTimer, toast]);

  // Countdown timer effect:
  // 1. SET mode: runs for set work duration. When finished, marks set DONE and AUTOMATICALLY starts REST timer!
  // 2. REST mode: counts down rest duration. When finished, clears timer and notifies ready for next set!
  useEffect(() => {
    if (!liveWorkoutSession?.activeTimer?.isRunning) return;

    const interval = setInterval(() => {
      setLiveWorkoutSession((prev) => {
        if (!prev?.activeTimer?.isRunning) return prev;
        const nextLeft = prev.activeTimer.secondsLeft - 1;

        if (nextLeft <= 0) {
          const { mode, exId, setIdx } = prev.activeTimer;

          if (mode === 'set') {
            // Set completed! Mark DONE automatically!
            const currentSets = prev.setsMap[exId] || [];
            const updatedSets = currentSets.map((s, idx) => (idx === setIdx ? { ...s, done: true } : s));

            // AUTOMATICALLY start REST TIMER!
            const restDuration = prev.restDuration || 60;
            return {
              ...prev,
              setsMap: {
                ...prev.setsMap,
                [exId]: updatedSets,
              },
              activeTimer: {
                mode: 'rest',
                exId,
                setIdx,
                secondsLeft: restDuration,
                totalSeconds: restDuration,
                isRunning: true,
              },
            };
          } else {
            // Rest timer finished! Clear timer and signal ready for next set
            return {
              ...prev,
              activeTimer: null,
            };
          }
        }

        return {
          ...prev,
          activeTimer: {
            ...prev.activeTimer,
            secondsLeft: nextLeft,
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [liveWorkoutSession?.activeTimer?.isRunning]);

  // Click on "Start" for a set: starts the SET DURATION timer (not rest).
  // Once a set is completed, it cannot be edited or restarted.
  const handleStartSet = (exId, setIdx) => {
    if (!liveWorkoutSession) return;
    const currentSets = liveWorkoutSession.setsMap[exId] || [];
    const thisSet = currentSets[setIdx];

    // If already done, it CANNOT be edited or restarted
    if (thisSet?.done) return;

    // Set duration countdown (40s work time)
    const SET_DURATION = 40;
    setLiveWorkoutSession((prev) => ({
      ...prev,
      activeTimer: {
        mode: 'set',
        exId,
        setIdx,
        secondsLeft: SET_DURATION,
        totalSeconds: SET_DURATION,
        isRunning: true,
      },
    }));
    toast(`Set ${setIdx + 1} started! Timer is tracking your set duration.`, 'bolt');
  };

  // Complete set early and immediately start the automatic rest timer
  const handleCompleteSetEarly = () => {
    if (!liveWorkoutSession?.activeTimer || liveWorkoutSession.activeTimer.mode !== 'set') return;
    const { exId, setIdx } = liveWorkoutSession.activeTimer;
    const currentSets = liveWorkoutSession.setsMap[exId] || [];
    const updatedSets = currentSets.map((s, idx) => (idx === setIdx ? { ...s, done: true } : s));
    const restDuration = liveWorkoutSession.restDuration || 60;

    setLiveWorkoutSession((prev) => ({
      ...prev,
      setsMap: {
        ...prev.setsMap,
        [exId]: updatedSets,
      },
      activeTimer: {
        mode: 'rest',
        exId,
        setIdx,
        secondsLeft: restDuration,
        totalSeconds: restDuration,
        isRunning: true,
      },
    }));
  };

  // Skip the rest timer
  const skipRestTimer = () => {
    if (!liveWorkoutSession?.activeTimer) return;
    timerTransitionRef.current = { mode: null, setIdx: null };
    setLiveWorkoutSession((prev) => ({
      ...prev,
      activeTimer: null,
    }));
    playChimeSound();
    toast('Rest skipped! Ready for next set.', 'bolt');
  };

  // Adjust timer by seconds
  const adjustTimer = (delta) => {
    setLiveWorkoutSession((prev) => {
      if (!prev?.activeTimer) return prev;
      const newSec = Math.max(0, prev.activeTimer.secondsLeft + delta);
      return {
        ...prev,
        activeTimer: { ...prev.activeTimer, secondsLeft: newSec },
      };
    });
  };

  // Toggle pause/resume timer
  const toggleTimerPause = () => {
    setLiveWorkoutSession((prev) => {
      if (!prev?.activeTimer) return prev;
      return {
        ...prev,
        activeTimer: { ...prev.activeTimer, isRunning: !prev.activeTimer.isRunning },
      };
    });
  };

  // Finish Workout: marks day done, logs to history, advances plan progress, stops timer, opens full summary screen
  const handleFinishWorkout = () => {
    if (!liveWorkoutSession) return;
    const { plan, dateKey, dayName, exercises, setsMap, elapsedSeconds } = liveWorkoutSession;
    const finalElapsedSeconds = elapsedSeconds;

    // Immediately stop live workout session so the timer freezes at this exact moment!
    setLiveWorkoutSession(null);

    // Calculate EXACT recorded completed sets for each exercise
    const exerciseBreakdown = exercises.map((ex) => {
      const s = setsMap[ex.id] || [];
      const completedSets = s.filter((item) => item.done).length;
      const totalSets = s.length > 0 ? s.length : 4;
      return {
        ...ex,
        completedSets,
        totalSets,
      };
    });

    const totalSetsDone = exerciseBreakdown.reduce((acc, ex) => acc + ex.completedSets, 0);
    const totalPossibleSets = exerciseBreakdown.reduce((acc, ex) => acc + ex.totalSets, 0);

    const burnedCalories = Math.max(
      totalSetsDone > 0 ? 60 : 0,
      Math.round(totalSetsDone * 18 + finalElapsedSeconds * 0.15)
    );
    const totalVolume = totalSetsDone * 10 * 20;

    try {
      // 1. Mark day as completed and increment count for this date
      const planKey = `${plan.id}:${dateKey}`;
      const existingRecord = completedDays[planKey];
      const prevCount =
        typeof existingRecord?.count === 'number'
          ? existingRecord.count
          : existingRecord
          ? 1
          : 0;
      const nextCount = prevCount + 1;

      const nextCompleted = {
        ...completedDays,
        [planKey]: {
          completedAt: Date.now(),
          dateKey,
          dayName,
          planId: plan.id,
          exercisesCount: exercises.length,
          count: nextCount,
        },
      };
      setCompletedDays(nextCompleted);
      writeLS('fx:completed-plan-days', nextCompleted);

      // 2. Advance plan progress continuous index
      const nextDayIdx = (activePlanData?.currentDayIndex || 0) + 1;
      const updatedPlanData = {
        planId: plan.id,
        planName: plan.name,
        startedAt: activePlanData?.startedAt || Date.now(),
        currentDayIndex: nextDayIdx,
        lastWorkoutDate: dateKey,
        completedDates: [...new Set([...(activePlanData?.completedDates || []), dateKey])],
      };
      setActivePlanData(updatedPlanData);
      writeLS('fx:active-plan-data', updatedPlanData);

      // 3. Log to history
      const logEntry = {
        id: `plan-${Date.now()}`,
        date: dateKey,
        at: Date.now(),
        name: `${plan.name} (${dayName})`,
        sets: totalSetsDone,
        reps: totalSetsDone * 10,
        volume: totalVolume,
        duration: finalElapsedSeconds,
        calories: burnedCalories,
        exercises: exercises.map((e) => e.id),
        planId: plan.id,
      };

      if (typeof setHistory === 'function') {
        setHistory([logEntry, ...(history || [])].slice(0, 500));
      } else {
        const prefix = `fx:${user?.id || 'guest'}:`;
        const currentH = readLS(prefix + 'history', []);
        writeLS(prefix + 'history', [logEntry, ...currentH].slice(0, 500));
      }
    } catch (err) {
      console.error('Failed to log completed workout:', err);
    }

    playChimeSound();

    // 4. Open Dedicated Full Summary Screen with all key details & EXACT recorded breakdown
    setCompletedWorkoutSummary({
      plan,
      dayName,
      routineTitle: currentDayRoutine?.title || 'Systematic Hypertrophy Session',
      dateKey,
      exercises: exerciseBreakdown,
      setsCompleted: totalSetsDone,
      totalPossibleSets,
      durationSecs: finalElapsedSeconds,
      durationFormatted: formatDigitalTime(finalElapsedSeconds),
      caloriesBurned: burnedCalories,
      totalVolume,
      avgHeartRate: totalSetsDone > 0 ? 138 : 95,
      intensity:
        totalSetsDone >= Math.max(1, totalPossibleSets * 0.75)
          ? 'High Hypertrophy'
          : totalSetsDone > 0
          ? 'Moderate Effort'
          : 'Light Session',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="dash plans-page">
      <div className="container" style={{ width: '100%', maxWidth: '100%' }}>
        {/* ============================================================
            VIEW 0: FULL SCREEN DEDICATED WORKOUT COMPLETION SUMMARY
            ============================================================ */}
        {completedWorkoutSummary ? (
          <div className="workout-summary-screen">
            {/* Top Navigation */}
            <div className="summary-nav-bar">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setCompletedWorkoutSummary(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <ArrowLeft width={16} height={16} /> Return to Training Schedule
              </button>
              <span className="summary-plan-badge">{completedWorkoutSummary.plan.name}</span>
            </div>

            {/* Hero Success Celebration Card */}
            <div className="summary-hero-card">
              <div className="summary-trophy-ring">
                <Trophy width={38} height={38} />
              </div>
              <span className="summary-eyebrow">Session Completed</span>
              <h1 className="summary-title">{completedWorkoutSummary.routineTitle}</h1>
              <p className="summary-sub">
                Outstanding dedication! Today's session is recorded and saved to your training history.
              </p>
            </div>

            {/* Primary Key Metrics Grid (Calories Burned, Active Time, Sets, Volume) */}
            <div className="summary-metrics-grid">
              <div className="summary-metric-card highlight-metric">
                <div className="summary-metric-icon" style={{ background: 'rgba(255, 94, 26, 0.12)', color: '#ff5e1a' }}>
                  <Flame width={22} height={22} />
                </div>
                <div className="summary-metric-content">
                  <span className="summary-metric-value">
                    {completedWorkoutSummary.caloriesBurned} <span className="metric-unit">kcal</span>
                  </span>
                  <span className="summary-metric-label">Calories Burned</span>
                </div>
              </div>

              <div className="summary-metric-card">
                <div className="summary-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                  <Clock width={22} height={22} />
                </div>
                <div className="summary-metric-content">
                  <span className="summary-metric-value">{completedWorkoutSummary.durationFormatted}</span>
                  <span className="summary-metric-label">Active Time</span>
                </div>
              </div>

              <div className="summary-metric-card">
                <div className="summary-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  <Check width={22} height={22} />
                </div>
                <div className="summary-metric-content">
                  <span className="summary-metric-value">
                    {completedWorkoutSummary.setsCompleted} <span className="metric-unit">Sets</span>
                  </span>
                  <span className="summary-metric-label">Sets Completed</span>
                </div>
              </div>

              <div className="summary-metric-card">
                <div className="summary-metric-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
                  <Dumbbell width={22} height={22} />
                </div>
                <div className="summary-metric-content">
                  <span className="summary-metric-value">
                    {completedWorkoutSummary.totalVolume.toLocaleString()} <span className="metric-unit">kg</span>
                  </span>
                  <span className="summary-metric-label">Total Volume</span>
                </div>
              </div>
            </div>

            {/* Performance Analytics Strip */}
            <div className="summary-perf-strip">
              <div className="perf-item">
                <span className="perf-label">Heart Rate Avg</span>
                <span className="perf-val">~{completedWorkoutSummary.avgHeartRate} bpm</span>
              </div>
              <div className="perf-divider" />
              <div className="perf-item">
                <span className="perf-label">Primary Muscle</span>
                <span className="perf-val">{completedWorkoutSummary.plan.targetMuscle}</span>
              </div>
              <div className="perf-divider" />
              <div className="perf-item">
                <span className="perf-label">Training Intensity</span>
                <span className="perf-val">{completedWorkoutSummary.intensity}</span>
              </div>
              <div className="perf-divider" />
              <div className="perf-item">
                <span className="perf-label">Target Consistency</span>
                <span
                  className="perf-val"
                  style={{ color: completedWorkoutSummary.setsCompleted > 0 ? '#10b981' : 'var(--muted)' }}
                >
                  {completedWorkoutSummary.totalPossibleSets > 0
                    ? `${Math.round(
                        (completedWorkoutSummary.setsCompleted / completedWorkoutSummary.totalPossibleSets) * 100
                      )}% Target Met`
                    : '100% Target Met'}
                </span>
              </div>
            </div>

            {/* Exercises Completed Breakdown */}
            <div className="summary-exercises-section">
              <h3 className="summary-section-heading">Completed Exercises Breakdown</h3>
              <div className="summary-exercises-list">
                {completedWorkoutSummary.exercises.map((ex, idx) => (
                  <div key={ex.id} className="summary-ex-row">
                    <div className="summary-ex-num">{idx + 1}</div>
                    <img
                      src={asset(ex.image || `images/${ex.id}.jpg`)}
                      alt={ex.name}
                      className="summary-ex-thumb"
                      onError={(e) => {
                        e.currentTarget.src = asset('images/0001-2gPfomN.jpg');
                      }}
                    />
                    <div className="summary-ex-info">
                      <h4 className="summary-ex-name">{ex.name}</h4>
                      <span className="summary-ex-meta">{ex.target} • {ex.equipment}</span>
                    </div>
                    <div className="summary-ex-sets">
                      <span
                        className="summary-sets-pill"
                        style={{
                          background:
                            ex.completedSets > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.08)',
                          borderColor:
                            ex.completedSets > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(100, 116, 139, 0.2)',
                          color: ex.completedSets > 0 ? '#10b981' : '#64748b',
                        }}
                      >
                        {ex.completedSets > 0 ? (
                          <>
                            <Check width={14} height={14} style={{ color: '#10b981' }} />{' '}
                            {ex.completedSets} of {ex.totalSets} Sets Completed
                          </>
                        ) : (
                          <>0 of {ex.totalSets} Sets Completed</>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="summary-footer-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setCompletedWorkoutSummary(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <Check width={16} height={16} /> Return to Training Schedule
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : liveWorkoutSession ? (
          <div className="live-workout-screen">
            {/* Top Navigation & Status Bar */}
            <div className="live-workout-header-bar">
              <div className="live-header-left">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (window.confirm('Exit live workout? Your completed sets will be preserved.')) {
                      setLiveWorkoutSession(null);
                    }
                  }}
                >
                  <ArrowLeft width={16} height={16} /> Exit
                </button>
                <div>
                  <span className="live-routine-tagline">
                    {liveWorkoutSession.plan.name} • {liveWorkoutSession.dayName}
                  </span>
                  <h2 className="live-routine-heading">{liveWorkoutSession.dayRoutine.title}</h2>
                </div>
              </div>

              <div className="live-header-right">
                <div className="live-progress-pill">
                  <span>Exercise {liveWorkoutSession.currentExIdx + 1} of {liveWorkoutSession.exercises.length}</span>
                </div>
                <div className="live-timer-chip">
                  <span>⏱ {formatDigitalTime(liveWorkoutSession.elapsedSeconds)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleFinishWorkout}
                  style={{ fontWeight: 800 }}
                  title="Finish workout and save session"
                >
                  <Trophy width={14} height={14} /> Finish Workout
                </button>
              </div>
            </div>

            {/* Overall Workout Progress Bar */}
            <div className="live-overall-progressbar-wrap">
              <div
                className="live-overall-progressbar-fill"
                style={{
                  width: `${Math.round(
                    ((liveWorkoutSession.currentExIdx + 1) / liveWorkoutSession.exercises.length) * 100
                  )}%`,
                }}
              />
            </div>

            {/* 2-Column Training Workspace */}
            {(() => {
              const currentEx = liveWorkoutSession.exercises[liveWorkoutSession.currentExIdx];
              if (!currentEx) return null;
              const sets = liveWorkoutSession.setsMap[currentEx.id] || [];
              const part = partMeta(currentEx.bodyPart);

              return (
                <div className="live-workspace-grid">
                  {/* Left Column: Visuals, Animation & Cues EXACTLY matching ExerciseDetail */}
                  <div className="live-exercise-card">
                    {/* Animated Exercise Visual with scanner, corners and media tag */}
                    <div className="detail-media paper">
                      <img
                        src={asset(currentEx.gif || currentEx.image)}
                        alt={currentEx.name}
                        onError={(e) => {
                          e.currentTarget.src = asset(currentEx.image || 'images/0001-2gPfomN.jpg');
                        }}
                      />
                      <span className="scan" />
                      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
                      <span className="media-tag">Target · {currentEx.target}</span>
                    </div>

                    {/* Chips, Title and Specs identical to ExerciseDetail */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <span className="chip"><span className="dot" style={{ background: part.color }} />{part.label}</span>
                        <span className="chip">#{currentEx.id}</span>
                      </div>
                      <h1 className="display" style={{ textTransform: 'uppercase', margin: '8px 0 16px', fontSize: 'clamp(28px, 3.5vw, 40px)', lineHeight: 1.15 }}>
                        {currentEx.name}
                      </h1>

                      <div className="spec" style={{ margin: '14px 0 22px' }}>
                        <div><small>Target</small><b>{currentEx.target}</b></div>
                        <div><small>Equipment</small><b>{currentEx.equipment}</b></div>
                        <div><small>Body part</small><b>{currentEx.bodyPart}</b></div>
                      </div>

                      <div className="sub-title" style={{ margin: '22px 0 10px' }}>
                        <h3 style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: 17, margin: 0 }}>How to do it</h3>
                      </div>
                      <ol className="steps-list" style={{ marginBottom: 20 }}>
                        {(currentEx.steps || [
                          'Engage target muscle group and position body with stable balance.',
                          'Execute movement under controlled tension through full range of motion.',
                          'Squeeze at peak contraction and return with deliberate eccentric pacing.'
                        ]).map((step, sIdx) => (
                          <li key={sIdx}>
                            <span>{sIdx + 1}</span>
                            <p>{step}</p>
                          </li>
                        ))}
                      </ol>

                      <div className="sub-title" style={{ margin: '22px 0 10px' }}>
                        <h3 style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: 17, margin: 0 }}>Muscles worked</h3>
                      </div>
                      <div className="muscles-overview">
                        <div className="muscle-card primary">
                          <div className="muscle-card-meta">
                            <span className="muscle-card-dot" />
                            <span className="muscle-card-role">Primary Target</span>
                          </div>
                          <div className="muscle-card-name">{currentEx.target}</div>
                        </div>
                        {currentEx.secondary?.length > 0 && (
                          <div className="muscle-card secondary">
                            <div className="muscle-card-meta">
                              <span className="muscle-card-dot" />
                              <span className="muscle-card-role">Supporting Muscles</span>
                            </div>
                            <div className="muscle-card-name">{currentEx.secondary.join(' · ')}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Sets Table & White Minimalist Countdown Timer */}
                  <div className="live-sets-card">
                    <div className="live-sets-header">
                      <h3 className="live-sets-title">Sets & Rest Tracking</h3>
                      <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
                        {liveWorkoutSession.restDuration}s rest configured
                      </span>
                    </div>

                    {/* Active Timer Box: Simply White in Color with Orange Text & Minimalist Design */}
                    {liveWorkoutSession.activeTimer?.exId === currentEx.id && (
                      <div className="live-rest-timer-box">
                        {liveWorkoutSession.activeTimer.mode === 'set' ? (
                          <>
                            <span className="timer-box-tag">
                              Set {liveWorkoutSession.activeTimer.setIdx + 1} · In Progress
                            </span>
                            <div className="timer-countdown-digital">
                              {formatDigitalTime(liveWorkoutSession.activeTimer.secondsLeft)}
                            </div>
                            <span className="timer-sub-note">
                              Perform repetitions with controlled cadence
                            </span>

                            <div className="timer-controls-row">
                              <button
                                type="button"
                                className="timer-ctrl-btn"
                                onClick={toggleTimerPause}
                              >
                                {liveWorkoutSession.activeTimer.isRunning ? 'Pause' : 'Resume'}
                              </button>
                              <button
                                type="button"
                                className="timer-ctrl-btn"
                                onClick={() => adjustTimer(15)}
                              >
                                +15s
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={handleCompleteSetEarly}
                                style={{ fontWeight: 800 }}
                              >
                                <Check width={14} height={14} /> Complete Set & Start Rest
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="timer-box-tag">
                              Rest Timer · Set {liveWorkoutSession.activeTimer.setIdx + 1} Done
                            </span>
                            <div className="timer-countdown-digital">
                              {formatDigitalTime(liveWorkoutSession.activeTimer.secondsLeft)}
                            </div>
                            <span className="timer-sub-note">
                              Resting between sets · Breathe, rehydrate, and recover
                            </span>

                            <div className="timer-controls-row">
                              <button
                                type="button"
                                className="timer-ctrl-btn"
                                onClick={() => adjustTimer(-15)}
                              >
                                -15s
                              </button>
                              <button
                                type="button"
                                className="timer-ctrl-btn"
                                onClick={toggleTimerPause}
                              >
                                {liveWorkoutSession.activeTimer.isRunning ? 'Pause' : 'Resume'}
                              </button>
                              <button
                                type="button"
                                className="timer-ctrl-btn"
                                onClick={() => adjustTimer(15)}
                              >
                                +15s
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={skipRestTimer}
                                style={{ fontWeight: 800 }}
                              >
                                Skip Rest
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Interactive Sets List */}
                    <div className="live-sets-list">
                      {sets.map((set, idx) => {
                        const isThisActiveSet =
                          liveWorkoutSession.activeTimer?.exId === currentEx.id &&
                          liveWorkoutSession.activeTimer?.setIdx === idx &&
                          liveWorkoutSession.activeTimer?.mode === 'set';

                        const isThisResting =
                          liveWorkoutSession.activeTimer?.exId === currentEx.id &&
                          liveWorkoutSession.activeTimer?.setIdx === idx &&
                          liveWorkoutSession.activeTimer?.mode === 'rest';

                        return (
                          <div
                            key={set.id || idx}
                            className={`live-set-item ${set.done ? 'set-completed' : ''} ${
                              isThisActiveSet ? 'set-timing' : ''
                            }`}
                            style={{ cursor: set.done ? 'default' : 'pointer' }}
                            onClick={() => {
                              if (!set.done) handleStartSet(currentEx.id, idx);
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <span className="set-number-tag">SET {idx + 1}</span>
                              <div className="set-metrics-info">
                                <span>{set.reps || 10} Reps</span>
                                <span>•</span>
                                <span>{set.weight || 20} kg</span>
                              </div>
                            </div>

                            <div>
                              {set.done ? (
                                <span className="set-action-trigger" style={{ color: '#10b981', cursor: 'default' }}>
                                  <Check width={14} height={14} /> Done
                                </span>
                              ) : isThisActiveSet ? (
                                <span className="set-action-trigger" style={{ color: '#ff5e1a' }}>
                                  <Bolt width={13} height={13} /> Active ({liveWorkoutSession.activeTimer.secondsLeft}s)
                                </span>
                              ) : isThisResting ? (
                                <span className="set-action-trigger" style={{ color: '#ff5e1a' }}>
                                  Resting ({liveWorkoutSession.activeTimer.secondsLeft}s)
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartSet(currentEx.id, idx);
                                  }}
                                >
                                  <Play width={12} height={12} /> Start
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bottom Footer Stepper & Next/Finish Bar */}
            <div className="live-workout-footer-bar">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={liveWorkoutSession.currentExIdx === 0}
                onClick={() => {
                  setLiveWorkoutSession((prev) => ({
                    ...prev,
                    currentExIdx: Math.max(0, prev.currentExIdx - 1),
                  }));
                }}
              >
                <ArrowLeft width={16} height={16} /> Previous Move
              </button>

              <div className="live-stepper-dots">
                {liveWorkoutSession.exercises.map((ex, idx) => {
                  const s = liveWorkoutSession.setsMap[ex.id] || [];
                  const isDone = s.length > 0 && s.every((item) => item.done);
                  const isCurrent = idx === liveWorkoutSession.currentExIdx;

                  return (
                    <span
                      key={ex.id || idx}
                      className={`live-step-dot ${isCurrent ? 'active' : ''} ${
                        isDone ? 'completed' : ''
                      }`}
                      onClick={() => {
                        setLiveWorkoutSession((prev) => ({ ...prev, currentExIdx: idx }));
                      }}
                      title={ex.name}
                    />
                  );
                })}
              </div>

              {liveWorkoutSession.currentExIdx === liveWorkoutSession.exercises.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    boxShadow: '0 0 25px rgba(255, 94, 26, 0.5)',
                    padding: '12px 28px',
                    fontWeight: 900,
                  }}
                  onClick={handleFinishWorkout}
                >
                  <Trophy width={18} height={18} /> Finish Workout
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setLiveWorkoutSession((prev) => ({
                      ...prev,
                      currentExIdx: Math.min(prev.exercises.length - 1, prev.currentExIdx + 1),
                    }));
                  }}
                >
                  <span>Next Move</span>
                  <ChevronRight width={16} height={16} />
                </button>
              )}
            </div>
          </div>
        ) : selectedPlan ? (
          /* ============================================================
             VIEW 2: PLAN DETAIL & INTERACTIVE CALENDAR VIEW
             ============================================================ */
          <div className="plan-detail-view">
            {/* Back Navigation Bar */}
            <div className="plan-detail-nav">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSelectedPlan(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <ArrowLeft width={16} height={16} /> Back to All Plans
              </button>
              <div className="plan-detail-badge-group">
                <span className="plan-duration-badge highlight">
                  {selectedPlan.weeks} WEEKS PROGRAM
                </span>
              </div>
            </div>

            {/* Plan Hero Banner with High-Resolution Athlete Image */}
            <div className="plan-hero-banner">
              <div
                className="plan-hero-backdrop"
                style={{
                  backgroundImage: `linear-gradient(90deg, rgba(14, 14, 16, 0.95) 0%, rgba(14, 14, 16, 0.85) 45%, rgba(14, 14, 16, 0.4) 100%), url(${asset(selectedPlan.image)})`,
                }}
              />
              <div className="plan-hero-content">
                <h1 className="plan-hero-title">{selectedPlan.name}</h1>
                <p className="plan-hero-desc">{selectedPlan.description}</p>
              </div>
            </div>

            {/* ============================================================
                INTERACTIVE TRAINING CALENDAR SCHEDULE
                ============================================================ */}
            <div className="plan-schedule-section">
              <div className="schedule-header">
                <div>
                  <h3 className="schedule-heading">Weekly Interactive Training Calendar</h3>
                  <p className="schedule-sub">
                    Click any day to review previous workouts, check completed sessions, or make up skipped days.
                  </p>
                </div>

                {/* SINGLE Prominent Start Workout Action Button */}
                {!currentDayRoutine?.isRest && (
                  <div className="schedule-single-action">
                    <button
                      type="button"
                      className={`btn ${isActiveDayCompleted ? 'btn-outline' : 'btn-primary'} plan-main-action-btn`}
                      onClick={handleStartWorkout}
                    >
                      {isActiveDayCompleted ? (
                        <>
                          <Check width={17} height={17} style={{ color: '#10b981' }} />
                          <span>Completed Today (Restart Session)</span>
                        </>
                      ) : (
                        <>
                          <Play width={17} height={17} />
                          <span>Start Workout</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Interactive Calendar Days Strip (Monday to Sunday) */}
              <div className="day-pills-row calendar-strip">
                {weekDays.map((dayItem) => {
                  const scheduleConfig = selectedPlan.schedule.find((s) => s.day === dayItem.dayName);
                  const isRestDay = scheduleConfig?.isRest;
                  const workoutCount = getDayWorkoutCount(dayItem.dateKey);
                  const isDone = workoutCount > 0;
                  const isMissed = dayItem.isPast && !isDone && !isRestDay;
                  const isSelected = activeDateKey === dayItem.dateKey;

                  return (
                    <button
                      key={dayItem.dateKey}
                      type="button"
                      className={`day-pill-btn calendar-day-btn ${isSelected ? 'active' : ''} ${
                        isDone ? 'day-status-done' : ''
                      } ${isMissed ? 'day-status-missed' : ''} ${isRestDay ? 'day-status-rest' : ''}`}
                      onClick={() => setActiveDateKey(dayItem.dateKey)}
                      aria-label={`${dayItem.dayName} ${dayItem.dateNumber}`}
                    >
                      <div className="calendar-date-header">
                        <span className="day-abbr">{dayItem.abbr}</span>
                        <span className="day-calendar-num">{dayItem.dateNumber}</span>
                      </div>

                      {/* Day Status Indicator: 1 or 2 Solid Glowing Orange Dots */}
                      <div className="calendar-status-wrap">
                        {workoutCount > 0 ? (
                          <div
                            className="cal-dot-container"
                            title={`${workoutCount} workout${workoutCount > 1 ? 's' : ''} completed today`}
                          >
                            <span className="cal-dot-orange" />
                            {workoutCount >= 2 && <span className="cal-dot-orange" />}
                          </div>
                        ) : isMissed ? (
                          <span className="cal-status-badge badge-skipped">Skipped</span>
                        ) : isRestDay ? (
                          <span className="cal-status-badge badge-rest">Rest</span>
                        ) : dayItem.isToday ? (
                          <span className="cal-status-badge badge-today">Today</span>
                        ) : (
                          <span className="cal-status-badge badge-upcoming">
                            {scheduleConfig?.exerciseIds?.length || 5} Moves
                          </span>
                        )}
                      </div>

                      {isSelected && <motion.span className="day-pill-glow" layoutId="dayGlow" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Day Detail Banner with History Status */}
              <div className={`active-day-banner ${isActiveDayCompleted ? 'banner-completed' : ''}`}>
                <div className="active-day-info">
                  <div className="active-day-topline">
                    <span className="active-day-name">
                      {activeCalendarDay.dayName}, {activeCalendarDay.monthName} {activeCalendarDay.dateNumber}
                    </span>
                    {isActiveDayCompleted && (
                      <span className="completed-tag-pill">
                        <span className="cal-dot-orange sm" /> Completed
                      </span>
                    )}
                    {activeCalendarDay.isPast && !isActiveDayCompleted && !currentDayRoutine?.isRest && (
                      <span className="skipped-tag-pill">Skipped</span>
                    )}
                    {currentDayRoutine?.isRest && (
                      <span className="rest-tag-pill">Rest Day</span>
                    )}
                  </div>
                  <h4 className="active-day-title">{currentDayRoutine?.title}</h4>
                  <p className="active-day-focus">{currentDayRoutine?.focus}</p>
                </div>

                {/* Single Action Button visible on mobile as well */}
                {!currentDayRoutine?.isRest && (
                  <div className="mobile-action-wrap">
                    <button
                      type="button"
                      className={`btn ${isActiveDayCompleted ? 'btn-outline' : 'btn-primary'} btn-sm`}
                      onClick={handleStartWorkout}
                    >
                      {isActiveDayCompleted ? (
                        <>
                          <Check width={14} height={14} style={{ color: '#10b981' }} />
                          <span>Replay</span>
                        </>
                      ) : (
                        <>
                          <Play width={14} height={14} />
                          <span>Start Workout</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Exercises List for the Selected Day (Enlarged and Fully Clickable) */}
              {currentDayRoutine?.isRest ? (
                <div className="rest-day-card">
                  <div className="rest-day-icon">
                    <Flame width={28} height={28} />
                  </div>
                  <h4>Active Recovery & Muscle Regeneration</h4>
                  <p>
                    No strenuous lifting scheduled for {activeCalendarDay.dayName}. Take time to hydrate,
                    consume adequate protein, and let muscular fibers repair for optimal growth.
                  </p>
                </div>
              ) : (
                <div className="plan-exercises-grid enlarged-grid">
                  {routineExercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="plan-exercise-card enlarged-card"
                      onClick={() => navigate(`/exercises/${ex.id}`)}
                      role="button"
                      tabIndex={0}
                      title={`Click to open full exercise details for ${ex.name}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(`/exercises/${ex.id}`);
                      }}
                    >
                      <div className="ex-index-badge">{idx + 1}</div>

                      {/* Large High-Res Exercise Visual Thumbnail */}
                      <div className="ex-media-wrap enlarged-media">
                        <img
                          src={asset(ex.image || `images/${ex.id}.jpg`)}
                          alt={ex.name}
                          className="ex-thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = asset('images/0001-2gPfomN.jpg');
                          }}
                        />
                      </div>

                      {/* Exercise Content & Details */}
                      <div className="ex-main-info">
                        <div className="ex-meta-tags">
                          <span className="ex-target-pill">{ex.target}</span>
                          <span className="ex-equip-pill">{ex.equipment}</span>
                        </div>
                        <h4 className="ex-title enlarged-title">{ex.name}</h4>
                        <span className="ex-volume-rec">Recommended: 4 Sets × 10-12 Reps</span>
                      </div>

                      {/* Link Indicator to View Details */}
                      <div className="ex-card-actions">
                        <div className="ex-open-indicator">
                          <span className="open-text">View details</span>
                          <ArrowUpRight width={16} height={16} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================
             VIEW 3: PLANS CATALOG OVERVIEW (SCREEN FIT & REAL IMAGES)
             ============================================================ */
          <div className="plans-catalog-view">
            {/* Top-Left Back Navigation Button */}
            <div className="catalog-top-nav">
              <button
                type="button"
                className="btn btn-ghost btn-sm catalog-back-btn"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                aria-label="Go back"
              >
                <ArrowLeft width={18} height={18} />
                <span>Back</span>
              </button>
            </div>

            {/* Header Section */}
            <div className="plans-header" style={{ marginBottom: 20 }}>
              <h1 className="dash-title" style={{ whiteSpace: 'nowrap', margin: 0, textTransform: 'uppercase' }}>TRAINING PLANS</h1>
            </div>

            {/* Active Training Program Resume Banner (Continuity where left off) */}
            {activePlan && (
              <div className="active-program-banner">
                <div className="active-program-left">
                  <div className="active-program-avatar">
                    <img
                      src={asset(activePlan.image)}
                      alt={activePlan.name}
                      onError={(e) => {
                        e.currentTarget.src = asset('images/plans/abs.jpg');
                      }}
                    />
                  </div>
                  <div>
                    <div className="active-program-tagline">
                      <Flame width={13} height={13} /> Active Training Program
                    </div>
                    <h3 className="active-program-title">{activePlan.name}</h3>
                    <div className="active-program-meta">
                      <span>Day {(activePlanData.currentDayIndex % (activePlan.schedule?.length || 7)) + 1} of {activePlan.weeks * 7}</span>
                      <span>•</span>
                      <span>{activePlan.targetMuscle}</span>
                    </div>
                  </div>
                </div>
                <div className="active-program-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedPlan(activePlan);
                      determineActiveDay(activePlan);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <Play width={16} height={16} />
                    <span>Resume Workout</span>
                  </button>
                </div>
              </div>
            )}

            {/* Category Filter Pills & Search Box */}
            <div className="plans-filter-bar">
              <div className="plans-category-pills">
                {PLAN_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`fchip ${activeCategory === cat.key ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.key)}
                  >
                    {activeCategory === cat.key && (
                      <motion.span
                        className="bg"
                        layoutId="planCatBg"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="plans-search-wrap">
                <div className="settings-search-box">
                  <Search width={18} height={18} />
                  <input
                    type="text"
                    placeholder="Search plans by muscle, name or goal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search plans"
                  />
                </div>
              </div>
            </div>

            {/* Plan Cards Grid (Full width & Responsive) */}
            <div className="plans-grid">
              {filteredPlans.map((plan) => {
                const isThisActive = activePlanData?.planId === plan.id;
                const isFollowed = Boolean(planProfiles[plan.id]);

                return (
                  <div
                    key={plan.id}
                    className="plan-card"
                    onClick={() => handleSelectPlan(plan)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSelectPlan(plan);
                    }}
                  >
                    {/* Real Image of the Athlete with exact muscle focus */}
                    <div className="plan-image-container">
                      <img
                        src={asset(plan.image)}
                        alt={plan.name}
                        className="plan-real-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = asset('images/plans/abs.jpg');
                        }}
                      />
                      <div className="plan-image-overlay" />

                      {/* Top Badges: Simple & Uncluttered */}
                      <div className="plan-card-badges">
                        <span className="plan-weeks-badge">{plan.weeks} WEEKS</span>
                        {isThisActive && (
                          <span
                            className="plan-level-tag"
                            style={{ borderColor: '#ff5e1a', color: '#ff5e1a', background: 'rgba(0, 0, 0, 0.75)' }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Plan Card Body */}
                    <div className="plan-card-body">
                      <h3 className="plan-card-title">{plan.name}</h3>
                      <p className="plan-card-tagline">{plan.tagline}</p>

                      <div className="plan-card-meta-row">
                        <span className="meta-item">
                          <Dumbbell width={14} height={14} /> {plan.frequency}
                        </span>
                        <span className="meta-item">
                          <Flame width={14} height={14} /> 5-6 moves / day
                        </span>
                      </div>

                      <div className="plan-card-footer">
                        <span className="plan-card-cta">
                          {isThisActive
                            ? 'Resume Program'
                            : isFollowed
                            ? 'Open Daily Schedule'
                            : 'Start & Personalize Plan'}{' '}
                          <ArrowUpRight width={15} height={15} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================
            PLAN ONBOARDING / PERSONALIZATION QUESTIONNAIRE MODAL
            ============================================================ */}
        <AnimatePresence>
          {onboardingPlan && (
            <motion.div
              className="plan-onboard-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="plan-onboard-card"
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
              >
                {/* Header */}
                <div className="plan-onboard-header">
                  <div>
                    <span className="plan-onboard-topline">
                      <Target width={13} height={13} /> Personalize Your Routine
                    </span>
                    <h3 className="plan-onboard-title">{onboardingPlan.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setOnboardingPlan(null)}
                    aria-label="Close"
                  >
                    <X width={18} height={18} />
                  </button>
                </div>

                {/* Progress Stepper Bar */}
                <div className="plan-onboard-stepper">
                  <span className={`onboard-step-pill ${onboardingStep >= 1 ? 'active' : ''}`} />
                  <span className={`onboard-step-pill ${onboardingStep >= 2 ? 'active' : ''}`} />
                  <span className={`onboard-step-pill ${onboardingStep >= 3 ? 'active' : ''}`} />
                </div>

                {/* Body Steps */}
                <div className="plan-onboard-body">
                  {onboardingStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <h4 className="onboard-step-heading">Step 1: Your Body Metrics</h4>
                      <p className="onboard-step-sub">
                        We calibrate lifting volume, rest periods, and progressive overload to your frame.
                      </p>

                      <div className="onboard-fields-grid">
                        <div className="field">
                          <span className="field-label">Current Weight</span>
                          <input
                            type="number"
                            className="input"
                            placeholder="70"
                            value={onboardingData.weight}
                            onChange={(e) =>
                              setOnboardingData({ ...onboardingData, weight: e.target.value })
                            }
                          />
                          <div className="onboard-unit-toggle">
                            <button
                              type="button"
                              className={`onboard-unit-btn ${
                                onboardingData.weightUnit === 'kg' ? 'active' : ''
                              }`}
                              onClick={() =>
                                setOnboardingData({ ...onboardingData, weightUnit: 'kg' })
                              }
                            >
                              KG
                            </button>
                            <button
                              type="button"
                              className={`onboard-unit-btn ${
                                onboardingData.weightUnit === 'lbs' ? 'active' : ''
                              }`}
                              onClick={() =>
                                setOnboardingData({ ...onboardingData, weightUnit: 'lbs' })
                              }
                            >
                              LBS
                            </button>
                          </div>
                        </div>

                        <div className="field">
                          <span className="field-label">Height</span>
                          <input
                            type="number"
                            className="input"
                            placeholder="175"
                            value={onboardingData.height}
                            onChange={(e) =>
                              setOnboardingData({ ...onboardingData, height: e.target.value })
                            }
                          />
                          <div className="onboard-unit-toggle">
                            <button
                              type="button"
                              className={`onboard-unit-btn ${
                                onboardingData.heightUnit === 'cm' ? 'active' : ''
                              }`}
                              onClick={() =>
                                setOnboardingData({ ...onboardingData, heightUnit: 'cm' })
                              }
                            >
                              CM
                            </button>
                            <button
                              type="button"
                              className={`onboard-unit-btn ${
                                onboardingData.heightUnit === 'ft' ? 'active' : ''
                              }`}
                              onClick={() =>
                                setOnboardingData({ ...onboardingData, heightUnit: 'ft' })
                              }
                            >
                              FT
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {onboardingStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <h4 className="onboard-step-heading">Step 2: Choose Your Training Level</h4>
                      <p className="onboard-step-sub">
                        Select your experience tier to tailor set intensity and technical difficulty.
                      </p>

                      <div className="level-cards-col">
                        {[
                          {
                            key: 'beginner',
                            title: 'Beginner',
                            desc: '0–1 years lifting · Focus on exercise mechanics & baseline hypertrophy',
                          },
                          {
                            key: 'intermediate',
                            title: 'Intermediate',
                            desc: '1–3 years lifting · Focus on progressive overload & muscle density',
                          },
                          {
                            key: 'advanced',
                            title: 'Advanced',
                            desc: '3+ years lifting · High-intensity density, volume & peak conditioning',
                          },
                        ].map((lvl) => (
                          <div
                            key={lvl.key}
                            className={`level-card-option ${
                              onboardingData.level === lvl.key ? 'selected' : ''
                            }`}
                            onClick={() =>
                              setOnboardingData({ ...onboardingData, level: lvl.key })
                            }
                          >
                            <div>
                              <h5 className="level-card-title">{lvl.title}</h5>
                              <p className="level-card-desc">{lvl.desc}</p>
                            </div>
                            <div className="level-check-indicator">
                              <Check width={13} height={13} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {onboardingStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <h4 className="onboard-step-heading">Step 3: Weekly Commitment & Focus</h4>
                      <p className="onboard-step-sub">
                        How many days can you commit each week to complete this protocol?
                      </p>

                      <div className="days-chips-row">
                        {[3, 4, 5, 6].map((days) => (
                          <div
                            key={days}
                            className={`day-chip-btn ${
                              onboardingData.daysPerWeek === days ? 'selected' : ''
                            }`}
                            onClick={() =>
                              setOnboardingData({ ...onboardingData, daysPerWeek: days })
                            }
                          >
                            {days} Days / wk
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: 20 }}>
                        <span className="field-label">Primary Focus</span>
                        <div className="days-chips-row" style={{ marginTop: 6 }}>
                          {[
                            { key: 'hypertrophy', label: 'Hypertrophy & Growth' },
                            { key: 'fat_loss', label: 'Fat Loss & Shred' },
                            { key: 'strength', label: 'Raw Strength' },
                          ].map((g) => (
                            <div
                              key={g.key}
                              className={`day-chip-btn ${
                                onboardingData.primaryGoal === g.key ? 'selected' : ''
                              }`}
                              style={{ fontSize: 12, padding: '10px 8px' }}
                              onClick={() =>
                                setOnboardingData({ ...onboardingData, primaryGoal: g.key })
                              }
                            >
                              {g.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="plan-onboard-footer">
                  {onboardingStep > 1 ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setOnboardingStep((s) => s - 1)}
                    >
                      <ArrowLeft width={15} height={15} /> Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {onboardingStep < 3 ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setOnboardingStep((s) => s + 1)}
                    >
                      Continue <ChevronRight width={15} height={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleCompleteOnboarding}
                      style={{ boxShadow: '0 0 20px rgba(255, 94, 26, 0.4)' }}
                    >
                      <Bolt width={15} height={15} /> Start {onboardingPlan.name}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
