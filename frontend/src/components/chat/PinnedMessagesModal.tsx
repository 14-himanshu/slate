import { useEffect } from 'react';
import type { Message, DirectMessage } from '../../types';
import { Avatar, Icon, Icons } from '../ui';

interface PinnedMessagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    messages: (Message | DirectMessage)[];
    onUnpin: (msg: Message | DirectMessage) => void;
}

export function PinnedMessagesModal({ isOpen, onClose, messages, onUnpin }: PinnedMessagesModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const pinnedMessages = messages.filter(m => m.isPinned);

    return (
        <>
            <div 
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            />
            <div style={{
                position: 'absolute',
                top: 60,
                right: 20,
                width: 380,
                maxHeight: '60vh',
                backgroundColor: '#16191E',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease'
            }}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon d={Icons.star || Icons.info} size={16} color="var(--text-muted)" />
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Pinned Messages</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Icon d={Icons.x} size={18} />
                    </button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                    {pinnedMessages.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                            No pinned messages in this conversation yet.
                        </div>
                    ) : (
                        pinnedMessages.map(msg => (
                            <div key={msg.id} style={{ padding: '12px', borderRadius: 8, background: 'var(--bg-elevated)', marginBottom: 8, display: 'flex', gap: 12, position: 'relative' }}>
                                <Avatar name={msg.username} size={32} circle />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{msg.username}</span>
                                        <button 
                                            onClick={() => onUnpin(msg)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 4 }}
                                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            Unpin
                                        </button>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                        {msg.text || (msg.type === 'image' ? '[Image]' : '[File]')}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
