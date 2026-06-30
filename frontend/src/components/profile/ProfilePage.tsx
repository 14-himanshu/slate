import { useEffect, useState, useCallback, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { UserProfile } from '../../types';
import { fetchProfile } from '../../lib/api';
import { requestNotificationPermission } from '../../lib/notifications';
import AvatarUpload from './AvatarUpload';
import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';
import SecuritySection from './SecuritySection';
import { Icon, Icons, Skeleton, Toggle, SettingRow } from '../ui';

interface Props {
  currentUser: string | null;
  token: string | null;
  joinedRooms: string[];
  messageCount: number;
  onClose: () => void;
  onLogout: () => void;
  onUsernameChange: (newUsername: string) => void;
}

interface Toast {
  id: number;
  msg: string;
  type: 'success' | 'error';
}

export default function ProfilePage({
  joinedRooms, messageCount, onClose, onLogout, onUsernameChange,
}: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], input[type="file"], select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(() => localStorage.getItem('chat_notifications') === 'true');
  const [sounds, setSounds] = useState(() => localStorage.getItem('chat_sounds') !== 'false');

  const addToast = useCallback((msg: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const handleToggleNotifications = async () => {
    if (!notifications) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifications(true);
        localStorage.setItem('chat_notifications', 'true');
        addToast('Notifications enabled.', 'success');
      } else {
        addToast('Notification permission denied by browser.', 'error');
      }
    } else {
      setNotifications(false);
      localStorage.setItem('chat_notifications', 'false');
      addToast('Notifications disabled.', 'success');
    }
  };

  const handleToggleSounds = () => {
    const next = !sounds;
    setSounds(next);
    localStorage.setItem('chat_sounds', String(next));
    addToast(next ? 'Sounds enabled.' : 'Sounds muted.', 'success');
  };

  useEffect(() => {
    setLoading(true);
    fetchProfile()
      .then(p => { setProfile(p); setLoading(false); })
      .catch(err => { setError(err instanceof Error ? err.message : 'Failed to load profile.'); setLoading(false); });
  }, []);

  function handleUpdate(updated: UserProfile) {
    setProfile(updated);
    if (updated.username !== profile?.username) onUsernameChange(updated.username);
  }

  return (
    <>
      <div 
        ref={containerRef}
        style={{
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderRadius: 12,
        overflow: 'hidden',
        height: '100%',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={Icons.user} size={14} color="var(--accent)" />
            </div>
            Account
          </span>
          <button
            id="profile-close-btn"
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Icon d={Icons.x} size={14} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <Skeleton w={56} h={56} radius={28} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton h={18} w="60%" />
                <Skeleton h={12} w="40%" />
              </div>
            </div>
            <Skeleton h={60} radius={10} />
            <Skeleton h={40} />
            <Skeleton h={40} />
          </div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon d={Icons.xCircle} size={22} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 14 }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              Retry
            </button>
          </div>
        ) : profile ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ProfileHeader profile={profile} messageCount={messageCount} roomCount={joinedRooms.length} />

              <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Profile detail controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <AvatarUpload profile={profile} onUpdate={handleUpdate} onToast={addToast} />
                  <ProfileForm profile={profile} onUpdate={handleUpdate} onToast={addToast} />
                </div>

                <div style={{ height: 1, background: 'var(--border)' }} />

                {/* Preferences */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>Preferences</p>

                  <SettingRow
                    icon={<Icon d={theme === 'dark' ? Icons.moon : Icons.sun} size={15} />}
                    label="Dark Theme"
                    description="Toggle between light and dark mode"
                  >
                    <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
                  </SettingRow>

                  <SettingRow
                    icon={<Icon d={Icons.bell} size={15} />}
                    label="Notifications"
                    description="Desktop alerts for new messages"
                  >
                    <Toggle checked={notifications} onChange={handleToggleNotifications} />
                  </SettingRow>

                  <SettingRow
                    icon={<Icon d={Icons.mic} size={15} />}
                    label="Message Sounds"
                    description="Play sound on incoming messages"
                  >
                    <Toggle checked={sounds} onChange={handleToggleSounds} />
                  </SettingRow>
                </div>

                <div style={{ height: 1, background: 'var(--border)' }} />

                {/* Security */}
                <div>
                  <SecuritySection onToast={addToast} onLogout={onLogout} />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200 }}>
        {toasts.map(t => (
          <div key={t.id} className="animate-slide-up" style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: 'var(--bg-elevated)',
            border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: 'var(--text-primary)',
            fontSize: 13, fontWeight: 500,
            boxShadow: 'var(--shadow-md)',
            maxWidth: 320,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.type === 'success' ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} />
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
