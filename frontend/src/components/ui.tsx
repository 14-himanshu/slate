import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, CSSProperties } from 'react';

/* ─── Utility ──────────────────────────────────────────────── */
function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ');
}

/* ─── Icons (inline SVG, no external deps) ─────────────────── */
export function Icon({
    d, size = 16, strokeWidth = 1.75, color = 'currentColor', style
}: {
    d: string | string[];
    size?: number;
    strokeWidth?: number;
    color?: string;
    style?: CSSProperties;
}) {
    const paths = Array.isArray(d) ? d : [d];
    return (
        <svg
            width={size} height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={style}
        >
            {paths.map((p, i) => <path key={i} d={p} />)}
        </svg>
    );
}

/* ─── Common icon paths ─────────────────────────────────────── */
export const Icons = {
    x:          'M18 6 6 18M6 6l12 12',
    check:      'M20 6 9 17l-5-5',
    chevronRight: 'M9 18l6-6-6-6',
    chevronDown: 'm6 9 6 6 6-6',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    plusSquare: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM12 8v8M8 12h8',
    search:     'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
    user:       'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    settings:   'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    lock:       'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
    eye:        'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    eyeOff:     'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
    phone:      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.42 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16l.92.92z',
    video:      'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z',
    paperclip:  'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
    send:       'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    plus:       'M12 5v14M5 12h14',
    hash:       'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18',
    messageCircle: 'm3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z',
    logOut:     'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    bell:       'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    bellSlash:  'M13.73 21a2 2 0 0 1-3.46 0M21 21l-4.2-4.2M2 2l19 19M18.63 13A17.89 17.89 0 0 1 18 8a6 6 0 0 0-9.33-5m-2.58 1.48A6 6 0 0 0 6 8c0 7-3 9-3 9h12.78',
    moon:       'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
    sun:        'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
    edit:       'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    trash:      'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z',
    smile:      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
    copy:       'M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.586-1.414l-3.828-3.828A2 2 0 0 0 14.172 2H10a2 2 0 0 0-2 2zm2 2h3.586L16 8.414V16h-6V6z M4 8H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1',
    calendar:   'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z',
    reply:      'M9 17H5a2 2 0 0 0-2 2v0M5 17V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8M9 17l3-3-3-3',
    shield:     'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    mic:        'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
    micOff:     'M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8',
    videoOff:   'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409',
    phoneOff:   'M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.92 2h2.94a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91M23 1 1 23',
    image:      'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
    link:       'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    moreHorizontal: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    arrowDown:  'M12 5v14M19 12l-7 7-7-7',
    key:        'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
    checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
    xCircle:    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6',
    loader:     'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
    camera:     'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    upload:     'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    users:      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    info:       'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8h.01M11 12h1v4h1',
};

/* ─── Card ──────────────────────────────────────────────────── */
interface CardProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
    return (
        <div
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                ...style,
            }}
            className={cn('relative overflow-hidden', className)}
        >
            {children}
        </div>
    );
}

/* ─── Button ────────────────────────────────────────────────── */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost' | 'outline' | 'secondary' | 'danger';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export function Button({ className, variant = 'primary', size = 'md', loading, children, style, disabled, ...props }: ButtonProps) {
    const base: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 500,
        borderRadius: 'var(--radius-md)',
        border: '1px solid transparent',
        outline: 'none',
        position: 'relative',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        letterSpacing: '-0.01em',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
    };

    const sizes: Record<string, CSSProperties> = {
        xs: { height: '28px', padding: '0 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)' },
        sm: { height: '32px', padding: '0 12px', fontSize: '13px' },
        md: { height: '38px', padding: '0 16px', fontSize: '14px' },
        lg: { height: '46px', padding: '0 24px', fontSize: '15px' },
    };

    const variants: Record<string, CSSProperties> = {
        primary: { background: 'var(--accent)', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
        secondary: { background: 'var(--bg-hover)', color: 'var(--text-primary)', borderColor: 'var(--border)' },
        ghost: { background: 'transparent', color: 'var(--text-secondary)' },
        outline: { background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border)' },
        danger: { background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' },
    };

    return (
        <button
            style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
            className={className}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    {children}
                </>
            ) : children}
        </button>
    );
}

/* ─── IconButton ────────────────────────────────────────────── */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    active?: boolean;
    size?: 'sm' | 'md';
    danger?: boolean;
}

export function IconButton({ label, active, size = 'md', danger, style, children, ...props }: IconButtonProps) {
    const dim = size === 'sm' ? 28 : 34;
    return (
        <button
            title={label}
            aria-label={label}
            style={{
                width: dim, height: dim,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: active ? 'var(--accent-bg)' : 'transparent',
                color: danger ? 'var(--danger)' : active ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.12s ease',
                ...style,
            }}
            onMouseEnter={e => {
                if (!danger) e.currentTarget.style.background = active ? 'var(--accent-bg)' : 'transparent';
                if (!danger) e.currentTarget.style.color = active ? 'var(--accent)' : '#FFFFFF';
                if (danger) e.currentTarget.style.background = 'var(--danger-bg)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = active ? 'var(--accent-bg)' : 'transparent';
                e.currentTarget.style.color = danger ? 'var(--danger)' : active ? 'var(--accent)' : 'var(--text-muted)';
            }}
            {...props}
        >
            {children}
        </button>
    );
}

/* ─── Field (Label + Input) ─────────────────────────────────── */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    id?: string;
    error?: string;
    hint?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export function Field({ label, id, error, hint, leftIcon, rightIcon, className, style, ...props }: FieldProps) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
        <div className={cn('flex flex-col', className)} style={{ gap: 6 }}>
            {label && (
                <label
                    htmlFor={inputId}
                    style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}
                >
                    {label}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                {leftIcon && (
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>
                        {leftIcon}
                    </span>
                )}
                <input
                    id={inputId}
                    style={{
                        height: '42px',
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: `0 ${rightIcon ? '40px' : '12px'} 0 ${leftIcon ? '38px' : '12px'}`,
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        ...style,
                    }}
                    onFocus={e => {
                        e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border-focus)';
                        e.currentTarget.style.boxShadow = error ? '0 0 0 3px var(--danger-bg)' : '0 0 0 3px var(--accent-glow)';
                    }}
                    onBlur={e => {
                        e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    {...props}
                />
                {rightIcon && (
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                        {rightIcon}
                    </span>
                )}
            </div>
            {error && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>{error}</p>}
            {hint && !error && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{hint}</p>}
        </div>
    );
}

/* ─── Toggle ────────────────────────────────────────────────── */
interface ToggleProps {
    checked: boolean;
    onChange: () => void;
    label?: string;
    size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, size = 'md' }: ToggleProps) {
    const w = size === 'sm' ? 32 : 40;
    const h = size === 'sm' ? 18 : 22;
    const d = size === 'sm' ? 14 : 18;
    const travel = w - d - 2;

    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            style={{
                width: w, height: h,
                borderRadius: h,
                border: 'none',
                background: checked ? 'var(--accent)' : 'var(--border)',
                position: 'relative',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.2s',
                boxShadow: checked ? '0 0 0 3px var(--accent-glow)' : 'none',
            }}
        >
            <div style={{
                position: 'absolute',
                top: (h - d) / 2,
                left: checked ? travel : (h - d) / 2,
                width: d, height: d,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'left 0.18s ease',
            }} />
        </button>
    );
}

/* ─── Badge ─────────────────────────────────────────────────── */
export function Badge({ count, max = 99 }: { count: number; max?: number }) {
    if (count <= 0) return null;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 18, height: 18,
            padding: '0 5px',
            borderRadius: 9,
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '0.02em',
            flexShrink: 0,
        }}>
            {count > max ? `${max}+` : count}
        </span>
    );
}

/* ─── BrandMark ─────────────────────────────────────────────── */
export function BrandMark({ size = 32 }: { size?: number }) {
    return (
        <img 
            src="/favicon.svg" 
            alt="Slate Logo" 
            style={{
                width: size, 
                height: size,
                objectFit: 'contain',
                flexShrink: 0
            }} 
        />
    );
}

/* ─── StatusBadge ───────────────────────────────────────────── */
interface StatusBadgeProps {
    active: boolean;
    activeText?: string;
    inactiveText?: string;
    size?: 'sm' | 'md';
}

export function StatusBadge({ active, activeText = 'Online', inactiveText = 'Offline', size = 'sm' }: StatusBadgeProps) {
    const dotSize = size === 'sm' ? 6 : 8;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: size === 'sm' ? '10px' : '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: active ? '#23A559' : 'var(--text-muted)',
        }}>
            <span style={{
                width: dotSize, height: dotSize, borderRadius: '50%',
                background: active ? '#23A559' : 'var(--offline)',
                border: '2px solid var(--bg-sidebar)',
                flexShrink: 0,
                animation: active ? 'pulse-dot 2.5s ease infinite' : 'none',
            }} />
            {active ? activeText : inactiveText}
        </span>
    );
}

/* ─── Avatar ────────────────────────────────────────────────── */
const AVATAR_PALETTES = [
    { from: '#475569', to: '#334155' },
    { from: '#115E59', to: '#0F766E' },
    { from: '#701A75', to: '#831843' },
    { from: '#374151', to: '#1F2937' },
    { from: '#064E3B', to: '#065F46' },
];

function getAvatarPalette(name: string) {
    const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
}

export function Avatar({
    name, src, size = 32, circle = false, status
}: {
    name: string;
    src?: string | null;
    size?: number;
    circle?: boolean;
    status?: 'online' | 'offline' | 'busy' | 'away';
}) {
    const { from, to } = getAvatarPalette(name);
    const radius = circle ? '50%' : `${Math.round(size * 0.3)}px`;

    const statusColors = {
        online: '#10B981', // green
        offline: '#94A3B8', // slate
        busy: '#EF4444', // red
        away: '#F59E0B', // amber
    };

    const statusDot = status ? (
        <div style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: Math.max(10, size * 0.28),
            height: Math.max(10, size * 0.28),
            backgroundColor: statusColors[status],
            border: `2px solid var(--bg-surface)`,
            borderRadius: '50%',
            zIndex: 1,
        }} />
    ) : null;

    if (src) {
        return (
            <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                <img
                    src={src}
                    alt={name}
                    title={name}
                    style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover' }}
                />
                {statusDot}
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <div
                aria-hidden="true"
                title={name}
                style={{
                    width: '100%', height: '100%',
                    borderRadius: radius,
                    background: `linear-gradient(135deg, ${from}, ${to})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: Math.round(size * 0.4),
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '-0.02em',
                    userSelect: 'none',
                }}
            >
                {name.charAt(0).toUpperCase()}
            </div>
            {statusDot}
        </div>
    );
}

/* ─── Skeleton ──────────────────────────────────────────────── */
export function Skeleton({ w, h, radius = 6 }: { w?: string | number; h: number; radius?: number }) {
    return (
        <div
            className="skeleton-pulse"
            style={{ width: w ?? '100%', height: h, borderRadius: radius }}
        />
    );
}

/* ─── Divider ───────────────────────────────────────────────── */
export function Divider({ label }: { label?: string }) {
    if (!label) {
        return <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />;
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
    );
}

/* ─── SettingRow ────────────────────────────────────────────── */
export function SettingRow({
    icon, label, description, children
}: {
    icon: ReactNode;
    label: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12,
            padding: '14px 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-sidebar)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>{icon}</span>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                    {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{description}</div>}
                </div>
            </div>
            {children}
        </div>
    );
}
