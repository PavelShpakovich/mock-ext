import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging
    console.error('[Moq] Component error:', error, errorInfo);

    // Store error logs in chrome.storage for debugging
    chrome.storage.local.get(['errorLog'], (result) => {
      const errors = result.errorLog || [];
      errors.push({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now(),
      });
      // Keep only last 10 errors to prevent storage bloat
      chrome.storage.local.set({ errorLog: errors.slice(-10) });
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: 'var(--background)',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Something went wrong</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', maxWidth: '400px' }}>
              A component error occurred. This has been logged for debugging.
            </p>
            {this.state.error && (
              <details
                style={{
                  marginBottom: '24px',
                  padding: '12px',
                  backgroundColor: 'var(--background-secondary)',
                  borderRadius: '6px',
                  maxWidth: '500px',
                  textAlign: 'left',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 500, marginBottom: '8px' }}>Error details</summary>
                <code
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </code>
              </details>
            )}
            <button
              onClick={this.handleReset}
              style={{
                background: '#10b981',
                border: 'none',
                outline: 'none',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
