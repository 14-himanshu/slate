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
    availableMentions?: string[];
}

export function MessageInput({
    value, setValue, sendMessage, sendFileMessage, isConnected,
    inputRef, disabled, onTyping,
    replyToMsg, setReplyToMsg, editingMsg, setEditingMsg, onEditMessage,
    activeTypingUsers = [], availableMentions = []
}: ComposerProps) {
    const [focused, setFocused] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<{ url: string; name: string; isImage: boolean; isAudio?: boolean; file?: File } | null>(null);
    const [mentionState, setMentionState] = useState<{ active: boolean; query: string; index: number }>({ active: false, query: '', index: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const discardNextRecording = useRef(false);

    const canSend = isConnected && !disabled && !uploading && (!!value.trim() || !!preview);
    const isOffline = !isConnected && !disabled;

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            discardNextRecording.current = false;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                if (discardNextRecording.current) return;
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
                setPreview({ url: URL.createObjectURL(file), name: 'Voice Note', isImage: false, isAudio: true, file });
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Microphone access denied:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        discardNextRecording.current = true;
        stopRecording();
    };

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
        } else if (preview && (fileInputRef.current?.files?.[0] || preview.file)) {
            setUploading(true);
            try {
                const fileToUpload = preview.file || fileInputRef.current!.files![0];
                await sendFileMessage(fileToUpload, value, replyToMsg?.id);
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onTyping(e.target.value.length > 0);
        
        const cursor = e.target.selectionStart || 0;
        const textBeforeCursor = e.target.value.substring(0, cursor);
        const match = textBeforeCursor.match(/(?:^|\s)@([A-Za-z0-9_]*)$/);
        
        if (match) {
            setMentionState({ active: true, query: match[1], index: 0 });
        } else {
            setMentionState({ active: false, query: '', index: 0 });
        }
    };

    const insertMention = (username: string) => {
        if (!inputRef.current) return;
        const cursor = inputRef.current.selectionStart || 0;
        const textBeforeCursor = value.substring(0, cursor);
        const textAfterCursor = value.substring(cursor);
        
        const match = textBeforeCursor.match(/(?:^|\s)@([A-Za-z0-9_]*)$/);
        if (!match) return;
        
        const matchIdx = textBeforeCursor.lastIndexOf(`@${match[1]}`);
        const newTextBefore = textBeforeCursor.substring(0, matchIdx) + `@${username} `;
        
        setValue(newTextBefore + textAfterCursor);
        setMentionState({ active: false, query: '', index: 0 });
        
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.selectionStart = newTextBefore.length;
                inputRef.current.selectionEnd = newTextBefore.length;
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (mentionState.active && availableMentions && availableMentions.length > 0) {
            const filtered = availableMentions.filter((u: string) => u.toLowerCase().includes(mentionState.query.toLowerCase()));
            if (filtered.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionState(s => ({ ...s, index: (s.index + 1) % filtered.length }));
                    return;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionState(s => ({ ...s, index: (s.index - 1 + filtered.length) % filtered.length }));
                    return;
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    insertMention(filtered[mentionState.index]);
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setMentionState({ active: false, query: '', index: 0 });
                    return;
                }
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            handleSend(); 
        } 
        if (e.key === 'Escape') { 
            setReplyToMsg(null); 
            setEditingMsg(null); 
            setValue(''); 
        }
    };

    const placeholderText = disabled
        ? 'Select a conversation…'
        : uploading ? 'Uploading…'
        : isOffline ? 'Reconnecting…'
        : editingMsg ? 'Edit your message…'
        : isRecording ? 'Recording...'
        : 'Write a message…';

    return (
        <footer style={{ padding: '0 16px 14px', background: 'var(--bg-base)', flexShrink: 0, position: 'relative' }}>
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
                    ) : preview.isAudio ? (
                        <div style={{ width: 36, height: 36, background: 'var(--success-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon d={Icons.mic} size={16} color="var(--success)" />
                        </div>
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

            {/* Mention Autocomplete Popover */}
            {mentionState.active && (() => {
                const filtered = availableMentions.filter((u: string) =>
                    u.toLowerCase().includes(mentionState.query.toLowerCase())
                );
                if (filtered.length === 0) return null;
                return (
                    <div style={{
                        position: 'absolute', bottom: '100%', left: 16, right: 16, marginBottom: 6,
                        background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '4px', boxShadow: 'var(--shadow-lg)',
                        zIndex: 100, display: 'flex', flexDirection: 'column', gap: 2,
                        maxHeight: 200, overflowY: 'auto'
                    }}>
                        {filtered.map((uname: string, idx: number) => (
                            <button
                                key={uname}
                                onMouseDown={(e) => { e.preventDefault(); insertMention(uname); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '7px 10px',
                                    background: idx === mentionState.index ? 'var(--bg-hover)' : 'transparent',
                                    border: 'none', borderRadius: 6, cursor: 'pointer',
                                    textAlign: 'left', width: '100%', transition: 'background 0.1s'
                                }}
                                onMouseEnter={() => setMentionState(s => ({ ...s, index: idx }))}
                            >
                                <div style={{
                                    width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                                    letterSpacing: '0.02em'
                                }}>
                                    {uname.slice(0, 2).toUpperCase()}
                                </div>
                                <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                                    <span style={{ color: 'var(--accent)' }}>@</span>{uname}
                                </span>
                            </button>
                        ))}
                    </div>
                );
            })()}

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
                {isRecording ? (
                    <div style={{ flex: 1, height: 36, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', color: 'var(--danger)', fontSize: 14, fontWeight: 500 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1.5s infinite' }} />
                        Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                        <button onClick={cancelRecording} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                            Cancel
                        </button>
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        id="message-input"
                        type="text"
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
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
                )}

                {/* Status indicator (offline) */}
                {isOffline && (
                    <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 500, whiteSpace: 'nowrap', paddingRight: 4 }}>
                        Reconnecting…
                    </span>
                )}

                {/* Send or Mic button */}
                {!value && !preview && !isRecording ? (
                    <button
                        onClick={startRecording}
                        disabled={!isConnected || disabled || uploading}
                        title="Hold to record voice note"
                        style={{
                            width: 36, height: 36,
                            borderRadius: 9,
                            border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: (!isConnected || disabled || uploading) ? 'not-allowed' : 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { if (isConnected && !disabled && !uploading) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                        <Icon d={Icons.mic} size={15} />
                    </button>
                ) : isRecording ? (
                    <button
                        onClick={stopRecording}
                        title="Stop and attach"
                        style={{
                            width: 36, height: 36,
                            borderRadius: 9,
                            border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--danger)',
                            color: '#fff',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.12s',
                            boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                        }}
                    >
                        <Icon d={Icons.micOff} size={15} />
                    </button>
                ) : (
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
                )}
            </div>
        </footer>
    );
}
