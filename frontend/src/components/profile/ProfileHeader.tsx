import type { UserProfile, UserStatus } from '../../types';
import { Avatar, Icon, Icons } from '../ui';

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; dot: string }> = {
  online:  { label: 'Online',  color: 'var(--success)',  dot: 'var(--success)' },
  busy:    { label: 'Busy',    color: 'var(--danger)',   dot: 'var(--danger)' },
  away:    { label: 'Away',    color: 'var(--warning)',  dot: 'var(--warning)' },
  offline: { label: 'Offline', color: 'var(--text-muted)', dot: 'var(--offline)' },
};

interface Props {
  profile: UserProfile;
  messageCount: number;
  roomCount: number;
}

export default function ProfileHeader({ profile, messageCount, roomCount }: Props) {
  const status = STATUS_CONFIG[profile.status] ?? STATUS_CONFIG.offline;
  const joined = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid var(--border)' }}>
      {/* Avatar + info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Avatar name={profile.username} src={profile.avatar} size={56} circle />
          <span style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 12, height: 12, borderRadius: '50%',
            background: status.dot,
            border: '2px solid var(--bg-surface)',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            {profile.username}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: status.color, fontWeight: 500 }}>{status.label}</span>
          </div>
          {profile.bio && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {[
          { icon: Icons.messageCircle, label: 'Messages', value: messageCount },
          { icon: Icons.hash, label: 'Rooms', value: roomCount },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, padding: '12px 0', textAlign: 'center',
            background: 'var(--bg-sidebar)',
            borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icon d={s.icon} size={10} />
              {s.label}
            </div>
          </div>
        ))}
        <div style={{
          flex: 1, padding: '12px 0', textAlign: 'center',
          background: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{joined}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon d={Icons.checkCircle} size={10} />
            Joined
          </div>
        </div>
      </div>
    </div>
  );
}
