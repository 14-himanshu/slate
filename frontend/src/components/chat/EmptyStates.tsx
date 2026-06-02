import { Icon, Icons } from '../ui';

function EmptyBase({
    icon, title, subtitle, action
}: {
    icon: string;
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
            <div style={{
                width: 64, height: 64,
                borderRadius: 20,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
                boxShadow: 'var(--shadow-sm)',
            }}>
                <Icon d={icon} size={26} color="var(--text-muted)" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                {title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260 }}>
                {subtitle}
            </p>
            {action && <div style={{ marginTop: 20 }}>{action}</div>}
        </div>
    );
}

export function NoRoomSelected() {
    return (
        <EmptyBase
            icon={Icons.hash}
            title="No room selected"
            subtitle="Join a room from the sidebar to start chatting with your team."
        />
    );
}

export function NoConversationSelected() {
    return (
        <EmptyBase
            icon={Icons.messageCircle}
            title="No conversation selected"
            subtitle="Search for a person in the sidebar to start a direct message."
        />
    );
}

export function EmptyMessages() {
    return (
        <EmptyBase
            icon={Icons.messageCircle}
            title="No messages yet"
            subtitle="Be the first to send a message. Say hello!"
        />
    );
}
