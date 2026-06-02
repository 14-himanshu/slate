import { useState } from 'react';
import { login, signup } from './lib/api';
import { BrandMark, Icons, Icon } from './components/ui';

interface AuthProps {
    onAuth: (username: string, token: string) => void;
}

function FeatureItem({ icon, label, desc }: { icon: string; label: string; desc: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon d={icon} size={16} color="rgba(255,255,255,0.9)" strokeWidth={1.75} />
            </div>
            <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{desc}</div>
            </div>
        </div>
    );
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
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
    const [globalError, setGlobalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const clearErrors = () => { setGlobalError(''); setFieldErrors({}); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        const newErrors: typeof fieldErrors = {};
        let hasError = false;
        if (!username.trim()) { newErrors.username = 'Username is required'; hasError = true; }
        else if (username.trim().length < 3) { newErrors.username = 'At least 3 characters'; hasError = true; }
        if (!password) { newErrors.password = 'Password is required'; hasError = true; }
        else if (password.length < 8) { newErrors.password = 'At least 8 characters'; hasError = true; }
        if (hasError) { setFieldErrors(newErrors); return; }

        setIsLoading(true);
        try {
            const fn = isLogin ? login : signup;
            const { token, username: returnedUsername } = await fn(username.trim(), password);
            localStorage.setItem('chat_token', token);
            localStorage.setItem('chat_username', returnedUsername);

            // E2EE Key Management — skip silently if crypto.subtle unavailable (HTTP non-localhost)
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
        } catch (err) {
            setGlobalError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin(p => !p);
        clearErrors();
        setUsername('');
        setPassword('');
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            background: 'var(--bg-base)',
        }}>
            {/* ── Left brand panel (desktop only) ─────────────── */}
            <div style={{
                display: 'none',
                width: '50%', flexShrink: 0,
                background: 'linear-gradient(145deg, #3b5ce4 0%, #4f6ef7 40%, #6b86f8 100%)',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '48px 52px',
                position: 'relative',
                overflow: 'hidden',
            }}
                className="auth-left-panel"
            >
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '40%', right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

                {/* Brand */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon d={Icons.messageCircle} size={20} color="white" strokeWidth={2} />
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Slate</span>
                    </div>
                </div>

                {/* Headline */}
                <div>
                    <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.04em', marginBottom: 16 }}>
                        Where teams<br />communicate.
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 48, maxWidth: 340 }}>
                        Real-time messaging, voice &amp; video calls, end-to-end encrypted direct messages — all in one place.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <FeatureItem icon={Icons.shield} label="End-to-End Encrypted" desc="Your DMs are private. Always." />
                        <FeatureItem icon={Icons.video} label="Voice & Video Calls" desc="Crystal-clear peer-to-peer calling." />
                        <FeatureItem icon={Icons.users} label="Team Rooms" desc="Organised channels for every project." />
                    </div>
                </div>

                {/* Footer */}
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>© 2025 Slate</p>
            </div>

            {/* ── Right form panel ─────────────────────────────── */}
            <div style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '32px 24px',
            }}>
                <div style={{ width: '100%', maxWidth: 400 }} className="animate-fade-in">

                    {/* Mobile brand */}
                    <div className="auth-mobile-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                        <BrandMark size={32} />
                        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Slate</span>
                    </div>

                    {/* Heading */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 8 }}>
                            {isLogin ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {isLogin
                                ? 'Sign in to continue to Slate'
                                : 'Start chatting with your team today'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
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
                        <InputField
                            id="auth-password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={v => { setPassword(v); clearErrors(); }}
                            placeholder="••••••••"
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                            error={fieldErrors.password}
                        />

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
                                marginTop: 4,
                                height: 46,
                                width: '100%',
                                background: isLoading ? 'var(--accent-light)' : 'var(--accent)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                fontFamily: 'inherit',
                                letterSpacing: '-0.01em',
                                boxShadow: '0 2px 12px rgba(79,110,247,0.3)',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = 'var(--accent)'; }}
                        >
                            {isLoading ? (
                                <>
                                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }}>
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    {isLogin ? 'Signing in…' : 'Creating account…'}
                                </>
                            ) : isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <p style={{ marginTop: 28, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        {' '}
                        <button
                            id="auth-toggle-btn"
                            type="button"
                            onClick={switchMode}
                            style={{
                                background: 'none', border: 'none',
                                color: 'var(--accent)', fontWeight: 600,
                                fontSize: 14, cursor: 'pointer',
                                fontFamily: 'inherit', padding: '0 2px',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>

            {/* Responsive style */}
            <style>{`
                @media (min-width: 768px) {
                    .auth-left-panel { display: flex !important; }
                    .auth-mobile-brand { display: none !important; }
                }
            `}</style>
        </div>
    );
}
