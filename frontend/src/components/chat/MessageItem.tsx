import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '../ui';
import { LinkPreview } from './LinkPreview';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function formatTime(d: Date) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageActions({ msg, mine, onReact, onReply, onThreadReply, onEdit, onDelete, onMoreClick, moreBtnRef }: any) {
    const btnStyle: any = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', display: 'flex', transition: 'all 0.15s ease', borderRadius: 6 };
    const onEnter = (e: any, c = 'var(--text-primary)', bg = 'var(--bg-hover)') => { e.currentTarget.style.color = c; e.currentTarget.style.backgroundColor = bg; };
    const onLeave = (e: any) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; };
    const divider = <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />;

    return (
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)', padding: '4px' }}>
            <button onClick={() => onReact(msg, 'like')} title="Like" style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
            </button>
            <button onClick={() => onReact(msg, 'heart')} title="Love" style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <button onClick={() => onReact(msg, 'check')} title="Check" style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            {divider}
            {onThreadReply && (
                <button onClick={() => onThreadReply(msg)} title="Reply in thread" style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
            )}
            <button onClick={onReply} title="Reply" style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
            </button>
            {mine && msg.type === 'text' && (
                <button onClick={onEdit} title="Edit" style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
            )}
            {mine && (
                <button onClick={onDelete} title="Delete" style={btnStyle} onMouseEnter={e => onEnter(e, 'var(--danger)', 'var(--danger-bg)')} onMouseLeave={onLeave}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            )}
            {divider}
            <button ref={moreBtnRef} onClick={onMoreClick} title="More" style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
        </div>
    );
}

export function ContextMenuItem({ icon, label, onClick, danger }: any) {
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

export function MessageContextMenu({ msg, mine, onReply, onThreadReply, onEdit, onDelete, onToggleSave, isSaved, onPin, onClose }: {
    msg: any, mine: boolean, onReply: any, onThreadReply?: any, onEdit: any, onDelete: any, onToggleSave: any, isSaved: boolean, onPin?: any, onClose: () => void
}) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            style={{ 
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
            {onThreadReply && (
                <ContextMenuItem 
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} 
                    label="Reply in Thread" 
                    onClick={() => { onThreadReply(msg); onClose(); }} 
                />
            )}
            <ContextMenuItem 
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>} 
                label="Copy text" 
                onClick={() => { navigator.clipboard.writeText(msg.text); onClose(); }} 
            />
            
            <ContextMenuItem 
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>} 
                label={isSaved ? "Unsave Message" : "Save Message"} 
                onClick={() => { onToggleSave(msg); onClose(); }} 
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
            <ContextMenuItem 
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={msg.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M21.1 11.1L12.9 2.9a2 2 0 0 0-2.8 0l-1.4 1.4a2 2 0 0 0 0 2.8l2.8 2.8-5.7 5.7-4.2-.7a1 1 0 0 0-1.1 1.1l.7 4.2 5.7-5.7 2.8 2.8a2 2 0 0 0 2.8 0l1.4-1.4a2 2 0 0 0 0-2.8z"></path></svg>} 
                label={msg.isPinned ? "Unpin Message" : "Pin Message"} 
                onClick={() => { if (onPin) onPin(msg); onClose(); }} 
            />
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

export function MessageItem({ msg, mine, hideHeader, isFirstInGroup = true, isLastInGroup = true, onReply, onThreadReply, onEdit, onDelete, onReact, onJumpToMessage, onToggleSave, isSaved, activeMenuMessageId, setActiveMenuMessageId }: any) {
    const [isHovered, setIsHovered] = useState(false);
    const [decryptedText, setDecryptedText] = useState<string | null>(null);
    const [decryptedLinkPreview, setDecryptedLinkPreview] = useState<any>(null);
    const [decryptError, setDecryptError] = useState<boolean>(false);
    const moreBtnRef = useRef<HTMLButtonElement>(null);
    const isMenuActive = activeMenuMessageId === msg.id;


    useEffect(() => {
        if (msg.isE2EE && msg.e2eeData) {
            const decrypt = async () => {
                try {
                    const username = localStorage.getItem('chat_username');
                    const privKeyJwk = localStorage.getItem(`chat_privkey_${username}`);
                    if (!privKeyJwk) throw new Error("No private key");
                    
                    const { importPrivateKey, decryptMessage } = await import('../../lib/e2ee');
                    const privKey = await importPrivateKey(privKeyJwk);
                    const role = mine ? 'sender' : 'recipient';
                    const decrypted = await decryptMessage(msg.e2eeData, privKey, role);
                    
                    try {
                        const parsed = JSON.parse(decrypted);
                        if (parsed.text !== undefined) {
                            setDecryptedText(parsed.text);
                            if (parsed.linkPreview) setDecryptedLinkPreview(parsed.linkPreview);
                        } else {
                            setDecryptedText(decrypted);
                        }
                    } catch {
                        setDecryptedText(decrypted);
                    }
                } catch (e) {
                    console.error("Decryption failed", e);
                    setDecryptError(true);
                }
            };
            decrypt();
        }
    }, [msg.isE2EE, msg.e2eeData, mine]);

    const handleMoreClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenuMessageId(isMenuActive ? null : msg.id);
    };

    const processedText = msg.text ? msg.text.replace(/@([A-Za-z0-9_]+)/g, '[@$1](mention://$1)') : '';

    return (
        <article
            id={`message-${msg.id}`}
            className="animate-fade-in"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
                display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-start', 
                gap: 16, marginTop: hideHeader ? 4 : 16, padding: '2px 16px', 
                position: 'relative', transition: 'background 0.1s ease', 
                background: isHovered || isMenuActive ? 'var(--bg-hover)' : 'transparent',
                zIndex: isMenuActive ? 50 : (isHovered ? 2 : 1),
            }}
        >
            <div style={{ width: 40, flexShrink: 0, marginTop: hideHeader ? 0 : 2, display: 'flex', justifyContent: 'center' }}>
                {!hideHeader && <Avatar name={msg.username} size={40} />}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', maxWidth: '100%', position: 'relative', flex: 1, minWidth: 0 }}>
                {!hideHeader && (
                    <div style={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 500, color: msg.username === 'System' ? 'var(--accent)' : 'var(--text-primary)', letterSpacing: '0.01em' }}>{msg.username}</span>
                    </div>
                )}
                
                <div style={{ position: 'relative', display: 'flex', width: '100%', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    {/* The Action Toolbar */}
                    {(isHovered || isMenuActive) && !msg.deleted && (
                        <div style={{ position: 'absolute', top: -18, right: 16, zIndex: 10, animation: 'fadeIn 0.15s ease' }}>
                            <MessageActions msg={msg} mine={mine} onReact={onReact} onReply={() => onReply(msg)} onThreadReply={onThreadReply} onEdit={() => onEdit(msg)} onDelete={() => onDelete(msg)} onMoreClick={handleMoreClick} moreBtnRef={moreBtnRef} />
                        </div>
                    )}

                    {/* Context Menu */}
                    {isMenuActive && (
                        <div style={{ position: 'absolute', top: 20, right: 16, zIndex: 100, animation: 'fadeIn 0.15s ease' }}>
                            <MessageContextMenu 
                                msg={msg} mine={mine} onReply={() => onReply(msg)} onThreadReply={onThreadReply} 
                                onEdit={() => onEdit(msg)} onDelete={() => onDelete(msg)} 
                                onToggleSave={onToggleSave} isSaved={isSaved}
                                onClose={() => setActiveMenuMessageId(null)} 
                            />
                        </div>
                    )}
                    
                    {/* Bubble / Text */}
                    <div style={{
                        padding: msg.deleted ? '0' : (msg.type === 'image' ? '4px' : '8px 16px'),
                        background: msg.deleted ? 'transparent' : (mine ? 'var(--my-bubble)' : 'var(--their-bubble)'),
                        color: msg.deleted ? 'var(--text-muted)' : (mine ? '#FFFFFF' : 'var(--text-primary)'),
                        borderRadius: msg.deleted ? '0' : (
                            mine 
                                ? `16px ${isFirstInGroup ? '16px' : '4px'} ${isLastInGroup ? '16px' : '4px'} 16px`
                                : `${isFirstInGroup ? '16px' : '4px'} 16px 16px ${isLastInGroup ? '16px' : '4px'}`
                        ),
                        boxShadow: msg.deleted || msg.type === 'image' ? 'none' : 'var(--shadow-sm)',
                        fontSize: 15, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                        opacity: msg.deleted ? 0.8 : 1, fontStyle: msg.deleted ? 'italic' : 'normal'
                    }}>
                        {/* Reply context */}
                        {msg.replyTo && (
                            <div 
                                onClick={() => {
                                    const id = typeof msg.replyTo === 'object' ? msg.replyTo.id : msg.replyTo;
                                    if (id) onJumpToMessage(id);
                                }}
                                style={{ 
                                    padding: '4px 8px', marginBottom: 6, background: 'var(--bg-elevated)', 
                                    borderLeft: `3px solid var(--border)`, borderRadius: 4, fontSize: 13, color: 'var(--text-secondary)',
                                    cursor: 'pointer', transition: 'background 0.1s', display: 'flex', alignItems: 'center', gap: 8
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                            >
                                <Avatar name={typeof msg.replyTo === 'object' ? msg.replyTo.username : '?'} size={16} circle />
                                <span style={{ fontWeight: 600 }}>{typeof msg.replyTo === 'object' ? msg.replyTo.username : 'Message'}</span>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>{typeof msg.replyTo === 'object' ? msg.replyTo.text : '...'}</div>
                            </div>
                        )}
                        {msg.deleted ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                                <span>This message was deleted.</span>
                            </div>
                        ) : (
                            <>
                                {/* Image message */}
                                {msg.type === 'image' && msg.fileUrl && (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={msg.fileUrl} alt={msg.fileName ?? 'image'} loading="lazy" style={{ display: 'block', maxWidth: '300px', maxHeight: '300px', borderRadius: 8, objectFit: 'cover', marginTop: 4, border: '1px solid var(--border)' }} />
                                    </a>
                                )}
                                {/* File message */}
                                {msg.type === 'file' && msg.fileUrl && !msg.fileName?.match(/\.(mp4|webm|ogg)$/i) && (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'inherit', marginTop: 4 }}>
                                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)' }}>{msg.fileName ?? 'Download file'}</span>
                                    </a>
                                )}
                                {/* Video message */}
                                {msg.type === 'file' && msg.fileUrl && msg.fileName?.match(/\.(mp4|webm|ogg)$/i) && (
                                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <video controls src={msg.fileUrl} style={{ maxWidth: '320px', maxHeight: '320px', borderRadius: 8, border: '1px solid var(--border)', background: '#000' }} />
                                    </div>
                                )}
                                {/* Audio message */}
                                {msg.type === 'audio' && msg.fileUrl && (
                                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center' }}>
                                        <audio controls src={msg.fileUrl} style={{ height: 40, outline: 'none', borderRadius: 20, minWidth: 240 }} />
                                    </div>
                                )}
                                {/* Text caption */}
                                {msg.text && msg.type !== 'image' && !msg.isE2EE && (
                                    <div className="markdown-body" style={{ fontSize: 15, width: '100%' }}>
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code(props: any) {
                                                    const {children, className, node, ...rest} = props;
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return match ? (
                                                        <SyntaxHighlighter
                                                            style={vscDarkPlus as any}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            customStyle={{ margin: '8px 0', borderRadius: 8, fontSize: 13, background: 'rgba(0,0,0,0.3)' }}
                                                            {...rest}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    ) : (
                                                        <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.9em' }} {...rest}>
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                                p({children}) {
                                                    return <p style={{ margin: '2px 0' }}>{children}</p>;
                                                },
                                                a({children, href}) {
                                                    if (href?.startsWith('mention://')) {
                                                        const mUser = href.replace('mention://', '');
                                                        const isMe = mUser === localStorage.getItem('chat_username');
                                                        return (
                                                            <span style={{
                                                                background: isMe ? 'rgba(245, 158, 11, 0.25)' : 'rgba(79, 110, 247, 0.18)',
                                                                color: isMe ? '#F59E0B' : 'var(--accent)',
                                                                border: `1px solid ${isMe ? 'rgba(245,158,11,0.4)' : 'rgba(79,110,247,0.3)'}`,
                                                                padding: '0 5px', borderRadius: 5, fontWeight: 700,
                                                                display: 'inline-block', lineHeight: 1.4, fontSize: '0.92em'
                                                            }}>
                                                                {children}
                                                            </span>
                                                        );
                                                    }
                                                    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)', textDecoration: 'underline' }}>{children}</a>;
                                                }
                                            }}
                                        >
                                            {processedText}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                {msg.text && msg.type === 'image' && !msg.isE2EE && (
                                    <div className="markdown-body" style={{ marginTop: 6, fontSize: 15, width: '100%' }}>
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                a({children, href}) {
                                                    if (href?.startsWith('mention://')) {
                                                        const mUser = href.replace('mention://', '');
                                                        const isMe = mUser === localStorage.getItem('chat_username');
                                                        return (
                                                            <span style={{
                                                                background: isMe ? 'rgba(245, 158, 11, 0.25)' : 'rgba(79, 110, 247, 0.18)',
                                                                color: isMe ? '#F59E0B' : 'var(--accent)',
                                                                border: `1px solid ${isMe ? 'rgba(245,158,11,0.4)' : 'rgba(79,110,247,0.3)'}`,
                                                                padding: '0 5px', borderRadius: 5, fontWeight: 700,
                                                                display: 'inline-block', lineHeight: 1.4, fontSize: '0.92em'
                                                            }}>
                                                                {children}
                                                            </span>
                                                        );
                                                    }
                                                    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)', textDecoration: 'underline' }}>{children}</a>;
                                                }
                                            }}
                                        >
                                            {processedText}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                
                                {/* E2EE Message */}
                                {msg.isE2EE && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        <span style={{ color: 'var(--text-primary)' }}>
                                            {decryptError ? <span style={{ fontStyle: 'italic', color: 'var(--danger)' }}>[Decryption Failed - Key Not Found]</span> : (decryptedText !== null ? decryptedText : <span style={{ fontStyle: 'italic', opacity: 0.8 }}>Decrypting...</span>)}
                                        </span>
                                    </div>
                                )}
                                {msg.edited && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>(edited)</span>}

                                {/* Link Preview */}
                                {msg.linkPreview && !msg.isE2EE && (
                                    <LinkPreview {...msg.linkPreview} />
                                )}
                                {decryptedLinkPreview && msg.isE2EE && (
                                    <LinkPreview {...decryptedLinkPreview} />
                                )}
                                
                                {/* Timestamp & Delivery Status / Read Receipts */}
                                <div style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, 
                                    marginTop: 4, marginRight: -4,
                                    fontSize: 10, color: mine ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                                    userSelect: 'none'
                                }}>
                                    <span>{formatTime(msg.timestamp)}</span>
                                    {mine && msg.conversationId && (
                                        <span style={{ display: 'flex', alignItems: 'center' }} title={msg.seenAt ? `Seen at ${new Date(msg.seenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Sent'}>
                                            {msg.seenAt ? (
                                                /* Double tick – blue = seen */
                                                <svg width="16" height="10" viewBox="0 0 24 15" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="2 8 7 13 17 2"/>
                                                    <polyline points="8 8 13 13 23 2"/>
                                                </svg>
                                            ) : (
                                                /* Single grey tick – sent / delivered */
                                                <svg width="12" height="10" viewBox="0 0 24 15" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="2 8 7 13 22 2"/>
                                                </svg>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, alignSelf: mine ? 'flex-end' : 'flex-start' }}>
                        {Object.entries(msg.reactions.reduce((acc: Record<string, number>, r: any) => { acc[r.icon] = (acc[r.icon] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([icon, count]: [string, any]) => (
                            <div key={icon} onClick={() => onReact(msg, icon)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '2px 8px', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                {icon === 'like' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>}
                                {icon === 'heart' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>}
                                {icon === 'check' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                <span style={{ fontWeight: 600 }}>{count}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Thread Replies Button */}
                {msg.threadReplyCount > 0 && !msg.threadId && (
                    <div 
                        onClick={() => onThreadReply && onThreadReply(msg)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, alignSelf: mine ? 'flex-end' : 'flex-start', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '4px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    >
                        <span style={{ fontSize: 14 }}>💬</span>
                        {msg.threadReplyCount} {msg.threadReplyCount === 1 ? 'reply' : 'replies'}
                        {msg.lastThreadReplyAt && <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, marginLeft: 4 }}>Last reply {formatTime(new Date(msg.lastThreadReplyAt))}</span>}
                    </div>
                )}
            </div>
            

        </article>
    );
}
