import { Avatar, Icon, Icons, IconButton } from '../ui';
import type { RoomSummary } from '../../types';

interface Props {
  room: RoomSummary;
  onlineUsers: string[];
  onClose: () => void;
  onLeave: () => void;
}

export function RoomInfoPanel({ room, onlineUsers, onClose, onLeave }: Props) {
  const handleCopyId = () => {
    navigator.clipboard.writeText(room.roomId);
    // Could add a toast here
  };

  const createdDate = new Date(room.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, animation: 'fadeIn 0.2s ease both' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(380px, 100vw)',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 101,
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        animation: 'slideInRight 0.25s ease both',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Room Info</span>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Icon d={Icons.x} size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Room Details */}
          <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, marginBottom: 16, boxShadow: '0 4px 12px rgba(79,110,247,0.3)' }}>
              {room.name.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{room.name}</h2>
            {room.description ? (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>{room.description}</p>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 16 }}>No description provided.</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <Icon d={Icons.hash} size={16} color="var(--text-muted)" />
              <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)' }}>{room.roomId}</span>
              <IconButton size="sm" onClick={handleCopyId} label="Copy Room ID">
                <Icon d={Icons.copy} size={14} />
              </IconButton>
            </div>
            
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon d={Icons.calendar} size={12} />
              Created on {createdDate}
            </p>
          </div>

          {/* Members List */}
          <div style={{ padding: '20px 0' }}>
            <div style={{ padding: '0 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Online Now
              </span>
              <span style={{ background: 'var(--success)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>
                {onlineUsers.length}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {onlineUsers.length > 0 ? onlineUsers.map(user => (
                <div key={user} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={user} size={36} circle />
                    <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-surface)' }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{user}</span>
                </div>
              )) : (
                <div style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' }}>
                  No one else is online.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: 20, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onLeave}
            style={{ width: '100%', padding: '12px', background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: 'var(--danger)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
          >
            <Icon d={Icons.logOut} size={16} />
            Leave Room
          </button>
        </div>
      </div>
    </>
  );
}
