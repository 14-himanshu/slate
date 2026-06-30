import React from 'react';
import type { Message, DirectMessage } from '../../types';
import { MessageItem } from './MessageItem';
import { EmptyMessages } from './EmptyStates';

type ChatMessage = Message | DirectMessage;

function formatDateLabel(d: Date) {
    const today = new Date(), yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function MessageList({ messages, currentUser, messagesEndRef, onReply, onThreadReply, onEdit, onDelete, onReact, onPin, onJumpToMessage, onLoadMore, savedMessages, onToggleSave, unreadCount }: {
    messages: ChatMessage[]; currentUser: string | null; messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onReply: (m: ChatMessage) => void; onThreadReply?: (m: ChatMessage) => void; onEdit: (m: ChatMessage) => void; onDelete: (m: ChatMessage) => void; onReact: (m: ChatMessage, icon: string) => void; onPin?: (m: ChatMessage) => void;
    onJumpToMessage: (id: string) => void;
    onLoadMore?: () => void;
    savedMessages?: Message[];
    onToggleSave?: (m: ChatMessage) => void;
    unreadCount?: number;
}) {
    const listRef = React.useRef<HTMLDivElement>(null);
    const topBoundaryRef = React.useRef<HTMLDivElement>(null);
    const [prevScrollHeight, setPrevScrollHeight] = React.useState<number | null>(null);
    const [activeMenuMessageId, setActiveMenuMessageId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const handleGlobalClick = () => setActiveMenuMessageId(null);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    React.useEffect(() => {
        if (!onLoadMore) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0]?.isIntersecting) {
                if (listRef.current) setPrevScrollHeight(listRef.current.scrollHeight);
                onLoadMore();
            }
        }, { threshold: 0.1 });
        if (topBoundaryRef.current) observer.observe(topBoundaryRef.current);
        return () => observer.disconnect();
    }, [onLoadMore]);

    React.useEffect(() => {
        if (prevScrollHeight !== null && listRef.current) {
            const currentScrollHeight = listRef.current.scrollHeight;
            const diff = currentScrollHeight - prevScrollHeight;
            if (diff > 0) {
                // If it's the main container scrolling:
                const mainContainer = listRef.current.closest('main');
                if (mainContainer) {
                    mainContainer.scrollTop += diff;
                }
            }
            setPrevScrollHeight(null);
        }
    }, [messages.length, prevScrollHeight]);

    if (messages.length === 0) return <EmptyMessages />;
    let lastDate = '';
    return (
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
            <div ref={topBoundaryRef} style={{ height: 1, width: '100%' }} />
            {messages.map((msg, i) => {
                const mine = msg.username === currentUser;
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const sameAsPrev = prev?.username === msg.username;
                const sameAsNext = next?.username === msg.username;
                const msgDate = msg.timestamp.toDateString();
                const showDate = msgDate !== lastDate;
                if (showDate) lastDate = msgDate;
                
                const timeDiffPrev = prev ? msg.timestamp.getTime() - prev.timestamp.getTime() : Infinity;
                const timeDiffNext = next ? next.timestamp.getTime() - msg.timestamp.getTime() : Infinity;
                
                const isGroupedWithPrev = sameAsPrev && timeDiffPrev < 2 * 60 * 1000 && !showDate;
                const isGroupedWithNext = sameAsNext && timeDiffNext < 2 * 60 * 1000 && (next.timestamp.toDateString() === msgDate);

                const hideHeader = isGroupedWithPrev;
                const isFirstInGroup = !isGroupedWithPrev;
                const isLastInGroup = !isGroupedWithNext;
                
                const isFirstUnread = unreadCount != null && unreadCount > 0 && i === messages.length - unreadCount;

                return (
                    <React.Fragment key={msg.id}>
                        {isFirstUnread && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
                                <div style={{ flex: 1, height: 1, background: 'var(--danger)' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>New Messages</span>
                                <div style={{ flex: 1, height: 1, background: 'var(--danger)' }} />
                            </div>
                        )}
                        {showDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
                                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{formatDateLabel(msg.timestamp)}</span>
                                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            </div>
                        )}
                        <MessageItem 
                            msg={msg} 
                            mine={mine} 
                            hideHeader={hideHeader} 
                            isFirstInGroup={isFirstInGroup} 
                            isLastInGroup={isLastInGroup} 
                            onReply={onReply} 
                            onThreadReply={onThreadReply}
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            onReact={onReact} 
                            onPin={onPin}
                            onJumpToMessage={onJumpToMessage}
                            onToggleSave={onToggleSave}
                            isSaved={savedMessages ? savedMessages.some(sm => sm.id === msg.id) : false}
                            activeMenuMessageId={activeMenuMessageId}
                            setActiveMenuMessageId={setActiveMenuMessageId}
                        />
                    </React.Fragment>
                );
            })}
            <div ref={messagesEndRef} style={{ height: 8 }} />
        </div>
    );
}
