import { useState, useEffect, useMemo } from 'react';
import type { DirectConversationSummary, UserSummary } from '../../types';
import { Avatar, Badge, BrandMark, Icon, IconButton, Icons } from '../ui';
import { RoomModal } from './RoomModal';

interface SidebarProps {
    userRooms: import('../../types').RoomSummary[];
    joinedRooms: string[];
    activeRoom: string | null;
    unreadByRoom: Record<string, number>;
    currentUser: string | null;
    onSwitch: (r: string) => void;
    onLeave: (r: string) => void;
    onJoin: (r: string) => void;
    directConversations: DirectConversationSummary[];
    activeConversationId: string | null;
    activeSection: 'rooms' | 'dm';
    onSelectConversation: (conversationId: string) => void;
    onStartConversation: (userId: string) => void;
    onSearchUsers: (query: string) => Promise<UserSummary[]>;
}

function formatTime(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getLastMessagePreview(c: DirectConversationSummary, currentUser: string | null) {
    const last = c.lastMessage;
    if (!last) return 'Start a conversation';
    const isMe = last.username === currentUser;
    const prefix = isMe ? 'You: ' : '';
    if (last.type === 'image') return `${prefix}Sent a photo`;
    if (last.type === 'file') return `${prefix}${last.fileName ?? 'Sent a file'}`;
    return `${prefix}${last.text}`;
}

export function Sidebar({
    userRooms, joinedRooms, activeRoom, unreadByRoom, currentUser,
    onSwitch, onLeave, onJoin,
    directConversations, activeConversationId, activeSection,
    onSelectConversation, onStartConversation, onSearchUsers,
}: SidebarProps) {
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
    const [hoveredDm, setHoveredDm] = useState<string | null>(null);
    const [dismissedDMs, setDismissedDMs] = useState<string[]>([]);
    const [globalSearch, setGlobalSearch] = useState('');
    const [dmResults, setDmResults] = useState<UserSummary[]>([]);
    const [dmSearching, setDmSearching] = useState(false);

    // Debounced global user search
    useEffect(() => {
        if (!globalSearch.trim()) { setDmResults([]); return; }
        const t = setTimeout(() => {
            setDmSearching(true);
            onSearchUsers(globalSearch.trim())
                .then(setDmResults)
                .finally(() => setDmSearching(false));
        }, 300);
        return () => clearTimeout(t);
    }, [globalSearch, onSearchUsers]);

    const lq = globalSearch.toLowerCase();
    
    // Combine joinedRooms with userRooms data
    const enrichedRooms = joinedRooms.map(id => {
        const data = userRooms.find(r => r.roomId === id);
        return { roomId: id, name: data?.name || id };
    });
    
    const filteredRooms = enrichedRooms.filter(r => r.name.toLowerCase().includes(lq) || r.roomId.toLowerCase().includes(lq));
    const filteredConvos = useMemo(() => {
        return directConversations
            .filter((c: DirectConversationSummary) => !dismissedDMs.includes(c.id))
            .filter((c: DirectConversationSummary) => c.user.username.toLowerCase().includes(lq));
    }, [directConversations, dismissedDMs, lq]);

    return (
        <aside style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-sidebar)',
            height: '100%',
            overflow: 'hidden',
        }}>
            {/* ── Brand bar ──────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px',
                height: 56,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', height: '100%' }}>
                    <BrandMark size={28} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Slate</div>
                    </div>
                </div>
            </div>

            {/* ── Global search ───────────────────────────── */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>
                        <Icon d={Icons.search} size={13} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search…"
                        value={globalSearch}
                        onChange={e => setGlobalSearch(e.target.value)}
                        style={{
                            width: '100%', height: 32,
                            background: 'var(--bg-input)',
                            border: 'none',
                            borderRadius: 4,
                            padding: '0 10px 0 30px',
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            outline: 'none',
                        }}
                    />
                    {globalSearch && (
                        <button onClick={() => setGlobalSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 2 }}>
                            <Icon d={Icons.x} size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Scrollable content ──────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 0' }}>

                {/* ROOMS section */}
                <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 4px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Rooms</span>
                        <IconButton label="Join or create a room" size="sm" onClick={() => setShowRoomModal(true)}>
                            <Icon d={Icons.plus} size={13} />
                        </IconButton>
                    </div>

                    {filteredRooms.length === 0 && (
                        <div style={{ padding: '6px 8px 8px', fontSize: 12, color: 'var(--text-muted)' }}>
                            {joinedRooms.length === 0 ? 'No rooms joined yet.' : 'No results.'}
                        </div>
                    )}

                    {filteredRooms.map(room => {
                        const active = room.roomId === activeRoom && activeSection === 'rooms';
                        const unread = unreadByRoom[room.roomId] ?? 0;
                        const hovered = hoveredRoom === room.roomId;
                        return (
                            <div
                                key={room.roomId}
                                onMouseEnter={() => setHoveredRoom(room.roomId)}
                                onMouseLeave={() => setHoveredRoom(null)}
                                onClick={() => onSwitch(room.roomId)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '6px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    marginBottom: 2,
                                    background: active ? 'var(--accent-bg)' : hovered ? 'var(--bg-hover)' : 'transparent',
                                    transition: 'background 0.1s',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>#</span>
                                    <span style={{
                                        fontSize: 13,
                                        fontWeight: unread > 0 ? 600 : active ? 600 : 400,
                                        color: active ? 'var(--accent)' : unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        letterSpacing: '-0.01em',
                                    }}>
                                        {room.name}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                    {unread > 0 && <Badge count={unread} />}
                                    {hovered && (
                                        <button
                                            onClick={e => { e.stopPropagation(); onLeave(room.roomId); }}
                                            title="Leave room"
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 3, borderRadius: 4, display: 'flex' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                                        >
                                            <Icon d={Icons.x} size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* DIRECT MESSAGES section */}
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 4px', borderTop: '1px solid var(--border-subtle)', marginTop: 4, paddingTop: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Direct Messages</span>
                    </div>

                    {/* DM Search Results */}
                    {globalSearch && (
                        <div style={{ padding: '4px 8px', marginBottom: 8 }}>
                            {dmSearching && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', fontSize: 12, color: 'var(--text-muted)' }}>
                                    <Icon d={Icons.loader} size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                    Searching users…
                                </div>
                            )}
                            {!dmSearching && dmResults.length === 0 && (
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 4px' }}>No users found for "{globalSearch}".</p>
                            )}
                            {dmResults.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => { onStartConversation(user.id); setGlobalSearch(''); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '6px 10px', marginBottom: 2,
                                        borderRadius: 4,
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        textAlign: 'left',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <Avatar name={user.username} size={28} circle />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{user.username}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: user.status === 'online' ? 'var(--success)' : 'var(--offline)', flexShrink: 0 }} />
                                            {user.status === 'online' ? 'Online' : 'Offline'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {filteredConvos.length === 0 && (
                        <div style={{ padding: '8px 8px 4px', fontSize: 12, color: 'var(--text-muted)' }}>
                            {directConversations.length === 0 ? 'No conversations yet.' : 'No results.'}
                        </div>
                    )}

                    {filteredConvos.map(convo => {
                        const active = activeSection === 'dm' && convo.id === activeConversationId;
                        const unread = convo.unreadCount ?? 0;
                        const preview = getLastMessagePreview(convo, currentUser);
                        const ts = formatTime(convo.lastMessageAt ?? convo.lastMessage?.timestamp);
                        return (
                            <div
                                key={convo.id}
                                onClick={() => onSelectConversation(convo.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '6px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    marginBottom: 2,
                                    background: 'transparent',
                                    border: 'none',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; setHoveredDm(convo.id); }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; setHoveredDm(null); }}
                            >
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <Avatar name={convo.user.username} size={32} circle />
                                    <span style={{
                                        position: 'absolute', bottom: 0, right: 0,
                                        width: 9, height: 9, borderRadius: '50%',
                                        background: convo.user.status === 'online' ? 'var(--success)' : 'var(--offline)',
                                        border: '2px solid var(--bg-sidebar)',
                                    }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                        <span style={{
                                            fontSize: 13, fontWeight: unread > 0 ? 700 : 500,
                                            color: active ? 'var(--accent)' : 'var(--text-primary)',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            letterSpacing: '-0.01em',
                                        }}>
                                            {convo.user.username}
                                        </span>
                                        {ts && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{ts}</span>}
                                    </div>
                                    <div style={{
                                        fontSize: 12,
                                        color: unread > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        marginTop: 1,
                                        fontWeight: unread > 0 ? 500 : 400,
                                    }}>
                                        {preview}
                                    </div>
                                </div>
                                {unread > 0 && hoveredDm !== convo.id && <Badge count={unread} />}
                                {hoveredDm === convo.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDismissedDMs(prev => [...prev, convo.id]);
                                        }}
                                        title="Dismiss chat"
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 3, borderRadius: 4, display: 'flex' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                                    >
                                        <Icon d={Icons.x} size={12} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>



                <div style={{ height: 16 }} />
            </div>

            {showRoomModal && (
                <RoomModal
                    recentRooms={userRooms.filter(r => !joinedRooms.includes(r.roomId))}
                    onClose={() => setShowRoomModal(false)}
                    onJoin={(roomId) => {
                        onJoin(roomId);
                        setShowRoomModal(false);
                    }}
                />
            )}
        </aside>
    );
}
