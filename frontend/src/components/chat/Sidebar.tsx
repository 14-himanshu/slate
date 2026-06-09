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
    onDeleteConversation: (conversationId: string) => void;
    onSearchUsers: (query: string) => Promise<UserSummary[]>;
    onOpenSavedItems: () => void;
    onOpenProfile: () => void;
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
    onSelectConversation, onStartConversation, onDeleteConversation, onSearchUsers,
    onOpenSavedItems, onOpenProfile
}: SidebarProps) {
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
    const [hoveredDm, setHoveredDm] = useState<string | null>(null);
    const [globalSearch, setGlobalSearch] = useState('');
    const [dmResults, setDmResults] = useState<UserSummary[]>([]);
    const [dmSearching, setDmSearching] = useState(false);
    const [isRoomsOpen, setIsRoomsOpen] = useState(true);
    const [isDMsOpen, setIsDMsOpen] = useState(true);

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
            .filter((c: DirectConversationSummary) => c.user.username.toLowerCase().includes(lq));
    }, [directConversations, lq]);

    return (
        <aside style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-sidebar)',
            height: '100%',
            overflow: 'hidden',
            borderRight: '1px solid var(--border)',
        }}>
            {/* ── Brand bar ──────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px',
                height: 56,
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
            }}>
                <div 
                    onClick={onOpenProfile}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', height: '100%' }}
                >
                    <BrandMark size={28} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Slate</div>
                    </div>
                </div>
            </div>

            {/* ── Global search ───────────────────────────── */}
            <div style={{ padding: '12px 16px', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>
                        <Icon d={Icons.search} size={14} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search rooms or DMs…"
                        value={globalSearch}
                        onChange={e => setGlobalSearch(e.target.value)}
                        style={{
                            width: '100%', height: 36,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0 12px 0 34px',
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    {globalSearch && (
                        <button onClick={() => setGlobalSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 2 }}>
                            <Icon d={Icons.x} size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Scrollable content ──────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>

                {/* SAVED ITEMS section */}
                <div style={{ marginBottom: 16, marginTop: 8 }}>
                    <button
                        onClick={onOpenSavedItems}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', background: 'transparent', border: 'none',
                            borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            color: 'var(--text-primary)',
                            transition: 'all 0.15s ease', textAlign: 'left',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <span style={{ color: 'var(--accent)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Saved Items</span>
                    </button>
                </div>

                {/* ROOMS section */}
                <div style={{ marginBottom: 16 }}>
                    <div 
                        onClick={() => setIsRoomsOpen(!isRoomsOpen)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 8px', cursor: 'pointer', userSelect: 'none' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRoomsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Rooms</span>
                        </div>
                        <IconButton label="Join or create a room" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRoomModal(true); }}>
                            <Icon d={Icons.plus} size={13} />
                        </IconButton>
                    </div>

                    {isRoomsOpen && (
                        <div style={{ paddingBottom: 8 }}>
                            {filteredRooms.length === 0 && (
                                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    marginBottom: 4,
                                    background: active ? 'var(--accent-bg)' : hovered ? 'var(--bg-hover)' : 'transparent',
                                    transition: 'all 0.15s ease',
                                    position: 'relative',
                                }}
                            >
                                {active && (
                                    <div style={{
                                        position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3,
                                        background: 'var(--accent)', borderRadius: '0 4px 4px 0'
                                    }} />
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>#</span>
                                    <span style={{
                                        fontSize: 13,
                                        fontWeight: unread > 0 ? 600 : active ? 600 : 500,
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
                                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                        >
                                            <Icon d={Icons.x} size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                            })}
                        </div>
                    )}
                </div>

                {/* DIRECT MESSAGES section */}
                <div style={{ marginTop: 16 }}>
                    <div 
                        onClick={() => setIsDMsOpen(!isDMsOpen)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 8px', cursor: 'pointer', userSelect: 'none' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDMsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Direct Messages</span>
                        </div>
                    </div>

                    {/* DM Search Results */}
                    {globalSearch && (
                        <div style={{ padding: '4px 0', marginBottom: 8 }}>
                            {dmSearching && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', fontSize: 12, color: 'var(--text-muted)' }}>
                                    <Icon d={Icons.loader} size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                    Searching users…
                                </div>
                            )}
                            {!dmSearching && dmResults.length === 0 && (
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 8px' }}>No users found.</p>
                            )}
                            {dmResults.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => { onStartConversation(user.id); setGlobalSearch(''); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 12px', marginBottom: 4,
                                        borderRadius: 'var(--radius-md)',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        textAlign: 'left',
                                        transition: 'all 0.15s ease',
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

                    {isDMsOpen && (
                        <div style={{ paddingBottom: 8 }}>
                            {filteredConvos.length === 0 && (
                                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    {directConversations.length === 0 ? 'No conversations yet.' : 'No results.'}
                                </div>
                            )}

                            {filteredConvos.map(convo => {
                                const active = activeSection === 'dm' && convo.id === activeConversationId;
                                const unread = convo.unreadCount ?? 0;
                                const preview = getLastMessagePreview(convo, currentUser);
                                const ts = formatTime(convo.lastMessageAt ?? convo.lastMessage?.timestamp);
                                const hovered = hoveredDm === convo.id;
                                return (
                                    <div
                                        key={convo.id}
                                        onClick={() => onSelectConversation(convo.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '8px 12px',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            marginBottom: 4,
                                            background: active ? 'var(--accent-bg)' : hovered ? 'var(--bg-hover)' : 'transparent',
                                            transition: 'all 0.15s ease',
                                            position: 'relative',
                                        }}
                                onMouseEnter={() => setHoveredDm(convo.id)}
                                onMouseLeave={() => setHoveredDm(null)}
                            >
                                {active && (
                                    <div style={{
                                        position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3,
                                        background: 'var(--accent)', borderRadius: '0 4px 4px 0'
                                    }} />
                                )}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <Avatar name={convo.user.username} size={32} circle />
                                    <span style={{
                                        position: 'absolute', bottom: 0, right: 0,
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: convo.user.status === 'online' ? 'var(--success)' : 'var(--text-muted)',
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
                                {unread > 0 && !hovered && <Badge count={unread} />}
                                {hovered && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteConversation(convo.id);
                                        }}
                                        title="Dismiss chat"
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 3, borderRadius: 4, display: 'flex' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                    >
                                        <Icon d={Icons.x} size={12} />
                                    </button>
                                )}
                            </div>
                        );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ height: 16 }} />
            </div>

            {/* USER PROFILE bottom bar */}
            <div 
                onClick={onOpenProfile}
                style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: 'var(--bg-surface)',
                    flexShrink: 0,
                    transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <Avatar name={currentUser ?? ''} size={32} circle />
                        <span style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: 10, height: 10, borderRadius: '50%',
                            background: 'var(--success)',
                            border: '2px solid var(--bg-surface)'
                        }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {currentUser}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Online</div>
                    </div>
                </div>
                <div style={{ color: 'var(--text-muted)', display: 'flex' }}>
                    <Icon d={Icons.settings} size={16} />
                </div>
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
