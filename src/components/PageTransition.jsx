import { motion } from 'framer-motion';

const ease = [0.76, 0, 0.24, 1];

export default function PageTransition({ children }) {
  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.35, ease } }}
      >
        {children}
      </motion.main>
      <motion.div
        className="page-curtain"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0, transition: { duration: 0.7, ease } }}
        exit={{ scaleY: 0 }}
        style={{ transformOrigin: 'top' }}
      />
      <motion.div
        className="page-curtain"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1, transition: { duration: 0.4, ease } }}
        style={{ transformOrigin: 'bottom' }}
      />
    </>
  );
}
