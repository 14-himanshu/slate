import { useState } from 'react';
import { login, signup, requestPasswordReset, resetPassword } from './lib/api';
import { Icons, Icon, BrandMark } from './components/ui';

interface AuthProps {
    onAuth: (username: string, token: string) => void;
}



function InputField({
    id, label, type = 'text', value, onChange, placeholder, autoComplete, autoFocus, error
}: {
    id: string; label: string; type?: string; value: string;
    onChange: (v: string) => void; placeholder?: string;
    autoComplete?: string; autoFocus?: boolean; error?: string;
}) {
    const [showPw, setShowPw] = useState(false);
    const [focused, setFocused] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPw ? 'text' : 'password') : type;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor={id} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    id={id}
                    type={inputType}
                    value={value}
                    autoFocus={autoFocus}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        width: '100%', height: 44,
                        background: 'var(--bg-input)',
                        border: `1.5px solid ${error ? 'var(--danger)' : focused ? 'var(--border-focus)' : 'var(--border)'}`,
                        borderRadius: 10,
                        padding: `0 ${isPassword ? '44px' : '14px'} 0 14px`,
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxShadow: focused ? (error ? '0 0 0 3px var(--danger-bg)' : '0 0 0 3px var(--accent-glow)') : 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        tabIndex={-1}
                        style={{
                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', padding: 4,
                            color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                        }}
                    >
                        <Icon d={showPw ? Icons.eyeOff : Icons.eye} size={16} />
                    </button>
                )}
            </div>
            {error && (
                <p style={{ fontSize: 12, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon d={Icons.xCircle} size={12} color="var(--danger)" />
                    {error}
                </p>
            )}
        </div>
    );
}

export default function Auth({ onAuth }: AuthProps) {
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-req' | 'forgot-reset'>(
        window.location.pathname === '/signup' ? 'signup' : 'login'
    );
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string; resetCode?: string }>({});
    const [globalError, setGlobalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mockEmailToast, setMockEmailToast] = useState('');

    const clearErrors = () => { setGlobalError(''); setFieldErrors({}); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        const newErrors: typeof fieldErrors = {};
        let hasError = false;
        
        if (!username.trim()) { newErrors.username = 'Username is required'; hasError = true; }
        else if (username.trim().length < 3) { newErrors.username = 'At least 3 characters'; hasError = true; }
        else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { newErrors.username = 'Only letters, numbers, and underscores'; hasError = true; }
        
        if (authMode !== 'forgot-req') {
            if (!password) { newErrors.password = 'Password is required'; hasError = true; }
            else if (password.length < 8) { newErrors.password = 'At least 8 characters'; hasError = true; }
        }

        if (authMode === 'forgot-reset') {
            if (!resetCode.trim()) { newErrors.resetCode = 'Code is required'; hasError = true; }
        }

        if (hasError) { setFieldErrors(newErrors); return; }

        setIsLoading(true);
        try {
            if (authMode === 'forgot-req') {
                const { code } = await requestPasswordReset(username.trim());
                setMockEmailToast(`Simulated Email: Your reset code is ${code}`);
                setAuthMode('forgot-reset');
            } else if (authMode === 'forgot-reset') {
                await resetPassword(username.trim(), resetCode.trim(), password);
                setMockEmailToast('');
                setGlobalError('');
                setAuthMode('login');
                setPassword('');
                setResetCode('');
                // Note: Not setting global error, but maybe a success message if needed.
                // For simplicity, we just drop them into login with username pre-filled.
                setTimeout(() => alert('Password reset successful. You can now sign in.'), 100);
            } else {
                const fn = authMode === 'login' ? login : signup;
                const { token, username: returnedUsername } = await fn(username.trim(), password);
                localStorage.setItem('chat_token', token);
                localStorage.setItem('chat_username', returnedUsername);

                // E2EE Key Management
                if (window.crypto?.subtle) {
                    try {
                        const { generateKeyPair, exportPublicKey, exportPrivateKey } = await import('./lib/e2ee');
                        const { updatePublicKey } = await import('./lib/api');
                        let privateKey = localStorage.getItem(`chat_privkey_${returnedUsername}`);
                        if (!privateKey) {
                            const keyPair = await generateKeyPair();
                            const pubJwk = await exportPublicKey(keyPair.publicKey);
                            const privJwk = await exportPrivateKey(keyPair.privateKey);
                            localStorage.setItem(`chat_privkey_${returnedUsername}`, privJwk);
                            localStorage.setItem(`chat_pubkey_${returnedUsername}`, pubJwk);
                            await updatePublicKey(pubJwk);
                        }
                    } catch (e2eeErr) {
                        console.warn('E2EE setup skipped:', e2eeErr);
                    }
                }

                onAuth(returnedUsername, token);
            }
        } catch (err) {
            setGlobalError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = (mode: 'login' | 'signup' | 'forgot-req') => {
        setAuthMode(mode);
        clearErrors();
        setPassword('');
        setResetCode('');
        setMockEmailToast('');
    };    return (
        <div style={{
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'var(--bg-base)',
            padding: '24px'
        }}>
            <div style={{
                width: '100%', 
                maxWidth: 420, 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--border)',
                borderRadius: 24,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.05)',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }} className="animate-fade-in">
                
                {/* Brand Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <BrandMark size={44} />
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Slate</span>
                </div>

                {/* Heading */}
                <div style={{ textAlign: 'center', width: '100%', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 8 }}>
                        {authMode === 'login' ? 'Welcome back' : authMode === 'signup' ? 'Create an account' : 'Reset password'}
                    </h1>
                    <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
                        {authMode === 'login'
                            ? 'Enter your details to sign in to your workspace'
                            : authMode === 'signup'
                                ? 'Enter your details to get started with Slate'
                                : authMode === 'forgot-req'
                                    ? 'Enter your username to receive a reset code'
                                    : 'Enter your reset code and new password'}
                    </p>
                </div>

                {/* Mock Email Toast */}
                {mockEmailToast && (
                    <div style={{
                        width: '100%', marginBottom: 20, padding: 12,
                        background: 'var(--bg-elevated)', border: '1px solid var(--accent)',
                        borderRadius: 10, color: 'var(--text-primary)', fontSize: 14,
                        textAlign: 'center', boxShadow: '0 4px 12px var(--accent-glow)',
                    }}>
                        <strong>{mockEmailToast}</strong>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }} noValidate>
                    <InputField
                        id="auth-username"
                        label="Username"
                        value={username}
                        onChange={v => { setUsername(v); clearErrors(); }}
                        placeholder="johndoe"
                        autoFocus
                        autoComplete="username"
                        error={fieldErrors.username}
                    />

                    {authMode === 'forgot-reset' && (
                        <InputField
                            id="auth-reset-code"
                            label="Reset Code"
                            value={resetCode}
                            onChange={v => { setResetCode(v); clearErrors(); }}
                            placeholder="123456"
                            error={fieldErrors.resetCode}
                        />
                    )}

                    {authMode !== 'forgot-req' && (
                        <InputField
                            id="auth-password"
                            label={authMode === 'forgot-reset' ? "New Password" : "Password"}
                            type="password"
                            value={password}
                            onChange={v => { setPassword(v); clearErrors(); }}
                            placeholder="••••••••"
                            autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                            error={fieldErrors.password}
                        />
                    )}
                    
                    {authMode === 'login' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
                            <button 
                                type="button" 
                                onClick={() => switchMode('forgot-req')} 
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    {globalError && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '12px 14px',
                            background: 'var(--danger-bg)',
                            border: '1px solid rgba(239,68,68,0.15)',
                            borderRadius: 10,
                            fontSize: 13, color: 'var(--danger)',
                        }}>
                            <Icon d={Icons.xCircle} size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                            {globalError}
                        </div>
                    )}

                    <button
                        id="auth-submit-btn"
                        type="submit"
                        disabled={isLoading}
                        style={{
                            marginTop: 8,
                            height: 48,
                            width: '100%',
                            background: isLoading ? 'var(--accent-light)' : 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontFamily: 'inherit',
                            letterSpacing: '-0.01em',
                            boxShadow: '0 4px 14px var(--accent-glow)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { if (!isLoading) e.currentTarget.style.transform = 'none'; }}
                    >
                        {isLoading ? (
                            <>
                                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }}>
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                {authMode === 'login' ? 'Signing in…' : authMode === 'signup' ? 'Creating account…' : 'Processing…'}
                            </>
                        ) : authMode === 'login' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : authMode === 'forgot-req' ? 'Send Reset Code' : 'Reset Password'}
                    </button>
                </form>

                {/* Toggle mode */}
                <p style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
                    {authMode === 'login' ? "Don't have an account?" : authMode === 'signup' ? 'Already have an account?' : 'Remember your password?'}
                    {' '}
                    <button
                        id="auth-toggle-btn"
                        type="button"
                        onClick={() => switchMode(authMode === 'login' ? 'signup' : 'login')}
                        style={{
                            background: 'none', border: 'none',
                            color: 'var(--accent)', fontWeight: 600,
                            fontSize: 14, cursor: 'pointer',
                            fontFamily: 'inherit', padding: '0 4px',
                            letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                        {authMode === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
