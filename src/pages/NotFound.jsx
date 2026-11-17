import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Arrow } from '../components/Icons.jsx';

export default function NotFound() {
  return (
    <section className="nf">
      <div>
        <motion.div
          className="display h1 accent"
          animate={{ rotate: [0, -3, 3, 0], y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          404
        </motion.div>
        <p className="lead" style={{ margin: '10px auto 30px' }}>This page skipped leg day. Let’s get you back on track.</p>
        <Link to="/" className="btn btn-primary">Back home <Arrow /></Link>
      </div>
    </section>
  );
}
