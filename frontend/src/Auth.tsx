import { useState } from 'react';
import { BrandMark, Button, Field } from './components/ui';
import { signup, login } from './lib/api';

interface AuthProps {
    onAuth: (username: string, token: string) => void;
}

function Auth({ onAuth }: AuthProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{username?: string, password?: string}>({});
    const [globalError, setGlobalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError('');
        setFieldErrors({});

        let hasError = false;
        const newErrors: {username?: string, password?: string} = {};

        if (!username.trim()) { newErrors.username = 'Username is required'; hasError = true; }
        else if (username.length < 3) { newErrors.username = 'Username must be at least 3 characters'; hasError = true; }

        if (!password.trim()) { newErrors.password = 'Password is required'; hasError = true; }
        else if (password.length < 4) { newErrors.password = 'Password must be at least 4 characters'; hasError = true; }

        if (hasError) { setFieldErrors(newErrors); return; }

        setIsLoading(true);

        try {
            const fn = isLogin ? login : signup;
            const { token, username: returnedUsername } = await fn(username.trim(), password);
            // Persist token so refresh keeps you logged in
            localStorage.setItem('chat_token', token);
            localStorage.setItem('chat_username', returnedUsername);
            onAuth(returnedUsername, token);
        } catch (err) {
            setGlobalError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-base)',
                padding: '24px',
            }}
        >
            <div
                className="animate-fade-in"
                style={{
                    width: '100%',
                    maxWidth: 400,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '48px 40px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 40, textAlign: 'center' }}>
                        <BrandMark size={48} />
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                {isLogin ? 'Sign in to SyncTalk' : 'Create an account'}
                            </h1>
                            <p style={{ marginTop: 8, fontSize: '14px', color: 'var(--text-secondary)' }}>
                                {isLogin ? 'Enter your details to access your account' : 'Start chatting with your team today'}
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Field
                            id="auth-username"
                            label="Username"
                            type="text"
                            value={username}
                            onChange={e => { setUsername(e.target.value); setFieldErrors(prev => ({...prev, username: ''})); setGlobalError(''); }}
                            placeholder="johndoe"
                            autoFocus
                            autoComplete="username"
                            error={fieldErrors.username}
                        />
                        <Field
                            id="auth-password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({...prev, password: ''})); setGlobalError(''); }}
                            placeholder="••••••••"
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                            error={fieldErrors.password}
                        />

                        {globalError && (
                            <div
                                style={{
                                    background: 'rgba(239,68,68,0.05)',
                                    border: '1px solid rgba(239,68,68,0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '12px',
                                    fontSize: '13px',
                                    color: 'var(--danger)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {globalError}
                            </div>
                        )}

                        <Button
                            id="auth-submit-btn"
                            type="submit"
                            size="lg"
                            disabled={isLoading}
                            style={{ width: '100%', marginTop: 8 }}
                        >
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }}>
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    {isLogin ? 'Signing in...' : 'Creating account...'}
                                </span>
                            ) : isLogin ? 'Sign In' : 'Create Account'}
                        </Button>
                    </form>

                    {/* Toggle */}
                    <div style={{ marginTop: 32, textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            {' '}
                            <button
                                id="auth-toggle-btn"
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); setGlobalError(''); setFieldErrors({}); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--accent)',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    padding: '0 4px',
                                }}
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </main>
    );
}

export default Auth;
