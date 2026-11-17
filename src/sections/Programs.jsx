import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { GlowCard, Paper, Reveal, SplitText } from '../components/Motion.jsx';
import { Arrow } from '../components/Icons.jsx';

export const ROUTINES = [
  {
    name: 'Strength Split',
    level: 'Intermediate',
    time: '60 min',
    blurb: 'Heavy compound lifts for raw strength. Four days a week.',
    list: [
      ['barbell bench press', 4, 8],
      ['barbell full squat', 4, 6],
      ['barbell bent over row', 4, 8],
      ['barbell seated overhead press', 3, 10],
      ['barbell romanian deadlift', 3, 10],
      ['cable pulldown', 3, 12],
    ],
  },
  {
    name: 'Full Body Starter',
    level: 'Beginner',
    time: '45 min',
    blurb: 'Every major muscle, three days a week. The perfect first programme.',
    featured: true,
    list: [
      ['dumbbell goblet squat', 3, 12],
      ['dumbbell bench press', 3, 10],
      ['cable seated row', 3, 12],
      ['dumbbell lateral raise', 3, 15],
      ['barbell curl', 3, 12],
      ['crunch floor', 3, 20],
    ],
  },
  {
    name: 'Home Burner',
    level: 'All levels',
    time: '30 min',
    blurb: 'Zero equipment, maximum sweat. Train anywhere, any time.',
    list: [
      ['push-up', 4, 15],
      ['jump squat', 4, 12],
      ['inverted row', 3, 10],
      ['burpee', 3, 10],
      ['mountain climber', 3, 20],
      ['diamond push-up', 3, 10],
    ],
  },
];

export default function Programs() {
  const { findByName, ready } = useData();
  const { loadRoutine } = useWorkout();
  const { user } = useAuth();
  const navigate = useNavigate();

  const routines = useMemo(
    () =>
      ROUTINES.map((r) => ({
        ...r,
        items: r.list.map(([n, sets, reps]) => ({ ex: findByName(n), sets, reps })).filter((x) => x.ex),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready]
  );

  const start = (r) => {
    if (!user) {
      navigate('/signup', { state: { from: '/dashboard' } });
      return;
    }
    loadRoutine(r.name, r.items.map(({ ex, sets, reps }) => ({ id: ex.id, sets, reps })));
    navigate('/builder');
  };

  return (
    <section className="section" id="programs">
      <div className="container">
        <div className="section-head">
          <div>
            <Reveal><span className="eyebrow">Ready-made programs</span></Reveal>
            <SplitText className="display h2" lines={['Don’t know', <span key="a" className="accent">where to start?</span>]} />
          </div>
          <Reveal delay={0.15}>
            <p className="lead">Load a proven routine into the builder with one tap, then tweak the sets, reps and weights to suit you.</p>
          </Reveal>
        </div>
        <div className="programs">
          {routines.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.12} style={{ display: 'flex' }}>
              <GlowCard className={`program ${r.featured ? 'featured' : ''}`} style={{ flex: 1 }} tilt={4}>
                <div className="program-media">
                  {r.items.slice(0, 6).map(({ ex }, j) => (
                    <motion.div key={ex.id} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + j * 0.06 }}>
                      <Paper src={ex.image} gif={ex.gif} autoplay alt={ex.name} />
                    </motion.div>
                  ))}
                </div>
                <div className="program-body">
                  <div className="program-top">
                    <span className="chip">{r.level}</span>
                    <span className="chip">{r.time}</span>
                    {r.featured && <span className="chip" style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 0 }}>Most popular</span>}
                  </div>
                  <div>
                    <h3>{r.name}</h3>
                    <p>{r.blurb}</p>
                  </div>
                  <ul>
                    {r.items.map(({ ex, sets, reps }) => (
                      <li key={ex.id}>
                        <span>{ex.name}</span>
                        <span>{sets} × {reps}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`btn ${r.featured ? 'btn-primary' : 'btn-ghost'}`} onClick={() => start(r)}>
                    Load into builder <Arrow />
                  </button>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
