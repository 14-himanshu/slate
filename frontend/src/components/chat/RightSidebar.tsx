import React from 'react';
import { Avatar, Icon, Icons } from '../ui';
import type { DirectConversationSummary } from '../../types';

interface RightSidebarProps {
    isOpen: boolean;
    activeSection: 'rooms' | 'dm';
    onlineUsers: string[];
    currentUser: string | null;
    activeConversation: DirectConversationSummary | null;
    messages?: import('../../types').Message[] | import('../../types').DirectMessage[];
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
    isOpen,
    activeSection,
    onlineUsers,
    currentUser,
    activeConversation,
    messages = []
}) => {
    if (!isOpen) return null;

    return (
        <aside style={{
            width: 280,
            background: 'var(--bg-sidebar)',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
        }}>
            {activeSection === 'rooms' ? (
                <div style={{ padding: '20px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Room Members
                    </div>
                    {onlineUsers.map(user => {
                        const isMe = user === currentUser;
                        return (
                            <div key={user} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', opacity: isMe ? 0.7 : 1 }}>
                                <div style={{ position: 'relative' }}>
                                    <Avatar name={user} size={28} circle />
                                    <span style={{ position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-sidebar)' }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user}{isMe && <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11, fontWeight: 400 }}>you</span>}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : activeConversation ? (
                <div style={{ display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                        <Avatar name={activeConversation.user.username} size={80} circle />
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12, marginBottom: 4 }}>
                            {activeConversation.user.username}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeConversation.user.status === 'online' ? 'var(--success)' : 'var(--offline)' }} />
                            {activeConversation.user.status === 'online' ? 'Online' : 'Offline'}
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 8 }}>
                            About Me
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, letterSpacing: '0.03em' }}>
                            {activeConversation.user.statusMessage || 'Hey there! I am using Slate. 🚀'}
                        </p>
                    </div>

                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 12 }}>
                            Shared Media
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {messages.filter(m => m.type === 'image' && m.fileUrl).slice(0, 4).map((m, i) => (
                                <div key={m.id || i} style={{ aspectRatio: '1', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                                    <img src={m.fileUrl} alt="Shared media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                            {messages.filter(m => m.type === 'image' && m.fileUrl).length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: '20px 0' }}>No shared media</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No conversation selected.
                </div>
            )}
        </aside>
    );
};
