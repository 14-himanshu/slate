import React, { useState, useEffect, useRef } from 'react';
import type { Message, DirectConversationSummary, DirectMessage, UserSummary } from '../types';
import { Avatar, StatusBadge, Icon, Icons, IconButton } from './ui';
import { Sidebar } from './chat/Sidebar';
import { NoRoomSelected, NoConversationSelected } from './chat/EmptyStates';
import { RoomInfoPanel } from './chat/RoomInfoPanel';
import { MessageList } from './chat/MessageList';
import { MessageInput } from './chat/MessageInput';
import { PinnedMessagesModal } from './chat/PinnedMessagesModal';
import { ThreadPanel } from './chat/ThreadPanel';

export interface ChatRoomProps {
    userRooms: import('../types').RoomSummary[];
    joinedRooms: string[];
    activeRoom: string | null;
    messagesByRoom: Record<string, Message[]>;
    unreadByRoom: Record<string, number>;
    onlineUsers: string[];
    typingUsers: string[];
    activeSection: 'rooms' | 'dm';
    activeConversationId: string | null;
    directConversations: DirectConversationSummary[];
    directMessagesByConversation: Record<string, DirectMessage[]>;
    dmTypingUsers: string[];
    onTyping: (isTyping: boolean) => void;
    onDirectTyping: (isTyping: boolean) => void;
    onJoinRoom: (roomId: string) => void;
    onLeaveRoom: (roomId: string) => void;
    onSwitchRoom: (roomId: string) => void;
    onSelectConversation: (conversationId: string) => void;
    onStartConversation: (userId: string) => void;
    onSearchUsers: (query: string) => Promise<UserSummary[]>;
    inputValue: string;
    setInputValue: (v: string) => void;
    sendMessage: (inputValue: string, replyToId?: string, threadId?: string) => void;
    sendFileMessage: (f: File, caption?: string, replyToId?: string, threadId?: string) => Promise<void>;
    sendDirectMessage: (inputValue: string, replyToId?: string, threadId?: string) => void;
    sendDirectFileMessage: (f: File, caption?: string, replyToId?: string, threadId?: string) => Promise<void>;
    onEditMessage: (msgId: string, text: string) => void;
    onDeleteMessage: (msgId: string) => void;
    onReactMessage: (msgId: string, icon: string) => void;
    onEditDirectMessage: (msgId: string, text: string) => void;
    onDeleteDirectMessage: (msgId: string) => void;
    onReactDirectMessage: (msgId: string, icon: string) => void;
    loadMoreMessages: (roomId: string, beforeDate: Date) => void;
    loadMoreDmMessages: (conversationId: string, beforeDate: Date) => void;
    threadMessages: Record<string, Message[]>;
    loadThreadMessages: (threadId: string, beforeDate?: Date) => void;
    isConnected: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    inputRef: React.RefObject<HTMLInputElement | null>;
    currentUser: string | null;
    onOpenProfile: () => void;
    onStartVideoCall?: () => void;
    onStartAudioCall?: () => void;
}

type ChatMessage = Message | DirectMessage;

const ChatRoom: React.FC<ChatRoomProps> = ({
    userRooms,
    joinedRooms,
    activeRoom,
    messagesByRoom,
    unreadByRoom,
    onlineUsers,
    typingUsers,
    activeSection,
    activeConversationId,
    directConversations,
    directMessagesByConversation,
    dmTypingUsers,
    onJoinRoom,
    onLeaveRoom,
    onSwitchRoom,
    onSelectConversation,
    onStartConversation,
    onSearchUsers,
    inputValue,
    setInputValue,
    sendMessage,
    sendFileMessage,
    sendDirectMessage,
    sendDirectFileMessage,
    onEditMessage,
    onDeleteMessage,
    onReactMessage,
    onEditDirectMessage,
    onDeleteDirectMessage,
    onReactDirectMessage,
    loadMoreMessages,
    loadMoreDmMessages,
    threadMessages,
    loadThreadMessages,
    isConnected,
    messagesEndRef,
    inputRef,
    currentUser,
    onOpenProfile,
    onTyping,
    onDirectTyping,
    onStartVideoCall,
    onStartAudioCall,
}) => {
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [replyToMsg, setReplyToMsg] = useState<ChatMessage | null>(null);
    const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [localToast, setLocalToast] = useState<string | null>(null);
    const [showRoomInfo, setShowRoomInfo] = useState(false);
    
    const [mutedRooms, setMutedRooms] = useState<string[]>(() => {
        const saved = localStorage.getItem('chat_muted_rooms');
        return saved ? JSON.parse(saved) : [];
    });
    const [isPinnedOpen, setIsPinnedOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('chat_muted_rooms', JSON.stringify(mutedRooms));
    }, [mutedRooms]);

    const handleToggleMute = () => {
        const targetId = activeConversationId || activeRoom;
        if (!targetId) return;
        setMutedRooms(prev => prev.includes(targetId) ? prev.filter(id => id !== targetId) : [...prev, targetId]);
    };

    const handleUnpin = (msg: Message | DirectMessage) => {
        // Implement unpin logic when backend is ready or just a mock toast
        setLocalToast(`Unpinned message ${msg.id}`);
    };


    const isDirect = activeSection === 'dm';
    const activeConversation = directConversations.find(c => c.id === activeConversationId) ?? null;
    const activeRoomData = userRooms.find(r => r.roomId === activeRoom);
    const messages: ChatMessage[] = isDirect
        ? (activeConversationId ? (directMessagesByConversation[activeConversationId] ?? []) : [])
        : (activeRoom ? (messagesByRoom[activeRoom] ?? []) : []);
    const activeTypingUsers = isDirect ? dmTypingUsers : typingUsers;

    useEffect(() => {
        setReplyToMsg(null);
        setEditingMsg(null);
        setMessageSearchQuery('');
        setInputValue('');
        setShowRoomInfo(false);
        setActiveThreadId(null);
    }, [activeSection, activeRoom, activeConversationId, setInputValue]);
    
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
    const userCount = onlineUsers.length;
    const isSelectionMissing = isDirect ? !activeConversationId : !activeRoom;
    const sendActiveMessage = isDirect ? sendDirectMessage : sendMessage;
    const sendActiveFile = isDirect ? sendDirectFileMessage : sendFileMessage;
    const handleTypingActive = isDirect ? onDirectTyping : onTyping;
    const handleDelete = (m: ChatMessage) => {
        if (isDirect) {
            onDeleteDirectMessage(m.id);
        } else {
            onDeleteMessage(m.id);
        }
    };
    const handleReact = (m: ChatMessage, icon: string) => {
        if (isDirect) {
            onReactDirectMessage(m.id, icon);
        } else {
            onReactMessage(m.id, icon);
        }
    };
    const handleEditCommit = (id: string, text: string) => {
        if (isDirect) {
            onEditDirectMessage(id, text);
        } else {
            onEditMessage(id, text);
        }
    };

    const availableMentions = isDirect 
        ? (activeConversation ? [activeConversation.user.username] : [])
        : onlineUsers;

    // Auto-scroll when messages change for the active room
    const prevActiveRef = useRef(activeRoom);
    useEffect(() => { prevActiveRef.current = activeRoom; }, [activeRoom]);

    const handleLoadMore = () => {
        if (isDirect && activeConversationId && filteredMessages.length > 0) {
            loadMoreDmMessages(activeConversationId, filteredMessages[0].timestamp);
        } else if (!isDirect && activeRoom && filteredMessages.length > 0) {
            loadMoreMessages(activeRoom, filteredMessages[0].timestamp);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr', width: '100%', height: '100%' }}>
            {/* Sidebar */}
            <Sidebar
                userRooms={userRooms}
                joinedRooms={joinedRooms} activeRoom={activeRoom}
                unreadByRoom={unreadByRoom} currentUser={currentUser}
                onSwitch={onSwitchRoom}
                onLeave={onLeaveRoom} onJoin={onJoinRoom}
                directConversations={directConversations}
                activeConversationId={activeConversationId}
                activeSection={activeSection}
                onSelectConversation={onSelectConversation}
                onStartConversation={onStartConversation}
                onSearchUsers={onSearchUsers}
            />

            {/* Main area */}
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {/* Header */}
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 12 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isDirect ? (
                            activeConversation ? (
                                <>
                                    <Avatar name={activeConversation.user.username} size={30} circle />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                            {activeConversation.user.username}
                                        </div>
                                        <div style={{ lineHeight: 1 }}>
                                            <StatusBadge
                                                active={activeConversation.user.status === 'online'}
                                                activeText="Online"
                                                inactiveText="Offline"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Direct Messages</div>
                            )
                        ) : (
                            <button
                                onClick={() => activeRoomData && setShowRoomInfo(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: 'none', border: 'none', cursor: activeRoomData ? 'pointer' : 'default',
                                    padding: '6px 12px', margin: '-6px -12px', borderRadius: 8,
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => { if (activeRoomData) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                onMouseLeave={e => { if (activeRoomData) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)' }}>#</span>
                                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                    {activeRoomData ? activeRoomData.name : (activeRoom ?? 'No room selected')}
                                </span>
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, paddingRight: 4 }}>
                        {isDirect && activeConversationId && (
                            <>
                                <IconButton label="Start audio call" onClick={onStartAudioCall}>
                                    <Icon d={Icons.phone} size={16} />
                                </IconButton>
                                <IconButton label="Start video call" onClick={onStartVideoCall}>
                                    <Icon d={Icons.video} size={16} />
                                </IconButton>
                                <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 6px' }} />
                            </>
                        )}
                        {(isDirect ? !!activeConversation : !!activeRoom) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>
                                        <Icon d={Icons.search} size={13} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search messages…"
                                        value={messageSearchQuery}
                                        onChange={e => setMessageSearchQuery(e.target.value)}
                                        style={{
                                            width: 180, height: 32,
                                            background: 'var(--bg-input)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 8,
                                            padding: '0 12px 0 28px',
                                            fontSize: 12,
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                        }}
                                        onFocus={e => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.width = '220px'; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.width = '180px'; }}
                                    />
                                </div>
                                {!isDirect && activeRoom && (
                                    <div
                                        title={`Online: ${onlineUsers.join(', ')}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'default' }}
                                    >
                                        <Icon d={Icons.users} size={12} />
                                        {userCount}
                                    </div>
                                )}
                            </div>
                        )}
                        <IconButton label={mutedRooms.includes(activeConversationId || activeRoom || '') ? "Unmute notifications" : "Mute notifications"} onClick={handleToggleMute}>
                            <Icon 
                                d={mutedRooms.includes(activeConversationId || activeRoom || '') ? Icons.bellSlash : Icons.bell} 
                                size={16} 
                                color={mutedRooms.includes(activeConversationId || activeRoom || '') ? '#EF4444' : undefined} 
                            />
                        </IconButton>
                        <IconButton label="Pinned messages" onClick={() => setIsPinnedOpen(!isPinnedOpen)}>
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                        </IconButton>

                        
                        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
                        {/* Profile button */}
                        <button
                            id="open-profile-btn"
                            onClick={onOpenProfile}
                            title={`${currentUser ?? 'Profile'} — open profile`}
                            style={{
                                width: 32, height: 32, borderRadius: 'var(--radius-md)',
                                background: 'var(--accent)',
                                border: 'none',
                                color: '#fff', fontWeight: 700, fontSize: 11,
                                cursor: 'pointer', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                letterSpacing: '0.03em',
                                transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                            {(currentUser ?? 'U').slice(0, 2).toUpperCase()}
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', scrollBehavior: 'smooth', position: 'relative', background: 'var(--bg-base)' }}>
                    <div style={{ maxWidth: 780, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {isSelectionMissing ? (isDirect ? <NoConversationSelected /> : <NoRoomSelected />) : (
                            filteredMessages.length === 0 && messageSearchQuery ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                    No messages match &ldquo;{messageSearchQuery}&rdquo;
                                </div>
                            ) : (
                                <MessageList
                                    messages={filteredMessages}
                                    currentUser={currentUser}
                                    messagesEndRef={messagesEndRef}
                                    onReply={setReplyToMsg}
                                    onThreadReply={(m) => {
                                        setActiveThreadId(m.id);
                                        if (!threadMessages[m.id]) {
                                            loadThreadMessages(m.id);
                                        }
                                    }}
                                    onEdit={(m) => { setEditingMsg(m); setInputValue(m.text); }}
                                    onDelete={handleDelete}
                                    onReact={handleReact}
                                    onJumpToMessage={handleJumpToMessage}
                                    onLoadMore={handleLoadMore}
                                />
                            )
                        )}
                    </div>
                    {localToast && (
                        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: 20, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
                            {localToast}
                        </div>
                    )}
                </main>

                {/* Composer */}
                <div style={{ maxWidth: 780 + 32, width: '100%', margin: '0 auto', alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
                    <MessageInput
                        value={inputValue}
                        setValue={setInputValue}
                        sendMessage={sendActiveMessage}
                        sendFileMessage={sendActiveFile}
                        isConnected={isConnected}
                        inputRef={inputRef}
                        disabled={isSelectionMissing}
                        onTyping={handleTypingActive}
                        replyToMsg={replyToMsg}
                        setReplyToMsg={setReplyToMsg}
                        editingMsg={editingMsg}
                        setEditingMsg={setEditingMsg}
                        onEditMessage={handleEditCommit}
                        activeTypingUsers={activeTypingUsers}
                        availableMentions={availableMentions}
                    />
                </div>
                </div>
                {activeThreadId && (
                    <ThreadPanel 
                        parentMessage={messages.find(m => m.id === activeThreadId) as Message}
                        messages={threadMessages[activeThreadId] || []}
                        username={currentUser || ''}
                        onClose={() => setActiveThreadId(null)}
                        onSendMessage={(text) => sendActiveMessage(text, undefined, activeThreadId)}
                        onSendFile={(f, cap) => sendActiveFile(f, cap, undefined, activeThreadId)}
                        onEditMessage={handleEditCommit}
                        onDeleteMessage={(id) => handleDelete({ id } as ChatMessage)}
                        onReactMessage={(id, icon) => handleReact({ id } as ChatMessage, icon)}
                        isConnected={isConnected}
                        availableMentions={availableMentions}
                    />
                )}
            </div>

            
            {showRoomInfo && activeRoomData && (
                <RoomInfoPanel
                    room={activeRoomData}
                    onlineUsers={onlineUsers}
                    onClose={() => setShowRoomInfo(false)}
                    onLeave={() => {
                        onLeaveRoom(activeRoomData.roomId);
                        setShowRoomInfo(false);
                    }}
                />
            )}

            <PinnedMessagesModal
                isOpen={isPinnedOpen}
                onClose={() => setIsPinnedOpen(false)}
                messages={messages}
                onUnpin={handleUnpin}
            />
        </div>
    );
};

export default ChatRoom;
