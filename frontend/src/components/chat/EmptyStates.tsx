import { Icon, Icons } from '../ui';

function EmptyGraphic({ type }: { type: 'room' | 'dm' | 'messages' }) {
    if (type === 'room') {
        return (
            <svg width="180" height="180" viewBox="0 0 200 200" fill="none" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>
                <circle cx="100" cy="100" r="80" fill="var(--bg-elevated)" opacity="0.5" />
                <path d="M70 130L130 70M70 70L130 130" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                <rect x="75" y="75" width="50" height="50" rx="12" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="4" />
                <path d="M90 95H110M90 105H105" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
            </svg>
        );
    }
    if (type === 'dm') {
        return (
            <svg width="180" height="180" viewBox="0 0 200 200" fill="none" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>
                <circle cx="100" cy="100" r="80" fill="var(--bg-elevated)" opacity="0.5" />
                <circle cx="85" cy="85" r="25" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="4" />
                <circle cx="115" cy="115" r="25" fill="var(--accent)" opacity="0.9" stroke="var(--bg-base)" strokeWidth="4" />
                <path d="M105 115H125" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </svg>
        );
    }
    return (
        <div style={{
            width: 64, height: 64, borderRadius: 20, background: 'var(--bg-elevated)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, boxShadow: 'var(--shadow-sm)',
        }}>
            <Icon d={Icons.messageCircle} size={26} color="var(--text-muted)" strokeWidth={1.5} />
        </div>
    );
}

function EmptyBase({
    type, title, subtitle, action
}: {
    type: 'room' | 'dm' | 'messages';
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}) {
    return (
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 40, textAlign: 'center',
            userSelect: 'none',
        }}>
            <EmptyGraphic type={type} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8, marginTop: type === 'messages' ? 0 : 24 }}>
                {title}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280 }}>
                {subtitle}
            </p>
            {action && <div style={{ marginTop: 24 }}>{action}</div>}
        </div>
    );
}

export function NoRoomSelected() {
    return (
        <EmptyBase
            type="room"
            title="Welcome to Slate"
            subtitle="Select a room from the sidebar or create a new one to start chatting with your team."
        />
    );
}

export function NoConversationSelected() {
    return (
        <EmptyBase
            type="dm"
            title="Your Messages"
            subtitle="Search for a person in the sidebar to start a direct message."
        />
    );
}

export function EmptyMessages() {
    return (
        <EmptyBase
            type="messages"
            title="No messages yet"
            subtitle="Be the first to send a message. Say hello!"
        />
    );
}
