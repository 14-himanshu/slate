import { useState } from 'react';
import { changePassword } from '../../lib/api';

interface Props {
  onToast: (msg: string, type: 'success' | 'error') => void;
  onLogout: () => void;
}

export default function SecuritySection({ onToast, onLogout }: Props) {
  const [old,    setOld]    = useState('');
  const [next,   setNext]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [show,    setShow]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 4) { onToast('New password must be at least 4 characters.', 'error'); return; }
    if (next !== confirm) { onToast('New passwords do not match.', 'error'); return; }
    setSaving(true);
    try {
      await changePassword(old, next);
      onToast('Password changed successfully!', 'success');
      setOld(''); setNext(''); setConfirm('');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Change failed.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    transition: 'all 0.1s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: 8, display: 'block',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Change password toggle */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'var(--bg-sidebar)',
      }}>
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            width: '100%', padding: '14px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'transparent', border: 'none',
            color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Change Password
          </span>
          <span style={{
            transform: show ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            color: 'var(--text-muted)',
            fontSize: 12,
          }}>▼</span>
        </button>

        {show && (
          <form onSubmit={handleSubmit} style={{
            padding: '16px', display: 'flex', flexDirection: 'column', gap: 16,
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            animation: 'fadeIn 0.2s ease both',
          }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input type="password" style={inputStyle} value={old}
                onChange={e => setOld(e.target.value)} placeholder="••••••••"
                onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-bg)'; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input type="password" style={inputStyle} value={next}
                onChange={e => setNext(e.target.value)} placeholder="Min. 4 characters"
                onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-bg)'; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" style={inputStyle} value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password"
                onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-bg)'; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <button
              type="submit" disabled={saving || !old || !next || !confirm}
              style={{
                marginTop: 4,
                padding: '10px', borderRadius: 'var(--radius-md)', border: 'none',
                background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: (!old || !next || !confirm) ? 0.5 : 1,
              }}
            >
              {saving ? 'Changing...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Sign out */}
      <button
        onClick={onLogout}
        style={{
          padding: '12px 0',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
          background: 'var(--bg-surface)', color: 'var(--danger)',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.1s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Sign Out of SyncTalk
      </button>
    </div>
  );
}
