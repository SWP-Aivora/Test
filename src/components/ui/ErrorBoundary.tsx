import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', background: 'var(--bg)',
        }}>
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '480px' }}>
            <div style={{
              background: 'var(--danger-glow)', width: '64px', height: '64px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
            }}>
              <AlertTriangle size={32} color="var(--danger)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '2rem' }}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {this.state.error && (
              <details style={{
                textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                padding: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem',
                color: 'var(--text-secondary)', fontFamily: 'monospace',
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Error details</summary>
                <p>{this.state.error.message}</p>
              </details>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={this.handleReset} className="btn btn-primary">
                <RotateCcw size={16} /> Try Again
              </button>
              <button onClick={() => window.location.href = '/'} className="btn btn-secondary">
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
