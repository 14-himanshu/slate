import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { Avatar, BrandMark, StatusBadge } from './ui';

interface ChatRoomProps {
    joinedRooms: string[];
    activeRoom: string | null;
    messagesByRoom: Record<string, Message[]>;
    unreadByRoom: Record<string, number>;
    onlineUsers: string[];
    typingUsers: string[];
    onTyping: (isTyping: boolean) => void;
    onJoinRoom: (roomId: string) => void;
    onLeaveRoom: (roomId: string) => void;
    onSwitchRoom: (roomId: string) => void;
    inputValue: string;
    setInputValue: (v: string) => void;
    sendMessage: (replyToId?: string) => void;
    sendFileMessage: (f: File, caption?: string, replyToId?: string) => Promise<void>;
    onEditMessage: (msgId: string, text: string) => void;
    onDeleteMessage: (msgId: string) => void;
    onReactMessage: (msgId: string, icon: string) => void;
    isConnected: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    inputRef: React.RefObject<HTMLInputElement | null>;
    currentUser: string | null;
    onOpenProfile: () => void;
}

function formatTime(d: Date) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDateLabel(d: Date) {
    const today = new Date(), yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

/* ── Sidebar ───────────────────────────────────────────────── */
function Sidebar({ joinedRooms, activeRoom, unreadByRoom, onlineUsers, currentUser, onSwitch, onLeave, onJoin, isConnected }: {
    joinedRooms: string[];
    activeRoom: string | null;
    unreadByRoom: Record<string, number>;
    onlineUsers: string[];
    currentUser: string | null;
    onSwitch: (r: string) => void;
    onLeave: (r: string) => void;
    onJoin: (r: string) => void;
    isConnected: boolean;
}) {
    const [adding, setAdding] = useState(false);
    const [newRoom, setNewRoom] = useState('');
    const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRooms = joinedRooms.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredUsers = onlineUsers.filter(u => u.toLowerCase().includes(searchQuery.toLowerCase()));

    const submit = () => {
        if (newRoom.trim()) { onJoin(newRoom); setNewRoom(''); setAdding(false); }
    };

    return (
        <aside style={{
            width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)',
            height: '100%',
        }}>
            {/* Brand */}
            <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <BrandMark size={28} />
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>SyncTalk</div>
                    <StatusBadge active={isConnected} activeText="Online" inactiveText="Offline" />
                </div>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '8px 10px 8px 32px', fontSize: 13, color: 'var(--text-primary)',
                            outline: 'none', transition: 'all 0.15s',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-bg)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                </div>
            </div>

            {/* Room list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 8px 8px' }}>
                    Rooms
                </div>

                {filteredRooms.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 10px', lineHeight: 1.6 }}>
                        No rooms found.
                    </div>
                )}

                {filteredRooms.map(room => {
                    const active = room === activeRoom;
                    const unread = unreadByRoom[room] ?? 0;
                    const hovered = hoveredRoom === room;
                    return (
                        <div
                            key={room}
                            onMouseEnter={() => setHoveredRoom(room)}
                            onMouseLeave={() => setHoveredRoom(null)}
                            onClick={() => onSwitch(room)}
                             style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                                background: active ? 'var(--accent-bg)' : hovered ? 'var(--bg-hover)' : 'transparent',
                                transition: 'all 0.1s ease',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                                <span style={{ color: active ? 'var(--accent-light)' : 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>#</span>
                                <span style={{
                                    fontSize: 13, fontWeight: active ? 600 : 500,
                                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {room}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {unread > 0 && (
                                    <span style={{
                                        background: '#7c3aed', color: '#fff', borderRadius: 10,
                                        fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center',
                                    }}>{unread > 99 ? '99+' : unread}</span>
                                )}
                                {hovered && (
                                    <button
                                        onClick={e => { e.stopPropagation(); onLeave(room); }}
                                        title="Leave room"
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--text-muted)', padding: 2, borderRadius: 4,
                                            display: 'flex', alignItems: 'center',
                                        }}
                                    >
                                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '16px 8px 8px', marginTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                    Active Users
                </div>

                {filteredUsers.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 10px' }}>
                        No users found.
                    </div>
                )}

                {filteredUsers.map(user => {
                    const isMe = user === currentUser;
                    return (
                        <div key={user} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, opacity: isMe ? 0.6 : 1 }}>
                            <div style={{ position: 'relative' }}>
                                <Avatar name={user} size={24} />
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#10b981', border: '2px solid var(--bg-surface)' }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user} {isMe && '(You)'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Add Room */}
            <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
                {adding ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input
                            autoFocus
                            value={newRoom}
                            onChange={e => setNewRoom(e.target.value.toUpperCase())}
                            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAdding(false); setNewRoom(''); } }}
                            placeholder="ROOM-ID"
                            style={{
                                flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-focus)',
                                borderRadius: 6, padding: '7px 10px', fontSize: 12, color: 'var(--text-primary)',
                                fontFamily: 'inherit', letterSpacing: '0.05em', outline: 'none',
                            }}
                        />
                        <button onClick={submit} style={{
                            background: 'var(--accent)', border: 'none',
                            borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '0 12px', fontSize: 12, fontWeight: 500,
                        }}>Join</button>
                    </div>
                ) : (
                     <button
                        id="add-room-btn"
                        onClick={() => setAdding(true)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            background: 'var(--bg-surface)', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '8px 12px', cursor: 'pointer', color: 'var(--text-primary)',
                            fontSize: 13, fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.1s ease',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                    >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Join a Room
                    </button>
                )}
            </div>
        </aside>
    );
}

/* ── Empty / No-room states ───────────────────────────────── */
function NoRoomSelected() {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)', padding: 32, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>No room selected</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Join a room from the sidebar to start chatting</p>
        </div>
    );
}

function EmptyMessages() {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>No messages yet</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Send a message to start the conversation</p>
        </div>
    );
}

/* ── Message List ─────────────────────────────────────────── */
/* ── Message List Components ──────────────────────────────── */
function MessageActions({ msg, mine, onReact, onReply, onEdit, onDelete, onMoreClick, moreBtnRef }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: 'var(--shadow-md)', padding: 2 }}>
            <button onClick={() => onReact(msg, 'like')} title="Like" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', display: 'flex', transition: 'color 0.15s, background 0.15s', borderRadius: 4 }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
            </button>
            <button onClick={() => onReact(msg, 'heart')} title="Love" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', display: 'flex', transition: 'color 0.15s, background 0.15s', borderRadius: 4 }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <button onClick={() => onReact(msg, 'check')} title="Check" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', display: 'flex', transition: 'color 0.15s, background 0.15s', borderRadius: 4 }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
            <button onClick={onReply} title="Reply" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', display: 'flex', transition: 'color 0.15s, background 0.15s', borderRadius: 4 }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
            </button>
            {mine && msg.type === 'text' && (
                <button onClick={onEdit} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', display: 'flex', transition: 'color 0.15s, background 0.15s', borderRadius: 4 }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
            )}
            {mine && (
                <button onClick={onDelete} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px', display: 'flex', transition: 'background 0.15s', borderRadius: 4 }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            )}
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
            <button ref={moreBtnRef} onClick={onMoreClick} title="More" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', display: 'flex', transition: 'color 0.15s, background 0.15s', borderRadius: 4 }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
        </div>
    );
}

function ContextMenuItem({ icon, label, onClick, danger }: any) {
    const [hover, setHover] = useState(false);
    return (
        <button 
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: hover ? (danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)') : 'transparent', color: danger ? '#ef4444' : 'var(--text-primary)', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 500, transition: 'background 0.1s', width: '100%' }}
        >
            <span style={{ display: 'flex', color: danger ? '#ef4444' : 'var(--text-secondary)' }}>{icon}</span>
            {label}
        </button>
    );
}

function MessageContextMenu({ msg, mine, onReply, onEdit, onDelete, onClose, position }: any) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        const handleClick = () => onClose();
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClick);
        };
    }, [onClose]);

    return (
        <div 
            style={{ 
                position: 'fixed', 
                top: position.top, 
                left: position.left, 
                right: position.right, 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--border)', 
                borderRadius: 6, 
                padding: '6px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2, 
                minWidth: 180, 
                zIndex: 100, 
                boxShadow: 'var(--shadow-lg)' 
            }} 
            onClick={e => e.stopPropagation()}
        >
            <ContextMenuItem 
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>} 
                label="Reply" 
                onClick={() => { onReply(msg); onClose(); }} 
            />
            <ContextMenuItem 
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>} 
                label="Copy text" 
                onClick={() => { navigator.clipboard.writeText(msg.text); onClose(); }} 
            />
            <ContextMenuItem 
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>} 
                label="Pin message" 
                onClick={() => onClose()} 
            />
            <ContextMenuItem 
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} 
                label="Mark unread" 
                onClick={() => onClose()} 
            />
            
            {mine && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}
            {mine && msg.type === 'text' && (
                <ContextMenuItem 
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} 
                    label="Edit Message" 
                    onClick={() => { onEdit(msg); onClose(); }} 
                />
            )}
            {mine && (
                <ContextMenuItem 
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>} 
                    label="Delete Message" 
                    onClick={() => { onDelete(msg); onClose(); }} 
                    danger 
                />
            )}
            
            {!mine && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}
            {!mine && (
                <ContextMenuItem 
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>} 
                    label="Report Message" 
                    onClick={() => onClose()} 
                    danger 
                />
            )}
        </div>
    );
}

function MessageItem({ msg, mine, sameAsPrev, sameAsNext, onReply, onEdit, onDelete, onReact, onJumpToMessage }: any) {
    const [isHovered, setIsHovered] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number, right?: number, left?: number } | null>(null);
    const moreBtnRef = useRef<HTMLButtonElement>(null);

    const handleMoreClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (moreBtnRef.current) {
            const rect = moreBtnRef.current.getBoundingClientRect();
            if (mine) {
                setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
            } else {
                setMenuPos({ top: rect.bottom + 8, left: rect.left });
            }
        }
    };

    const br = mine
        ? { borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderTopRightRadius: sameAsPrev ? 4 : 12, borderBottomRightRadius: sameAsNext ? 4 : 12 }
        : { borderTopRightRadius: 12, borderBottomRightRadius: 12, borderTopLeftRadius: sameAsPrev ? 4 : 12, borderBottomLeftRadius: sameAsNext ? 4 : 12 };

    return (
        <article
            id={`message-${msg.id}`}
            className="animate-slide-up"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 10, marginTop: sameAsPrev ? 3 : 14, padding: '0 16px', position: 'relative', transition: 'background 0.3s ease', borderRadius: 8 }}
        >
            {!mine && (
                <div style={{ width: 32, flexShrink: 0, marginBottom: 2 }}>
                    {!sameAsNext ? <Avatar name={msg.username} size={32} /> : <div style={{ width: 32 }} />}
                </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', maxWidth: 'min(72%,520px)', position: 'relative' }}>
                {!mine && !sameAsPrev && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, marginLeft: 2, letterSpacing: '0.02em' }}>{msg.username}</span>
                )}
                
                <div style={{ position: 'relative', display: 'flex', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    {/* The Action Toolbar */}
                    {(isHovered || menuPos) && !msg.deleted && (
                        <div style={{ position: 'absolute', top: -14, [mine ? 'right' : 'left']: 'calc(100% + 8px)', zIndex: 10, opacity: isHovered || menuPos ? 1 : 0, transition: 'opacity 0.15s ease' }}>
                            <MessageActions msg={msg} mine={mine} onReact={onReact} onReply={() => onReply(msg)} onEdit={() => onEdit(msg)} onDelete={() => onDelete(msg)} onMoreClick={handleMoreClick} moreBtnRef={moreBtnRef} />
                        </div>
                    )}
                    
                     {/* Bubble */}
                    <div style={{ ...br, padding: msg.type === 'image' ? '4px' : '8px 12px', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap', background: mine ? 'var(--my-bubble)' : 'var(--their-bubble)', color: mine ? '#fff' : 'var(--text-primary)', border: mine ? '1px solid var(--my-bubble)' : '1px solid var(--border)', opacity: msg.deleted ? 0.6 : 1, fontStyle: msg.deleted ? 'italic' : 'normal', transition: 'filter 0.1s', filter: (isHovered && !msg.deleted) ? 'brightness(1.05)' : 'none' }}>
                        {/* Reply context */}
                        {msg.replyTo && (
                            <div 
                                onClick={() => {
                                    const id = typeof msg.replyTo === 'object' ? msg.replyTo.id : msg.replyTo;
                                    if (id) onJumpToMessage(id);
                                }}
                                style={{ 
                                    padding: '4px 8px', marginBottom: 6, background: mine ? 'rgba(0,0,0,0.2)' : 'var(--bg-surface)', 
                                    borderLeft: `3px solid ${mine ? '#fff' : 'var(--accent-light)'}`, borderRadius: 4, fontSize: 12, opacity: 0.9,
                                    cursor: 'pointer', transition: 'transform 0.1s, background 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = mine ? 'rgba(0,0,0,0.3)' : 'var(--bg-hover)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = mine ? 'rgba(0,0,0,0.2)' : 'var(--bg-surface)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: 2 }}>{typeof msg.replyTo === 'object' ? msg.replyTo.username : 'Message'}</div>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{typeof msg.replyTo === 'object' ? msg.replyTo.text : '...'}</div>
                            </div>
                        )}
                        {msg.deleted ? "This message was removed" : (
                            <>
                                {/* Image message */}
                                {msg.type === 'image' && msg.fileUrl && (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={msg.fileUrl} alt={msg.fileName ?? 'image'} style={{ display: 'block', maxWidth: 260, maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                                    </a>
                                )}
                                {/* File message */}
                                {msg.type === 'file' && msg.fileUrl && (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
                                        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                        <span style={{ fontSize: 13, fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 2 }}>{msg.fileName ?? 'Download file'}</span>
                                    </a>
                                )}
                                {/* Text caption */}
                                {msg.text && msg.type !== 'image' && <span>{msg.text.split(/(@\w+)/g).map((part: string, i: number) => part.startsWith('@') ? <span key={i} style={{ color: mine ? '#fff' : 'var(--accent-light)', fontWeight: 700, background: mine ? 'rgba(255,255,255,0.2)' : 'rgba(124,58,237,0.15)', padding: '0 4px', borderRadius: 4 }}>{part}</span> : part)}</span>}
                                {msg.text && msg.type === 'image' && (
                                    <p style={{ margin: '6px 4px 2px', fontSize: 13 }}>{msg.text.split(/(@\w+)/g).map((part: string, i: number) => part.startsWith('@') ? <span key={i} style={{ color: mine ? '#fff' : 'var(--accent-light)', fontWeight: 700, background: mine ? 'rgba(255,255,255,0.2)' : 'rgba(124,58,237,0.15)', padding: '0 4px', borderRadius: 4 }}>{part}</span> : part)}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, alignSelf: mine ? 'flex-end' : 'flex-start' }}>
                        {Object.entries(msg.reactions.reduce((acc: Record<string, number>, r: any) => { acc[r.icon] = (acc[r.icon] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([icon, count]: [string, any]) => (
                            <div key={icon} onClick={() => onReact(msg, icon)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '2px 6px', fontSize: 11, cursor: 'pointer', color: 'var(--accent-light)' }}>
                                {icon === 'like' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>}
                                {icon === 'heart' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>}
                                {icon === 'check' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{count}</span>
                            </div>
                        ))}
                    </div>
                )}

                {!sameAsNext && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, marginLeft: mine ? 0 : 4, marginRight: mine ? 4 : 0 }}>
                        <time style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatTime(msg.timestamp)}</time>
                        {msg.edited && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(edited)</span>}
                        {mine && (
                            <span style={{ fontSize: 10, color: 'var(--accent-light)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </span>
                        )}
                    </div>
                )}
            </div>
            
            {menuPos && (
                <MessageContextMenu msg={msg} mine={mine} position={menuPos} onClose={() => setMenuPos(null)} onReply={() => onReply(msg)} onEdit={() => onEdit(msg)} onDelete={() => onDelete(msg)} />
            )}
        </article>
    );
}

function MessageList({ messages, currentUser, messagesEndRef, onReply, onEdit, onDelete, onReact, onJumpToMessage }: {
    messages: Message[]; currentUser: string | null; messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onReply: (m: Message) => void; onEdit: (m: Message) => void; onDelete: (m: Message) => void; onReact: (m: Message, icon: string) => void;
    onJumpToMessage: (id: string) => void;
}) {
    if (messages.length === 0) return <EmptyMessages />;
    let lastDate = '';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
            {messages.map((msg, i) => {
                const mine = msg.username === currentUser;
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const sameAsPrev = prev?.username === msg.username;
                const sameAsNext = next?.username === msg.username;
                const msgDate = msg.timestamp.toDateString();
                const showDate = msgDate !== lastDate;
                if (showDate) lastDate = msgDate;

                return (
                    <React.Fragment key={msg.id}>
                        {showDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
                                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{formatDateLabel(msg.timestamp)}</span>
                                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            </div>
                        )}
                        <MessageItem msg={msg} mine={mine} sameAsPrev={sameAsPrev} sameAsNext={sameAsNext} onReply={onReply} onEdit={onEdit} onDelete={onDelete} onReact={onReact} onJumpToMessage={onJumpToMessage} />
                    </React.Fragment>
                );
            })}
            <div ref={messagesEndRef} style={{ height: 8 }} />
        </div>
    );
}

/* ── Composer ─────────────────────────────────────────────── */
function Composer({ value, setValue, sendMessage, sendFileMessage, isConnected, inputRef, disabled, onTyping, replyToMsg, setReplyToMsg, editingMsg, setEditingMsg, onEditMessage }: {
    value: string; setValue: (v: string) => void; sendMessage: (replyToId?: string) => void;
    sendFileMessage: (f: File, caption?: string, replyToId?: string) => Promise<void>;
    isConnected: boolean; inputRef: React.RefObject<HTMLInputElement | null>; disabled: boolean;
    onTyping: (isTyping: boolean) => void;
    replyToMsg: Message | null; setReplyToMsg: (m: Message | null) => void;
    editingMsg: Message | null; setEditingMsg: (m: Message | null) => void;
    onEditMessage: (id: string, text: string) => void;
}) {
    const [focused,    setFocused]    = useState(false);
    const [uploading,  setUploading]  = useState(false);
    const [preview,    setPreview]    = useState<{ url: string; name: string; isImage: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canSend = isConnected && !disabled && !uploading && (!!value.trim() || !!preview);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isImage = file.type.startsWith('image/');
        const objectUrl = isImage ? URL.createObjectURL(file) : '';
        setPreview({ url: objectUrl, name: file.name, isImage });
    };

    const handleSend = async () => {
        if (!canSend) return;
        if (editingMsg) {
            onEditMessage(editingMsg.id, value);
            setEditingMsg(null);
            setValue('');
        } else if (preview && fileInputRef.current?.files?.[0]) {
            setUploading(true);
            try {
                await sendFileMessage(fileInputRef.current.files[0], value, replyToMsg?.id);
                setValue('');
            } finally {
                setUploading(false);
                setPreview(null);
                setReplyToMsg(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } else {
            sendMessage(replyToMsg?.id);
            setReplyToMsg(null);
        }
    };

    const clearPreview = () => {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <footer style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            {/* File preview */}
            {preview && (
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                    {preview.isImage && (
                        <img src={preview.url} alt="preview" style={{ height: 48, width: 48, objectFit: 'cover', borderRadius: 6 }} />
                    )}
                    {!preview.isImage && (
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth={1.5} strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.name}</span>
                    {uploading && <span style={{ fontSize: 11, color: 'var(--accent-light)' }}>Uploading…</span>}
                    {!uploading && <button onClick={clearPreview} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>✕</button>}
                </div>
            )}

            {/* Reply / Edit preview */}
            {(replyToMsg || editingMsg) && (
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-input)', borderLeft: '3px solid var(--accent-light)', borderRadius: 4, padding: '8px 12px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 2 }}>
                            {editingMsg ? 'Editing Message' : `Replying to ${replyToMsg?.username}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(editingMsg || replyToMsg)?.text || 'File attached'}
                        </div>
                    </div>
                    <button onClick={() => { setReplyToMsg(null); setEditingMsg(null); setValue(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>✕</button>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-input)', border: `1px solid ${focused ? 'var(--border-focus)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '6px 6px 6px 12px', boxShadow: focused ? '0 0 0 3px var(--accent-bg)' : 'none', transition: 'border-color 0.18s,box-shadow 0.18s' }}>
                {/* File attach button */}
                <button
                    id="attach-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isConnected || disabled || uploading}
                    title="Attach file or image"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', display: 'flex', alignItems: 'center', flexShrink: 0, opacity: (!isConnected || disabled || uploading) ? 0.4 : 1 }}
                >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} />

                <input
                    ref={inputRef} id="message-input" type="text" value={value}
                    onChange={e => {
                        setValue(e.target.value);
                        onTyping(e.target.value.length > 0);
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); onTyping(false); }}
                    disabled={!isConnected || disabled || uploading}
                    placeholder={disabled ? 'Select a room…' : uploading ? 'Uploading…' : isConnected ? 'Type a message…' : 'Reconnecting…'}
                    style={{ flex: 1, height: 40, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', caretColor: 'var(--accent-light)' }}
                />
                 <button id="send-message-btn" onClick={handleSend} disabled={!canSend} aria-label="Send"
                    style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: canSend ? 'var(--accent)' : 'var(--bg-hover)', color: canSend ? '#fff' : 'var(--text-muted)', cursor: canSend ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'all 0.1s' }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                    </svg>
                </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                Press <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: 'monospace' }}>Enter</kbd> to send
            </p>
        </footer>
    );
}

/* ── ChatRoom root ────────────────────────────────────────── */
const ChatRoom: React.FC<ChatRoomProps> = ({
    joinedRooms, activeRoom, messagesByRoom, unreadByRoom, onlineUsers, typingUsers,
    onJoinRoom, onLeaveRoom, onSwitchRoom,
    inputValue, setInputValue, sendMessage, sendFileMessage, onEditMessage, onDeleteMessage, onReactMessage, isConnected, messagesEndRef, inputRef, currentUser,
    onOpenProfile, onTyping,
}) => {
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);
    const [editingMsg, setEditingMsg] = useState<Message | null>(null);
    const [localToast, setLocalToast] = useState<string | null>(null);
    
    const messages    = activeRoom ? (messagesByRoom[activeRoom] ?? []) : [];
    
    const handleJumpToMessage = (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-message');
            setTimeout(() => {
                element.classList.remove('highlight-message');
            }, 2000);
        } else {
            setLocalToast('Original message not found in this view');
            setTimeout(() => setLocalToast(null), 3000);
        }
    };

    const filteredMessages = messages.filter(m => m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()));
    const userCount   = onlineUsers.length;

    // Auto-scroll when messages change for the active room
    const prevActiveRef = useRef(activeRoom);
    useEffect(() => { prevActiveRef.current = activeRoom; }, [activeRoom]);

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* Sidebar */}
            <Sidebar
                joinedRooms={joinedRooms} activeRoom={activeRoom}
                unreadByRoom={unreadByRoom} onlineUsers={onlineUsers} currentUser={currentUser}
                onSwitch={onSwitchRoom}
                onLeave={onLeaveRoom} onJoin={onJoinRoom} isConnected={isConnected}
            />

            {/* Main area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                {/* Header */}
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 60, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 12 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-muted)' }}>#</span>
                        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            {activeRoom ?? 'No room selected'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {activeRoom && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                <div style={{ position: 'relative', width: 200 }}>
                                    <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search messages..."
                                        value={messageSearchQuery}
                                        onChange={e => setMessageSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-full)', padding: '6px 12px 6px 30px', fontSize: 12, color: 'var(--text-primary)',
                                            outline: 'none', transition: 'all 0.2s',
                                        }}
                                        onFocus={e => { e.currentTarget.style.border = '1px solid var(--border-focus)'; }}
                                        onBlur={e => { e.currentTarget.style.border = '1px solid var(--border)'; }}
                                    />
                                </div>

                                <div title={`${userCount} user(s) online: ${onlineUsers.join(', ')}`} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                                    </svg>
                                    {userCount}
                                </div>
                                <StatusBadge active={isConnected} activeText="Connected" inactiveText="Reconnecting" />
                            </div>
                        )}
                        {/* Profile button */}
                         <button
                            id="open-profile-btn"
                            onClick={onOpenProfile}
                            title={`${currentUser ?? 'Profile'} — click to open profile`}
                            style={{
                                width: 32, height: 32, borderRadius: 'var(--radius-md)',
                                background: 'var(--accent)',
                                border: 'none',
                                color: '#fff', fontWeight: 600, fontSize: 13,
                                cursor: 'pointer', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'opacity 0.1s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                            {(currentUser ?? 'U').slice(0, 2).toUpperCase()}
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', scrollBehavior: 'smooth', position: 'relative' }}>
                    <div style={{ maxWidth: 780, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {!activeRoom ? <NoRoomSelected /> : (
                            filteredMessages.length === 0 && messageSearchQuery ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                    No messages match "{messageSearchQuery}"
                                </div>
                            ) : (
                                <MessageList messages={filteredMessages} currentUser={currentUser} messagesEndRef={messagesEndRef} onReply={setReplyToMsg} onEdit={(m) => { setEditingMsg(m); setInputValue(m.text); }} onDelete={(m) => onDeleteMessage(m.id)} onReact={(m, icon) => onReactMessage(m.id, icon)} onJumpToMessage={handleJumpToMessage} />
                            )
                        )}
                    </div>
                    {localToast && (
                        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: 20, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, zIndex: 1000, animation: 'popIn 0.3s ease' }}>
                            {localToast}
                        </div>
                    )}
                </main>

                {/* Composer & Typing indicator */}
                <div style={{ maxWidth: 780 + 32, width: '100%', margin: '0 auto', alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 20, padding: '0 24px', display: 'flex', alignItems: 'center' }}>
                        {typingUsers.length > 0 && (
                            <span className="animate-fade-in" style={{ fontSize: 11, color: 'var(--accent-light)', fontWeight: 600, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ display: 'flex', gap: 2 }}>
                                    <span style={{ width: 4, height: 4, background: 'currentColor', borderRadius: '50%', animation: 'shimmer 1.4s infinite linear', animationDelay: '0s' }} />
                                    <span style={{ width: 4, height: 4, background: 'currentColor', borderRadius: '50%', animation: 'shimmer 1.4s infinite linear', animationDelay: '0.2s' }} />
                                    <span style={{ width: 4, height: 4, background: 'currentColor', borderRadius: '50%', animation: 'shimmer 1.4s infinite linear', animationDelay: '0.4s' }} />
                                </span>
                                {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.join(', ')} are typing...`}
                            </span>
                        )}
                    </div>
                    <Composer value={inputValue} setValue={setInputValue} sendMessage={sendMessage} sendFileMessage={sendFileMessage} isConnected={isConnected} inputRef={inputRef} disabled={!activeRoom} onTyping={onTyping} replyToMsg={replyToMsg} setReplyToMsg={setReplyToMsg} editingMsg={editingMsg} setEditingMsg={setEditingMsg} onEditMessage={onEditMessage} />
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
