import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Paper } from '../components/Motion.jsx';
import { Arrow, ArrowLeft, Check, Dumbbell, Flame, Bolt, Trophy, Logo } from '../components/Icons.jsx';
import { GOALS, LEVELS, routineFor } from '../lib/goals.js';
import '../onboarding.css';

const ease = [0.22, 1, 0.36, 1];

const ONBOARDING_STEPS = [
  { id: 'goal', title: 'Main Goal', subtitle: 'What are you training for?' },
  { id: 'plan', title: 'Your Routine', subtitle: 'Experience level and weekly schedule' },
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
  const { ready, findByName } = useData();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    goal: user?.profile?.goal || 'muscle',
    level: user?.profile?.level || 'beginner',
    days: user?.profile?.days || 3,
    weight: user?.profile?.weight || '',
    height: user?.profile?.height || '',
  });
  const [errors, setErrors] = useState({});

  const firstName = user?.name ? user.name.split(' ')[0] : 'Athlete';

  const setVal = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const matchedRoutine = useMemo(() => {
    return routineFor({ goal: form.goal, level: form.level });
  }, [form.goal, form.level]);

  const validateStep = (s) => {
    const errs = {};
    if (s === 0 && !form.goal) {
      errs.goal = 'Please select a primary goal.';
    }
    if (s === 1 && !form.level) {
      errs.level = 'Please select your experience level.';
    }
    if (s === 2) {
      if (form.weight && (Number(form.weight) < 25 || Number(form.weight) > 300)) {
        errs.weight = 'Please enter a valid weight between 25 and 300 kg.';
      }
      if (form.height && (Number(form.height) < 100 || Number(form.height) > 250)) {
        errs.height = 'Please enter a valid height between 100 and 250 cm.';
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
    const profileData = {
      goal: form.goal || 'fit',
      level: form.level || 'beginner',
      days: Number(form.days) || 3,
      weight: form.weight ? Number(form.weight) : null,
      height: form.height ? Number(form.height) : null,
      onboardingComplete: true,
    };
    updateUser({ profile: profileData });
    toast(`Welcome aboard, ${firstName}! Your training plan is live.`, 'bolt');
    navigate('/dashboard', { replace: true });
  };

  const skipToDashboard = () => {
    updateUser({
      profile: {
        goal: 'fit',
        level: 'beginner',
        days: 3,
        weight: null,
        height: null,
        onboardingComplete: true,
      },
    });
    toast('Profile set with default plan. You can edit anytime in Settings.', 'info');
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
        <Link to="/" className="onboarding-logo">
          <Logo />
          <span>FITNEX</span>
        </Link>

        {/* Multi-step progress bar */}
        <div className="onboarding-progress-wrap">
          <div className="onboarding-progress-bar">
            <motion.div
              className="onboarding-progress-fill"
              initial={false}
              animate={{ width: `${((step + 1) / ONBOARDING_STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease }}
            />
          </div>
          <span className="onboarding-step-indicator">
            Step {step + 1} of {ONBOARDING_STEPS.length}
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
            className="onboarding-step-card"
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

            {/* Step 1: Goals */}
            {step === 0 && (
              <div className="onboarding-goals-grid">
                {GOALS.map((g, i) => {
                  const Icon = GOAL_ICONS[g.key] || Dumbbell;
                  const isSelected = form.goal === g.key;
                  const demoEx = ready ? findByName(g.exercise) : null;
                  return (
                    <motion.button
                      type="button"
                      key={g.key}
                      className={`onboarding-goal-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setVal('goal', g.key)}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div className="goal-card-top">
                        <span className="goal-icon-badge">
                          <Icon width={22} height={22} />
                        </span>
                        <div className={`goal-check-pill ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <Check width={14} height={14} />}
                        </div>
                      </div>

                      {demoEx && (
                        <div className="goal-media-wrap">
                          <Paper src={demoEx.image} gif={demoEx.gif} autoplay alt={g.label} />
                        </div>
                      )}

                      <div className="goal-info">
                        <h3>{g.label}</h3>
                        <p>{g.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Experience & Plan Frequency */}
            {step === 1 && (
              <div className="onboarding-plan-section">
                <div className="plan-block">
                  <label className="section-label">Lifting Experience</label>
                  <div className="experience-cards">
                    {LEVELS.map((lvl) => {
                      const isSelected = form.level === lvl.key;
                      return (
                        <button
                          type="button"
                          key={lvl.key}
                          className={`experience-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setVal('level', lvl.key)}
                        >
                          <div className="exp-radio">
                            {isSelected && <span className="exp-dot" />}
                          </div>
                          <div className="exp-details">
                            <b>{lvl.label}</b>
                            <span>{lvl.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="plan-block">
                  <label className="section-label">
                    Weekly Training Days: <b>{form.days} days / week</b>
                  </label>
                  <div className="days-picker">
                    {[2, 3, 4, 5, 6].map((d) => (
                      <button
                        type="button"
                        key={d}
                        className={`day-btn ${form.days === d ? 'active' : ''}`}
                        onClick={() => setVal('days', d)}
                      >
                        <span className="day-number">{d}</span>
                        <span className="day-label">days</span>
                      </button>
                    ))}
                  </div>
                  <p className="days-hint">
                    {form.days <= 2 && 'Ideal for maintaining baseline fitness and mobility.'}
                    {form.days === 3 && 'Recommended for full-body progression and recovery.'}
                    {form.days === 4 && 'Classic Upper/Lower split for optimal hypertrophy.'}
                    {form.days >= 5 && 'High-frequency athlete regimen with push/pull/legs splits.'}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Body Metrics */}
            {step === 2 && (
              <div className="onboarding-metrics-section">
                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-label">Body Weight</span>
                    <div className="metric-input-wrap">
                      <input
                        type="number"
                        className="metric-input"
                        placeholder="75"
                        value={form.weight}
                        onChange={(e) => setVal('weight', e.target.value)}
                        min={25}
                        max={300}
                        step={0.5}
                      />
                      <span className="metric-unit">kg</span>
                    </div>
                    {errors.weight && <span className="field-error">{errors.weight}</span>}
                    <span className="metric-desc">Used to calculate starting strength loads</span>
                  </div>

                  <div className="metric-card">
                    <span className="metric-label">Height</span>
                    <div className="metric-input-wrap">
                      <input
                        type="number"
                        className="metric-input"
                        placeholder="180"
                        value={form.height}
                        onChange={(e) => setVal('height', e.target.value)}
                        min={100}
                        max={250}
                        step={1}
                      />
                      <span className="metric-unit">cm</span>
                    </div>
                    {errors.height && <span className="field-error">{errors.height}</span>}
                    <span className="metric-desc">Used for body composition analytics</span>
                  </div>
                </div>

                <div className="metrics-note">
                  <span className="note-icon">💡</span>
                  <span>
                    You can update or adjust these metrics at any time in your profile settings.
                  </span>
                </div>
              </div>
            )}

            {/* Step 4: Plan Confirmation & Recap */}
            {step === 3 && (
              <div className="onboarding-recap-section">
                <div className="recap-card">
                  <div className="recap-header">
                    <div className="recap-badge-icon">
                      <Check width={24} height={24} />
                    </div>
                    <div>
                      <span className="recap-tag">RECOMMENDED STARTER PROGRAM</span>
                      <h2 className="recap-title">{matchedRoutine}</h2>
                    </div>
                  </div>

                  <div className="recap-details-grid">
                    <div className="recap-detail">
                      <span className="recap-lbl">Primary Goal</span>
                      <b>{GOALS.find((g) => g.key === form.goal)?.label || 'Muscle'}</b>
                    </div>
                    <div className="recap-detail">
                      <span className="recap-lbl">Experience</span>
                      <b>{LEVELS.find((l) => l.key === form.level)?.label || 'Beginner'}</b>
                    </div>
                    <div className="recap-detail">
                      <span className="recap-lbl">Frequency</span>
                      <b>{form.days} Days / Week</b>
                    </div>
                    <div className="recap-detail">
                      <span className="recap-lbl">Starting Weight</span>
                      <b>{form.weight ? `${form.weight} kg` : 'Not set'}</b>
                    </div>
                  </div>

                  <div className="recap-feature-list">
                    <div className="feature-item">
                      <Check width={16} height={16} />
                      <span>1,324 movements indexed & filtered to your goals</span>
                    </div>
                    <div className="feature-item">
                      <Check width={16} height={16} />
                      <span>Live workout tracker with rest timer configured</span>
                    </div>
                    <div className="feature-item">
                      <Check width={16} height={16} />
                      <span>Personalized daily starter routine queued</span>
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
                  className="btn btn-ghost"
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
                  {busy ? 'Setting up...' : 'Enter Dashboard'} <Arrow width={18} height={18} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
