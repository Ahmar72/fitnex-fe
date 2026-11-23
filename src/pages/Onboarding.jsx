import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Arrow, ArrowLeft, Check, Dumbbell, Flame, Bolt, Trophy, Logo, Up, Down } from '../components/Icons.jsx';
import { GOALS, LEVELS, DEFAULT_PLAN_BY_GOAL } from '../lib/goals.js';
import { getProgramForUser, DIFFICULTY_CALIBRATION } from '../lib/progressionEngine.js';
import { asset, readLS, writeLS } from '../lib/utils.js';
import '../onboarding.css';

const ease = [0.22, 1, 0.36, 1];

const ONBOARDING_STEPS = [
  { id: 'goal', title: 'Main Goal', subtitle: 'What are you training for?' },
  { id: 'plan', title: 'Your Routine', subtitle: 'Experience level & weekly schedule' },
  { id: 'metrics', title: 'Body & Nutrition', subtitle: 'Calculate your daily calorie target & macros' },
  { id: 'ready', title: 'Your Program', subtitle: 'Your personalized starter routine and calorie target are ready' },
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
    planId: DEFAULT_PLAN_BY_GOAL?.[user?.profile?.goal || 'muscle'] || 'muscle-building',
    level: user?.profile?.level || 'beginner',
    days: user?.profile?.days || 3,
    age: user?.profile?.age || 25,
    sex: user?.profile?.sex || 'male',
    activityLevel: user?.profile?.activityLevel || 'moderate',
    dietGoal: user?.profile?.dietGoal || (user?.profile?.goal === 'fat' ? 'loss' : user?.profile?.goal === 'muscle' || user?.profile?.goal === 'strength' ? 'gain' : 'maintain'),
    weight: user?.profile?.weight || (user?.profile?.weightUnit === 'lbs' ? 154 : 70),
    height: user?.profile?.height || (user?.profile?.heightUnit === 'ft' ? 5.7 : 170),
  });

  // Units state for live conversion
  const [weightUnit, setWeightUnit] = useState(user?.profile?.weightUnit || 'kg'); // 'kg' | 'lbs'
  const [heightUnit, setHeightUnit] = useState(user?.profile?.heightUnit || 'cm'); // 'cm' | 'ft'
  const [calcTriggered, setCalcTriggered] = useState(true);

  const [errors, setErrors] = useState({});

  const firstName = user?.name ? user.name.split(' ')[0] : 'Athlete';

  const setVal = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const handleSelectGoal = (goalKey) => {
    setVal('goal', goalKey);
    const defaultDietGoal = goalKey === 'fat' ? 'loss' : goalKey === 'muscle' || goalKey === 'strength' ? 'gain' : 'maintain';
    setVal('dietGoal', defaultDietGoal);
  };

  // Resolved tailored goal program for user
  const tailoredProgram = useMemo(() => {
    return getProgramForUser(form.goal, form.level, form.days);
  }, [form.goal, form.level, form.days]);

  const diffConfig = useMemo(() => {
    return DIFFICULTY_CALIBRATION[form.level] || DIFFICULTY_CALIBRATION.beginner;
  }, [form.level]);

  // Mifflin-St Jeor Calorie and Macronutrient Calculator
  const calcResults = useMemo(() => {
    const age = Number(form.age) || 25;
    const sex = form.sex || 'male';

    let weightKg = Number(form.weight) || (weightUnit === 'kg' ? 70 : 154 / 2.20462);
    if (weightUnit === 'lbs') weightKg = weightKg / 2.20462;

    let heightCm = Number(form.height) || (heightUnit === 'cm' ? 170 : 5.7 * 30.48);
    if (heightUnit === 'ft') heightCm = heightCm * 30.48;

    // Mifflin-St Jeor formula
    // Men: BMR = 10*w + 6.25*h - 5*a + 5
    // Women: BMR = 10*w + 6.25*h - 5*a - 161
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
    bmr = Math.round(bmr);

    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };
    const mult = multipliers[form.activityLevel] || 1.55;
    const tdee = Math.round(bmr * mult);

    let targetCalories = tdee;
    const dietGoal = form.dietGoal || (form.goal === 'fat' ? 'loss' : form.goal === 'muscle' || form.goal === 'strength' ? 'gain' : 'maintain');

    if (dietGoal === 'loss') {
      targetCalories = Math.max(1200, Math.round(tdee - 500));
    } else if (dietGoal === 'gain') {
      targetCalories = Math.round(tdee + 350);
    } else {
      targetCalories = tdee;
    }

    // Macronutrients: 30% Protein, 40% Carbohydrates, 30% Fat
    const protein = Math.round((targetCalories * 0.30) / 4);
    const carbs = Math.round((targetCalories * 0.40) / 4);
    const fat = Math.round((targetCalories * 0.30) / 9);

    return {
      bmr,
      tdee,
      targetCalories,
      macros: { protein, carbs, fat },
    };
  }, [form.age, form.sex, form.weight, weightUnit, form.height, heightUnit, form.activityLevel, form.dietGoal, form.goal]);

  // Handle switching weight units with conversion
  const handleWeightUnitChange = (newUnit) => {
    if (newUnit === weightUnit) return;
    if (form.weight) {
      const val = Number(form.weight);
      if (!isNaN(val) && val > 0) {
        if (newUnit === 'lbs') {
          // kg to lbs
          setVal('weight', Math.round(val * 2.20462));
        } else {
          // lbs to kg
          setVal('weight', Math.round(val / 2.20462));
        }
      }
    } else {
      setVal('weight', newUnit === 'kg' ? 70 : 154);
    }
    setWeightUnit(newUnit);
  };

  // Handle switching height units with conversion
  const handleHeightUnitChange = (newUnit) => {
    if (newUnit === heightUnit) return;
    if (form.height) {
      const val = Number(form.height);
      if (!isNaN(val) && val > 0) {
        if (newUnit === 'ft') {
          const totalInches = val / 2.54;
          const feet = (totalInches / 12).toFixed(1);
          setVal('height', feet);
        } else {
          const cm = Math.round(val * 30.48);
          setVal('height', cm);
        }
      }
    } else {
      setVal('height', newUnit === 'cm' ? 170 : 5.7);
    }
    setHeightUnit(newUnit);
  };

  // Step weight value up or down
  const stepWeight = (dir) => {
    const step = weightUnit === 'kg' ? 0.5 : 1;
    const min = weightUnit === 'kg' ? 25 : 55;
    const max = weightUnit === 'kg' ? 300 : 660;
    const defaultVal = weightUnit === 'kg' ? 70 : 154;
    const cur = form.weight === '' || isNaN(Number(form.weight)) ? defaultVal : Number(form.weight);
    const next = Math.min(max, Math.max(min, Math.round((cur + dir * step) * 10) / 10));
    setVal('weight', next);
  };

  // Step height value up or down
  const stepHeight = (dir) => {
    if (heightUnit === 'cm') {
      const min = 100, max = 250, defaultVal = 170;
      const cur = form.height === '' || isNaN(Number(form.height)) ? defaultVal : Number(form.height);
      const next = Math.min(max, Math.max(min, cur + dir * 1));
      setVal('height', next);
    } else {
      const min = 3.2, max = 8.2, defaultVal = 5.7;
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
      const inLbs = Math.round(val * 2.20462);
      return `≈ ${inLbs} lbs`;
    } else {
      const inKg = Math.round(val / 2.20462);
      return `≈ ${inKg} kg`;
    }
  }, [form.weight, weightUnit]);

  // Live height conversion text
  const heightConversionHint = useMemo(() => {
    if (!form.height || isNaN(Number(form.height))) return null;
    const val = Number(form.height);
    if (val <= 0) return null;

    let cm = val;
    if (heightUnit === 'ft') cm = val * 30.48;

    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);

    if (heightUnit === 'cm') {
      return `≈ ${feet} ft ${inches} in`;
    } else {
      return `≈ ${Math.round(cm)} cm`;
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
      if (form.age) {
        const a = Number(form.age);
        if (isNaN(a) || a < 10 || a > 120) {
          errs.age = 'Please enter a valid age (10–120).';
        }
      }
      if (form.weight) {
        let kg = Number(form.weight);
        if (weightUnit === 'lbs') kg = kg / 2.20462;
        if (kg < 25 || kg > 300) {
          errs.weight = 'Please enter a valid weight (25–300 kg or 55–660 lbs).';
        }
      }
      if (form.height) {
        let cm = Number(form.height);
        if (heightUnit === 'ft') cm = cm * 30.48;
        if (cm < 100 || cm > 250) {
          errs.height = 'Please enter a valid height (100–250 cm or 3.2–8.2 ft).';
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
    let finalWeight = form.weight ? Number(form.weight) : (weightUnit === 'kg' ? 70 : 154);
    if (finalWeight && weightUnit === 'lbs') {
      finalWeight = Math.round((finalWeight / 2.20462) * 10) / 10;
    }

    let finalHeight = form.height ? Number(form.height) : (heightUnit === 'cm' ? 170 : 5.7);
    if (finalHeight) {
      if (heightUnit === 'ft') finalHeight = Math.round(finalHeight * 30.48);
    }

    // Initialize goal progression for user's goal
    const goalKey = form.goal || 'muscle';
    const goalProgressObj = {
      goal: goalKey,
      level: form.level || 'beginner',
      daysPerWeek: Number(form.days) || 3,
      startedAt: Date.now(),
      currentDayIndex: 0,
      lastWorkoutDate: null,
      completedDates: [],
    };
    writeLS(`fx:goal-progress:${goalKey}`, goalProgressObj);

    const profileData = {
      goal: goalKey,
      level: form.level || 'beginner',
      days: Number(form.days) || 3,
      age: Number(form.age) || 25,
      sex: form.sex || 'male',
      activityLevel: form.activityLevel || 'moderate',
      dietGoal: form.dietGoal || (goalKey === 'fat' ? 'loss' : goalKey === 'muscle' || goalKey === 'strength' ? 'gain' : 'maintain'),
      weight: finalWeight,
      height: finalHeight,
      weightUnit,
      heightUnit,
      bmr: calcResults.bmr,
      tdee: calcResults.tdee,
      calorieTarget: calcResults.targetCalories,
      macros: calcResults.macros,
      onboardingComplete: true,
    };

    updateUser({ profile: profileData });

    toast(`Welcome aboard, ${firstName}! Your personalized ${tailoredProgram.name} and calorie target are ready.`, 'bolt');
    navigate('/dashboard', { replace: true });
  };

  const skipToDashboard = () => {
    const goalKey = 'muscle';
    const goalProgressObj = {
      goal: goalKey,
      level: 'beginner',
      daysPerWeek: 3,
      startedAt: Date.now(),
      currentDayIndex: 0,
      lastWorkoutDate: null,
      completedDates: [],
    };
    writeLS(`fx:goal-progress:${goalKey}`, goalProgressObj);

    updateUser({
      profile: {
        goal: goalKey,
        level: 'beginner',
        days: 3,
        age: 25,
        sex: 'male',
        activityLevel: 'moderate',
        dietGoal: 'gain',
        weight: 70,
        height: 170,
        weightUnit: 'kg',
        heightUnit: 'cm',
        bmr: 1643,
        tdee: 2547,
        calorieTarget: 2897,
        macros: { protein: 217, carbs: 290, fat: 97 },
        onboardingComplete: true,
      },
    });
    toast(`Profile ready. Your personalized workout is ready on your dashboard.`, 'info');
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
                {step === 2 && 'Calculate your daily calorie & macro targets'}
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
            {/* Step 2: Body Stats & Calorie Calculator                    */}
            {/* ========================================================== */}
            {step === 2 && (
              <div className="onboarding-metrics-section">
                {/* Enter your details card matching Image 1 */}
                <div className="calc-form-card">
                  <h3 className="calc-card-title">Enter your details</h3>

                  {/* Row 1: Age & Sex */}
                  <div className="calc-grid-2col">
                    <div className="calc-field-group">
                      <label htmlFor="user-age-input" className="calc-field-label">Age</label>
                      <div className="calc-input-wrapper">
                        <input
                          id="user-age-input"
                          type="number"
                          className="calc-input"
                          placeholder="25"
                          value={form.age}
                          onChange={(e) => setVal('age', e.target.value)}
                          min={12}
                          max={100}
                        />
                      </div>
                      {errors.age && <span className="field-error">{errors.age}</span>}
                    </div>

                    <div className="calc-field-group">
                      <label htmlFor="user-sex-select" className="calc-field-label">Sex</label>
                      <div className="calc-input-wrapper">
                        <select
                          id="user-sex-select"
                          className="calc-select"
                          value={form.sex}
                          onChange={(e) => setVal('sex', e.target.value)}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Height with Unit Toggle */}
                  <div className="calc-field-group">
                    <div className="calc-field-header">
                      <label htmlFor="user-height-input" className="calc-field-label">Height</label>
                      <div className="calc-unit-toggle" role="group" aria-label="Height Unit">
                        <button
                          type="button"
                          className={`calc-unit-btn ${heightUnit === 'cm' ? 'active' : ''}`}
                          onClick={() => handleHeightUnitChange('cm')}
                        >
                          cm
                        </button>
                        <button
                          type="button"
                          className={`calc-unit-btn ${heightUnit === 'ft' ? 'active' : ''}`}
                          onClick={() => handleHeightUnitChange('ft')}
                        >
                          ft/in
                        </button>
                      </div>
                    </div>
                    <div className="calc-input-wrapper">
                      <input
                        id="user-height-input"
                        type="number"
                        className="calc-input"
                        placeholder={heightUnit === 'cm' ? '170' : '5.7'}
                        value={form.height}
                        onChange={(e) => setVal('height', e.target.value)}
                        step={heightUnit === 'cm' ? 1 : 0.1}
                        min={heightUnit === 'cm' ? 100 : 3.2}
                        max={heightUnit === 'cm' ? 250 : 8.2}
                      />
                      <span className="calc-input-suffix">{heightUnit === 'cm' ? 'cm' : 'ft'}</span>
                    </div>
                    {heightConversionHint && (
                      <span className="calc-conversion-hint">{heightConversionHint}</span>
                    )}
                    {errors.height && <span className="field-error">{errors.height}</span>}
                  </div>

                  {/* Row 3: Weight with Unit Toggle */}
                  <div className="calc-field-group">
                    <div className="calc-field-header">
                      <label htmlFor="user-weight-input" className="calc-field-label">Weight</label>
                      <div className="calc-unit-toggle" role="group" aria-label="Weight Unit">
                        <button
                          type="button"
                          className={`calc-unit-btn ${weightUnit === 'kg' ? 'active' : ''}`}
                          onClick={() => handleWeightUnitChange('kg')}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          className={`calc-unit-btn ${weightUnit === 'lbs' ? 'active' : ''}`}
                          onClick={() => handleWeightUnitChange('lbs')}
                        >
                          lbs
                        </button>
                      </div>
                    </div>
                    <div className="calc-input-wrapper">
                      <input
                        id="user-weight-input"
                        type="number"
                        className="calc-input"
                        placeholder={weightUnit === 'kg' ? '70' : '154'}
                        value={form.weight}
                        onChange={(e) => setVal('weight', e.target.value)}
                        step={0.5}
                        min={weightUnit === 'kg' ? 25 : 55}
                        max={weightUnit === 'kg' ? 300 : 660}
                      />
                      <span className="calc-input-suffix">{weightUnit}</span>
                    </div>
                    {weightConversionHint && (
                      <span className="calc-conversion-hint">{weightConversionHint}</span>
                    )}
                    {errors.weight && <span className="field-error">{errors.weight}</span>}
                  </div>

                  {/* Row 4: Activity Level matching Image 1 & 2 */}
                  <div className="calc-field-group">
                    <label htmlFor="user-activity-select" className="calc-field-label">Activity Level</label>
                    <div className="calc-input-wrapper">
                      <select
                        id="user-activity-select"
                        className="calc-select"
                        value={form.activityLevel}
                        onChange={(e) => setVal('activityLevel', e.target.value)}
                      >
                        <option value="sedentary">Sedentary (little or no exercise)</option>
                        <option value="light">Lightly active (light exercise 1-3 days/week)</option>
                        <option value="moderate">Moderately active (moderate exercise 3-5 days/week)</option>
                        <option value="very_active">Very active (hard exercise 6-7 days/week)</option>
                        <option value="extra_active">Extra active (very hard exercise, physical job)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Your Goal matching Image 1 */}
                  <div className="calc-field-group">
                    <label htmlFor="user-goal-select" className="calc-field-label">Your Goal</label>
                    <div className="calc-input-wrapper">
                      <select
                        id="user-goal-select"
                        className="calc-select"
                        value={form.dietGoal}
                        onChange={(e) => setVal('dietGoal', e.target.value)}
                      >
                        <option value="maintain">Maintain weight</option>
                        <option value="loss">Weight loss / Cut</option>
                        <option value="gain">Muscle gain / Bulk</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Button matching Image 1 */}
                  <button
                    type="button"
                    className="calc-submit-btn"
                    onClick={() => {
                      setCalcTriggered(true);
                      const el = document.getElementById('calc-results-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Calculate Calories
                  </button>
                </div>

                {/* Calorie & Macro Results Cards matching Image 3 */}
                <div id="calc-results-section" className="calc-results-wrap">
                  {/* Card 1: Your Daily Calorie Target */}
                  <div className="calc-target-card">
                    <h4 className="calc-target-title">Your Daily Calorie Target</h4>
                    <div className="calc-target-number-row">
                      <span className="calc-target-number">{calcResults.targetCalories}</span>
                      <span className="calc-target-badge">calories/day</span>
                    </div>
                    <div className="calc-target-meta">
                      <p className="calc-meta-line">
                        Basal Metabolic Rate (BMR): <strong>{calcResults.bmr} calories</strong>
                      </p>
                      <p className="calc-meta-line">
                        Total Daily Energy Expenditure: <strong>{calcResults.tdee} calories</strong>
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Suggested Macronutrients */}
                  <div className="calc-macros-card">
                    <h4 className="calc-macros-title">Suggested Macronutrients</h4>
                    <div className="calc-macros-grid">
                      <div className="calc-macro-box">
                        <span className="calc-macro-val">{calcResults.macros.protein}g</span>
                        <span className="calc-macro-label">Protein</span>
                      </div>
                      <div className="calc-macro-box">
                        <span className="calc-macro-val">{calcResults.macros.carbs}g</span>
                        <span className="calc-macro-label">Carbs</span>
                      </div>
                      <div className="calc-macro-box">
                        <span className="calc-macro-val">{calcResults.macros.fat}g</span>
                        <span className="calc-macro-label">Fat</span>
                      </div>
                    </div>
                    <p className="calc-macros-disclaimer">
                      Based on approximately 30% protein, 40% carbohydrates, and 30% fat. Adjust based on your specific dietary needs and preferences.
                    </p>
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
                      <span className="recap-tag">ACTIVE GOAL ROUTINE</span>
                      <h2 className="recap-title">{tailoredProgram.name}</h2>
                      <p className="recap-blurb">{tailoredProgram.tagline}</p>
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
                      <b>{tailoredProgram.day1Workout?.focus || 'Core Compound Movements'}</b>
                    </div>
                    <div className="recap-detail">
                      <span className="recap-lbl">Schedule</span>
                      <b>{form.days} Days / Week · {diffConfig.label}</b>
                    </div>
                    <div className="recap-detail">
                      <span className="recap-lbl">Daily Target</span>
                      <b>{calcResults.targetCalories} kcal ({calcResults.macros.protein}P · {calcResults.macros.carbs}C · {calcResults.macros.fat}F)</b>
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
