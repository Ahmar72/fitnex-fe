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
  Settings,
  Arrow,
} from '../components/Icons.jsx';
import { PLANS, PLAN_CATEGORIES } from '../lib/plansData.js';
import { getProgressionForWeek, getSetDurationForDay } from '../lib/progressionEngine.js';
import { asset, dayKey, readLS, writeLS, playChimeSound, playWhistleSound, speakVoice, getExerciseVoiceOverview, partMeta } from '../lib/utils.js';
import WorkoutCompleteModal from '../components/WorkoutCompleteModal.jsx';

const ease = [0.22, 1, 0.36, 1];

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

function buildScheduleForFrequency(baseSchedule = [], targetDays = 4) {
  const daysNum = Math.min(6, Math.max(2, Number(targetDays) || 4));
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const activeDayIndicesByFreq = {
    2: [0, 3],             // Mon, Thu
    3: [0, 2, 4],          // Mon, Wed, Fri
    4: [0, 1, 3, 4],       // Mon, Tue, Thu, Fri
    5: [0, 1, 2, 4, 5],    // Mon, Tue, Wed, Fri, Sat
    6: [0, 1, 2, 3, 4, 5], // Mon, Tue, Wed, Thu, Fri, Sat
  };

  const activeIndices = new Set(activeDayIndicesByFreq[daysNum] || [0, 1, 3, 4]);
  const workoutTemplates = (baseSchedule || []).filter((s) => !s.isRest && s.exerciseIds?.length > 0);
  if (!workoutTemplates.length) return baseSchedule;

  let workoutIdx = 0;
  return dayNames.map((name, i) => {
    if (activeIndices.has(i)) {
      const template = workoutTemplates[workoutIdx % workoutTemplates.length];
      workoutIdx++;
      return {
        ...template,
        day: name,
        isRest: false,
      };
    } else {
      return {
        day: name,
        title: 'Rest & Recovery Day',
        focus: 'Active recovery, hydration and muscle repair',
        isRest: true,
        exerciseIds: [],
      };
    }
  });
}

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

  const resolvePlanWithFrequency = useCallback((basePlan, days) => {
    if (!basePlan) return null;
    const freq = Number(days) || basePlan.daysPerWeek || 3;
    const originalPlan = PLANS.find((p) => p.id === basePlan.id) || basePlan;
    const adapted = buildScheduleForFrequency(originalPlan.schedule, freq);
    return {
      ...originalPlan,
      daysPerWeek: freq,
      frequency: `${freq} Days / Week`,
      schedule: adapted,
    };
  }, []);

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

  // Plan Activation Modal state (streamlined days/week selector, no body metric re-asking)
  const [activatingPlan, setActivatingPlan] = useState(null);
  const [activationDays, setActivationDays] = useState(3);
  // Edit Plan modal state (Option 1: Edit days/week, Option 2: End plan)
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editDaysPerWeek, setEditDaysPerWeek] = useState(3);
  // Confirmation modal before ending active plan
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // Selected week inside multi-week plan view (1 to selectedPlan.weeks)
  const [selectedWeek, setSelectedWeek] = useState(1);
  // Selected day index inside the chosen week (0 to 6, corresponding to Mon..Sun)
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  // Dedicated Guided Live Workout Session state
  const [liveWorkoutSession, setLiveWorkoutSession] = useState(null);
  // Full-screen dedicated workout completion summary state
  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState(null);
  const [planCompleteModalData, setPlanCompleteModalData] = useState(null);

  // Active program object resolved from activePlanData
  const activePlan = useMemo(() => {
    if (!activePlanData?.planId) return null;
    const p = PLANS.find((p) => p.id === activePlanData.planId);
    if (!p) return null;
    return resolvePlanWithFrequency(p, activePlanData.daysPerWeek || 3);
  }, [activePlanData, resolvePlanWithFrequency]);

  // Active calendar day object
  const activeCalendarDay = useMemo(() => {
    return weekDays.find((d) => d.dateKey === activeDateKey) || todayCalendarDay;
  }, [weekDays, activeDateKey, todayCalendarDay]);

  // Current day's routine from the selected plan schedule
  const currentDayRoutine = useMemo(() => {
    if (!selectedPlan?.schedule?.length) return null;
    return selectedPlan.schedule[selectedDayIdx] || selectedPlan.schedule[0];
  }, [selectedPlan, selectedDayIdx]);

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

  // Select plan handler: if already active, open detail; otherwise open clean activation modal
  const handleSelectPlan = (plan) => {
    const userDays = activePlanData?.planId === plan.id
      ? (activePlanData.daysPerWeek || 3)
      : (planProfiles[plan.id]?.daysPerWeek || user?.profile?.days || plan.daysPerWeek || 3);

    const resolved = resolvePlanWithFrequency(plan, userDays);

    if (activePlanData?.planId === plan.id) {
      const progDay = activePlanData.currentDayIndex || 0;
      setSelectedWeek(Math.min(plan.weeks, Math.floor(progDay / 7) + 1));
      setSelectedDayIdx(progDay % 7);
      setSelectedPlan(resolved);
      determineActiveDay(resolved);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const initialDays = userDays;
    setActivationDays(initialDays);
    setActivatingPlan(resolved);
  };

  // Activate program with chosen days per week
  const handleActivatePlan = (plan, days = activationDays) => {
    if (!plan) return;

    const newActivePlan = {
      planId: plan.id,
      planName: plan.name,
      daysPerWeek: Number(days),
      startedAt: Date.now(),
      currentDayIndex: 0,
      lastWorkoutDate: null,
      completedDates: [],
    };
    setActivePlanData(newActivePlan);
    writeLS('fx:active-plan-data', newActivePlan);

    const updatedProfiles = {
      ...planProfiles,
      [plan.id]: {
        daysPerWeek: Number(days),
        activatedAt: Date.now(),
      },
    };
    setPlanProfiles(updatedProfiles);
    writeLS('fx:plan-profiles', updatedProfiles);

    const resolved = resolvePlanWithFrequency(plan, days);
    toast(`${plan.name} is now active! (${days} days / week)`, 'bolt');
    setActivatingPlan(null);
    setSelectedWeek(1);
    setSelectedDayIdx(0);
    setSelectedPlan(resolved);
    determineActiveDay(resolved);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // End or cancel active training program
  const handleCancelPlan = () => {
    setActivePlanData(null);
    writeLS('fx:active-plan-data', null);
    setShowCancelConfirm(false);
    toast('Training program ended.', 'info');
  };

  // Open Edit Plan modal (allowing user to change frequency or end plan)
  const handleOpenEditPlan = (plan) => {
    const currentDays = activePlanData?.daysPerWeek || plan?.daysPerWeek || user?.profile?.days || 3;
    setEditDaysPerWeek(currentDays);
    setShowEditPlanModal(true);
  };

  // Save updated training days per week from Edit Plan modal
  const handleSaveEditDays = () => {
    const daysNum = Number(editDaysPerWeek);
    if (activePlanData) {
      const updated = {
        ...activePlanData,
        daysPerWeek: daysNum,
      };
      setActivePlanData(updated);
      writeLS('fx:active-plan-data', updated);
    }
    const targetPlan = selectedPlan || activePlan;
    if (targetPlan) {
      const updatedProfiles = {
        ...planProfiles,
        [targetPlan.id]: {
          ...(planProfiles[targetPlan.id] || {}),
          daysPerWeek: daysNum,
        },
      };
      setPlanProfiles(updatedProfiles);
      writeLS('fx:plan-profiles', updatedProfiles);

      const refreshed = resolvePlanWithFrequency(targetPlan, daysNum);
      setSelectedPlan(refreshed);
    }
    if (user && updateUser) {
      updateUser({ profile: { ...(user.profile || {}), days: daysNum } });
    }
    setShowEditPlanModal(false);
    toast(`Training frequency updated to ${daysNum} days/week.`, 'success');
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

    if (routineExercises[0]) {
      lastAnnouncedPlanExIdRef.current = routineExercises[0].id;
      speakVoice(getExerciseVoiceOverview(routineExercises[0]), { rate: 0.96, pitch: 1.02, interrupt: true });
    }

    const restDuration = Number(user?.profile?.rest || readLS('fx:rest-timer', 60)) || 60;
    const weekProg = getProgressionForWeek(selectedWeek);

    const initialSets = {};
    routineExercises.forEach((ex) => {
      const baseWeight = ex.equipment === 'body weight' ? 0 : 20;
      const weight = baseWeight > 0 ? baseWeight + weekProg.bonusWeight : 0;
      initialSets[ex.id] = Array.from({ length: weekProg.sets }, (_, sIdx) => ({
        id: sIdx + 1,
        reps: weekProg.reps,
        weight,
        done: false,
      }));
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

  // Voice guide: state name first and 1-2 sentence overview when starting or switching exercise in plans
  const lastAnnouncedPlanExIdRef = useRef(null);
  const liveWorkoutSessionRef = useRef(liveWorkoutSession);
  liveWorkoutSessionRef.current = liveWorkoutSession;
  const completedPlanSetVoiceRef = useRef(null);
  useEffect(() => {
    if (!liveWorkoutSession) {
      lastAnnouncedPlanExIdRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    const curEx = liveWorkoutSession.exercises?.[liveWorkoutSession.currentExIdx];
    if (!curEx || !curEx.id) return;
    if (lastAnnouncedPlanExIdRef.current === curEx.id) return;
    lastAnnouncedPlanExIdRef.current = curEx.id;

    speakVoice(getExerciseVoiceOverview(curEx), { rate: 0.96, pitch: 1.02, interrupt: true });
  }, [liveWorkoutSession?.currentExIdx, Boolean(liveWorkoutSession)]);

  // Countdown timer effect:
  // 1. SET mode: runs for set work duration. When finished, marks set DONE and AUTOMATICALLY starts REST timer!
  // 2. REST mode: counts down rest duration. When finished, clears timer and notifies ready for next set!
  useEffect(() => {
    if (!liveWorkoutSession?.activeTimer?.isRunning) return;

    const interval = setInterval(() => {
      const session = liveWorkoutSessionRef.current;
      if (!session?.activeTimer?.isRunning) return;

      const curTimer = session.activeTimer;
      const nextLeft = curTimer.secondsLeft - 1;

      // Check halfway mark for SET mode and announce "Halfway there" at exact half time
      let nextHalfway = curTimer.halfwayAnnounced;
      if (curTimer.mode === 'set' && !curTimer.halfwayAnnounced) {
        const halfPoint = Math.floor(curTimer.totalSeconds / 2);
        if (nextLeft <= halfPoint) {
          speakVoice('Halfway there', { rate: 1.05, interrupt: true });
          nextHalfway = true;
        }
      }

      // Voice countdown for the last 3 seconds of a set: 3, 2, 1
      if (curTimer.mode === 'set') {
        if (nextLeft === 3) {
          speakVoice('Three', { rate: 1.18, interrupt: true });
        } else if (nextLeft === 2) {
          speakVoice('Two', { rate: 1.18, interrupt: true });
        } else if (nextLeft === 1) {
          speakVoice('One', { rate: 1.18, interrupt: true });
        }
      }

      if (nextLeft <= 0) {
        const { mode, exId, setIdx } = curTimer;

        if (mode === 'set') {
          // Set completed! Guard so it speaks "Done" and rest cue only once
          const setKey = `${exId}-${setIdx}`;
          if (completedPlanSetVoiceRef.current !== setKey) {
            completedPlanSetVoiceRef.current = setKey;
            speakVoice('Done. Take rest and get ready for the next set.', { rate: 1.02, interrupt: true });
          }

          // Set completed! Mark DONE automatically!
          const currentSets = session.setsMap[exId] || [];
          const updatedSets = currentSets.map((s, idx) => (idx === setIdx ? { ...s, done: true } : s));

          // AUTOMATICALLY start REST TIMER!
          const restDuration = session.restDuration || 60;
          playChimeSound();

          setLiveWorkoutSession((prev) => {
            if (!prev) return prev;
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
                halfwayAnnounced: false,
              },
            };
          });
        } else {
          // Rest timer finished! Clear timer and signal ready for next set
          playChimeSound();
          setLiveWorkoutSession((prev) => (prev ? { ...prev, activeTimer: null } : prev));
        }
      } else {
        setLiveWorkoutSession((prev) => {
          if (!prev?.activeTimer) return prev;
          return {
            ...prev,
            activeTimer: {
              ...prev.activeTimer,
              secondsLeft: nextLeft,
              halfwayAnnounced: nextHalfway,
            },
          };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [liveWorkoutSession?.activeTimer?.isRunning]);

  // Update set reps or weight directly in the table
  const updatePlanSet = (exId, setIdx, field, value) => {
    setLiveWorkoutSession((prev) => {
      if (!prev) return prev;
      const oldSets = prev.setsMap[exId] || [];
      const newSets = oldSets.map((s, idx) => (idx === setIdx ? { ...s, [field]: value } : s));
      return {
        ...prev,
        setsMap: {
          ...prev.setsMap,
          [exId]: newSets,
        },
      };
    });
  };

  // Click on "Start" for a set: starts the SET DURATION timer (not rest).
  // Once a set is completed, it cannot be edited or restarted.
  const handleStartSet = (exId, setIdx) => {
    if (!liveWorkoutSession) return;
    const currentSets = liveWorkoutSession.setsMap[exId] || [];
    const thisSet = currentSets[setIdx];

    // If already done, it CANNOT be edited or restarted
    if (thisSet?.done) return;

    // Blow marathon sports whistle
    playWhistleSound();

    // Set duration countdown: 40s base + 5s per day progression
    const SET_DURATION = getSetDurationForDay(selectedDayIdx);
    setLiveWorkoutSession((prev) => ({
      ...prev,
      activeTimer: {
        mode: 'set',
        exId,
        setIdx,
        secondsLeft: SET_DURATION,
        totalSeconds: SET_DURATION,
        isRunning: true,
        halfwayAnnounced: false,
      },
    }));
    toast(`Set ${setIdx + 1} started! Timer is tracking your set duration.`, 'bolt');
  };

  // Complete set early and immediately start the automatic rest timer
  const handleCompleteSetEarly = () => {
    if (!liveWorkoutSession?.activeTimer || liveWorkoutSession.activeTimer.mode !== 'set') return;
    const { exId, setIdx } = liveWorkoutSession.activeTimer;
    const setKey = `${exId}-${setIdx}`;
    if (completedPlanSetVoiceRef.current !== setKey) {
      completedPlanSetVoiceRef.current = setKey;
      speakVoice('Done. Take rest and get ready for the next set.', { rate: 1.02, interrupt: true });
    }
    const currentSets = liveWorkoutSession.setsMap[exId] || [];
    const updatedSets = currentSets.map((s, idx) => (idx === setIdx ? { ...s, done: true } : s));
    const restDuration = liveWorkoutSession.restDuration || 60;
    playChimeSound();

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

    // Enforce that user completes at least one set of each exercise
    const unfinishedExercise = exercises.find((ex) => {
      const s = setsMap[ex.id] || [];
      return !s.some((item) => item.done);
    });
    if (unfinishedExercise) {
      toast(`Please complete at least one set of each exercise before finishing (missing: ${unfinishedExercise.name})`, 'info');
      return;
    }

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
    let totalVolume = 0;
    exercises.forEach((ex) => {
      const sets = setsMap[ex.id] || [];
      sets.forEach((set) => {
        if (set.done) {
          const wt = Number(set.weight);
          if (!isNaN(wt) && wt > 0) {
            totalVolume += wt;
          }
        }
      });
    });

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

      // Also sync registration plan progress if matching
      const registeredPlanId = user?.profile?.registeredPlanId || (user?.profile?.goal === 'fat' ? 'weight-loss' : user?.profile?.goal === 'fit' ? 'abs-building' : user?.profile?.goal === 'strength' ? 'boulder-shoulders' : 'muscle-building');
      if (plan.id === registeredPlanId) {
        const prevReg = readLS('fx:registered-plan-progress', null) || {};
        const regIdx = (prevReg.currentDayIndex || 0) + 1;
        const regObj = {
          ...prevReg,
          planId: plan.id,
          currentDayIndex: regIdx,
          lastWorkoutDate: dateKey,
          completedDates: [...new Set([...(prevReg.completedDates || []), dateKey])],
        };
        writeLS('fx:registered-plan-progress', regObj);
        writeLS(`fx:reg-plan-progress:${plan.id}`, regObj);
      }

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
        setHistory((prev) => [logEntry, ...(prev || [])].slice(0, 500));
      }
      const prefix = `fx:${user?.id || 'guest'}:`;
      const currentH = readLS(prefix + 'history', []);
      writeLS(prefix + 'history', [logEntry, ...currentH].slice(0, 500));
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

    const completedExercises = exerciseBreakdown.filter((e) => e.completedSets > 0);
    const effectiveExercises = completedExercises.length > 0 ? completedExercises : exercises;
    const trainedMuscles = [...new Set(effectiveExercises.map((e) => e.bodyPart).filter(Boolean))];
    const trainedTargets = [...new Set(effectiveExercises.map((e) => e.target).filter(Boolean))];

    setPlanCompleteModalData({
      durationSecs: finalElapsedSeconds,
      durationMinutes: Math.max(1, Math.round(finalElapsedSeconds / 60)),
      volume: totalVolume,
      setsCount: totalSetsDone,
      workSetsCount: totalSetsDone,
      caloriesBurned: burnedCalories,
      trainedMuscles,
      trainedTargets,
      routineName: `${plan.name} (${dayName})`,
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
              <span className="summary-plan-badge">{completedWorkoutSummary?.plan?.name || 'Training Plan'}</span>
            </div>

            {/* Hero Success Celebration Card */}
            <div className="summary-hero-card">
              <div className="summary-trophy-ring">
                <Trophy width={22} height={22} />
              </div>
              <span className="summary-eyebrow">Session Completed</span>
              <h2 className="summary-title">{completedWorkoutSummary.routineTitle}</h2>
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
          (() => {
            const currentEx = liveWorkoutSession.exercises[liveWorkoutSession.currentExIdx];
            if (!currentEx) return null;
            const sets = liveWorkoutSession.setsMap[currentEx.id] || [];
            const isBodyweight = currentEx?.equipment && /body\s*weight/i.test(currentEx.equipment);
            const allSets = Object.values(liveWorkoutSession.setsMap).flat();
            const doneCount = allSets.filter((s) => s.done).length;

            return (
              <motion.div
                className="live"
                data-lenis-prevent
                initial={{ clipPath: 'inset(100% 0 0 0)' }}
                animate={{ clipPath: 'inset(0% 0 0 0)' }}
                exit={{ clipPath: 'inset(0 0 100% 0)' }}
                transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
              >
                <div className="live-media paper">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentEx.id}
                      src={asset(currentEx.gif || currentEx.image)}
                      alt={currentEx.name}
                      initial={{ opacity: 0, scale: 0.85, x: 60 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: -60 }}
                      transition={{ duration: 0.6, ease }}
                      onError={(e) => {
                        e.currentTarget.src = asset(currentEx.image || 'images/0001-2gPfomN.jpg');
                      }}
                    />
                  </AnimatePresence>
                </div>

                <div className="live-panel">
                  <div className="live-top">
                    <span className="eyebrow">
                      {liveWorkoutSession.plan.name} · {liveWorkoutSession.currentExIdx + 1} / {liveWorkoutSession.exercises.length}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => {
                        if (window.confirm('Exit live workout? Your completed sets will be preserved.')) {
                          setLiveWorkoutSession(null);
                        }
                      }}
                      aria-label="Close workout"
                    >
                      <X />
                    </button>
                  </div>

                  <div className="live-progress">
                    <span style={{ width: `${(doneCount / Math.max(1, allSets.length)) * 100}%` }} />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentEx.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, ease }}
                    >
                      <h2
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          margin: '4px 0 2px',
                          lineHeight: 1.25,
                          letterSpacing: '-0.01em',
                          color: 'var(--text)',
                        }}
                      >
                        {currentEx.name}
                      </h2>
                      <p
                        className="muted"
                        style={{
                          margin: '4px 0 2px',
                          textTransform: 'capitalize',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {currentEx.target} · {currentEx.equipment}
                      </p>
                      <p
                        className="muted"
                        style={{
                          fontSize: '12px',
                          margin: '2px 0 8px',
                          lineHeight: 1.4,
                        }}
                      >
                        {currentEx.steps?.[0] || 'Execute with steady cadence, full extension and strict contraction on every rep.'}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="sets">
                    <div
                      className="sets-header-row"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '46px 1fr 1fr 100px',
                        gap: 10,
                        padding: '0 8px 6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--muted)',
                      }}
                    >
                      <span style={{ textAlign: 'center' }}>Set</span>
                      <span style={{ textAlign: 'center' }}>Kg</span>
                      <span style={{ textAlign: 'center' }}>Reps</span>
                      <span></span>
                    </div>
                    {sets.map((s, i) => {
                      const isSetTimerActive =
                        liveWorkoutSession.activeTimer?.mode === 'set' &&
                        liveWorkoutSession.activeTimer?.exId === currentEx.id &&
                        liveWorkoutSession.activeTimer?.setIdx === i;

                      const isRestActive =
                        liveWorkoutSession.activeTimer?.mode === 'rest' &&
                        liveWorkoutSession.activeTimer?.exId === currentEx.id &&
                        liveWorkoutSession.activeTimer?.setIdx === i;

                      return (
                        <div
                          key={s.id || i}
                          className={`set-row ${s.done ? 'done' : ''}`}
                          style={{ gridTemplateColumns: '46px 1fr 1fr 100px' }}
                        >
                          <span className="n">{i + 1}</span>
                          <input
                            className={`num-input ${isBodyweight && (!s.weight || Number(s.weight) === 0) ? 'bw-input' : ''}`}
                            type="text"
                            value={isBodyweight && (!s.weight || Number(s.weight) === 0) ? 'Bodyweight' : s.weight}
                            disabled={s.done}
                            onFocus={(e) => {
                              if (isBodyweight && (!s.weight || Number(s.weight) === 0)) {
                                e.target.select();
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              updatePlanSet(currentEx.id, i, 'weight', val);
                            }}
                            onBlur={(e) => {
                              if (isBodyweight && (!e.target.value || Number(e.target.value) === 0)) {
                                updatePlanSet(currentEx.id, i, 'weight', '');
                              }
                            }}
                            aria-label="Weight"
                          />
                          <input
                            className="num-input"
                            type="number"
                            value={s.reps}
                            disabled={s.done}
                            onChange={(e) => updatePlanSet(currentEx.id, i, 'reps', e.target.value)}
                            aria-label="Reps"
                          />
                          {s.done ? (
                            <span className="builder-set-done-badge" title="Set completed (locked)">
                              <Check width={14} height={14} /> Done
                            </span>
                          ) : isSetTimerActive ? (
                            <span className="builder-set-active-badge" title="Set timer counting down">
                              <span className="pulse-dot" /> {liveWorkoutSession.activeTimer.secondsLeft}s
                            </span>
                          ) : isRestActive ? (
                            <span className="builder-set-rest-badge" title="Rest in progress">
                              Rest {liveWorkoutSession.activeTimer.secondsLeft}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="builder-set-start-btn"
                              onClick={() => handleStartSet(currentEx.id, i)}
                              aria-label={`Start set ${i + 1}`}
                            >
                              <Play width={12} height={12} /> Start
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {liveWorkoutSession.activeTimer && liveWorkoutSession.activeTimer.exId === currentEx.id && (
                      <motion.div
                        className="live-active-timer-box"
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="timer-info-col">
                          <span className="timer-clean-label">
                            {liveWorkoutSession.activeTimer.mode === 'set'
                              ? `Set ${liveWorkoutSession.activeTimer.setIdx + 1}`
                              : 'Rest Timer'}
                          </span>
                          <div className="timer-clean-digits">
                            {Math.floor(liveWorkoutSession.activeTimer.secondsLeft / 60)}:
                            {String(liveWorkoutSession.activeTimer.secondsLeft % 60).padStart(2, '0')}
                          </div>
                        </div>

                        <div className="timer-actions">
                          {liveWorkoutSession.activeTimer.mode === 'set' ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={handleCompleteSetEarly}
                              title="Complete set now and start rest timer"
                            >
                              <Check width={14} height={14} /> Done set & Rest
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={skipRestTimer}
                              title="Skip remaining rest"
                            >
                              Skip rest
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={toggleTimerPause}
                          >
                            {liveWorkoutSession.activeTimer.isRunning ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => adjustTimer(15)}
                          >
                            +15s
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="live-nav">
                    {liveWorkoutSession.currentExIdx > 0 ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          const prevIdx = Math.max(0, liveWorkoutSession.currentExIdx - 1);
                          const prevEx = liveWorkoutSession.exercises[prevIdx];
                          if (prevEx) {
                            speakVoice(getExerciseVoiceOverview(prevEx), { rate: 0.96, pitch: 1.02, interrupt: true });
                          }
                          setLiveWorkoutSession((prev) => ({
                            ...prev,
                            currentExIdx: prevIdx,
                          }));
                        }}
                      >
                        ← Previous
                      </button>
                    ) : (
                      <div />
                    )}

                    {liveWorkoutSession.currentExIdx < liveWorkoutSession.exercises.length - 1 ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          const nextIdx = Math.min(
                            liveWorkoutSession.exercises.length - 1,
                            liveWorkoutSession.currentExIdx + 1
                          );
                          const nextEx = liveWorkoutSession.exercises[nextIdx];
                          if (nextEx) {
                            speakVoice(getExerciseVoiceOverview(nextEx), { rate: 0.96, pitch: 1.02, interrupt: true });
                          }
                          setLiveWorkoutSession((prev) => ({
                            ...prev,
                            currentExIdx: nextIdx,
                          }));
                        }}
                      >
                        Next exercise → <Arrow />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleFinishWorkout}
                      >
                        <Check width={15} height={15} /> Finish & log
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()
        ) : selectedPlan ? (
          /* ============================================================
             VIEW 2: PLAN DETAIL & INTERACTIVE CALENDAR VIEW
             ============================================================ */
          <div className="plan-detail-view">
            {/* Back Navigation Bar */}
            <div className="plan-detail-nav">
              <button
                type="button"
                className="nav-back-pill"
                onClick={() => {
                  setSelectedPlan(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <ArrowLeft width={15} height={15} /> Back to All Plans
              </button>
              <div className="plan-detail-badge-group">
                {activePlanData?.planId === selectedPlan.id ? (
                  <button
                    type="button"
                    className="plan-edit-btn"
                    onClick={() => handleOpenEditPlan(selectedPlan)}
                    title="Edit training frequency or end plan"
                  >
                    <Settings width={14} height={14} />
                    <span>Edit Plan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{
                      height: 32,
                      padding: '0 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onClick={() => {
                      setActivationDays(user?.profile?.days || selectedPlan.frequency || 3);
                      setActivatingPlan(selectedPlan);
                    }}
                  >
                    <Bolt width={13} height={13} />
                    <span>Activate Plan</span>
                  </button>
                )}
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
                INTERACTIVE TRAINING CALENDAR SCHEDULE (Multi-Week Plan Progression)
                ============================================================ */}
            <div className="plan-schedule-section">
              <div className="schedule-header">
                <div>
                  <h3 className="schedule-heading">Training Schedule & Calendar</h3>
                  <p className="schedule-sub">
                    Structured by the weeks of your plan. Select any week and training day to inspect or start workouts.
                  </p>
                </div>

                {/* SINGLE Prominent Start Workout Action Button */}
                {!currentDayRoutine?.isRest && (
                  <div className="schedule-single-action">
                    <button
                      type="button"
                      className="btn btn-primary plan-main-action-btn"
                      onClick={handleStartWorkout}
                    >
                      <Play width={17} height={17} />
                      <span>Start Week {selectedWeek} · {currentDayRoutine.day} Workout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Multi-Week Selector Strip according to specific plan weeks */}
              <div className="plan-weeks-selector-bar">
                <div className="weeks-pills-row">
                  {Array.from({ length: selectedPlan.weeks || 6 }, (_, i) => i + 1).map((wNum) => {
                    const isSelected = selectedWeek === wNum;
                    const isCurrentProg =
                      activePlanData?.planId === selectedPlan.id &&
                      Math.floor((activePlanData.currentDayIndex || 0) / 7) + 1 === wNum;

                    return (
                      <button
                        key={wNum}
                        type="button"
                        className={`week-pill-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedWeek(wNum)}
                      >
                        <span>Week {wNum}</span>
                        {isCurrentProg && <span className="current-week-dot" title="Current Week" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Calendar Days Strip (Days of Selected Week) */}
              <div className="day-pills-row calendar-strip">
                {selectedPlan.schedule.map((scheduleConfig, dayIdx) => {
                  const dayNumInPlan = (selectedWeek - 1) * 7 + (dayIdx + 1);
                  const isRestDay = scheduleConfig.isRest;
                  const isSelected = selectedDayIdx === dayIdx;
                  const isPlanActive = activePlanData?.planId === selectedPlan.id;
                  const isDone = isPlanActive && (activePlanData.currentDayIndex || 0) > dayNumInPlan - 1;
                  const isToday = isPlanActive && (activePlanData.currentDayIndex || 0) === dayNumInPlan - 1;

                  return (
                    <button
                      key={dayIdx}
                      type="button"
                      className={`day-pill-btn calendar-day-btn ${isSelected ? 'active' : ''} ${
                        isDone ? 'day-status-done' : ''
                      } ${isRestDay ? 'day-status-rest' : ''}`}
                      onClick={() => setSelectedDayIdx(dayIdx)}
                      aria-label={`${scheduleConfig.day} Day ${dayNumInPlan}`}
                    >
                      <div className="calendar-date-header">
                        <span className="day-abbr">{scheduleConfig.day.slice(0, 3)}</span>
                        <span className="day-calendar-num">{dayNumInPlan}</span>
                      </div>

                      <div className="calendar-status-wrap">
                        {isDone ? (
                          <span className="cal-status-badge badge-done">
                            <Check width={10} height={10} /> Done
                          </span>
                        ) : isRestDay ? (
                          <span className="cal-status-badge badge-rest">Rest</span>
                        ) : isToday ? (
                          <span className="cal-status-badge badge-today">Today</span>
                        ) : (
                          <span className="cal-status-badge badge-upcoming">
                            {scheduleConfig.exerciseIds?.length || 5} Moves
                          </span>
                        )}
                      </div>

                      {isSelected && <motion.span className="day-pill-glow" layoutId="dayGlow" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Day Detail Banner with History Status */}
              <div className="active-day-banner">
                <div className="active-day-info">
                  <div className="active-day-topline">
                    <span className="active-day-name">
                      Week {selectedWeek} · Day {(selectedWeek - 1) * 7 + (selectedDayIdx + 1)} ({currentDayRoutine?.day})
                    </span>
                    {currentDayRoutine?.isRest ? (
                      <span className="rest-tag-pill">Rest & Active Recovery</span>
                    ) : (
                      <span className="completed-tag-pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        <Flame width={12} height={12} /> {currentDayRoutine?.exerciseIds?.length || 5} Exercises
                      </span>
                    )}
                  </div>
                  <h4 className="active-day-title">{currentDayRoutine?.title || currentDayRoutine?.focus}</h4>
                  <p className="active-day-focus">{currentDayRoutine?.focus}</p>
                </div>

                {/* Single Action Button visible on mobile as well */}
                {!currentDayRoutine?.isRest && (
                  <div className="mobile-action-wrap">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleStartWorkout}
                    >
                      <Play width={14} height={14} />
                      <span>Start Workout</span>
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
                      onClick={() =>
                        navigate(`/exercises/${ex.id}`, {
                          state: {
                            fromPlan: selectedPlan?.id,
                            planName: selectedPlan?.name,
                            planExerciseIds: routineExercises.map((e) => e.id),
                          },
                        })
                      }
                      role="button"
                      tabIndex={0}
                      title={`Click to open full exercise details for ${ex.name}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          navigate(`/exercises/${ex.id}`, {
                            state: {
                              fromPlan: selectedPlan?.id,
                              planName: selectedPlan?.name,
                              planExerciseIds: routineExercises.map((e) => e.id),
                            },
                          });
                        }
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
                <div className="active-program-actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="plan-edit-btn"
                    onClick={() => handleOpenEditPlan(activePlan)}
                    title="Edit training frequency or end plan"
                  >
                    <Settings width={14} height={14} />
                    <span>Edit Plan</span>
                  </button>
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
                          {isThisActive ? 'Resume Program' : 'Activate Program'}{' '}
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
            PLAN ACTIVATION MODAL: SELECT DAYS/WEEK & ACTIVATE
            ============================================================ */}
        <AnimatePresence>
          {activatingPlan && (
            <motion.div
              className="plan-onboard-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivatingPlan(null)}
            >
              <motion.div
                className="plan-onboard-card"
                style={{ maxWidth: 520 }}
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="plan-onboard-header">
                  <div>
                    <span className="plan-onboard-topline">
                      <Bolt width={13} height={13} /> Activate Training Plan
                    </span>
                    <h3 className="plan-onboard-title">{activatingPlan.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setActivatingPlan(null)}
                    aria-label="Close"
                  >
                    <X width={18} height={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="plan-onboard-body" style={{ minHeight: 'auto', padding: '22px 28px' }}>
                  {/* Plan Overview Card */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 14,
                      borderRadius: 14,
                      background: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
                      border: '1px solid var(--line)',
                      marginBottom: 20,
                    }}
                  >
                    <img
                      src={asset(activatingPlan.image)}
                      alt={activatingPlan.name}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 10,
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.currentTarget.src = asset('images/plans/abs.jpg');
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: 'var(--accent)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {activatingPlan.targetMuscle} • {activatingPlan.weeks} WEEKS
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--muted)',
                          marginTop: 4,
                          lineHeight: 1.4,
                        }}
                      >
                        {activatingPlan.description}
                      </div>
                    </div>
                  </div>

                  {/* Days / Week Selection */}
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text)',
                        marginBottom: 6,
                      }}
                    >
                      Training Days Per Week
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        margin: '0 0 14px 0',
                      }}
                    >
                      Select how many days you want to train each week:
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: 8,
                      }}
                    >
                      {[2, 3, 4, 5, 6].map((days) => (
                        <button
                          key={days}
                          type="button"
                          className="day-chip-btn"
                          style={{
                            padding: '12px 6px',
                            borderRadius: 12,
                            border: `1.5px solid ${
                              activationDays === days ? 'var(--accent)' : 'var(--line)'
                            }`,
                            background:
                              activationDays === days
                                ? 'var(--accent)'
                                : 'var(--surface-2, rgba(255, 255, 255, 0.03))',
                            color: activationDays === days ? '#ffffff' : 'var(--text)',
                            fontWeight: 800,
                            fontSize: 13,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                          }}
                          onClick={() => setActivationDays(days)}
                        >
                          <div>{days}</div>
                          <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>DAYS</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div
                  className="plan-onboard-footer"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 28px',
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--muted)' }}
                    onClick={() => {
                      const p = activatingPlan;
                      setActivatingPlan(null);
                      setSelectedPlan(p);
                      determineActiveDay(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Preview Schedule
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      padding: '10px 22px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 18px rgba(255, 94, 26, 0.4)',
                    }}
                    onClick={() => handleActivatePlan(activatingPlan, activationDays)}
                  >
                    <Play width={15} height={15} /> Activate Plan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
            EDIT PLAN MODAL (ENLARGED, ATTRACTIVE, TWO PROCESSING BUTTONS)
            ============================================================ */}
        <AnimatePresence>
          {showEditPlanModal && (
            <motion.div
              className="plan-onboard-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditPlanModal(false)}
            >
              <motion.div
                className="plan-onboard-card"
                style={{
                  maxWidth: 480,
                  width: '100%',
                  padding: '32px 28px',
                  textAlign: 'left',
                  borderRadius: 20,
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--line)',
                }}
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                  <div>
                    <h3 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
                      Edit Training Plan
                    </h3>
                    <span style={{ fontSize: 13.5, color: 'var(--accent)', fontWeight: 700 }}>
                      {selectedPlan?.name || activePlan?.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 34, height: 34, borderRadius: 10 }}
                    onClick={() => setShowEditPlanModal(false)}
                    aria-label="Close"
                  >
                    <X width={16} height={16} />
                  </button>
                </div>

                {/* Frequency selection header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Weekly Schedule</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--accent)',
                      background: 'var(--accent-soft)',
                      padding: '3px 10px',
                      borderRadius: 20,
                      border: '1px solid var(--line)',
                    }}
                  >
                    {editDaysPerWeek} Days / Week
                  </span>
                </div>

                {/* Days/Week Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
                  {[2, 3, 4, 5, 6].map((days) => {
                    const isSelected = Number(editDaysPerWeek) === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        style={{
                          height: 48,
                          borderRadius: 14,
                          fontSize: 15,
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--line)',
                          background: isSelected ? 'var(--accent)' : 'var(--surface-2)',
                          color: isSelected ? '#ffffff' : 'var(--text)',
                          boxShadow: isSelected ? '0 4px 14px rgba(255, 94, 26, 0.35)' : 'none',
                        }}
                        onClick={() => setEditDaysPerWeek(days)}
                      >
                        {days}d
                      </button>
                    );
                  })}
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
                  Calibrates your weekly calendar days, training sessions, and scheduled rest periods immediately.
                </p>

                {/* Two Processing Action Buttons Only */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      height: 46,
                      fontSize: 14.5,
                      fontWeight: 800,
                      borderRadius: 14,
                      boxShadow: '0 4px 18px rgba(255, 94, 26, 0.35)',
                    }}
                    onClick={handleSaveEditDays}
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 14,
                      color: '#ef4444',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.28)',
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.18s ease',
                    }}
                    onClick={() => {
                      setShowEditPlanModal(false);
                      setShowCancelConfirm(true);
                    }}
                  >
                    <X width={15} height={15} /> End Plan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
            CONFIRMATION MODAL: END ACTIVE PLAN
            ============================================================ */}
        <AnimatePresence>
          {showCancelConfirm && (
            <motion.div
              className="plan-onboard-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelConfirm(false)}
            >
              <motion.div
                className="plan-onboard-card"
                style={{ maxWidth: 420, padding: '28px 24px', alignItems: 'center', textAlign: 'center' }}
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <X width={24} height={24} />
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
                  End Training Program?
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 22px' }}>
                  Are you sure you want to end this active program? You can choose or restart any plan anytime.
                </p>

                <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ flex: 1, border: '1px solid var(--line)' }}
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    Keep Program
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
                    onClick={() => {
                      setShowCancelConfirm(false);
                      handleCancelPlan();
                    }}
                  >
                    Yes, End Plan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <WorkoutCompleteModal
        isOpen={Boolean(planCompleteModalData)}
        onClose={() => setPlanCompleteModalData(null)}
        data={planCompleteModalData}
      />
    </section>
  );
}
