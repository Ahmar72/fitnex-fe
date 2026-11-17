import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Paper } from './Motion.jsx';
import { Heart, Plus, ArrowUpRight } from './Icons.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { partMeta, asset } from '../lib/utils.js';

const ExerciseCard = forwardRef(function ExerciseCard({ ex, index = 0, viewMode = 'grid' }, ref) {
  const { favorites, toggleFavorite, addToWorkout } = useWorkout();
  const fav = favorites.includes(ex.id);
  const part = partMeta(ex.bodyPart);
  const [hover, setHover] = useState(false);
  const stop = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  // LIST VIEW: Sleek horizontal white card row
  if (viewMode === 'list') {
    return (
      <motion.article
        ref={ref}
        layout
        className="ex-list-item"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
        transition={{ duration: 0.35, delay: Math.min(index % 12, 11) * 0.025 }}
      >
        <Link to={`/exercises/${ex.id}`} className="ex-list-thumb" title={ex.name}>
          <img
            src={asset(ex.image || `images/${ex.id}.jpg`)}
            alt={ex.name}
            onError={(e) => {
              e.currentTarget.src = asset('images/0001-2gPfomN.jpg');
            }}
          />
        </Link>
        <div className="ex-list-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ex-list-id">#{ex.id}</span>
            <Link to={`/exercises/${ex.id}`} className="ex-list-title">
              {ex.name}
            </Link>
          </div>
          <div className="ex-list-tags">
            <span className="chip"><span className="dot" style={{ background: part.color }} />{part.label}</span>
            <span className="chip">{ex.target}</span>
            <span className="chip">{ex.equipment}</span>
          </div>
        </div>
        <div className="ex-list-actions">
          <button
            type="button"
            className={`icon-btn ${fav ? 'on' : ''}`}
            onClick={stop(() => toggleFavorite(ex.id))}
            aria-label={fav ? 'Remove favourite' : 'Add favourite'}
            title={fav ? 'Remove favourite' : 'Add favourite'}
          >
            <Heart filled={fav} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={stop(() => addToWorkout(ex.id))}
            aria-label="Add to workout"
            title="Add to workout"
          >
            <Plus />
          </button>
          <Link to={`/exercises/${ex.id}`} className="ex-list-btn" title="View exercise details">
            View <ArrowUpRight width={14} height={14} />
          </Link>
        </div>
      </motion.article>
    );
  }

  // GRID VIEW: Pure white card with centered visual, tags, and action triggers
  return (
    <motion.article
      ref={ref}
      layout
      className="ex-card"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      transition={{ duration: 0.4, delay: Math.min(index % 12, 11) * 0.03, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
    >
      <Link to={`/exercises/${ex.id}`} data-cursor="View" style={{ display: 'contents' }}>
        <Paper src={ex.image} gif={ex.gif} play={hover} autoplay="touch" alt={ex.name}>
          <span className="play-badge">{hover ? '● Live' : 'Hover to play'}</span>
          <span className="ex-id">#{ex.id}</span>
        </Paper>
        <div className="ex-body">
          <h3>{ex.name}</h3>
          <div className="ex-tags">
            <span className="chip"><span className="dot" style={{ background: part.color }} />{part.label}</span>
            <span className="chip">{ex.target}</span>
            <span className="chip">{ex.equipment}</span>
          </div>
        </div>
      </Link>
      <div className="ex-actions">
        <button className={`icon-btn ${fav ? 'on' : ''}`} onClick={stop(() => toggleFavorite(ex.id))} aria-label={fav ? 'Remove favourite' : 'Add favourite'}>
          <Heart filled={fav} />
        </button>
        <button className="icon-btn" onClick={stop(() => addToWorkout(ex.id))} aria-label="Add to workout">
          <Plus />
        </button>
      </div>
    </motion.article>
  );
});

export default ExerciseCard;
