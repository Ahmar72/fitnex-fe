import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useAuth, EMAIL_RE, passwordChecks } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Arrow, ArrowLeft, Check, Eye, EyeOff, Logo } from '../components/Icons.jsx';

const ease = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Shared layout: hero image on the left, form on the right           */
/* ------------------------------------------------------------------ */
function AuthLayout({ title, subtitle, children, side }) {
  return (
    <section className="auth">
      <div className="auth-visual">
        <div className="auth-hero-wrap">
          <motion.img
            src="/auth-hero.jpg"
            alt="Fitnex athlete training"
            className="auth-hero-img"
            initial={{ scale: 1.05 }}
            animate={{ scale: [1.05, 1, 1.05] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="auth-visual-overlay" />
        <motion.div
          className="auth-visual-copy"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8, ease }}
        >
          {side}
        </motion.div>
      </div>

      <div className="auth-panel">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease }}
        >
          <Link to="/" className="logo auth-logo"><Logo /><span>Fit<em>nex</em></span></Link>
          <h1 className="display auth-title">{title}</h1>
          <p className="muted auth-sub">{subtitle}</p>
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function Field({ label, error, children, hint }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span className="field-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {error}
          </motion.span>
        )}
      </AnimatePresence>
      {hint && !error && <span className="field-hint">{hint}</span>}
    </label>
  );
}

function PasswordInput({ value, onChange, placeholder = '••••••••', autoComplete, name }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        name={name}
      />
      <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}

export function StrengthMeter({ password }) {
  const checks = passwordChecks(password);
  const score = checks.filter((c) => c.ok).length;
  const labels = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'];
  const colors = ['#ff3d6e', '#ff5b35', '#ff9f43', '#ff7830', '#ff5e1a'];
  return (
    <div className="strength">
      <div className="strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <motion.i key={i} animate={{ background: i < score ? colors[score] : 'rgba(255,255,255,.08)' }} transition={{ duration: 0.3 }} />
        ))}
      </div>
      <div className="strength-row">
        <span style={{ color: colors[score] }}>{password ? labels[score] : 'Password strength'}</span>
      </div>
      <ul className="checks">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'ok' : ''}>
            <span className="tick">{c.ok && <Check width={10} height={10} />}</span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Shake({ k, children }) {
  const controls = useAnimationControls();
  useEffect(() => {
    if (k) controls.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.45 } });
  }, [k, controls]);
  return <motion.div animate={controls}>{children}</motion.div>;
}

const SideCopy = ({ big, small }) => (
  <>
    <span className="eyebrow">Fitnex</span>
    <h2 className="display">{big}</h2>
    <p>{small}</p>
    <div className="auth-stats">
      <div><b>1,324</b><span>Animated exercises</span></div>
      <div><b>10</b><span>Languages</span></div>
      <div><b>0</b><span>Ads or trackers</span></div>
    </div>
  </>
);

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */
export function Login() {
  const { user, login, signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.from || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  if (user && !busy) return <Navigate to={next} replace />;

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return setShake((s) => s + 1);
    setBusy(true);
    try {
      const u = await login(form.email, form.password, form.remember);
      toast(`Welcome back, ${u.name.split(' ')[0]}!`, 'bolt');
      navigate(next, { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
      setShake((s) => s + 1);
    } finally {
      setBusy(false);
    }
  };

  const demo = async () => {
    setBusy(true);
    const creds = { email: 'demo@fitnex.app', password: 'Demo@1234' };
    try {
      await login(creds.email, creds.password, true).catch(() =>
        signup({ name: 'Demo Athlete', ...creds, profile: { goal: 'muscle', level: 'intermediate', days: 4, weight: 78 } })
      );
      toast('Signed in to the demo account', 'bolt');
      navigate(next, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in to pick up where you left off."
      side={<SideCopy big={<>Every rep <span className="accent">counts.</span></>} small="Your workouts, favourites and progress are waiting for you." />}
    >
      <Shake k={shake}>
        <form className="auth-form" onSubmit={submit} noValidate>
          <AnimatePresence>
            {errors.form && (
              <motion.div className="form-alert" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {errors.form}
              </motion.div>
            )}
          </AnimatePresence>
          <Field label="Email" error={errors.email}>
            <input className="input" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => set('email')(e.target.value)} />
          </Field>
          <Field label="Password" error={errors.password}>
            <PasswordInput value={form.password} onChange={set('password')} autoComplete="current-password" />
          </Field>
          <div className="auth-row">
            <label className="checkbox">
              <input type="checkbox" checked={form.remember} onChange={(e) => set('remember')(e.target.checked)} />
              <span className="box"><Check width={12} height={12} /></span>
              Keep me signed in
            </label>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : <>Sign in <Arrow /></>}
          </button>
          <div className="divider"><span>or</span></div>
          <button className="btn btn-ghost btn-block" type="button" onClick={demo} disabled={busy}>
            Try the demo account
          </button>
          <p className="auth-switch">
            New to Fitnex? <Link to="/signup" state={location.state}>Create a free account</Link>
          </p>
        </form>
      </Shake>
    </AuthLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Signup — Account creation (onboarding happens on /onboarding)       */
/* ------------------------------------------------------------------ */
export function Signup() {
  const { user, signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    terms: false,
  });

  if (user && !busy) {
    return <Navigate to={user.profile?.onboardingComplete ? '/dashboard' : '/onboarding'} replace />;
  }

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address.';
    if (passwordChecks(form.password).some((c) => !c.ok)) {
      e.password = 'Your password doesn’t meet all the requirements yet.';
    }
    if (form.confirm !== form.password || !form.confirm) {
      e.confirm = 'Passwords don’t match.';
    }
    if (!form.terms) e.terms = 'Please accept the terms to continue.';
    setErrors(e);
    if (Object.keys(e).length) setShake((x) => x + 1);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const u = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast(`Welcome to Fitnex, ${u.name.split(' ')[0]}! Let's tailor your routine.`, 'bolt');
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
      setShake((x) => x + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create account."
      subtitle="Free forever. Takes less than a minute."
      side={
        <SideCopy
          big={<>Start strong. <span className="accent">Stay strong.</span></>}
          small="Join Fitnex and train with 1,324 animated exercises, smart programmes and a live workout mode."
        />
      }
    >
      <Shake k={shake}>
        <form className="auth-form" onSubmit={submit} noValidate>
          <AnimatePresence>
            {errors.form && (
              <motion.div
                className="form-alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {errors.form}
              </motion.div>
            )}
          </AnimatePresence>

          <Field label="Full name" error={errors.name}>
            <input
              className="input"
              autoComplete="name"
              placeholder="Alex Morgan"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
            />
          </Field>

          <div className="field-grid">
            <Field label="Password" error={errors.password}>
              <PasswordInput
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                name="new-password"
              />
            </Field>
            <Field label="Confirm password" error={errors.confirm}>
              <PasswordInput
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                name="confirm-password"
              />
            </Field>
          </div>

          <StrengthMeter password={form.password} />

          <label className={`checkbox ${errors.terms ? 'has-error' : ''}`}>
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => set('terms')(e.target.checked)}
            />
            <span className="box">
              <Check width={12} height={12} />
            </span>
            I agree to the Terms and Privacy Policy
          </label>
          {errors.terms && <span className="field-error">{errors.terms}</span>}

          <div className="auth-actions">
            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={busy}
            >
              {busy ? <span className="spinner" /> : <>Create account <Arrow /></>}
            </button>
          </div>

          <p className="auth-switch">
            Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
          </p>
        </form>
      </Shake>
    </AuthLayout>
  );
}
