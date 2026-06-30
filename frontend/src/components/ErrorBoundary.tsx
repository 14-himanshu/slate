import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-base)',
                    color: 'var(--text-primary)',
                    padding: 24,
                    textAlign: 'center'
                }}>
                    <div style={{
                        background: 'var(--bg-elevated)',
                        padding: 32,
                        borderRadius: 16,
                        border: '1px solid var(--border-subtle)',
                        maxWidth: 480,
                        width: '100%'
                    }}>
                        <div style={{ marginBottom: 24 }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'var(--accent)',
                                color: 'white',
                                border: 'none',
                                padding: '10px 24px',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 14,
                                width: '100%'
                            }}
                        >
                            Reload application
                        </button>
                        {this.state.error && (
                            <div style={{
                                marginTop: 24,
                                padding: 16,
                                background: 'var(--bg-input)',
                                borderRadius: 8,
                                overflowX: 'auto',
                                textAlign: 'left',
                                border: '1px solid var(--border)'
                            }}>
                                <code style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
