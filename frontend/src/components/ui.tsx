import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

/* ─── Utility ──────────────────────────────────────────────── */
function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ');
}

/* ─── Card ──────────────────────────────────────────────────── */
interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className }: CardProps) {
    return (
        <div
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
            }}
            className={cn('relative overflow-hidden', className)}
        >
            {children}
        </div>
    );
}

/* ─── Button ────────────────────────────────────────────────── */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost' | 'outline' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', style, ...props }: ButtonProps) {
    const base: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 500,
        borderRadius: 'var(--radius-md)',
        border: '1px solid transparent',
        outline: 'none',
        transition: 'all 0.15s ease',
        position: 'relative',
        cursor: 'pointer',
        fontFamily: 'inherit',
    };

    const sizes: Record<string, React.CSSProperties> = {
        sm: { height: '32px', padding: '0 12px', fontSize: '13px' },
        md: { height: '40px', padding: '0 16px', fontSize: '14px' },
        lg: { height: '48px', padding: '0 24px', fontSize: '15px' },
    };

    const variants: Record<string, React.CSSProperties> = {
        primary: {
            background: 'var(--accent)',
            color: '#fff',
        },
        secondary: {
            background: 'var(--bg-hover)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--text-secondary)',
        },
        outline: {
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
        },
    };

    return (
        <button
            style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
            className={className}
            {...props}
        />
    );
}

/* ─── Field (Label + Input) ─────────────────────────────────── */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id?: string;
    error?: string;
}

export function Field({ label, id, error, className, style, ...props }: FieldProps) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label
                htmlFor={inputId}
                style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                }}
            >
                {label}
            </label>
            <input
                id={inputId}
                style={{
                    height: '40px',
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0 12px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxShadow: 'var(--shadow-sm)',
                    ...style,
                }}
                onFocus={e => {
                    e.currentTarget.style.borderColor = `var(--border-focus)`;
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-bg)';
                }}
                onBlur={e => {
                    e.currentTarget.style.borderColor = `${error ? 'var(--danger)' : 'var(--border)'}`;
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                {...props}
            />
            {error && (
                <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{error}</p>
            )}
        </div>
    );
}

/* ─── BrandMark ─────────────────────────────────────────────── */
export function BrandMark({ size = 32 }: { size?: number }) {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
            </svg>
        </div>
    );
}

/* ─── StatusBadge ───────────────────────────────────────────── */
interface StatusBadgeProps {
    active: boolean;
    activeText?: string;
    inactiveText?: string;
}

export function StatusBadge({ active, activeText = 'Online', inactiveText = 'Offline' }: StatusBadgeProps) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 500,
                background: active ? 'rgba(16,185,129,0.08)' : 'var(--bg-hover)',
                color: active ? '#059669' : 'var(--text-secondary)',
                border: `1px solid ${active ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: active ? '#10b981' : 'var(--text-muted)',
                    flexShrink: 0,
                    animation: active ? 'pulse-dot 2s ease infinite' : 'none',
                }}
            />
            {active ? activeText : inactiveText}
        </span>
    );
}

/* ─── Avatar ────────────────────────────────────────────────── */
const AVATAR_COLORS = [
    ['#3b82f6', '#1d4ed8'],
    ['#10b981', '#047857'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#b91c1c'],
    ['#8b5cf6', '#6d28d9'],
];

function getAvatarColors(name: string) {
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
    const [from, to] = getAvatarColors(name);
    return (
        <div
            aria-hidden="true"
            title={name}
            style={{
                width: size,
                height: size,
                borderRadius: 'var(--radius-md)',
                background: `linear-gradient(135deg, ${from}, ${to})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.4,
                fontWeight: 600,
                color: '#fff',
                flexShrink: 0,
            }}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}
