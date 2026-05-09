import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { UserProfile } from '../../types';
import { fetchProfile } from '../../lib/api';
import AvatarUpload from './AvatarUpload';
import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';
import SecuritySection from './SecuritySection';

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

type TabType = 'profile' | 'settings' | 'security';

function Skeleton({ w, h, radius = 6 }: { w: string | number; h: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'var(--bg-hover)',
      opacity: 0.6,
    }} />
  );
}

export default function ProfilePage({
  joinedRooms,
  messageCount,
  onClose,
  onLogout,
  onUsernameChange,
}: Props) {
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [toasts,   setToasts]   = useState<Toast[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Settings state
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const addToast = useCallback((msg: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProfile()
      .then(p => { setProfile(p); setLoading(false); })
      .catch(err => { setError(err instanceof Error ? err.message : 'Failed to load profile.'); setLoading(false); });
  }, []);

  function handleUpdate(updated: UserProfile) {
    setProfile(updated);
    if (updated.username !== profile?.username) {
      onUsernameChange(updated.username);
    }
  }

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--bg-overlay)',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease both',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 'min(400px, 100vw)',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 101,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeIn 0.2s ease both',
      }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Profile Settings
          </span>
          <button
            id="profile-close-btn"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--bg-hover)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <Skeleton w={80} h={80} radius={40} />
            </div>
            <Skeleton w="50%" h={20} />
            <Skeleton w="100%" h={1} />
            <Skeleton w="100%" h={40} />
            <Skeleton w="100%" h={40} />
          </div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 14 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px', background: 'var(--accent)', border: 'none',
                borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
              }}
            >Retry</button>
          </div>
        ) : profile ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ProfileHeader
                profile={profile}
                messageCount={messageCount}
                roomCount={joinedRooms.length}
              />

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-sidebar)', position: 'sticky', top: 0, zIndex: 10 }}>
                <button style={tabStyle(activeTab === 'profile')} onClick={() => setActiveTab('profile')}>Profile</button>
                <button style={tabStyle(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>Settings</button>
                <button style={tabStyle(activeTab === 'security')} onClick={() => setActiveTab('security')}>Security</button>
              </div>

              <div style={{ padding: '24px 20px' }}>
                {activeTab === 'profile' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <AvatarUpload profile={profile} onUpdate={handleUpdate} onToast={addToast} />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <ProfileForm profile={profile} onUpdate={handleUpdate} onToast={addToast} />
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>App Preferences</h2>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-sidebar)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Dark Theme</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Automatic switching supported</div>
                      </div>
                      <button
                        onClick={toggleTheme}
                        style={{
                          width: 40, height: 22, borderRadius: 11, border: 'none',
                          background: theme === 'dark' ? 'var(--accent)' : 'var(--border)',
                          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 2, left: theme === 'dark' ? 20 : 2,
                          width: 18, height: 18, borderRadius: '50%', background: '#fff',
                          transition: 'left 0.2s',
                        }} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-sidebar)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Notifications</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>New message alerts</div>
                      </div>
                      <button
                        onClick={() => { setNotifications(!notifications); addToast('Preference updated.', 'success'); }}
                        style={{
                          width: 40, height: 22, borderRadius: 11, border: 'none',
                          background: notifications ? 'var(--accent)' : 'var(--border)',
                          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 2, left: notifications ? 20 : 2,
                          width: 18, height: 18, borderRadius: '50%', background: '#fff',
                          transition: 'left 0.2s',
                        }} />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="animate-fade-in">
                    <SecuritySection onToast={addToast} onLogout={onLogout} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Toast notifications */}
      <div style={{
        position: 'fixed', bottom: 20, right: 20,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 200,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)',
            border: `1px solid ${t.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: 'var(--text-primary)',
            fontSize: 13, fontWeight: 500,
            boxShadow: 'var(--shadow-md)',
            maxWidth: 300,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease both',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.type === 'success' ? 'var(--success)' : 'var(--danger)' }} />
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
