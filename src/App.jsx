import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Preloader from './components/Preloader.jsx';
import Cursor from './components/Cursor.jsx';
import ScrollProgress from './components/ScrollProgress.jsx';
import PageTransition from './components/PageTransition.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import AppLayout from './components/AppLayout.jsx';
import AppSpinner from './components/AppSpinner.jsx';
import { useSmoothScroll } from './lib/useSmoothScroll.js';
import Home from './pages/Home.jsx';

const Library = lazy(() => import('./pages/Library.jsx'));
const ExerciseDetail = lazy(() => import('./pages/ExerciseDetail.jsx'));
const Builder = lazy(() => import('./pages/Builder.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Plans = lazy(() => import('./pages/Plans.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Nutrition = lazy(() => import('./pages/Nutrition.jsx'));
const MealDetail = lazy(() => import('./pages/MealDetail.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const Login = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Signup })));
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'));

const AUTH_PAGES = ['/login', '/signup', '/onboarding'];
const APP_ROUTES = ['/dashboard', '/plans', '/profile', '/exercises', '/builder', '/nutrition'];

const page = (el, protect = false) => <PageTransition>{protect ? <RequireAuth>{el}</RequireAuth> : el}</PageTransition>;
const appPage = (el) => (
  <PageTransition>
    <RequireAuth>
      <AppLayout>{el}</AppLayout>
    </RequireAuth>
  </PageTransition>
);

export default function App() {
  const location = useLocation();
  const lenis = useSmoothScroll();
  const isAuthPage = AUTH_PAGES.includes(location.pathname);
  const isAppRoute = APP_ROUTES.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );

  const scrollTop = () => {
    if (lenis.current) lenis.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  };

  useEffect(() => {
    document.title = {
      '/login': 'Sign in — Fitnex',
      '/signup': 'Create your account — Fitnex',
      '/onboarding': 'Personalize your training — Fitnex',
      '/dashboard': 'Dashboard — Fitnex',
      '/plans': 'Workout Plans — Fitnex',
      '/exercises': 'Exercise library — Fitnex',
      '/builder': 'Workout builder — Fitnex',
      '/profile': 'Profile — Fitnex',
      '/nutrition': 'Nutrition — Fitnex',
    }[location.pathname] || 'Fitnex — Train with intent';
  }, [location.pathname]);

  // Scroll to a #section after the page has rendered.
  useEffect(() => {
    if (!location.hash) return;
    const t = setTimeout(() => {
      const el = document.querySelector(location.hash);
      if (!el) return;
      if (lenis.current) lenis.current.scrollTo(el, { offset: -60 });
      else el.scrollIntoView({ behavior: 'smooth' });
    }, 650);
    return () => clearTimeout(t);
  }, [location.key, location.hash, lenis]);

  return (
    <>
      <Preloader />
      <Cursor />
      {!isAppRoute && <ScrollProgress />}
      {!isAuthPage && !isAppRoute && <Navbar />}
      <Suspense fallback={<AppSpinner label="Loading Fitnex..." />}>
        <Routes>
          <Route path="/" element={page(<Home />)} />
          <Route path="/login" element={page(<Login />)} />
          <Route path="/signup" element={page(<Signup />)} />
          <Route path="/onboarding" element={page(<Onboarding />, true)} />

          {/* Authenticated App Workspace - Persistent AppLayout with smooth navigation */}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/plans/:id" element={<Plans />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/exercises" element={<Library />} />
            <Route path="/exercises/:id" element={<ExerciseDetail />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/nutrition/:mealId" element={<MealDetail />} />
          </Route>

          <Route path="*" element={page(<NotFound />)} />
        </Routes>
      </Suspense>
      {!isAuthPage && !isAppRoute && <Footer />}
    </>
  );
}
