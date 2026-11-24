import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth, EMAIL_RE, passwordChecks } from '../context/AuthContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Reveal, SplitText } from '../components/Motion.jsx';
import {
  Check,
  Download,
  LogOut,
  Trash,
  Sun,
  Moon,
  ChevronRight,
  Search,
  Play,
  Volume,
  Ruler,
  Dumbbell,
  Palette,
  Lock,
  User,
  Shield,
  Arrow,
  Upload,
  Camera,
  Flame,
  Bolt,
  Trophy,
} from '../components/Icons.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { StrengthMeter } from './Auth.jsx';
import { GOALS, LEVELS, DEFAULT_PLAN_BY_GOAL } from '../lib/goals.js';
import { isVoiceEnabled, setVoiceEnabled, speakVoice, readLS, writeLS } from '../lib/utils.js';

const GOAL_ICONS = {
  muscle: Dumbbell,
  fat: Flame,
  strength: Bolt,
  fit: Trophy,
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export default function Profile() {
  const { user, updateUser, changePassword, deleteAccount, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLanguage, languages, t, currentLanguage } = useLanguage();
  const { history, favorites, workout } = useWorkout();
  const toast = useToast();
  const navigate = useNavigate();

  // Form states
  const [acct, setAcct] = useState({ name: user?.name || '', email: user?.email || '' });
  const [prof, setProf] = useState({
    goal: 'fit',
    level: 'beginner',
    days: 3,
    weight: '',
    units: 'kg',
    ...(user?.profile || {}),
  });

  useEffect(() => {
    if (user?.profile) {
      setProf((prev) => ({
        ...prev,
        ...user.profile,
        goal: user.profile.goal || prev.goal || 'muscle',
        days: user.profile.days || prev.days || 3,
        level: user.profile.level || prev.level || 'beginner',
        weight: user.profile.weight ?? prev.weight ?? '',
      }));
    }
  }, [user?.profile]);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwErr, setPwErr] = useState('');
  const [acctErr, setAcctErr] = useState('');
  const [confirm, setConfirm] = useState('');

  // Expandable accordion state (tracks open section key or null)
  const [openSection, setOpenSection] = useState(null);

  // Search filter for settings
  const [searchQuery, setSearchQuery] = useState('');

  // Cursor color state ('black' | 'white' | 'orange')
  const [cursorColor, setCursorColor] = useState(() => {
    try {
      return localStorage.getItem('fx:cursor-color') || 'black';
    } catch {
      return 'black';
    }
  });

  const handleCursorColorChange = (color) => {
    setCursorColor(color);
    try {
      localStorage.setItem('fx:cursor-color', color);
    } catch {}
    document.documentElement.setAttribute('data-cursor-color', color);
    toast(`Cursor color updated to ${color}`, 'bolt');
  };

  // Timer alert preferences state (rest duration synced with user profile and storage)
  const [timerAlerts, setTimerAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('fx:rest-timer');
      if (saved) return { duration: Number(saved) };
    } catch {}
    return { duration: user?.profile?.rest || 60 };
  });

  // Voice guidelines toggle state
  const [voiceEnabled, setVoiceEnabledState] = useState(() => isVoiceEnabled());

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabledState(next);
    setVoiceEnabled(next);
    if (user) {
      updateUser({ profile: { ...(user.profile || {}), voiceGuidelines: next } });
    }
    toast(
      next ? 'Voice guidelines enabled' : 'Voice guidelines disabled',
      next ? 'bolt' : 'info'
    );
    if (next) {
      speakVoice('voice_enabled', { lang, interrupt: true });
    }
  };

  const toggleSection = (key) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const saveAccount = (e) => {
    e.preventDefault();
    if (acct.name.trim().length < 2) return setAcctErr('Please enter your full name.');
    try {
      // Email is permanent and non-editable once registered
      updateUser({ name: acct.name.trim() });
      setAcctErr('');
      toast('Account details saved', 'bolt');
    } catch (err) {
      setAcctErr(err.message);
    }
  };

  const saveProfile = () => {
    const updatedGoal = prof.goal || 'muscle';
    const updatedPlanId = DEFAULT_PLAN_BY_GOAL[updatedGoal] || 'muscle-building';
    const updatedDays = Number(prof.days) || 3;
    const finalWeight = prof.weight ? Number(prof.weight) : null;

    updateUser({
      profile: {
        ...(user?.profile || {}),
        ...prof,
        goal: updatedGoal,
        level: prof.level || 'beginner',
        days: updatedDays,
        weight: finalWeight,
      },
    });

    toast('Fitness profile updated — dashboard synced', 'bolt');
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwordChecks(pw.next).some((c) => !c.ok)) {
      return setPwErr('Your new password doesn’t meet all the requirements.');
    }
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: '', next: '' });
      setPwErr('');
      toast('Password changed', 'bolt');
    } catch (err) {
      setPwErr(err.message);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ user, favorites, workout, history }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fitnex-${user.name.split(' ')[0].toLowerCase()}-data.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Your data was exported', 'bolt');
  };

  const remove = () => {
    deleteAccount();
    toast('Your account was deleted', 'info');
    navigate('/');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      toast('Please choose an image under 2.5MB', 'alert');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      updateUser({ avatar: dataUrl });
      toast('Profile photo updated!', 'check');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    updateUser({ avatar: null });
    toast('Profile photo removed.', 'info');
  };

  if (!user) return <div className="page-fallback" />;

  const activeGoal = GOALS.find((g) => g.key === prof.goal) || GOALS[0];

  // Filter items based on search query
  const q = searchQuery.trim().toLowerCase();
  const matches = (text = '') => (!q ? true : text.toLowerCase().includes(q));

  const showAccount = matches(user.name) || matches(user.email) || matches('account details profile');
  const showWorkout = matches('workout') || matches('goals') || matches('schedule') || matches(activeGoal.label);
  const showTimer = matches('timer') || matches('alerts') || matches('rest') || matches('interval');
  const showUnitsLang = matches('units') || matches('language') || matches('lang') || matches('urdu') || matches('english') || matches('kg');
  const showEquipment = matches('equipment') || matches('weights') || matches('barbell') || matches('dumbbell');
  const showLook = matches('look') || matches('home') || matches('appearance') || matches('theme') || matches('dark') || matches('light');
  const showPassword = matches('password') || matches('security') || matches('change password');
  const showData = matches('data') || matches('privacy') || matches('export') || matches('delete') || matches('json');

  return (
    <section className="dash">
      <div className="container">
        {/* Profile Hero Header */}
        <div className="profile-hero">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <motion.div
              className="avatar xl"
              style={{ overflow: 'hidden', padding: 0 }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Profile'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials(user?.name)
              )}
            </motion.div>
            <label
              title="Change profile photo"
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent, #ff5500)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: '2px solid var(--surface, #ffffff)',
                transition: 'transform 0.2s',
              }}
            >
              <Upload width={14} height={14} />
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <Reveal>
              <span className="eyebrow">{t('profile.eyebrow', 'Profile & settings')}</span>
            </Reveal>
            <SplitText as="h1" className="display dash-title" animateNow delay={0.3} lines={[user.name]} />
            <Reveal delay={0.4}>
              <p className="muted" style={{ margin: 0 }}>
                {user.email} · {t('profile.member_since', 'Member since')}{' '}
                {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </Reveal>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              toast('Signed out — see you soon', 'info');
              navigate('/');
            }}
            style={{ marginLeft: 'auto' }}
          >
            <LogOut /> {t('profile.sign_out', 'Sign out')}
          </button>
        </div>

        {/* Sequenced iOS-Style Grouped Settings Cards */}
        <div className="settings-container">
          {/* Top Search Bar */}
          <div className="settings-search-wrap">
            <div className="settings-search-box">
              <Search width={18} height={18} />
              <input
                type="text"
                placeholder={t('profile.search_placeholder', 'Search settings...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search settings"
              />
            </div>
          </div>

          {/* Group 1: Standalone Account Card */}
          {showAccount && (
            <div className="settings-group">
              <div className="settings-card-group">
                <div className="settings-item">
                  <button
                    type="button"
                    className="settings-row"
                    onClick={() => toggleSection('account')}
                    aria-expanded={openSection === 'account'}
                  >
                    <div className="settings-badge avatar-badge" style={{ overflow: 'hidden', padding: 0 }}>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                      ) : (
                        <User width={20} height={20} />
                      )}
                    </div>
                    <div className="settings-info">
                      <span className="settings-title">{user.name}</span>
                      <span className="settings-sub">
                        {user.email} · {t('profile.account_sub', 'Example data, only in this browser.')}
                      </span>
                    </div>
                    <span className={`settings-chevron ${openSection === 'account' ? 'expanded' : ''}`}>
                      <ChevronRight width={18} height={18} />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {openSection === 'account' && (
                      <motion.div
                        key="account-drawer"
                        className="settings-drawer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="settings-drawer-inner">
                          <h4 style={{ margin: '0 0 14px', fontSize: 16 }}>{t('profile.your_details', 'Your details')}</h4>

                          {/* Profile Picture Upload & Preview */}
                          <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
                            <span className="field-label" style={{ display: 'block', marginBottom: 10 }}>
                              {t('profile.photo', 'Profile Photo')}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                              <div
                                style={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: '50%',
                                  background: 'var(--accent, #ff5e1a)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 20,
                                  fontWeight: 800,
                                  overflow: 'hidden',
                                  border: '2px solid rgba(255, 94, 26, 0.4)',
                                  flexShrink: 0,
                                }}
                              >
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  initials(user.name)
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                                  <Upload width={14} height={14} />
                                  <span>{user.avatar ? 'Change photo' : 'Upload photo'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleAvatarUpload}
                                  />
                                </label>
                                {user.avatar && (
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={handleRemoveAvatar}
                                    style={{ color: '#ef4444' }}
                                  >
                                    <Trash width={14} height={14} />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <form onSubmit={saveAccount} className="auth-form">
                            <div className="field-grid">
                              <label className="field">
                                <span className="field-label">{t('profile.full_name', 'Full name')}</span>
                                <input
                                  className="input"
                                  value={acct.name}
                                  onChange={(e) => setAcct({ ...acct, name: e.target.value })}
                                />
                              </label>
                              <label className="field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span className="field-label">{t('profile.email', 'Email')}</span>
                                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                                    {t('profile.email_locked', 'Permanent')}
                                  </span>
                                </div>
                                <input
                                  className="input"
                                  type="email"
                                  value={user?.email || acct.email}
                                  disabled
                                  readOnly
                                  style={{
                                    opacity: 0.65,
                                    cursor: 'not-allowed',
                                    backgroundColor: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
                                    color: 'var(--muted)',
                                  }}
                                  aria-readonly="true"
                                  title="Email address cannot be changed once registered"
                                />
                              </label>
                            </div>
                            {acctErr && <span className="field-error">{acctErr}</span>}
                            <button
                              className="btn btn-primary btn-sm"
                              type="submit"
                              style={{ alignSelf: 'flex-start', marginTop: 12 }}
                            >
                              <Check /> {t('profile.save_details', 'Save details')}
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {/* Group 2: Training */}
          {(showWorkout || showTimer) && (
            <div className="settings-group">
              <div className="settings-group-header">{t('profile.cat_training', 'Training')}</div>
              <div className="settings-card-group">
                {/* Row 1: Workout & Goals */}
                {showWorkout && (
                  <div className="settings-item">
                    <button
                      type="button"
                      className="settings-row"
                      onClick={() => toggleSection('workout')}
                      aria-expanded={openSection === 'workout'}
                    >
                      <div className="settings-badge" style={{ background: '#10b98122', color: '#10b981' }}>
                        <Play width={18} height={18} />
                      </div>
                      <div className="settings-info">
                        <span className="settings-title">{t('profile.workout_title', 'Workout')}</span>
                        <span className="settings-sub">
                          {activeGoal.label} · {prof.days} {t('profile.days_week', 'days / week')}
                        </span>
                      </div>
                      <span className={`settings-chevron ${openSection === 'workout' ? 'expanded' : ''}`}>
                        <ChevronRight width={18} height={18} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {openSection === 'workout' && (
                        <motion.div
                          key="workout-drawer"
                          className="settings-drawer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="settings-drawer-inner">
                            <h4 style={{ margin: '0 0 12px', fontSize: 16 }}>{t('profile.goal_schedule', 'Goal & schedule')}</h4>
                            <div className="goal-pills">
                              {GOALS.map((g) => {
                                const IconComp = GOAL_ICONS[g.key];
                                const isSelected = prof.goal === g.key;
                                return (
                                  <button
                                    key={g.key}
                                    type="button"
                                    className={`goal-btn ${isSelected ? 'active' : ''}`}
                                    onClick={() => setProf((prev) => ({ ...prev, goal: g.key }))}
                                  >
                                    {IconComp && <IconComp width={15} height={15} />}
                                    <span>{g.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="field-grid" style={{ marginTop: 16 }}>
                              <label className="field">
                                <span className="field-label">{t('profile.level', 'Level')}</span>
                                <select
                                  className="input"
                                  value={prof.level}
                                  onChange={(e) => setProf({ ...prof, level: e.target.value })}
                                >
                                  {LEVELS.map((l) => (
                                    <option key={l.key} value={l.key}>
                                      {l.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span className="field-label">{t('profile.days_week', 'Days / week')}</span>
                                <select
                                  className="input"
                                  value={prof.days}
                                  onChange={(e) => setProf({ ...prof, days: Number(e.target.value) })}
                                >
                                  {[2, 3, 4, 5, 6].map((d) => (
                                    <option key={d} value={d}>
                                      {d} days
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span className="field-label">{t('profile.weight', 'Weight (kg)')}</span>
                                <input
                                  className="input"
                                  type="number"
                                  value={prof.weight ?? ''}
                                  onChange={(e) => setProf({ ...prof, weight: e.target.value })}
                                />
                              </label>
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={saveProfile}
                              style={{ alignSelf: 'flex-start', marginTop: 16 }}
                            >
                              <Check /> {t('profile.update_profile', 'Update profile')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Row 2: Timer Alerts */}
                {showTimer && (
                  <div className="settings-item">
                    <button
                      type="button"
                      className="settings-row"
                      onClick={() => toggleSection('timer')}
                      aria-expanded={openSection === 'timer'}
                    >
                      <div className="settings-badge" style={{ background: '#f43f5e22', color: '#f43f5e' }}>
                        <Volume width={18} height={18} />
                      </div>
                      <div className="settings-info">
                        <span className="settings-title">{t('profile.timer_title', 'Timer alerts')}</span>
                        <span className="settings-sub">
                          {timerAlerts.duration}s {t('profile.rest_interval', 'rest interval')}
                        </span>
                      </div>
                      <span className={`settings-chevron ${openSection === 'timer' ? 'expanded' : ''}`}>
                        <ChevronRight width={18} height={18} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {openSection === 'timer' && (
                        <motion.div
                          key="timer-drawer"
                          className="settings-drawer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="settings-drawer-inner">
                            <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>{t('profile.timer_title', 'Timer alerts')}</h4>
                            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
                              {t('profile.timer_sub', 'Configure your default rest interval between sets.')}
                            </p>
                            <div className="field" style={{ maxWidth: 280 }}>
                              <span className="field-label">{t('profile.default_rest', 'Default rest between sets')}</span>
                              <select
                                className="input"
                                value={timerAlerts.duration}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setTimerAlerts({ duration: val });
                                  try {
                                    localStorage.setItem('fx:rest-timer', String(val));
                                  } catch {}
                                  if (user) {
                                    updateUser({ profile: { ...(user.profile || {}), rest: val } });
                                  }
                                }}
                              >
                                <option value={45}>45 seconds</option>
                                <option value={60}>60 seconds (1 min)</option>
                                <option value={90}>90 seconds (1:30 min)</option>
                                <option value={120}>120 seconds (2 min)</option>
                                <option value={180}>180 seconds (3 min)</option>
                              </select>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Row 3: Voice Guidelines Toggle */}
                <div className="settings-item">
                  <div
                    className="settings-row"
                    style={{ cursor: 'pointer' }}
                    onClick={handleToggleVoice}
                  >
                    <div className="settings-badge" style={{ background: '#3b82f622', color: '#3b82f6' }}>
                      <Volume width={18} height={18} />
                    </div>
                    <div className="settings-info">
                      <span className="settings-title">Voice guidelines</span>
                      <span className="settings-sub">
                        {voiceEnabled
                          ? 'Spoken cues for technique, countdowns & rest alerts'
                          : 'Voice audio cues are muted during workouts'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`toggle ${voiceEnabled ? 'on' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVoice();
                      }}
                      aria-pressed={voiceEnabled}
                      aria-label="Toggle voice guidelines"
                      style={{ height: 38, padding: '0 12px', flexShrink: 0 }}
                    >
                      <span className="sw" />
                      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 26 }}>
                        {voiceEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Group 3: Set once (Preferences, Units, Language, Theme) */}
          {(showUnitsLang || showEquipment || showLook) && (
            <div className="settings-group">
              <div className="settings-group-header">{t('profile.cat_set_once', 'Set once')}</div>
              <div className="settings-card-group">
                {/* Row 1: Units & language */}
                {showUnitsLang && (
                  <div className="settings-item">
                    <button
                      type="button"
                      className="settings-row"
                      onClick={() => toggleSection('units-lang')}
                      aria-expanded={openSection === 'units-lang'}
                    >
                      <div className="settings-badge" style={{ background: '#06b6d422', color: '#06b6d4' }}>
                        <Ruler width={18} height={18} />
                      </div>
                      <div className="settings-info">
                        <span className="settings-title">{t('profile.units_lang_title', 'Units & language')}</span>
                        <span className="settings-sub">
                          {prof.units || 'kg'} · {currentLanguage?.native} ({currentLanguage?.label})
                        </span>
                      </div>
                      <span className={`settings-chevron ${openSection === 'units-lang' ? 'expanded' : ''}`}>
                        <ChevronRight width={18} height={18} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {openSection === 'units-lang' && (
                        <motion.div
                          key="units-lang-drawer"
                          className="settings-drawer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="settings-drawer-inner">
                            <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>
                              {t('profile.language_title', 'Interface & Instruction Language')}
                            </h4>
                            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
                              {t(
                                'profile.language_sub',
                                'Choose the language for the entire web interface and exercise instructions.'
                              )}
                            </p>

                            {/* Clean Dropdown Language Selector including Urdu & All 12 languages */}
                            <div className="field" style={{ maxWidth: 380, marginBottom: 20 }}>
                              <label className="field-label" htmlFor="profile-select-language">
                                {t('profile.select_language', 'Select Language')}
                              </label>
                              <select
                                id="profile-select-language"
                                className="input"
                                value={lang}
                                onChange={(e) => {
                                  const newLang = e.target.value;
                                  setLanguage(newLang);
                                  const chosen = languages.find((l) => l.code === newLang);
                                  toast(
                                    `Language set to ${chosen?.native || newLang} (${chosen?.label || ''})`,
                                    'bolt'
                                  );
                                  if (voiceEnabled) {
                                    speakVoice('lang_changed', { lang: newLang, interrupt: true });
                                  }
                                }}
                                style={{
                                  fontWeight: 700,
                                  fontSize: 15,
                                  cursor: 'pointer',
                                }}
                              >
                                {languages.map((l) => (
                                  <option key={l.code} value={l.code}>
                                    {l.native} — {l.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                              <label className="field-label" style={{ marginBottom: 8, display: 'block' }}>
                                {t('profile.units_label', 'Weight units')}
                              </label>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                  type="button"
                                  className={`fchip ${prof.units !== 'lb' ? 'active' : ''}`}
                                  onClick={() => {
                                    setProf({ ...prof, units: 'kg' });
                                    updateUser({ profile: { ...prof, units: 'kg' } });
                                    toast('Units set to Metric (kg)', 'bolt');
                                  }}
                                >
                                  {prof.units !== 'lb' && <motion.span className="bg" layoutId="unitBg" />}
                                  <span>{t('profile.units_kg', 'Metric (kg)')}</span>
                                </button>
                                <button
                                  type="button"
                                  className={`fchip ${prof.units === 'lb' ? 'active' : ''}`}
                                  onClick={() => {
                                    setProf({ ...prof, units: 'lb' });
                                    updateUser({ profile: { ...prof, units: 'lb' } });
                                    toast('Units set to Imperial (lb)', 'bolt');
                                  }}
                                >
                                  {prof.units === 'lb' && <motion.span className="bg" layoutId="unitBg" />}
                                  <span>{t('profile.units_lb', 'Imperial (lb)')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Row 2: Equipment */}
                {showEquipment && (
                  <div className="settings-item">
                    <button
                      type="button"
                      className="settings-row"
                      onClick={() => toggleSection('equipment')}
                      aria-expanded={openSection === 'equipment'}
                    >
                      <div className="settings-badge" style={{ background: '#6366f122', color: '#6366f1' }}>
                        <Dumbbell width={18} height={18} />
                      </div>
                      <div className="settings-info">
                        <span className="settings-title">{t('profile.equipment_title', 'Equipment')}</span>
                        <span className="settings-sub">{t('profile.equipment_sub', 'Everything')}</span>
                      </div>
                      <span className={`settings-chevron ${openSection === 'equipment' ? 'expanded' : ''}`}>
                        <ChevronRight width={18} height={18} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {openSection === 'equipment' && (
                        <motion.div
                          key="equipment-drawer"
                          className="settings-drawer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="settings-drawer-inner">
                            <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>{t('profile.equipment_title', 'Equipment')}</h4>
                            <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
                              Fitnex exercises support 28 equipment types, from bodyweight to barbells, dumbbells, cables, bands, and machines.
                            </p>
                            <Link to="/exercises" className="btn btn-ghost btn-sm">
                              Explore exercise equipment <Arrow />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Row 3: Look & Home */}
                {showLook && (
                  <div className="settings-item">
                    <button
                      type="button"
                      className="settings-row"
                      onClick={() => toggleSection('look')}
                      aria-expanded={openSection === 'look'}
                    >
                      <div className="settings-badge" style={{ background: '#a855f722', color: '#a855f7' }}>
                        <Palette width={18} height={18} />
                      </div>
                      <div className="settings-info">
                        <span className="settings-title">{t('profile.look_title', 'Look & Home')}</span>
                        <span className="settings-sub">
                          {isDark ? t('profile.dark_theme', 'Dark theme') : t('profile.light_theme', 'Light theme')} · Ember Orange
                        </span>
                      </div>
                      <span className={`settings-chevron ${openSection === 'look' ? 'expanded' : ''}`}>
                        <ChevronRight width={18} height={18} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {openSection === 'look' && (
                        <motion.div
                          key="look-drawer"
                          className="settings-drawer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="settings-drawer-inner">
                            <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>{t('profile.appearance', 'Appearance')}</h4>
                            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
                              {t('profile.appearance_sub', 'Select your interface appearance for training and workouts.')}
                            </p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className={`fchip ${isDark ? 'active' : ''}`}
                                onClick={() => {
                                  if (!isDark) toggleTheme();
                                }}
                              >
                                {isDark && (
                                  <motion.span
                                    className="bg"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                                  />
                                )}
                                <Moon width={14} height={14} /> <span>{t('profile.dark_theme', 'Dark theme')}</span>
                              </button>
                              <button
                                type="button"
                                className={`fchip ${!isDark ? 'active' : ''}`}
                                onClick={() => {
                                  if (isDark) toggleTheme();
                                }}
                              >
                                {!isDark && (
                                  <motion.span
                                    className="bg"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                                  />
                                )}
                                <Sun width={14} height={14} /> <span>{t('profile.light_theme', 'Light theme')}</span>
                              </button>
                            </div>

                            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line, rgba(0, 0, 0, 0.08))' }}>
                              <label className="field" style={{ maxWidth: 360, margin: 0 }}>
                                <span className="field-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 13 }}>
                                  {t('profile.cursor_color', 'Cursor Color')}
                                </span>
                                <div className="select-wrap" style={{ position: 'relative' }}>
                                  <select
                                    className="input cursor-color-select"
                                    value={cursorColor}
                                    onChange={(e) => handleCursorColorChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      height: 46,
                                      padding: '0 36px 0 14px',
                                      fontSize: 14,
                                      fontWeight: 600,
                                      borderRadius: 10,
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      background: 'var(--surface-1, #ffffff)',
                                      border: '1px solid var(--line-2, #e4e4e7)',
                                      color: 'var(--text, #18181b)'
                                    }}
                                  >
                                    <option value="black">⚫ Black (Classic clean)</option>
                                    <option value="white">⚪ White (Recommended for Dark mode)</option>
                                    <option value="orange">🟠 Orange (Brand signature)</option>
                                  </select>
                                </div>
                              </label>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Group 4: Security & Data */}
          {(showPassword || showData) && (
            <div className="settings-group">
              <div className="settings-group-header">{t('profile.cat_security', 'Security & Data')}</div>
              <div className="settings-card-group">
                {/* Row 1: Password & Security */}
                {showPassword && (
                  <div className="settings-item">
                    <button
                      type="button"
                      className="settings-row"
                      onClick={() => toggleSection('security')}
                      aria-expanded={openSection === 'security'}
                    >
                      <div className="settings-badge" style={{ background: '#f59e0b22', color: '#f59e0b' }}>
                        <Lock width={18} height={18} />
                      </div>
                      <div className="settings-info">
                        <span className="settings-title">{t('profile.security_title', 'Password & Security')}</span>
                        <span className="settings-sub">{t('profile.security_sub', 'Change sign-in password')}</span>
                      </div>
                      <span className={`settings-chevron ${openSection === 'security' ? 'expanded' : ''}`}>
                        <ChevronRight width={18} height={18} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {openSection === 'security' && (
                        <motion.div
                          key="security-drawer"
                          className="settings-drawer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="settings-drawer-inner">
                            <h4 style={{ margin: '0 0 14px', fontSize: 16 }}>{t('profile.change_password', 'Change password')}</h4>
                            <form onSubmit={savePassword} className="auth-form">
                              <div className="field-grid">
                                <label className="field">
                                  <span className="field-label">{t('profile.current_password', 'Current password')}</span>
                                  <input
                                    className="input"
                                    type="password"
                                    autoComplete="current-password"
                                    value={pw.current}
                                    onChange={(e) => setPw({ ...pw, current: e.target.value })}
                                  />
                                </label>
                                <label className="field">
                                  <span className="field-label">{t('profile.new_password', 'New password')}</span>
                                  <input
                                    className="input"
                                    type="password"
                                    autoComplete="new-password"
                                    value={pw.next}
                                    onChange={(e) => setPw({ ...pw, next: e.target.value })}
                                  />
                                </label>
                              </div>
                              {pw.next && <StrengthMeter password={pw.next} />}
                              {pwErr && <span className="field-error">{pwErr}</span>}
                              <button
                                className="btn btn-primary btn-sm"
                                type="submit"
                                style={{ alignSelf: 'flex-start', marginTop: 12 }}
                                disabled={!pw.current || !pw.next}
                              >
                                <Check /> {t('profile.update_password', 'Update password')}
                              </button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Row 2: Data & Privacy */}
                {showData && (
                  <div className="settings-item">
                    <button
                      type="button"
                      className="settings-row"
                      onClick={() => toggleSection('data')}
                      aria-expanded={openSection === 'data'}
                    >
                      <div className="settings-badge" style={{ background: '#ef444422', color: '#ef4444' }}>
                        <Trash width={18} height={18} />
                      </div>
                      <div className="settings-info">
                        <span className="settings-title">{t('profile.data_title', 'Data & Privacy')}</span>
                        <span className="settings-sub">
                          {history.length} workouts · {favorites.length} {t('nav.favorites', 'Favourites')} · {t('profile.export_json', 'Export JSON')}
                        </span>
                      </div>
                      <span className={`settings-chevron ${openSection === 'data' ? 'expanded' : ''}`}>
                        <ChevronRight width={18} height={18} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {openSection === 'data' && (
                        <motion.div
                          key="data-drawer"
                          className="settings-drawer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="settings-drawer-inner">
                            <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>{t('profile.export_delete', 'Export or delete')}</h4>
                            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
                              {history.length} workouts · {favorites.length} favourites · stored locally on this device.
                            </p>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={exportData}
                              style={{ alignSelf: 'flex-start', marginBottom: 20 }}
                            >
                              <Download /> {t('profile.export_json', 'Export my data (JSON)')}
                            </button>

                            <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                              <span className="field-label" style={{ color: 'var(--hot)', fontWeight: 700 }}>
                                {t('profile.delete_confirm', 'Type DELETE to permanently remove your account')}
                              </span>
                              <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                                <input
                                  className="input"
                                  style={{ flex: '1 1 180px' }}
                                  value={confirm}
                                  onChange={(e) => setConfirm(e.target.value)}
                                  placeholder="DELETE"
                                />
                                <AnimatePresence>
                                  {confirm === 'DELETE' && (
                                    <motion.button
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="btn btn-danger"
                                      onClick={remove}
                                    >
                                      <Trash /> {t('profile.delete_account', 'Delete account')}
                                    </motion.button>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
