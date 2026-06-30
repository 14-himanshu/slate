import React, { useState, useEffect, useRef } from 'react';
import type { Message, DirectConversationSummary, DirectMessage, UserSummary } from '../types';
import { Avatar, StatusBadge, Icon, Icons, IconButton } from './ui';
import { Sidebar } from './chat/Sidebar';
import { NoRoomSelected, NoConversationSelected } from './chat/EmptyStates';
import { RoomInfoPanel } from './chat/RoomInfoPanel';
import { MessageList } from './chat/MessageList';
import { MessageInput } from './chat/MessageInput';

import { GlobalSearch } from './chat/GlobalSearch';
import { SavedItemsPanel } from './chat/SavedItemsPanel';
import { PinnedMessagesModal } from './chat/PinnedMessagesModal';
import { ThreadPanel } from './chat/ThreadPanel';
import { RightSidebar } from './chat/RightSidebar';

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
    onDeleteConversation: (conversationId: string) => void;
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
    activeSection, activeConversationId, directConversations, directMessagesByConversation, dmTypingUsers,
    onJoinRoom, onLeaveRoom, onSwitchRoom, onSelectConversation, onStartConversation, onDeleteConversation, onSearchUsers,
    inputValue, setInputValue, sendMessage, sendFileMessage, sendDirectMessage, sendDirectFileMessage,
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
    const [showScrollFab, setShowScrollFab] = useState(false);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [showSavedItems, setShowSavedItems] = useState(false);
    const [savedMessages, setSavedMessages] = useState<Message[]>([]);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const scrollAreaRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        localStorage.setItem('chat_muted_rooms', JSON.stringify(mutedRooms));
    }, [mutedRooms]);

    useEffect(() => {
        import('../lib/api').then(api => {
            api.fetchSavedMessages().then(setSavedMessages).catch(console.error);
        });
    }, []);

    const handleToggleSave = async (msg: ChatMessage) => {
        const isSaved = savedMessages.some(sm => sm.id === msg.id);
        const type = (msg as Message).roomId ? 'room' : 'dm';
        try {
            const api = await import('../lib/api');
            if (isSaved) {
                await api.unsaveMessage(msg.id);
                setSavedMessages(prev => prev.filter(m => m.id !== msg.id));
                setLocalToast('Message removed from Saved Items');
            } else {
                await api.saveMessage(msg.id, type);
                setSavedMessages(prev => [{ ...msg, savedAt: new Date() } as Message, ...prev]);
                setLocalToast('Message added to Saved Items');
            }
        } catch (err) {
            setLocalToast('Failed to toggle save message');
        }
    };

    const handleToggleMute = () => {
        const targetId = activeConversationId || activeRoom;
        if (!targetId) return;
        setMutedRooms(prev => prev.includes(targetId) ? prev.filter(id => id !== targetId) : [...prev, targetId]);
    };

    const handleUnpin = (msg: Message | DirectMessage) => {
        // Implement unpin logic when backend is ready or just a mock toast
        setLocalToast(`Unpinned message ${msg.id}`);
    };

    const handlePin = (msg: Message | DirectMessage) => {
        setLocalToast(`Pinned message ${msg.id}`);
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
        setShowScrollFab(false);
    }, [activeSection, activeRoom, activeConversationId, setInputValue]);

    // Cmd+K global search shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowGlobalSearch(s => !s);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);
    
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
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', width: '100%', height: '100%' }}>
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
                onDeleteConversation={onDeleteConversation}
                onSearchUsers={onSearchUsers}
                onOpenSavedItems={() => setShowSavedItems(true)}
                onOpenProfile={onOpenProfile}
            />

            <RightSidebar 
                isOpen={isRightSidebarOpen}
                activeSection={activeSection}
                onlineUsers={onlineUsers}
                currentUser={currentUser}
                activeConversation={activeConversation || null}
                messages={messages}
            />

            {/* Main area */}
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden', background: 'var(--bg-base)' }}>
                    {/* Header */}
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 12 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isDirect ? (
                            activeConversation ? (
                                <>
                                    <Avatar name={activeConversation.user.username} size={30} circle status={activeConversation.user.status} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                            {activeConversation.user.username}
                                        </div>
                                        <div style={{ lineHeight: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <StatusBadge
                                                active={activeConversation.user.status === 'online'}
                                                activeText={activeConversation.user.status === 'online' ? 'Online' : 'Offline'}
                                                inactiveText="Offline"
                                            />
                                            {activeConversation.user.statusMessage && (
                                                <>
                                                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        &ldquo;{activeConversation.user.statusMessage}&rdquo;
                                                    </span>
                                                </>
                                            )}
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
                                <button
                                    onClick={() => setShowGlobalSearch(true)}
                                    title="Global Search (Cmd+K)"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                        padding: '4px 10px', borderRadius: 8, color: 'var(--text-secondary)',
                                        fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                >
                                    <Icon d={Icons.search} size={14} />
                                    Search...
                                    <kbd style={{ fontSize: 10, padding: '2px 4px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 4, marginLeft: 4 }}>⌘K</kbd>
                                </button>
                                <div style={{ position: 'relative', display: 'none' /* Hiding local search to favor global search */ }}>
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
                        <IconButton label={isRightSidebarOpen ? "Hide info" : "Show info"} onClick={() => setIsRightSidebarOpen(prev => !prev)}>
                            <Icon d={Icons.info} size={16} />
                        </IconButton>


                    </div>
                </header>

                {/* Messages */}
                <main
                    ref={scrollAreaRef as any}
                    onScroll={(e) => {
                        const el = e.currentTarget;
                        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                        setShowScrollFab(distFromBottom > 200);
                    }}
                    style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', scrollBehavior: 'smooth', position: 'relative', background: 'var(--bg-base)' }}
                >
                    <div style={{ maxWidth: 780, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {isSelectionMissing ? (isDirect ? <NoConversationSelected /> : <NoRoomSelected />) : (
                            filteredMessages.length === 0 && messageSearchQuery ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                    No messages match &ldquo;{messageSearchQuery}&rdquo;
                                </div>
                            ) : (
                                <MessageList
                                    unreadCount={isDirect ? (activeConversation?.unreadCount || 0) : (activeRoom ? unreadByRoom[activeRoom] || 0 : 0)}
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
                                    onPin={handlePin}
                                    onJumpToMessage={handleJumpToMessage}
                                    onLoadMore={handleLoadMore}
                                    savedMessages={savedMessages}
                                    onToggleSave={handleToggleSave}
                                />
                            )
                        )}
                    </div>
                    {localToast && (
                        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: 20, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
                            {localToast}
                        </div>
                    )}

                    {/* Scroll-to-bottom FAB */}
                    {showScrollFab && (
                        <button
                            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            style={{
                                position: 'sticky', bottom: 20, right: 20, alignSelf: 'flex-end',
                                marginRight: 20, marginBottom: 8,
                                width: 38, height: 38, borderRadius: '50%',
                                background: 'var(--accent)', color: '#fff',
                                border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: 'var(--shadow-md)',
                                animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
                                zIndex: 10, transition: 'opacity 0.2s',
                            }}
                            title="Scroll to bottom"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
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
                {activeThreadId && messages.find(m => m.id === activeThreadId) && (
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
                
                {showRoomInfo && activeRoomData && (
                    <RoomInfoPanel
                        room={activeRoomData}
                        onlineUsers={onlineUsers}
                        messages={messagesByRoom[activeRoomData.roomId] || []}
                        onClose={() => setShowRoomInfo(false)}
                        onLeave={() => {
                            onLeaveRoom(activeRoomData.roomId);
                            setShowRoomInfo(false);
                        }}
                    />
                )}

                {/* Saved Items Panel */}
                {showSavedItems && (
                    <SavedItemsPanel
                        savedMessages={savedMessages}
                        onClose={() => setShowSavedItems(false)}
                        onUnsave={(id) => handleToggleSave({ id } as ChatMessage)}
                        onJumpToMessage={(id, roomId, convId) => {
                            if (roomId) onSwitchRoom(roomId);
                            else if (convId) onSelectConversation(convId);
                            handleJumpToMessage(id);
                        }}
                    />
                )}
            </div>


            <PinnedMessagesModal
                isOpen={isPinnedOpen}
                onClose={() => setIsPinnedOpen(false)}
                messages={messages}
                onUnpin={handleUnpin}
            />

            {/* Global Search Modal (Cmd+K) */}
            {showGlobalSearch && (
                <GlobalSearch
                    onClose={() => setShowGlobalSearch(false)}
                    messages={[
                        ...Object.values(messagesByRoom || {}).flat(),
                        ...Object.values(directMessagesByConversation || {}).flat().map((m: DirectMessage) => ({ ...m, text: m.text || '' }))
                    ].map(m => ({
                        id: m.id,
                        text: m.text || '',
                        username: m.username,
                        timestamp: m.timestamp,
                        roomId: (m as Message).roomId,
                        conversationId: (m as DirectMessage).conversationId,
                    }))}
                    rooms={userRooms}
                    conversations={directConversations}
                    onJumpToRoom={(roomId) => { onSwitchRoom(roomId); }}
                    onJumpToConversation={(convId) => { onSelectConversation(convId); }}
                    onJumpToMessage={handleJumpToMessage}
                />
            )}


        </div>
    );
};

export default ChatRoom;
