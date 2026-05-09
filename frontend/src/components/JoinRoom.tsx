import React from 'react';
import { BrandMark, Button, Field, StatusBadge } from './ui';

interface JoinRoomProps {
    roomId: string;
    setRoomId: (id: string) => void;
    joinRoom: () => void;
    isConnected: boolean;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ roomId, setRoomId, joinRoom, isConnected }) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') joinRoom();
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
            }}
        >
            <div
                className="animate-pop-in"
                style={{
                    width: '100%',
                    maxWidth: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 32,
                    position: 'relative',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <BrandMark size={48} />
                    <div>
                        <h2 style={{
                            fontSize: '24px', fontWeight: 600,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                        }}>
                            Enter a Room
                        </h2>
                        <p style={{ marginTop: 8, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Type a room ID to start chatting in real-time
                        </p>
                    </div>
                    <StatusBadge active={isConnected} activeText="Server connected" inactiveText="Connecting…" />
                </div>

                {/* Input area */}
                <div
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '32px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        boxShadow: 'var(--shadow-md)',
                    }}
                >
                    <Field
                        id="room-id-input"
                        label="Room ID"
                        type="text"
                        value={roomId}
                        onChange={e => setRoomId(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyPress}
                        placeholder="e.g. ALPHA"
                        disabled={!isConnected}
                        maxLength={12}
                        autoFocus
                        style={{
                            textAlign: 'center',
                            fontSize: '18px',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            height: '52px',
                        }}
                    />

                    <Button
                        id="join-room-btn"
                        onClick={joinRoom}
                        disabled={!isConnected || !roomId.trim()}
                        size="lg"
                        style={{ width: '100%' }}
                    >
                        Join Conversation
                    </Button>
                </div>

                {/* Info footer */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    Fast, secure, and ephemeral
                </div>
            </div>
        </div>
    );
};

export default JoinRoom;
