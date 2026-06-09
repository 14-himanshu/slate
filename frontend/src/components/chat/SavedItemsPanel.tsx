
import type { Message } from '../../types';
import { Avatar, IconButton, Icons, Icon } from '../ui';
import ReactMarkdown from 'react-markdown';

interface SavedItemsPanelProps {
    savedMessages: Message[];
    onClose: () => void;
    onJumpToMessage: (messageId: string, roomId?: string, conversationId?: string) => void;
    onUnsave: (messageId: string) => void;
}

export function SavedItemsPanel({ savedMessages, onClose, onJumpToMessage, onUnsave }: SavedItemsPanelProps) {
    return (
        <div style={{
            width: 380, height: '100%',
            background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 10,
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--accent)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </span>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Saved Items</h3>
                </div>
                <IconButton label="Close" onClick={onClose}><Icon d={Icons.x} size={18} /></IconButton>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
                {savedMessages.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: 16, opacity: 0.5 }}>
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>No saved items</p>
                        <p style={{ margin: 0, fontSize: 14 }}>Hover over any message and click the bookmark icon to save it here for quick reference.</p>
                    </div>
                ) : (
                    savedMessages.map(msg => (
                        <div key={msg.id} style={{
                            padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background 0.15s ease', cursor: 'pointer'
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Avatar name={msg.username} size={24} circle />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{msg.username}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onJumpToMessage(msg.id, (msg as any).roomId, (msg as any).conversationId); }}
                                        title="Jump to message"
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onUnsave(msg.id); }}
                                        title="Remove from saved items"
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                {msg.type === 'image' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                                        <Icon d={Icons.image} size={16} /> <span>Saved an image</span>
                                    </div>
                                )}
                                {msg.type === 'file' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                                        <Icon d={Icons.paperclip} size={16} /> <span>Saved a file</span>
                                    </div>
                                )}
                                {msg.type === 'audio' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                                        <Icon d={Icons.mic} size={16} /> <span>Saved a voice note</span>
                                    </div>
                                )}
                                {msg.text && (
                                    <div className="markdown-body" style={{ fontSize: 14, opacity: 0.9 }}>
                                        <ReactMarkdown>{msg.text.length > 200 ? msg.text.substring(0, 200) + '...' : msg.text}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
