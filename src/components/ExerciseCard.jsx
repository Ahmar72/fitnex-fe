import { forwardRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Paper } from './Motion.jsx';
import { Heart, Plus, ArrowUpRight } from './Icons.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { partMeta, asset } from '../lib/utils.js';

const ExerciseCard = forwardRef(function ExerciseCard({ ex, index = 0, viewMode = 'grid', onSelect }, ref) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, addToWorkout } = useWorkout();
  const fav = favorites.includes(ex.id);
  const part = partMeta(ex.bodyPart);
  const [hover, setHover] = useState(false);
  const stop = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  const handleCardClick = (e) => {
    if (onSelect) {
      if (e) e.preventDefault();
      onSelect(ex);
    } else {
      if (e?.target?.closest('a')) return;
      navigate(`/exercises/${ex.id}`);
    }
  };

  // LIST VIEW: Sleek horizontal white card row (entire row clickable)
  if (viewMode === 'list') {
    return (
      <motion.article
        ref={ref}
        className="ex-list-item"
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(index % 12, 6) * 0.02 }}
      >
        <Link
          to={`/exercises/${ex.id}`}
          className="ex-list-link"
          onClick={(e) => {
            if (onSelect) {
              e.preventDefault();
              onSelect(ex);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', flex: 1, textDecoration: 'none', color: 'inherit' }}
        >
          <div className="ex-list-thumb" title={ex.name}>
            <img
              src={asset(ex.image || `images/${ex.id}.jpg`)}
              alt={ex.name}
              onError={(e) => {
                e.currentTarget.src = asset('images/0001-2gPfomN.jpg');
              }}
            />
          </div>
          <div className="ex-list-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ex-list-id">#{ex.id}</span>
              <span className="ex-list-title">
                {ex.name}
              </span>
            </div>
            <div className="ex-list-tags">
              <span className="chip"><span className="dot" style={{ background: part.color }} />{part.label}</span>
              <span className="chip">{ex.target}</span>
              <span className="chip">{ex.equipment}</span>
            </div>
          </div>
        </Link>
        <div className="ex-list-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`action-circle-btn fav-btn ${fav ? 'on' : ''}`}
            onClick={stop(() => toggleFavorite(ex.id))}
            aria-label={fav ? 'Remove favourite' : 'Add favourite'}
            title={fav ? 'Remove favourite' : 'Add favourite'}
          >
            <Heart
              width={16}
              height={16}
              stroke={fav ? '#ef4444' : '#ff5500'}
              fill={fav ? '#ef4444' : '#ffffff'}
            />
          </button>
          <button
            type="button"
            className="action-circle-btn plus-btn"
            onClick={stop(() => addToWorkout(ex.id))}
            aria-label="Add to workout"
            title="Add to workout"
          >
            <Plus width={16} height={16} stroke="#ff5500" />
          </button>
        </div>
      </motion.article>
    );
  }

  // GRID VIEW: Pure white card with centered visual, tags, and action triggers
  return (
    <motion.article
      ref={ref}
      className="ex-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index % 12, 6) * 0.02 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <Link
        to={`/exercises/${ex.id}`}
        data-cursor="View"
        className="ex-card-link"
        onClick={(e) => {
          if (onSelect) {
            e.preventDefault();
            onSelect(ex);
          }
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          textDecoration: 'none',
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
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
      <div className="ex-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`action-circle-btn fav-btn ${fav ? 'on' : ''}`}
          onClick={stop(() => toggleFavorite(ex.id))}
          aria-label={fav ? 'Remove favourite' : 'Add favourite'}
          title={fav ? 'Remove favourite' : 'Add favourite'}
        >
          <Heart
            width={16}
            height={16}
            stroke={fav ? '#ef4444' : '#ff5500'}
            fill={fav ? '#ef4444' : '#ffffff'}
          />
        </button>
        <button
          type="button"
          className="action-circle-btn plus-btn"
          onClick={stop(() => addToWorkout(ex.id))}
          aria-label="Add to workout"
          title="Add to workout"
        >
          <Plus width={16} height={16} stroke="#ff5500" />
        </button>
      </div>
    </motion.article>
  );
});

export default ExerciseCard;
