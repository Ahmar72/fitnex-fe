import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { Paper, Reveal, SplitText } from '../components/Motion.jsx';
import { ArrowUpRight, Arrow } from '../components/Icons.jsx';
import { BODY_PARTS, sample } from '../lib/utils.js';

const ease = [0.22, 1, 0.36, 1];

export default function Explorer() {
  const { exercises, facets } = useData();
  const navigate = useNavigate();
  const [part, setPart] = useState('chest');

  const counts = Object.fromEntries(facets.bodyPart);
  const parts = BODY_PARTS.filter((b) => counts[b.key] > 2);
  const list = useMemo(() => sample(exercises.filter((e) => e.bodyPart === part), 7, 5), [exercises, part]);
  const [feature, ...rest] = list;

  return (
    <section className="section" id="explore" style={{ background: 'var(--bg-2)' }}>
      <div className="container">
        <div className="section-head">
          <div>
            <Reveal><span className="eyebrow">Explore by body part</span></Reveal>
            <SplitText className="display h2" lines={['Pick a muscle.', <span key="a" className="accent">Find the move.</span>]} />
          </div>
          <Reveal delay={0.15}>
            <Link to="/exercises" className="btn btn-ghost">Open full library <Arrow /></Link>
          </Reveal>
        </div>

        <Reveal className="tabs">
          {parts.map((b) => (
            <button key={b.key} className={`tab ${part === b.key ? 'active' : ''}`} onClick={() => setPart(b.key)}>
              {part === b.key && <motion.span className="tab-bg" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 28 }} />}
              <span>{b.label}</span>
              <small>{counts[b.key]}</small>
            </button>
          ))}
        </Reveal>

        <AnimatePresence mode="wait">
          {feature && (
            <motion.div
              key={part}
              className="explorer"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } }, exit: { opacity: 0, transition: { duration: 0.2 } } }}
            >
              <motion.div variants={{ hidden: { opacity: 0, x: -40 }, show: { opacity: 1, x: 0, transition: { duration: 0.7, ease } } }}>
                <Link to={`/exercises/${feature.id}`} className="explorer-feature paper" data-cursor="Open" style={{ height: '100%' }}>
                  <div className="paper-img">
                    <motion.img
                      src={`${import.meta.env.BASE_URL}${feature.gif}`}
                      alt={feature.name}
                      initial={{ scale: 0.8, rotate: -4 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 1, ease }}
                    />
                  </div>
                  <div className="info">
                    <div>
                      <span className="chip" style={{ background: '#111', color: 'var(--accent)', border: 0 }}>Featured</span>
                      <h3 style={{ marginTop: 12, textTransform: 'uppercase' }}>{feature.name}</h3>
                      <p>{feature.target} · {feature.equipment}</p>
                    </div>
                    <span className="go"><ArrowUpRight width={24} height={24} /></span>
                  </div>
                </Link>
              </motion.div>
              <div className="explorer-grid">
                {rest.map((e) => (
                  <motion.div key={e.id} variants={{ hidden: { opacity: 0, y: 30, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease } } }}>
                    <Paper src={e.image} gif={e.gif} autoplay alt={e.name} onClick={() => navigate(`/exercises/${e.id}`)} data-cursor="View">
                      <span className="lbl">{e.name}</span>
                    </Paper>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
