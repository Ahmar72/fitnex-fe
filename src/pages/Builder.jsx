import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Paper, Reveal, SplitText } from '../components/Motion.jsx';
import { Arrow, Check, Down, Play, Plus, Search, Trash, Up, X } from '../components/Icons.jsx';
import { ROUTINES } from '../sections/Programs.jsx';
import { BODY_PARTS, asset, dayKey, fmt } from '../lib/utils.js';
import { createPortal } from 'react-dom';
import { lockScroll } from '../lib/useSmoothScroll.js';

const ease = [0.22, 1, 0.36, 1];

const WorkoutItem = forwardRef(function WorkoutItem({ item, ex, index, total }, ref) {
  const { removeItem, moveItem, addSet, removeSet, updateSet } = useWorkout();
  const { t } = useLanguage();
  return (
    <motion.div
      ref={ref}
      layout
      className="wk-item"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, transition: { duration: 0.25 } }}
      transition={{ duration: 0.5, ease }}
    >
      <div className="wk-item-head">
        <Link to={`/exercises/${ex.id}`} title="View exercise details">
          <Paper src={ex.image} gif={ex.gif} autoplay alt={ex.name} />
        </Link>
        <div className="grow">
          <Link
            to={`/exercises/${ex.id}`}
            className="wk-item-title-link"
            title="Click to view exercise details"
          >
            <h3>{ex.name}</h3>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span className="chip">{ex.target}</span>
            <span className="chip">{ex.equipment}</span>
            <Link
              to={`/exercises/${ex.id}`}
              className="wk-item-view-link"
              title="View full exercise details"
            >
              View details ↗
            </Link>
          </div>
        </div>
        <div className="tools">
          <button className="icon-btn" onClick={() => moveItem(item.uid, -1)} disabled={index === 0} aria-label="Move up" style={{ opacity: index === 0 ? 0.3 : 1 }}><Up /></button>
          <button className="icon-btn" onClick={() => moveItem(item.uid, 1)} disabled={index === total - 1} aria-label="Move down" style={{ opacity: index === total - 1 ? 0.3 : 1 }}><Down /></button>
          <button className="icon-btn" onClick={() => removeItem(item.uid)} aria-label="Remove exercise"><Trash /></button>
        </div>
      </div>
      <div className="sets">
        <div className="set-row head">
          <span style={{ textAlign: 'center' }}>{t('builder.col_set', 'Set')}</span>
          <span>{t('builder.col_kg', 'Kg')}</span>
          <span>{t('builder.col_reps', 'Reps')}</span>
          <span style={{ textAlign: 'center' }}>{t('builder.col_status', 'Status')}</span>
          <span />
        </div>
        <AnimatePresence initial={false}>
          {item.sets.map((s, i) => (
            <motion.div
              key={s.id}
              className={`set-row ${s.done ? 'done' : ''}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="n">{i + 1}</span>
              <input
                className="num-input"
                type="number"
                min="0"
                step="0.5"
                value={s.weight}
                disabled={s.done}
                onChange={(e) => updateSet(item.uid, s.id, { weight: e.target.value })}
                aria-label={`Set ${i + 1} weight`}
              />
              <input
                className="num-input"
                type="number"
                min="0"
                value={s.reps}
                disabled={s.done}
                onChange={(e) => updateSet(item.uid, s.id, { reps: e.target.value })}
                aria-label={`Set ${i + 1} reps`}
              />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {s.done ? (
                  <span className="builder-set-done-badge" title="Set completed (locked)">
                    <Check width={14} height={14} /> Done
                  </span>
                ) : (
                  <button
                    type="button"
                    className="builder-set-start-btn"
                    onClick={() => updateSet(item.uid, s.id, { done: true })}
                    aria-label={`Start set ${i + 1}`}
                  >
                    <Play width={12} height={12} /> Start
                  </button>
                )}
              </div>
              <button
                className="x-btn"
                onClick={() => !s.done && removeSet(item.uid, s.id)}
                disabled={s.done}
                style={{ opacity: s.done ? 0.25 : 1, cursor: s.done ? 'not-allowed' : 'pointer' }}
                aria-label="Remove set"
              >
                <X width={16} height={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <button className="add-set" onClick={() => addSet(item.uid)}>{t('builder.add_set', '+ Add set')}</button>
    </motion.div>
  );
});

function LiveMode({ items, byId, onClose }) {
  const { updateSet, finish } = useWorkout();
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);
  const [rest, setRest] = useState(0);
  const [restMax, setRestMax] = useState(60);

  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
  }, []);

  useEffect(() => {
    if (rest <= 0) return;
    const timeOut = setTimeout(() => setRest((r) => r - 1), 1000);
    return () => clearTimeout(timeOut);
  }, [rest]);

  useEffect(() => {
    if (rest === 0 && restMax && navigator.vibrate) navigator.vibrate?.(200);
  }, [rest, restMax]);

  const item = items[Math.min(idx, items.length - 1)];
  if (!item) return null;
  const ex = byId.get(item.exerciseId);
  const allSets = items.flatMap((i) => i.sets);
  const doneCount = allSets.filter((s) => s.done).length;
  const C = 2 * Math.PI * 56;

  const tick = (s) => {
    if (s.done) return;
    updateSet(item.uid, s.id, { done: true });
    setRestMax(60);
    setRest(60);
  };
  const end = () => {
    if (finish()) onClose();
  };

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
            key={ex.id}
            src={asset(ex.gif)}
            alt={ex.name}
            initial={{ opacity: 0, scale: 0.85, x: 60 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -60 }}
            transition={{ duration: 0.6, ease }}
          />
        </AnimatePresence>
      </div>
      <div className="live-panel">
        <div className="live-top">
          <span className="eyebrow">{t('builder.eyebrow', 'Workout builder')} · {idx + 1} / {items.length}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close live mode"><X /></button>
        </div>
        <div className="live-progress"><span style={{ width: `${(doneCount / Math.max(1, allSets.length)) * 100}%` }} /></div>
        <AnimatePresence mode="wait">
          <motion.div key={ex.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease }}>
            <h2 className="display">{ex.name}</h2>
            <p className="muted" style={{ margin: '10px 0 0', textTransform: 'capitalize' }}>{ex.target} · {ex.equipment}</p>
            <p className="muted" style={{ fontSize: 14 }}>{ex.steps[0]}</p>
          </motion.div>
        </AnimatePresence>

        <div className="sets">
          {item.sets.map((s, i) => (
            <div key={s.id} className={`set-row ${s.done ? 'done' : ''}`} style={{ gridTemplateColumns: '46px 1fr 1fr 90px' }}>
              <span className="n">{i + 1}</span>
              <input className="num-input" type="number" value={s.weight} disabled={s.done} onChange={(e) => updateSet(item.uid, s.id, { weight: e.target.value })} aria-label="Weight" />
              <input className="num-input" type="number" value={s.reps} disabled={s.done} onChange={(e) => updateSet(item.uid, s.id, { reps: e.target.value })} aria-label="Reps" />
              {s.done ? (
                <span className="builder-set-done-badge" title="Set completed (locked)">
                  <Check width={14} height={14} /> Done
                </span>
              ) : (
                <button
                  type="button"
                  className="builder-set-start-btn"
                  onClick={() => tick(s)}
                  aria-label={`Start set ${i + 1}`}
                >
                  <Play width={12} height={12} /> Start
                </button>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {rest > 0 && (
            <motion.div className="rest" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <svg viewBox="0 0 130 130">
                <circle cx="65" cy="65" r="56" stroke="var(--ring-track)" strokeWidth="10" fill="none" />
                <circle cx="65" cy="65" r="56" stroke="var(--accent)" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - rest / restMax)} transform="rotate(-90 65 65)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div>
                <span className="eyebrow">{t('builder.rest', 'Rest')}</span>
                <div className="t">{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setRest((r) => r + 15); setRestMax((m) => m + 15); }}>+15s</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setRest(0)}>{t('builder.skip', 'Skip')}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="live-nav">
          <button className="btn btn-ghost" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>{t('builder.prev', '← Previous')}</button>
          {idx < items.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setIdx((i) => i + 1)}>{t('builder.next_ex', 'Next exercise →')} <Arrow /></button>
          ) : (
            <button className="btn btn-primary" onClick={end}><Check /> {t('builder.finish_live', 'Finish & log')}</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Builder() {
  const { exercises, byId, ready, findByName } = useData();
  const { workout, history, rename, clear, finish, addToWorkout, loadRoutine, clearHistory } = useWorkout();
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [live, setLive] = useState(false);

  const items = workout.items.filter((i) => byId.has(i.exerciseId));

  const stats = useMemo(() => {
    const sets = items.flatMap((i) => i.sets);
    const done = sets.filter((s) => s.done);
    const vol = sets.reduce((a, s) => a + Number(s.reps || 0) * Number(s.weight || 0), 0);
    const parts = {};
    items.forEach((i) => {
      const p = byId.get(i.exerciseId)?.bodyPart;
      parts[p] = (parts[p] || 0) + i.sets.length;
    });
    return { sets: sets.length, done: done.length, vol, mins: Math.round(sets.length * 2.5), parts };
  }, [items, byId]);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return exercises.filter((e) => `${e.name} ${e.target} ${e.equipment}`.toLowerCase().includes(t)).slice(0, 10);
  }, [q, exercises]);

  const weeks = useMemo(() => {
    const byDay = {};
    history.forEach((h) => (byDay[h.date] = (byDay[h.date] || 0) + h.sets));
    const days = [];
    const today = new Date();
    for (let i = 7 * 16 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(byDay[dayKey(d)] || 0);
    }
    return days;
  }, [history]);

  const loadPreset = (r) => {
    const list = r.list.map(([n, sets, reps]) => ({ ex: findByName(n), sets, reps })).filter((x) => x.ex);
    loadRoutine(r.name, list.map(({ ex, sets, reps }) => ({ id: ex.id, sets, reps })));
  };

  const partsMax = Math.max(1, ...Object.values(stats.parts));

  return (
    <>
      <section className="page-head" style={{ paddingBottom: 20 }}>
        <div className="container">
          <h1 className="display h1" style={{ whiteSpace: 'nowrap', margin: 0, textTransform: 'uppercase' }}>
            {t('builder.title_1', 'Build it.')} <span className="accent">{t('builder.title_2', 'Lift it.')}</span>
          </h1>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 120 }}>
        <div className="builder">
          <div>
            <div className="wk-title">
              <input value={workout.name} onChange={(e) => rename(e.target.value)} aria-label="Workout name" maxLength={40} />
              {items.length > 0 && (
                <button className="btn btn-primary" onClick={() => setLive(true)}><Play /> {t('builder.start', 'Start workout')}</button>
              )}
            </div>

            {!ready ? (
              <div className="loader-dots"><i /><i /><i /></div>
            ) : items.length === 0 ? (
              <motion.div className="card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ padding: 36 }}>
                <span className="tag">{t('builder.empty_title', 'Empty workout')}</span>
                <h3>{t('builder.empty_sub', 'Start from scratch — or a template.')}</h3>
                <p>{t('builder.empty_desc', 'Add exercises from the library, use quick add, or load one of our programmes below.')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 26 }}>
                  {ROUTINES.map((r) => {
                    const first = findByName(r.list[0][0]);
                    return (
                      <motion.button key={r.name} className="card" style={{ padding: 16, textAlign: 'left', background: 'var(--surface-2)' }} whileHover={{ y: -4 }} onClick={() => loadPreset(r)}>
                        {first && <Paper src={first.image} gif={first.gif} autoplay style={{ borderRadius: 12, aspectRatio: 1.6, marginBottom: 12 }} />}
                        <b>{r.name}</b>
                        <span className="muted" style={{ fontSize: 13 }}>{r.level} · {r.list.length} exercises</span>
                      </motion.button>
                    );
                  })}
                </div>
                <Link to="/exercises" className="btn btn-ghost" style={{ marginTop: 20, alignSelf: 'flex-start' }}>{t('builder.browse_lib', 'Browse library')} <Arrow /></Link>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {items.map((it, i) => (
                  <WorkoutItem key={it.uid} item={it} ex={byId.get(it.exerciseId)} index={i} total={items.length} />
                ))}
              </AnimatePresence>
            )}
          </div>

          <aside className="builder-side">
            <Reveal delay={0.3} className="card summary">
              <h4>{t('builder.summary_title', 'Session summary')}</h4>
              <div className="summary-grid">
                <div><b>{items.length}</b><small>{t('builder.stat_exercises', 'Exercises')}</small></div>
                <div><b>{stats.done}/{stats.sets}</b><small>{t('builder.stat_sets_done', 'Sets done')}</small></div>
                <div><b>{fmt(stats.vol)}</b><small>{t('builder.stat_volume', 'Planned kg volume')}</small></div>
                <div><b>~{stats.mins}</b><small>{t('builder.stat_minutes', 'Minutes')}</small></div>
              </div>
              {Object.keys(stats.parts).length > 0 && (
                <div className="bars" style={{ paddingTop: 18 }}>
                  {BODY_PARTS.filter((b) => stats.parts[b.key]).map((b) => (
                    <div className="bar-row" key={b.key}>
                      <span>{t(`part.${b.key}`, b.label)}</span>
                      <div className="bar-track">
                        <motion.div className="bar-fill" style={{ background: b.color }} animate={{ width: `${(stats.parts[b.key] / partsMax) * 100}%` }} transition={{ duration: 0.6, ease }} />
                      </div>
                      <span style={{ textAlign: 'right' }}>{stats.parts[b.key]}</span>
                    </div>
                  ))}
                </div>
              )}
              {items.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={finish} style={{ flex: 1 }}><Check /> {t('builder.finish', 'Finish & log')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.confirm('Remove all exercises from this workout?') && clear()}><Trash /> {t('builder.clear', 'Clear')}</button>
                </div>
              )}
            </Reveal>

            <Reveal delay={0.4} className="card">
              <h4 className="eyebrow" style={{ margin: 0 }}>{t('builder.quick_add', 'Quick add')}</h4>
              <label className="search" style={{ marginTop: 14, flex: 'none' }}>
                <Search />
                <input className="input" placeholder={t('builder.search_ph', 'e.g. squat, biceps, cable')} value={q} onChange={(e) => setQ(e.target.value)} />
              </label>
              <div className="quick-add" data-lenis-prevent>
                <AnimatePresence>
                  {matches.map((e, i) => (
                    <motion.button key={e.id} onClick={() => addToWorkout(e.id)} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03 } }} exit={{ opacity: 0 }}>
                      <Paper src={e.image} />
                      <span>{e.name}</span>
                      <span className="plus"><Plus width={18} height={18} /></span>
                    </motion.button>
                  ))}
                </AnimatePresence>
                {q && matches.length === 0 && <p className="muted" style={{ fontSize: 14 }}>No matches.</p>}
              </div>
            </Reveal>

            <Reveal delay={0.5} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 className="eyebrow" style={{ margin: 0 }}>{t('builder.training_log', 'Training log')}</h4>
                {history.length > 0 && <button className="link-btn" onClick={() => window.confirm('Delete your whole training log?') && clearHistory()}>{t('builder.reset', 'Reset')}</button>}
              </div>
              <div className="heat" style={{ paddingTop: 16 }}>
                {weeks.map((v, i) => (
                  <i key={i} style={{ background: v === 0 ? 'var(--heat-0)' : v < 6 ? 'var(--heat-1)' : v < 15 ? 'var(--heat-2)' : 'var(--heat-3)' }} title={v ? `${v} sets` : ''} />
                ))}
              </div>
              <div className="history-list" style={{ marginTop: 16 }}>
                {history.length === 0 && <p className="muted" style={{ fontSize: 14, margin: 0 }}>Finish a workout to start your streak.</p>}
                {history.slice(0, 5).map((h) => (
                  <div key={h.id}>
                    <b>{h.name}</b>
                    <span>{h.date} · {h.sets} sets · {fmt(h.volume)} kg</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      {createPortal(
        <AnimatePresence>
          {live && items.length > 0 && <LiveMode items={items} byId={byId} onClose={() => setLive(false)} />}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
