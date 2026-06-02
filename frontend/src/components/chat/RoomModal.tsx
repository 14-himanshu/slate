import React, { useState } from 'react';
import { Button, Field, Icon, Icons } from '../ui';
import { createRoom } from '../../lib/api';
import type { RoomSummary } from '../../types';

interface Props {
  onClose: () => void;
  onJoin: (roomId: string, name?: string) => void;
  recentRooms: RoomSummary[];
}

export function RoomModal({ onClose, onJoin, recentRooms }: Props) {
  const [tab, setTab] = useState<'join' | 'create'>('join');

  // Join state
  const [joinId, setJoinId] = useState('');

  // Create state
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    onJoin(joinId.trim().toUpperCase());
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setIsCreating(true);
    setError('');
    try {
      const room = await createRoom(createName.trim(), createDesc.trim());
      onJoin(room.roomId, room.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      setIsCreating(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, animation: 'fadeIn 0.2s ease both' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 440,
        background: 'var(--bg-surface)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-xl)',
        zIndex: 1001,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInUp 0.2s ease-out both',
      }}>
        {/* Header Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => { setTab('join'); setError(''); }}
            style={{
              flex: 1, padding: '16px', border: 'none', background: tab === 'join' ? 'var(--bg-surface)' : 'transparent',
              color: tab === 'join' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 14, fontWeight: tab === 'join' ? 600 : 500, cursor: 'pointer',
              borderBottom: tab === 'join' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            Join Room
          </button>
          <button
            onClick={() => { setTab('create'); setError(''); }}
            style={{
              flex: 1, padding: '16px', border: 'none', background: tab === 'create' ? 'var(--bg-surface)' : 'transparent',
              color: tab === 'create' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 14, fontWeight: tab === 'create' ? 600 : 500, cursor: 'pointer',
              borderBottom: tab === 'create' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            Create New Room
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {error && (
            <div style={{ padding: 12, marginBottom: 20, background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          {tab === 'join' ? (
            <div className="animate-fade-in">
              <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Field
                  label="Room ID"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  placeholder="e.g. ALPHA"
                  autoFocus
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Button type="submit" disabled={!joinId.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                  Join Room
                </Button>
              </form>

              {recentRooms.length > 0 && (
                <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
                    Recent Rooms
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {recentRooms.map(room => (
                      <button
                        key={room.roomId}
                        onClick={() => onJoin(room.roomId, room.name)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', background: 'var(--bg-hover)', border: 'none', borderRadius: 8,
                          cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Icon d={Icons.hash} size={16} color="var(--text-muted)" />
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{room.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{room.roomId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">
              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Field
                  label="Room Name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Engineering Team"
                  autoFocus
                />
                <Field
                  label="Description (optional)"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="What is this room about?"
                />
                <Button type="submit" disabled={!createName.trim() || isCreating} loading={isCreating} style={{ width: '100%', justifyContent: 'center' }}>
                  Create & Join
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
