import React, { useState, useRef } from 'react';
import type { Message, DirectMessage } from '../../types';
import { Icon, Icons } from '../ui';

type ChatMessage = Message | DirectMessage;

interface ComposerProps {
    value: string;
    setValue: (v: string) => void;
    sendMessage: (inputValue: string, replyToId?: string) => void;
    sendFileMessage: (f: File, caption?: string, replyToId?: string) => Promise<void>;
    isConnected: boolean;
    inputRef: React.RefObject<HTMLInputElement | null>;
    disabled: boolean;
    onTyping: (isTyping: boolean) => void;
    replyToMsg: ChatMessage | null;
    setReplyToMsg: (m: ChatMessage | null) => void;
    editingMsg: ChatMessage | null;
    setEditingMsg: (m: ChatMessage | null) => void;
    onEditMessage: (id: string, text: string) => void;
    activeTypingUsers?: string[];
}

export function MessageInput({
    value, setValue, sendMessage, sendFileMessage, isConnected,
    inputRef, disabled, onTyping,
    replyToMsg, setReplyToMsg, editingMsg, setEditingMsg, onEditMessage,
    activeTypingUsers = []
}: ComposerProps) {
    const [focused, setFocused] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<{ url: string; name: string; isImage: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canSend = isConnected && !disabled && !uploading && (!!value.trim() || !!preview);
    const isOffline = !isConnected && !disabled;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isImage = file.type.startsWith('image/');
        setPreview({ url: isImage ? URL.createObjectURL(file) : '', name: file.name, isImage });
    };

    const handleSend = async () => {
        if (!canSend) return;
        if (editingMsg) {
            onEditMessage(editingMsg.id, value);
            setEditingMsg(null); setValue('');
        } else if (preview && fileInputRef.current?.files?.[0]) {
            setUploading(true);
            try {
                await sendFileMessage(fileInputRef.current.files[0], value, replyToMsg?.id);
                setValue('');
            } finally {
                setUploading(false); setPreview(null); setReplyToMsg(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } else {
            sendMessage(value, replyToMsg?.id);
            setValue(''); setReplyToMsg(null);
        }
    };

    const clearPreview = () => {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const placeholderText = disabled
        ? 'Select a conversation…'
        : uploading ? 'Uploading…'
        : isOffline ? 'Reconnecting…'
        : editingMsg ? 'Edit your message…'
        : 'Write a message…';

    return (
        <footer style={{ padding: '0 16px 14px', background: 'var(--bg-surface)', flexShrink: 0 }}>
            {/* Typing indicator zone directly above input */}
            <div style={{ height: 20, display: 'flex', alignItems: 'center', marginBottom: 2, paddingLeft: 8 }}>
                {activeTypingUsers.length > 0 && (
                    <span className="animate-fade-in" style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                            {[0, 0.15, 0.3].map((delay, i) => (
                                <span key={i} style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%', animation: `typing-bounce 1.2s ease infinite`, animationDelay: `${delay}s` }} />
                            ))}
                        </span>
                        {activeTypingUsers.length === 1 ? `${activeTypingUsers[0]} is typing` : `${activeTypingUsers.join(', ')} are typing`}
                    </span>
                )}
            </div>

            {/* File preview banner */}
            {preview && (
                <div style={{
                    marginBottom: 8,
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '8px 12px',
                }}>
                    {preview.isImage ? (
                        <img src={preview.url} alt="preview" style={{ height: 44, width: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    ) : (
                        <div style={{ width: 36, height: 36, background: 'var(--accent-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon d={Icons.paperclip} size={16} color="var(--accent)" />
                        </div>
                    )}
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preview.name}
                    </span>
                    {uploading ? (
                        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Icon d={Icons.loader} size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
                            Uploading
                        </span>
                    ) : (
                        <button onClick={clearPreview} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', borderRadius: 4 }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                            <Icon d={Icons.x} size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* Reply / Edit context banner */}
            {(replyToMsg || editingMsg) && (
                <div style={{
                    marginBottom: 8,
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg-input)',
                    borderLeft: '3px solid var(--accent)',
                    borderRadius: '0 8px 8px 0',
                    padding: '8px 12px',
                }}>
                    <div style={{ color: 'var(--accent)', display: 'flex', flexShrink: 0 }}>
                        <Icon d={editingMsg ? Icons.edit : Icons.reply} size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 2, letterSpacing: '-0.01em' }}>
                            {editingMsg ? 'Editing message' : `Replying to ${replyToMsg?.username}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(editingMsg || replyToMsg)?.text || 'File'}
                        </div>
                    </div>
                    <button
                        onClick={() => { setReplyToMsg(null); setEditingMsg(null); setValue(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', borderRadius: 4 }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                        <Icon d={Icons.x} size={14} />
                    </button>
                </div>
            )}

            {/* Main input row */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-input)',
                border: `1.5px solid ${isOffline ? 'var(--warning)' : focused ? 'var(--border-focus)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: '4px 4px 4px 4px',
                boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'var(--shadow-xs)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
            }}>
                {/* Attach button */}
                <button
                    id="attach-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isConnected || disabled || uploading}
                    title="Attach file or image"
                    style={{
                        width: 36, height: 36,
                        background: 'none', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', borderRadius: 8,
                        cursor: (!isConnected || disabled || uploading) ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                        opacity: (!isConnected || disabled || uploading) ? 0.4 : 1,
                        transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (isConnected && !disabled && !uploading) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                    <Icon d={Icons.paperclip} size={17} />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.txt,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                
                {/* Emoji button */}
                <button
                    disabled={!isConnected || disabled}
                    title="Choose emoji"
                    style={{
                        width: 32, height: 32,
                        background: 'none', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', borderRadius: 8,
                        cursor: (!isConnected || disabled) ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                        opacity: (!isConnected || disabled) ? 0.4 : 1,
                        transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (isConnected && !disabled) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                </button>

                {/* GIF button */}
                <button
                    disabled={!isConnected || disabled}
                    title="Choose GIF"
                    style={{
                        width: 32, height: 32,
                        background: 'none', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', borderRadius: 8,
                        cursor: (!isConnected || disabled) ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                        opacity: (!isConnected || disabled) ? 0.4 : 1,
                        transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (isConnected && !disabled) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><path d="M8 10v4"></path><path d="M12 10v4"></path><path d="M16 10v4"></path><path d="M12 12h2"></path></svg>
                </button>

                {/* Text input */}
                <input
                    ref={inputRef}
                    id="message-input"
                    type="text"
                    value={value}
                    onChange={e => { setValue(e.target.value); onTyping(e.target.value.length > 0); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } if (e.key === 'Escape') { setReplyToMsg(null); setEditingMsg(null); setValue(''); } }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { setFocused(false); onTyping(false); }}
                    disabled={!isConnected || disabled || uploading}
                    placeholder={placeholderText}
                    style={{
                        flex: 1, height: 36,
                        background: 'transparent',
                        border: 'none', outline: 'none',
                        fontSize: 14, color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        caretColor: 'var(--accent)',
                    }}
                />

                {/* Status indicator (offline) */}
                {isOffline && (
                    <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 500, whiteSpace: 'nowrap', paddingRight: 4 }}>
                        Reconnecting…
                    </span>
                )}

                {/* Send button */}
                <button
                    id="send-message-btn"
                    onClick={handleSend}
                    disabled={!canSend}
                    aria-label="Send message"
                    style={{
                        width: 36, height: 36,
                        borderRadius: 9,
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: canSend ? 'var(--accent)' : 'transparent',
                        color: canSend ? '#fff' : 'var(--text-muted)',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                        flexShrink: 0,
                        transition: 'all 0.12s',
                        boxShadow: canSend ? '0 2px 8px rgba(79,110,247,0.3)' : 'none',
                    }}
                >
                    <Icon d={Icons.send} size={15} />
                </button>
            </div>
        </footer>
    );
}
