import { Logo } from './Icons.jsx';

export default function AppSpinner({ label = 'Loading...' }) {
  return (
    <div className="app-spinner-container" role="status" aria-live="polite">
      <div className="app-spinner-card">
        <div className="spinner-rings-wrap">
          <div className="spinner-outer-ring" />
          <div className="spinner-inner-ring" />
          <div className="spinner-center-icon">
            <Logo width={22} height={22} />
          </div>
        </div>
        <div className="spinner-text">
          <span className="spinner-brand">FITNEX</span>
          <span className="spinner-sub">{label}</span>
        </div>
      </div>
    </div>
  );
}

export function TopProgressBar({ active }) {
  if (!active) return null;
  return (
    <div className="top-progress-bar-wrap" aria-hidden="true">
      <div className="top-progress-bar-line" />
    </div>
  );
}
