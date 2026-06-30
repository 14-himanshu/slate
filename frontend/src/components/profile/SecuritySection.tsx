import { useState } from 'react';
import { changePassword, deleteAccount } from '../../lib/api';
import { Button, Icon, Icons } from '../ui';

interface Props {
  onToast: (msg: string, type: 'success' | 'error') => void;
  onLogout: () => void;
}

function PwInput({ label, id, value, onChange }: { label: string; id: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          style={{
            width: '100%', height: 40,
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border)',
            borderRadius: 8,
            padding: '0 40px 0 12px',
            fontSize: 14, color: 'var(--text-primary)',
            outline: 'none', fontFamily: 'inherit',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        <button type="button" onClick={() => setShow(p => !p)} tabIndex={-1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <Icon d={show ? Icons.eyeOff : Icons.eye} size={15} />
        </button>
      </div>
    </div>
  );
}

export default function SecuritySection({ onToast, onLogout }: Props) {
  const [old, setOld] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) { onToast('New password must be at least 8 characters.', 'error'); return; }
    if (next !== confirm) { onToast('New passwords do not match.', 'error'); return; }
    setSaving(true);
    try {
      await changePassword(old, next);
      onToast('Password updated successfully.', 'success');
      setOld(''); setNext(''); setConfirm(''); setShowForm(false);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to update password.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Change password card */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setShowForm(s => !s)}
          style={{
            width: '100%', padding: '14px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--bg-sidebar)', border: 'none',
            color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon d={Icons.key} size={15} color="var(--text-muted)" />
            Change Password
          </span>
          <span style={{ transform: showForm ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)', display: 'flex' }}>
            <Icon d={Icons.chevronRight} size={14} style={{ transform: 'rotate(90deg)' }} />
          </span>
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', animation: 'fadeIn 0.15s ease both' }}>
            <PwInput label="Current Password" id="pw-current" value={old} onChange={setOld} />
            <PwInput label="New Password" id="pw-new" value={next} onChange={setNext} />
            <PwInput label="Confirm New Password" id="pw-confirm" value={confirm} onChange={setConfirm} />
            <Button type="submit" loading={saving} disabled={saving || !old || !next || !confirm} style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}>
              Update Password
            </Button>
          </form>
        )}
      </div>

      {/* Danger zone */}
      <div style={{ border: '1px solid var(--danger-bg)', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
        <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', borderBottom: '1px solid rgba(239,68,68,0.12)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Danger Zone</div>
        </div>
        <div style={{ padding: 16, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>Sign out</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>You will need to sign back in.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
            <button
              onClick={onLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                background: 'none',
                border: '1px solid var(--danger)',
                borderRadius: 8,
                color: 'var(--danger)',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.12s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <Icon d={Icons.logOut} size={14} />
              Sign Out
            </button>
            <button
              onClick={async () => {
                if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                  try {
                    await deleteAccount();
                    onLogout();
                  } catch (err) {
                    onToast(err instanceof Error ? err.message : 'Failed to delete account.', 'error');
                  }
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                background: 'none',
                border: '1px solid var(--danger)',
                borderRadius: 8,
                color: 'var(--danger)',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.12s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <Icon d={Icons.trash} size={14} />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
