import { useRef, useState } from 'react';
import type { UserProfile } from '../../types';
import { uploadAvatar } from '../../lib/api';

interface Props {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AvatarUpload({ profile, onUpdate, onToast }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const initials = profile.username.slice(0, 2).toUpperCase();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    void handleUpload(file);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      onUpdate(updated);
      onToast('Avatar updated!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      onToast(msg, 'error');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const avatarSrc = preview ?? profile.avatar;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Avatar circle */}
      <div
        style={{
          position: 'relative',
          width: 80, height: 80,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        onClick={() => fileRef.current?.click()}
        title="Click to change avatar"
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={profile.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'var(--bg-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 600, color: 'var(--text-primary)',
          }}>
            {initials}
          </div>
        )}

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
        >
          {uploading ? (
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>Updating…</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={() => fileRef.current?.click()}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '2px 0' }}
        >
          Change profile photo
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          JPEG, PNG or WebP · Max 5MB
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
