import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Paper } from './Motion.jsx';
import { Heart, Plus } from './Icons.jsx';
import { useWorkout } from '../context/WorkoutContext.jsx';
import { partMeta } from '../lib/utils.js';

const ExerciseCard = forwardRef(function ExerciseCard({ ex, index = 0 }, ref) {
  const { favorites, toggleFavorite, addToWorkout } = useWorkout();
  const fav = favorites.includes(ex.id);
  const part = partMeta(ex.bodyPart);
  const [hover, setHover] = useState(false);
  const stop = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <motion.article
      ref={ref}
      layout
      className="ex-card"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ duration: 0.6, delay: Math.min(index % 12, 11) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
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
