import React from 'react';

/**
 * Fitnex Production Error Boundary
 * 
 * Intercepts uncaught rendering exceptions anywhere in the React tree,
 * logs error diagnostics, and prevents unrecoverable blank white screens
 * with a branded, accessible recovery interface.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Fitnex ErrorBoundary caught an unhandled exception:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
            background: 'var(--bg, #0b0b0d)',
            color: 'var(--text, #f5f5f7)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(255, 94, 26, 0.12)',
              border: '1.5px solid rgba(255, 94, 26, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #ff5e1a)',
              marginBottom: 20,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2
            style={{
              fontSize: 'clamp(20px, 2.4vw, 28px)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              margin: '0 0 10px',
            }}
          >
            Something unexpected occurred
          </h2>

          <p
            style={{
              maxWidth: 460,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--muted, #abb0bf)',
              margin: '0 0 26px',
            }}
          >
            We ran into an unexpected hiccup loading this view. Your saved workouts and active progress remain completely safe.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                height: 42,
                padding: '0 20px',
                fontSize: 13.5,
                fontWeight: 700,
                borderRadius: 10,
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="btn btn-ghost"
              style={{
                height: 42,
                padding: '0 20px',
                fontSize: 13.5,
                fontWeight: 700,
                borderRadius: 10,
                border: '1px solid var(--line, rgba(255,255,255,0.12))',
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
