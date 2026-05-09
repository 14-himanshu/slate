import type { UserProfile, UserStatus } from '../../types';

const STATUS_MAP: Record<UserStatus, { label: string; color: string }> = {
  online:  { label: 'Online',  color: '#10b981' },
  busy:    { label: 'Busy',    color: '#ef4444' },
  away:    { label: 'Away',    color: '#f59e0b' },
  offline: { label: 'Offline', color: '#6b7280' },
};

interface Props {
  profile: UserProfile;
  messageCount: number;
  roomCount: number;
}

export default function ProfileHeader({ profile, messageCount, roomCount }: Props) {
  const status = STATUS_MAP[profile.status] ?? STATUS_MAP.offline;

  const joined = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric',
  });

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '32px 24px 28px',
    }}>
      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: status.color,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, color: status.color, fontWeight: 500 }}>{status.label}</span>
      </div>

      {/* Username + bio */}
      <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>
        {profile.username}
      </h1>
      <p style={{
        fontSize: 14, color: 'var(--text-secondary)',
        lineHeight: 1.5,
        minHeight: 20, marginBottom: 24,
        fontStyle: profile.bio ? 'normal' : 'italic',
      }}>
        {profile.bio || 'No bio provided.'}
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 32 }}>
        {[
          { label: 'Messages', value: messageCount },
          { label: 'Rooms',    value: roomCount },
          { label: 'Joined',   value: joined },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {s.value}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
