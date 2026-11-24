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
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.from || '/dashboard';
  const [form, setForm] = useState({ email: location.state?.email || '', password: '', remember: true });
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
      toast(`Welcome back, ${u.name ? u.name.split(' ')[0] : 'Athlete'}!`, 'bolt');
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
    try {
      const u = await login('athlete@fitnex.com', 'Password123!', true);
      toast(`Signed in as ${u.name}`, 'bolt');
      navigate(next, { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
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
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : <>Sign in <Arrow /></>}
          </button>
          <div className="divider"><span>or</span></div>
          <button className="btn btn-ghost btn-block" type="button" onClick={demo} disabled={busy}>
            Try the athlete account
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
/* Signup — Account creation with OTP verification step                */
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
      const registered = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      toast(`Account created! We sent an OTP verification code to ${form.email}.`, 'bolt');
      navigate('/verify-email', {
        state: { email: form.email, name: form.name },
        replace: true,
      });
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
              {busy ? <span className="spinner" /> : <>Create account & send OTP <Arrow /></>}
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

/* ------------------------------------------------------------------ */
/* VerifyEmail — 6-digit OTP code verification & resend               */
/* ------------------------------------------------------------------ */
export function VerifyEmail() {
  const { user, verifyEmail, resendVerification } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  const initialEmail = location.state?.email || query.get('email') || user?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleDigitChange = (index, value) => {
    // Check for paste
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length) {
        const nextDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = pasted[i] || '';
        }
        setDigits(nextDigits);
        return;
      }
    }

    const nextDigits = [...digits];
    nextDigits[index] = value.slice(-1);
    setDigits(nextDigits);
    setErrors({});

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const token = digits.join('').trim();
    if (!email || !EMAIL_RE.test(email)) {
      setErrors({ email: 'Valid email address is required.' });
      return setShake((s) => s + 1);
    }
    if (token.length !== 6) {
      setErrors({ form: 'Please enter all 6 digits of your verification code.' });
      return setShake((s) => s + 1);
    }

    setBusy(true);
    setErrors({});
    try {
      await verifyEmail(email, token);
      toast('Email verified successfully! Welcome to Fitnex.', 'bolt');
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
      setShake((s) => s + 1);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    if (!email || !EMAIL_RE.test(email)) {
      setErrors({ email: 'Please enter your email to resend code.' });
      return;
    }

    setResending(true);
    setErrors({});
    try {
      await resendVerification(email);
      setSuccess('A fresh 6-digit verification code has been sent to your email.');
      setCountdown(60);
      toast('Verification code sent via Mailtrap!', 'bolt');
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email."
      subtitle="Enter the 6-digit verification code sent to your email."
      side={<SideCopy big={<>One quick <span className="accent">step.</span></>} small="Verify your account to access custom routines, personalized macros, and tracking." />}
    >
      <Shake k={shake}>
        <form className="auth-form" onSubmit={submit} noValidate>
          <AnimatePresence>
            {errors.form && (
              <motion.div className="form-alert" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {errors.form}
              </motion.div>
            )}
            {success && (
              <motion.div className="form-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <Field label="Email address" error={errors.email}>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <div className="otp-container">
            <span className="field-label">6-Digit Verification Code</span>
            <div className="otp-inputs">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-digit-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  className="otp-input"
                  placeholder=""
                  autoComplete="off"
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoFocus={idx === 0 && !digit}
                />
              ))}
            </div>
            <div className="resend-row">
              <span className="muted" style={{ fontSize: '13px' }}>Didn’t get a code?</span>
              <button
                type="button"
                className="resend-btn"
                onClick={handleResend}
                disabled={countdown > 0 || resending}
              >
                {resending ? 'Sending...' : countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : <>Verify & Continue <Arrow /></>}
          </button>

          <p className="auth-switch">
            Back to <Link to="/login">Sign in</Link>
          </p>
        </form>
      </Shake>
    </AuthLayout>
  );
}

/* ------------------------------------------------------------------ */
/* ForgotPassword — Request password reset code via Mailtrap           */
/* ------------------------------------------------------------------ */
export function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setErrors({ email: 'Enter a valid email address.' });
      return setShake((s) => s + 1);
    }

    setBusy(true);
    setErrors({});
    try {
      await forgotPassword(email);
      setSuccess(true);
      toast('Reset instructions sent to your email!', 'bolt');
    } catch (err) {
      setErrors({ form: err.message });
      setShake((s) => s + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password."
      subtitle="We’ll send a password recovery code to your registered email."
      side={<SideCopy big={<>Account <span className="accent">Recovery.</span></>} small="Get back into your account quickly and securely." />}
    >
      <Shake k={shake}>
        <form className="auth-form" onSubmit={submit} noValidate>
          <AnimatePresence>
            {errors.form && (
              <motion.div className="form-alert" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {errors.form}
              </motion.div>
            )}
            {success && (
              <motion.div className="form-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                A password reset code has been sent to <strong>{email}</strong>. Check your inbox (or Mailtrap) to continue.
              </motion.div>
            )}
          </AnimatePresence>

          {!success ? (
            <>
              <Field label="Email" error={errors.email}>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? <span className="spinner" /> : <>Send Reset Code <Arrow /></>}
              </button>
            </>
          ) : (
            <div className="auth-actions" style={{ flexDirection: 'column' }}>
              <Link to={`/reset-password?email=${encodeURIComponent(email)}`} className="btn btn-primary btn-block">
                Enter Reset Code &rarr;
              </Link>
            </div>
          )}

          <p className="auth-switch">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </Shake>
    </AuthLayout>
  );
}

/* ------------------------------------------------------------------ */
/* ResetPassword — Enter code and set new password                    */
/* ------------------------------------------------------------------ */
export function ResetPassword() {
  const { resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  const [token, setToken] = useState(query.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!token.trim()) errs.token = 'Enter the reset code received in your email.';
    if (passwordChecks(password).some((c) => !c.ok)) {
      errs.password = 'Password does not meet all security requirements.';
    }
    if (password !== confirm) {
      errs.confirm = 'Passwords do not match.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return setShake((s) => s + 1);

    setBusy(true);
    try {
      await resetPassword(token, password);
      toast('Password reset successfully! Please sign in.', 'bolt');
      navigate('/login', { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
      setShake((s) => s + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Set new password."
      subtitle="Enter the reset code sent to your email and choose a new password."
      side={<SideCopy big={<>Secure <span className="accent">Access.</span></>} small="Choose a strong password to protect your fitness journey." />}
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

          <Field label="Reset code / token" error={errors.token}>
            <input
              className="input"
              placeholder="Paste code from email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </Field>

          <div className="field-grid">
            <Field label="New password" error={errors.password}>
              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="New password"
              />
            </Field>
            <Field label="Confirm password" error={errors.confirm}>
              <PasswordInput
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                placeholder="Confirm password"
              />
            </Field>
          </div>

          <StrengthMeter password={password} />

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : <>Reset Password & Sign in <Arrow /></>}
          </button>

          <p className="auth-switch">
            Back to <Link to="/login">Sign in</Link>
          </p>
        </form>
      </Shake>
    </AuthLayout>
  );
}
