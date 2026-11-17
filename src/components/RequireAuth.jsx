import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsPresent } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';

let lastToast = 0;

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const toast = useToast();
  // While a page animates out (e.g. right after sign-out) it must not redirect again.
  const isPresent = useIsPresent();

  useEffect(() => {
    // guard against StrictMode's double effect run
    if (!user && isPresent && Date.now() - lastToast > 1500) {
      lastToast = Date.now();
      toast('Create a free account or sign in to continue', 'info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    if (!isPresent) return <div className="page-fallback" />;
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}
