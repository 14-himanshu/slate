import { useEffect, useState } from 'react';
import type { UserProfile, UserStatus } from '../../types';
import { updateProfile } from '../../lib/api';

interface Props {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

const STATUSES: { value: UserStatus; label: string; color: string }[] = [
  { value: 'online',  label: 'Online',  color: '#10b981' },
  { value: 'busy',    label: 'Busy',    color: '#ef4444' },
  { value: 'away',    label: 'Away',    color: '#f59e0b' },
  { value: 'offline', label: 'Offline', color: '#6b7280' },
];

export default function ProfileForm({ profile, onUpdate, onToast }: Props) {
  const [username, setUsername] = useState(profile.username);
  const [bio,      setBio]      = useState(profile.bio ?? '');
  const [status,   setStatus]   = useState<UserStatus>(profile.status);
  const [saving,   setSaving]   = useState(false);
  const [dirty,    setDirty]    = useState(false);

  // Track changes
  useEffect(() => {
    setDirty(
      username !== profile.username ||
      bio !== (profile.bio ?? '') ||
      status !== profile.status
    );
  }, [username, bio, status, profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const updated = await updateProfile({ username, bio, status });
      onUpdate(updated);
      onToast('Profile updated!', 'success');
      // Sync localStorage username if changed
      if (updated.username !== profile.username) {
        localStorage.setItem('chat_username', updated.username);
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.1s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: 8,
    display: 'block',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Username */}
      <div>
        <label style={labelStyle}>Username</label>
        <input
          style={inputStyle}
          value={username}
          onChange={e => setUsername(e.target.value)}
          maxLength={30}
          minLength={3}
          placeholder="Enter username"
          onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-bg)'; }}
          onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Bio */}
      <div>
        <label style={labelStyle}>Bio <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>({bio.length}/150)</span></label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={150}
          placeholder="Write something about yourself..."
          onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-bg)'; }}
          onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Status */}
      <div>
        <label style={labelStyle}>Availability Status</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: status === s.value ? 'var(--accent)' : 'var(--border)',
                background: status === s.value ? 'var(--accent-bg)' : 'var(--bg-surface)',
                color: status === s.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.1s',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        type="submit"
        disabled={!dirty || saving}
        style={{
          marginTop: 8,
          padding: '10px 0',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: dirty ? 'var(--accent)' : 'var(--bg-hover)',
          color: dirty ? '#fff' : 'var(--text-muted)',
          fontSize: 14,
          fontWeight: 600,
          cursor: dirty && !saving ? 'pointer' : 'not-allowed',
          transition: 'all 0.1s',
        }}
      >
        {saving ? 'Updating...' : 'Save Profile Changes'}
      </button>
    </form>
  );
}
