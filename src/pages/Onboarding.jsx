import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Arrow, ArrowLeft, Check, Dumbbell, Flame, Bolt, Trophy, Logo, Up, Down } from '../components/Icons.jsx';
import { GOALS, LEVELS, DEFAULT_PLAN_BY_GOAL } from '../lib/goals.js';
import { getProgramForUser } from '../lib/progressionEngine.js';
import { PLANS } from '../lib/plansData.js';
import { asset, readLS, writeLS } from '../lib/utils.js';
import '../onboarding.css';

const ease = [0.22, 1, 0.36, 1];

const ONBOARDING_STEPS = [
  { id: 'goal', title: 'Main Goal', subtitle: 'What are you training for?' },
  { id: 'plan', title: 'Your Routine', subtitle: 'Experience level & weekly schedule' },
  { id: 'metrics', title: 'Body Stats', subtitle: 'Calibrate starting volume and stats' },
  { id: 'ready', title: 'Your Program', subtitle: 'Your personalized starter routine is ready' },
];

const GOAL_ICONS = {
  muscle: Dumbbell,
  fat: Flame,
  strength: Bolt,
  fit: Trophy,
};

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const { ready, byId } = useData();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);

  // Form state - plan strictly corresponds to the chosen goal
  const [form, setForm] = useState({
    goal: user?.profile?.goal || 'muscle',
    planId: DEFAULT_PLAN_BY_GOAL[user?.profile?.goal || 'muscle'] || 'muscle-building',
    level: user?.profile?.level || 'beginner',
    days: user?.profile?.days || 3,
    weight: user?.profile?.weight || '',
    height: user?.profile?.height || '',
  });

  // Units state for live conversion
  const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' | 'lbs'
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' | 'ft' | 'm'

  const [errors, setErrors] = useState({});

  const firstName = user?.name ? user.name.split(' ')[0] : 'Athlete';

  const setVal = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const handleSelectGoal = (goalKey) => {
    setVal('goal', goalKey);
    setVal('planId', DEFAULT_PLAN_BY_GOAL[goalKey] || 'muscle-building');
  };

  // Resolved active program strictly matching selected goal
  const selectedPlan = useMemo(() => {
    const id = DEFAULT_PLAN_BY_GOAL[form.goal] || 'muscle-building';
    return PLANS.find((p) => p.id === id) || PLANS[0];
  }, [form.goal]);

  // Resolved tailored program for user
  const tailoredProgram = useMemo(() => {
    return getProgramForUser(form.goal, form.level, form.days);
  }, [form.goal, form.level, form.days]);

  // Handle switching weight units with conversion
  const handleWeightUnitChange = (newUnit) => {
    if (newUnit === weightUnit) return;
    if (form.weight) {
      const val = Number(form.weight);
      if (!isNaN(val) && val > 0) {
        if (newUnit === 'lbs') {
          // kg to lbs
          setVal('weight', (val * 2.20462).toFixed(1));
        } else {
          // lbs to kg
          setVal('weight', (val / 2.20462).toFixed(1));
        }
      }
    }
    setWeightUnit(newUnit);
  };

  // Handle switching height units with conversion
  const handleHeightUnitChange = (newUnit) => {
    if (newUnit === heightUnit) return;
    if (form.height) {
      const val = Number(form.height);
      if (!isNaN(val) && val > 0) {
        // Convert to cm first
        let inCm = val;
        if (heightUnit === 'm') inCm = val * 100;
        else if (heightUnit === 'ft') inCm = val * 30.48;

        if (newUnit === 'cm') {
          setVal('height', Math.round(inCm));
        } else if (newUnit === 'm') {
          setVal('height', (inCm / 100).toFixed(2));
        } else if (newUnit === 'ft') {
          const totalInches = inCm / 2.54;
          const feet = (totalInches / 12).toFixed(1);
          setVal('height', feet);
        }
      }
    }
    setHeightUnit(newUnit);
  };

  // Step weight value up or down
  const stepWeight = (dir) => {
    const step = weightUnit === 'kg' ? 0.5 : 1;
    const min = weightUnit === 'kg' ? 25 : 55;
    const max = weightUnit === 'kg' ? 300 : 660;
    const defaultVal = weightUnit === 'kg' ? 75 : 165;
    const cur = form.weight === '' || isNaN(Number(form.weight)) ? defaultVal : Number(form.weight);
    const next = Math.min(max, Math.max(min, Math.round((cur + dir * step) * 10) / 10));
    setVal('weight', next);
  };

  // Step height value up or down
  const stepHeight = (dir) => {
    if (heightUnit === 'cm') {
      const min = 100, max = 250, defaultVal = 180;
      const cur = form.height === '' || isNaN(Number(form.height)) ? defaultVal : Number(form.height);
      const next = Math.min(max, Math.max(min, cur + dir * 1));
      setVal('height', next);
    } else if (heightUnit === 'm') {
      const min = 1.0, max = 2.5, defaultVal = 1.80;
      const cur = form.height === '' || isNaN(Number(form.height)) ? defaultVal : Number(form.height);
      const next = Math.min(max, Math.max(min, Math.round((cur + dir * 0.01) * 100) / 100));
      setVal('height', next.toFixed(2));
    } else {
      const min = 3.2, max = 8.2, defaultVal = 5.9;
      const cur = form.height === '' || isNaN(Number(form.height)) ? defaultVal : Number(form.height);
      const next = Math.min(max, Math.max(min, Math.round((cur + dir * 0.1) * 10) / 10));
      setVal('height', next.toFixed(1));
    }
  };

  // Live weight conversion text
  const weightConversionHint = useMemo(() => {
    if (!form.weight || isNaN(Number(form.weight))) return null;
    const val = Number(form.weight);
    if (val <= 0) return null;
    if (weightUnit === 'kg') {
      const inLbs = (val * 2.20462).toFixed(1);
      return `≈ ${inLbs} lbs`;
    } else {
      const inKg = (val / 2.20462).toFixed(1);
      return `≈ ${inKg} kg`;
    }
  }, [form.weight, weightUnit]);

  // Live height conversion text (always includes feet and inches)
  const heightConversionHint = useMemo(() => {
    if (!form.height || isNaN(Number(form.height))) return null;
    const val = Number(form.height);
    if (val <= 0) return null;

    let cm = val;
    if (heightUnit === 'm') cm = val * 100;
    else if (heightUnit === 'ft') cm = val * 30.48;

    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    const meters = (cm / 100).toFixed(2);

    if (heightUnit === 'cm') {
      return `≈ ${feet} ft ${inches} in (${meters} m)`;
    } else if (heightUnit === 'm') {
      return `≈ ${feet} ft ${inches} in (${Math.round(cm)} cm)`;
    } else {
      return `≈ ${feet} ft ${inches} in (${Math.round(cm)} cm · ${meters} m)`;
    }
  }, [form.height, heightUnit]);

  const validateStep = (s) => {
    const errs = {};
    if (s === 0 && !form.goal) {
      errs.goal = 'Please select a primary goal.';
    }
    if (s === 1 && !form.level) {
      errs.level = 'Please select your experience level.';
    }
    if (s === 2) {
      if (form.weight) {
        let kg = Number(form.weight);
        if (weightUnit === 'lbs') kg = kg / 2.20462;
        if (kg < 25 || kg > 300) {
          errs.weight = 'Please enter a valid weight (25–300 kg or 55–660 lbs).';
        }
      }
      if (form.height) {
        let cm = Number(form.height);
        if (heightUnit === 'm') cm = cm * 100;
        if (heightUnit === 'ft') cm = cm * 30.48;
        if (cm < 100 || cm > 250) {
          errs.height = 'Please enter a valid height (100–250 cm).';
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setDir(1);
    setStep((s) => Math.min(ONBOARDING_STEPS.length - 1, s + 1));
  };

  const prevStep = () => {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const completeOnboarding = () => {
    setBusy(true);

    // Normalize weight/height to standard kg / cm for storage
    let finalWeight = form.weight ? Number(form.weight) : null;
    if (finalWeight && weightUnit === 'lbs') {
      finalWeight = Math.round((finalWeight / 2.20462) * 10) / 10;
    }

    let finalHeight = form.height ? Number(form.height) : null;
    if (finalHeight) {
      if (heightUnit === 'm') finalHeight = Math.round(finalHeight * 100);
      else if (heightUnit === 'ft') finalHeight = Math.round(finalHeight * 30.48);
    }

    // Set the chosen program as the active program and registered program across the whole web
    const activePlanObj = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      daysPerWeek: Number(form.days) || 3,
      startedAt: Date.now(),
      currentDayIndex: 0,
      lastWorkoutDate: null,
      completedDates: [],
    };
    writeLS('fx:active-plan-data', activePlanObj);
    writeLS('fx:registered-plan-progress', activePlanObj);
    writeLS(`fx:reg-plan-progress:${selectedPlan.id}`, activePlanObj);

    const profiles = readLS('fx:plan-profiles', {});
    profiles[selectedPlan.id] = {
      daysPerWeek: Number(form.days) || 3,
      activatedAt: Date.now(),
    };
    writeLS('fx:plan-profiles', profiles);

    const profileData = {
      goal: form.goal || 'muscle',
      level: form.level || 'beginner',
      days: Number(form.days) || 3,
      registeredPlanId: selectedPlan.id,
      activePlanId: selectedPlan.id,
      planName: selectedPlan.name,
      weight: finalWeight,
      height: finalHeight,
      weightUnit,
      heightUnit,
      onboardingComplete: true,
    };

    updateUser({ profile: profileData });

    toast(`Welcome aboard, ${firstName}! "${selectedPlan.name}" is now active on your dashboard.`, 'bolt');
    navigate('/dashboard', { replace: true });
  };

  const skipToDashboard = () => {
    const defaultPlan = selectedPlan || PLANS[0];
    const activePlanObj = {
      planId: defaultPlan.id,
      planName: defaultPlan.name,
      daysPerWeek: 3,
      startedAt: Date.now(),
      currentDayIndex: 0,
      lastWorkoutDate: null,
      completedDates: [],
    };
    writeLS('fx:active-plan-data', activePlanObj);
    writeLS('fx:registered-plan-progress', activePlanObj);
    writeLS(`fx:reg-plan-progress:${defaultPlan.id}`, activePlanObj);

    const profiles = readLS('fx:plan-profiles', {});
    profiles[defaultPlan.id] = {
      daysPerWeek: 3,
      activatedAt: Date.now(),
    };
    writeLS('fx:plan-profiles', profiles);

    updateUser({
      profile: {
        goal: 'muscle',
        level: 'beginner',
        days: 3,
        registeredPlanId: defaultPlan.id,
        activePlanId: defaultPlan.id,
        planName: defaultPlan.name,
        weight: null,
        height: null,
        weightUnit: 'kg',
        heightUnit: 'cm',
        onboardingComplete: true,
      },
    });
    toast(`Profile ready. "${defaultPlan.name}" is active on your dashboard.`, 'info');
    navigate('/dashboard', { replace: true });
  };

  const slideVariants = {
    enter: (d) => ({ opacity: 0, x: d * 50, scale: 0.98 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.45, ease } },
    exit: (d) => ({ opacity: 0, x: d * -50, scale: 0.98, transition: { duration: 0.25 } }),
  };

  return (
    <div className="onboarding-page">
      {/* Top Header */}
      <header className="onboarding-header">
        <Link to="/" className="onboarding-logo" title="Fitnex Home">
          <Logo />
          <span>FITNEX</span>
        </Link>

        {/* Multi-step progress bar (Increased size & clear visibility) */}
        <div className="onboarding-progress-wrap">
          <div className="onboarding-progress-bar" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={4}>
            <motion.div
              className="onboarding-progress-fill"
              initial={false}
              animate={{ width: `${((step + 1) / ONBOARDING_STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease }}
            />
          </div>
          <span className="onboarding-step-indicator">
            Step {step + 1} of {ONBOARDING_STEPS.length} · {ONBOARDING_STEPS[step].title}
          </span>
        </div>

        <button
          type="button"
          className="onboarding-skip-btn"
          onClick={skipToDashboard}
          title="Skip to Dashboard"
        >
          Skip for now
        </button>
      </header>

      {/* Main Questionnaire Container */}
      <main className="onboarding-container">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className={`onboarding-step-card step-${step}`}
          >
            {/* Step Heading */}
            <div className="onboarding-heading">
              <span className="onboarding-badge">{ONBOARDING_STEPS[step].title}</span>
              <h1 className="onboarding-title">
                {step === 0 && `Hey ${firstName}, what's your primary goal?`}
                {step === 1 && 'What’s your training plan & experience?'}
                {step === 2 && 'What are your body metrics?'}
                {step === 3 && 'Your personalized starter routine is ready!'}
              </h1>
              <p className="onboarding-subtitle">{ONBOARDING_STEPS[step].subtitle}</p>
            </div>

            {/* ========================================================== */}
            {/* Step 0: Goal Cards (1 Line / 4 Columns with Real Photos)   */}
            {/* ========================================================== */}
            {step === 0 && (
              <div className="onboarding-goals-grid">
                {GOALS.map((g, i) => {
                  const Icon = GOAL_ICONS[g.key] || Dumbbell;
                  const isSelected = form.goal === g.key;
                  return (
                    <motion.button
                      type="button"
                      key={g.key}
                      className={`onboarding-goal-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectGoal(g.key)}
                      whileHover={{ y: -4, scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="goal-card-top">
                        <span className="goal-icon-badge">
                          <Icon width={20} height={20} />
                        </span>
                        <div className={`goal-check-pill ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <Check width={13} height={13} />}
                        </div>
                      </div>

                      {/* Real athlete photograph */}
                      <div className="goal-media-wrap">
                        <img
                          src={asset(g.image)}
                          alt={g.label}
                          className="goal-real-img"
                          loading="eager"
                        />
                        <div className="goal-media-overlay" />
                      </div>

                      <div className="goal-info">
                        <h3>{g.label}</h3>
                        <p>{g.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* ========================================================== */}
            {/* Step 1: Experience & Frequency in Clean Columns + Dropdown  */}
            {/* ========================================================== */}
            {step === 1 && (
              <div className="onboarding-plan-section">
                <div className="plan-block">
                  <div className="plan-block-header">
                    <label className="section-label">Lifting Experience & Schedule</label>
                    <span className="section-sublabel">Select your experience level and adjust training frequency</span>
                  </div>

                  {/* Vertical Column Stack for Experience Levels */}
                  <div className="experience-columns-list">
                    {LEVELS.map((lvl) => {
                      const isSelected = form.level === lvl.key;
                      return (
                        <div
                          key={lvl.key}
                          className={`experience-row-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setVal('level', lvl.key)}
                        >
                          <div className="exp-left-col">
                            <div className="exp-radio">
                              {isSelected && <span className="exp-dot" />}
                            </div>
                            <div className="exp-details">
                              <b className="exp-title">{lvl.label}</b>
                              <span className="exp-desc">{lvl.desc}</span>
                            </div>
                          </div>

                          {/* Training Days Dropdown in front of level */}
                          <div className="exp-right-col" onClick={(e) => e.stopPropagation()}>
                            <div className="exp-days-dropdown-wrap">
                              <select
                                id={`days-select-${lvl.key}`}
                                className="experience-days-select"
                                value={isSelected ? form.days : 3}
                                onChange={(e) => {
                                  setVal('level', lvl.key);
                                  setVal('days', Number(e.target.value));
                                }}
                              >
                                <option value={2}>2 Days / Week</option>
                                <option value={3}>3 Days / Week</option>
                                <option value={4}>4 Days / Week</option>
                                <option value={5}>5 Days / Week</option>
                                <option value={6}>6 Days / Week</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* Step 2: Body Metrics (Clean, Light Placeholders & Live)    */}
            {/* ========================================================== */}
            {step === 2 && (
              <div className="onboarding-metrics-section">
                <div className="metrics-grid">
                  {/* Body Weight Input Card */}
                  <div className="metric-card">
                    <div className="metric-header-row">
                      <span className="metric-label">Body Weight</span>
                      {/* Unit Selector */}
                      <div className="unit-toggle-pills" role="group" aria-label="Weight Unit">
                        <button
                          type="button"
                          className={`unit-pill ${weightUnit === 'kg' ? 'active' : ''}`}
                          onClick={() => handleWeightUnitChange('kg')}
                        >
                          KG
                        </button>
                        <button
                          type="button"
                          className={`unit-pill ${weightUnit === 'lbs' ? 'active' : ''}`}
                          onClick={() => handleWeightUnitChange('lbs')}
                        >
                          LBS
                        </button>
                      </div>
                    </div>

                    <div className="metric-input-wrap">
                      <span className="metric-unit-left">{weightUnit}</span>
                      <input
                        type="number"
                        className="metric-input"
                        placeholder={weightUnit === 'kg' ? '75' : '165'}
                        value={form.weight}
                        onChange={(e) => setVal('weight', e.target.value)}
                        min={weightUnit === 'kg' ? 25 : 55}
                        max={weightUnit === 'kg' ? 300 : 660}
                        step={0.5}
                      />
                      <div className="metric-stepper">
                        <button
                          type="button"
                          className="metric-stepper-btn"
                          onClick={() => stepWeight(1)}
                          aria-label="Increase weight"
                        >
                          <Up width={12} height={12} />
                        </button>
                        <button
                          type="button"
                          className="metric-stepper-btn"
                          onClick={() => stepWeight(-1)}
                          aria-label="Decrease weight"
                        >
                          <Down width={12} height={12} />
                        </button>
                      </div>
                    </div>

                    {/* Live automatic unit conversion only when user enters number */}
                    {weightConversionHint && (
                      <div className="metric-conversion-line">
                        <span className="conversion-active">{weightConversionHint}</span>
                      </div>
                    )}

                    {errors.weight && <span className="field-error">{errors.weight}</span>}
                  </div>

                  {/* Height Input Card */}
                  <div className="metric-card">
                    <div className="metric-header-row">
                      <span className="metric-label">Height</span>
                      {/* Unit Selector */}
                      <div className="unit-toggle-pills" role="group" aria-label="Height Unit">
                        <button
                          type="button"
                          className={`unit-pill ${heightUnit === 'cm' ? 'active' : ''}`}
                          onClick={() => handleHeightUnitChange('cm')}
                        >
                          CM
                        </button>
                        <button
                          type="button"
                          className={`unit-pill ${heightUnit === 'ft' ? 'active' : ''}`}
                          onClick={() => handleHeightUnitChange('ft')}
                        >
                          FT
                        </button>
                        <button
                          type="button"
                          className={`unit-pill ${heightUnit === 'm' ? 'active' : ''}`}
                          onClick={() => handleHeightUnitChange('m')}
                        >
                          M
                        </button>
                      </div>
                    </div>

                    <div className="metric-input-wrap">
                      <span className="metric-unit-left">{heightUnit}</span>
                      <input
                        type="number"
                        className="metric-input"
                        placeholder={heightUnit === 'cm' ? '180' : heightUnit === 'm' ? '1.80' : '5.9'}
                        value={form.height}
                        onChange={(e) => setVal('height', e.target.value)}
                        min={heightUnit === 'cm' ? 100 : heightUnit === 'm' ? 1.0 : 3.2}
                        max={heightUnit === 'cm' ? 250 : heightUnit === 'm' ? 2.5 : 8.2}
                        step={heightUnit === 'cm' ? 1 : 0.01}
                      />
                      <div className="metric-stepper">
                        <button
                          type="button"
                          className="metric-stepper-btn"
                          onClick={() => stepHeight(1)}
                          aria-label="Increase height"
                        >
                          <Up width={12} height={12} />
                        </button>
                        <button
                          type="button"
                          className="metric-stepper-btn"
                          onClick={() => stepHeight(-1)}
                          aria-label="Decrease height"
                        >
                          <Down width={12} height={12} />
                        </button>
                      </div>
                    </div>

                    {/* Live automatic height conversion only when user enters number */}
                    {heightConversionHint && (
                      <div className="metric-conversion-line">
                        <span className="conversion-active">{heightConversionHint}</span>
                      </div>
                    )}

                    {errors.height && <span className="field-error">{errors.height}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* Step 3: Personalized Starter Routine Ready (Clean Recap)   */}
            {/* ========================================================== */}
            {step === 3 && (
              <div className="onboarding-recap-section">
                <div className="recap-card">
                  <div className="recap-header">
                    <div className="recap-badge-icon">
                      <Check width={26} height={26} />
                    </div>
                    <div>
                      <span className="recap-tag">ACTIVE TRAINING PROGRAM</span>
                      <h2 className="recap-title">{selectedPlan.name}</h2>
                      <p className="recap-blurb">{selectedPlan.tagline}</p>
                    </div>
                  </div>

                  {/* Clean Summary Stats Strip */}
                  <div className="recap-details-grid">
                    <div className="recap-detail">
                      <span className="recap-lbl">Primary Goal</span>
                      <b>{GOALS.find((g) => g.key === form.goal)?.label || 'Muscle'}</b>
                    </div>
                    <div className="recap-detail">
                      <span className="recap-lbl">Target Focus</span>
                      <b>{selectedPlan.targetMuscle}</b>
                    </div>
                    <div className="recap-detail">
                      <span className="recap-lbl">Schedule</span>
                      <b>{form.days} Days / Week · {selectedPlan.weeks} Weeks</b>
                    </div>
                    <div className="recap-detail">
                      <span className="recap-lbl">Week 1 Progression</span>
                      <b>3 Sets × 10 Reps · 40s / Set</b>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Controls */}
            <div className="onboarding-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost onboarding-back-btn"
                  onClick={prevStep}
                  disabled={busy}
                >
                  <ArrowLeft width={18} height={18} /> Back
                </button>
              )}

              {step < ONBOARDING_STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary onboarding-submit-btn"
                  onClick={nextStep}
                >
                  Continue <Arrow width={18} height={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary onboarding-submit-btn"
                  onClick={completeOnboarding}
                  disabled={busy}
                >
                  {busy ? 'Configuring Plan...' : 'Enter Dashboard & Start Plan'} <Arrow width={18} height={18} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
