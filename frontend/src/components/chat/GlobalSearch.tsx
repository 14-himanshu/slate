import React, { useState, useEffect, useRef } from 'react';
import { searchMessages } from '../../lib/api';

interface SearchResult {
    id: string;
    type: 'message' | 'user' | 'room';
    title: string;
    subtitle?: string;
    roomId?: string;
    conversationId?: string;
    timestamp?: string;
}

interface GlobalSearchProps {
    onClose: () => void;
    messages: Array<{ id: string; text: string; username: string; timestamp: Date; roomId?: string; conversationId?: string }>;
    rooms: Array<{ roomId: string; name: string }>;
    conversations: Array<{ id: string; user: { username: string } }>;
    onJumpToRoom: (roomId: string) => void;
    onJumpToConversation: (conversationId: string) => void;
    onJumpToMessage: (messageId: string) => void;
}

export function GlobalSearch({ onClose, messages, rooms, conversations, onJumpToRoom, onJumpToConversation, onJumpToMessage }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [recentItems, setRecentItems] = useState<SearchResult[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('chat_recent_searches') || '[]');
        } catch {
            return [];
        }
    });

    const saveRecent = (r: SearchResult) => {
        const next = [r, ...recentItems.filter(x => x.id !== r.id)].slice(0, 5);
        setRecentItems(next);
        localStorage.setItem('chat_recent_searches', JSON.stringify(next));
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const q = query.toLowerCase();
        let found: SearchResult[] = [];

        // Rooms
        rooms.forEach(r => {
            if (r.name.toLowerCase().includes(q) || r.roomId.toLowerCase().includes(q)) {
                found.push({ id: r.roomId, type: 'room', title: `#${r.name}`, subtitle: 'Room', roomId: r.roomId });
            }
        });

        // Users / DM conversations
        conversations.forEach(c => {
            if (c.user.username.toLowerCase().includes(q)) {
                found.push({ id: c.id, type: 'user', title: c.user.username, subtitle: 'Direct Message', conversationId: c.id });
            }
        });

        // Messages (last 200 for perf)
        const recent = messages.slice(-200);
        recent.forEach(m => {
            if (m.text && m.text.toLowerCase().includes(q)) {
                found.push({
                    id: m.id, type: 'message',
                    title: m.text.length > 80 ? m.text.slice(0, 80) + '…' : m.text,
                    subtitle: `${m.username} · ${m.timestamp.toLocaleDateString()}`,
                    roomId: m.roomId, conversationId: (m as any).conversationId
                });
            }
        });

        setResults(found.slice(0, 12));
        setSelectedIndex(0);

        // Backend search for messages
        const timeoutId = setTimeout(async () => {
            try {
                const apiMessages = await searchMessages(q);
                setResults(prev => {
                    const next = [...prev];
                    apiMessages.forEach(m => {
                        if (!next.some(r => r.id === m.id)) {
                            next.push({
                                id: m.id, type: 'message',
                                title: m.text?.length > 80 ? m.text.slice(0, 80) + '…' : m.text,
                                subtitle: `${m.username} · ${new Date(m.timestamp).toLocaleDateString()}`,
                                roomId: m.roomId, conversationId: (m as any).conversationId
                            });
                        }
                    });
                    return next.slice(0, 20);
                });
            } catch (err) {
                console.error("Backend search failed:", err);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, messages, rooms, conversations]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]); }
        if (e.key === 'Escape') { onClose(); }
    };

    const handleSelect = (r: SearchResult) => {
        saveRecent(r);
        if (r.type === 'room' && r.roomId) { onJumpToRoom(r.roomId); }
        else if (r.type === 'user' && r.conversationId) { onJumpToConversation(r.conversationId); }
        else if (r.type === 'message') {
            if (r.roomId) { onJumpToRoom(r.roomId); }
            else if (r.conversationId) { onJumpToConversation(r.conversationId); }
            setTimeout(() => onJumpToMessage(r.id), 300);
        }
        onClose();
    };

    const iconFor = (type: SearchResult['type']) => {
        if (type === 'room') return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
        );
        if (type === 'user') return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
        );
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
        );
    };

    const colorFor = (type: SearchResult['type']) => {
        if (type === 'room') return 'var(--accent)';
        if (type === 'user') return 'var(--success)';
        return 'var(--text-muted)';
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'var(--bg-overlay)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '10vh',
                animation: 'fadeIn 0.15s ease',
            }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                style={{
                    width: '100%', maxWidth: 560,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                    animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
                }}
                onKeyDown={handleKeyDown}
            >
                {/* Search input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: results.length > 0 ? '1px solid var(--border)' : 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search messages, rooms, people…"
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            fontSize: 15, color: 'var(--text-primary)', fontFamily: 'inherit',
                        }}
                    />
                    <kbd style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>ESC</kbd>
                </div>

                {/* Results */}
                {query.trim() && (
                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {results.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                No results for &ldquo;{query}&rdquo;
                            </div>
                        ) : (
                            results.map((r, i) => (
                                <button
                                    key={r.id}
                                    onClick={() => handleSelect(r)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        width: '100%', padding: '10px 16px',
                                        background: i === selectedIndex ? 'var(--bg-hover)' : 'transparent',
                                        border: 'none', textAlign: 'left', cursor: 'pointer',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                >
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                        background: 'var(--bg-elevated)', color: colorFor(r.type),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {iconFor(r.type)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.title}
                                        </div>
                                        {r.subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{r.subtitle}</div>}
                                    </div>
                                    <kbd style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', flexShrink: 0, opacity: i === selectedIndex ? 1 : 0, transition: 'opacity 0.1s' }}>↵</kbd>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {!query.trim() && (
                    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[['Channels', '#'], ['People', '@'], ['Files', '📎']].map(([label, icon]) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
                                    <span>{icon}</span>{label}
                                </div>
                            ))}
                        </div>
                        {recentItems.length > 0 && (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recent</div>
                                {recentItems.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => handleSelect(r)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            width: '100%', padding: '8px 12px', margin: '0 -12px',
                                            background: 'transparent',
                                            border: 'none', textAlign: 'left', cursor: 'pointer',
                                            borderRadius: 8,
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                                            background: 'var(--bg-elevated)', color: colorFor(r.type),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {iconFor(r.type)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {r.title}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div style={{ width: '100%', fontSize: 11, color: 'var(--text-muted)' }}>
                            Use ↑↓ to navigate · Enter to select · Esc to dismiss
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
