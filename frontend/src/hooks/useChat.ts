import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, DirectConversationSummary, DirectMessage } from '../types';
import { fetchDirectConversations, createDirectConversation, markDirectConversationRead } from '../lib/api';
import { sendNotification } from '../lib/notifications';

const storedRooms = JSON.parse(localStorage.getItem('chat_rooms') ?? '[]') as string[];
const storedActiveSection = (localStorage.getItem('chat_active_section') as 'rooms' | 'dm' | null) ?? 'rooms';
const storedActiveDm = localStorage.getItem('chat_active_dm');

export function useChat(
  isAuthenticated: boolean,
  token: string | null,
  username: string | null,
  handleLogout: () => void,
  onWebRTCSignal?: (payload: { conversationId: string, senderId: string, senderUsername: string, signalType: string, data: any }) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [joinedRooms, setJoinedRooms] = useState<string[]>(storedRooms);
  const [activeRoom, setActiveRoom] = useState<string | null>(storedRooms[0] ?? null);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});
  const [unreadByRoom, setUnreadByRoom] = useState<Record<string, number>>({});
  const [onlineUsersByRoom, setOnlineUsersByRoom] = useState<Record<string, string[]>>({});
  const [typingUsersByRoom, setTypingUsersByRoom] = useState<Record<string, string[]>>({});
  const [activeSection, setActiveSection] = useState<'rooms' | 'dm'>(storedActiveSection);
  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>({});
  const [userRooms, setUserRooms] = useState<import('../types').RoomSummary[]>([]);
  const [directConversations, setDirectConversations] = useState<DirectConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(storedActiveDm);
  const [dmMessagesByConversation, setDmMessagesByConversation] = useState<Record<string, DirectMessage[]>>({});
  const [dmTypingByConversation, setDmTypingByConversation] = useState<Record<string, string[]>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const directConversationsRef = useRef<DirectConversationSummary[]>([]);
  const activeConversationIdRef = useRef<string | null>(storedActiveDm);
  const activeSectionRef = useRef<'rooms' | 'dm'>(storedActiveSection);
  const activeRoomRef = useRef<string | null>(activeRoom);

  useEffect(() => { localStorage.setItem('chat_rooms', JSON.stringify(joinedRooms)); }, [joinedRooms]);
  useEffect(() => { localStorage.setItem('chat_active_section', activeSection); }, [activeSection]);
  useEffect(() => {
    if (activeConversationId) localStorage.setItem('chat_active_dm', activeConversationId);
    else localStorage.removeItem('chat_active_dm');
  }, [activeConversationId]);
  useEffect(() => { directConversationsRef.current = directConversations; }, [directConversations]);
  useEffect(() => { activeConversationIdRef.current = activeConversationId; }, [activeConversationId]);
  useEffect(() => { activeSectionRef.current = activeSection; }, [activeSection]);
  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDirectConversations()
      .then(setDirectConversations)
      .catch((err) => console.error('Failed to load direct conversations:', err));
      
    import('../lib/api').then(api => {
      api.getUserRooms().then(rooms => {
        setUserRooms(rooms);
        // Ensure joinedRooms has these rooms so they are subscribed
        setJoinedRooms(prev => {
          const newIds = new Set(prev);
          rooms.forEach(r => newIds.add(r.roomId));
          return Array.from(newIds);
        });
      }).catch(err => console.error('Failed to load user rooms:', err));
    });
  }, [isAuthenticated]);

  const parseDirectMessage = useCallback((raw: any): DirectMessage => {
    const replyTo = raw.replyTo ? (typeof raw.replyTo === 'string' ? raw.replyTo : parseDirectMessage(raw.replyTo)) : undefined;
    return {
      id: raw.id, conversationId: raw.conversationId, senderId: raw.senderId, username: raw.username,
      text: raw.message, timestamp: new Date(raw.timestamp), type: (raw.type ?? 'text') as DirectMessage['type'],
      fileUrl: raw.fileUrl, fileName: raw.fileName, edited: raw.edited, deleted: raw.deleted, replyTo, reactions: raw.reactions,
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const wsBase = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8080`;

    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let reconnectDelay = 1000;
    let isComponentMounted = true;
    let ws: WebSocket | null = null;

    const connectWs = () => {
      if (!isComponentMounted || !token) return;
      ws = new WebSocket(wsBase, [encodeURIComponent(token)]);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelay = 1000;
        const rooms = JSON.parse(localStorage.getItem('chat_rooms') ?? '[]') as string[];
        for (const roomId of rooms) ws?.send(JSON.stringify({ type: 'joinRoom', payload: { roomId } }));
        for (const conversation of directConversationsRef.current) ws?.send(JSON.stringify({ type: 'joinDm', payload: { conversationId: conversation.id, includeHistory: 'false' } }));
        if (activeConversationIdRef.current) ws?.send(JSON.stringify({ type: 'joinDm', payload: { conversationId: activeConversationIdRef.current, includeHistory: 'true' } }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as { type: string; payload: Record<string, unknown>; };
          if (data.type === 'history') {
            const roomId = data.payload['roomId'] as string;
            const messages = (data.payload['messages'] as Array<any>).map(m => ({
              id: m.id, roomId: m.roomId, text: m.message, username: m.username, timestamp: new Date(m.timestamp),
              type: (m.type as Message['type']) ?? 'text', fileUrl: m.fileUrl, fileName: m.fileName, edited: m.edited, deleted: m.deleted, replyTo: m.replyTo, reactions: m.reactions, linkPreview: m.linkPreview, threadId: m.threadId, threadReplyCount: m.threadReplyCount, lastThreadReplyAt: m.lastThreadReplyAt
            }));
            setMessagesByRoom(prev => ({ ...prev, [roomId]: messages }));
          } else if (data.type === 'historyLoaded') {
            const roomId = data.payload['roomId'] as string;
            const messages = (data.payload['messages'] as Array<any>).map(m => ({
              id: m.id, roomId: m.roomId, text: m.message, username: m.username, timestamp: new Date(m.timestamp),
              type: (m.type as Message['type']) ?? 'text', fileUrl: m.fileUrl, fileName: m.fileName, edited: m.edited, deleted: m.deleted, replyTo: m.replyTo, reactions: m.reactions, linkPreview: m.linkPreview, threadId: m.threadId, threadReplyCount: m.threadReplyCount, lastThreadReplyAt: m.lastThreadReplyAt
            }));
            setMessagesByRoom(prev => {
              const current = prev[roomId] || [];
              const newMessages = messages.filter(m => !current.some(c => c.id === m.id));
              return { ...prev, [roomId]: [...newMessages, ...current].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) };
            });
          } else if (data.type === 'threadHistoryLoaded') {
            const threadId = data.payload['threadId'] as string;
            const messages = (data.payload['messages'] as Array<any>).map(m => ({
              id: m.id, roomId: m.roomId, text: m.message, username: m.username, timestamp: new Date(m.timestamp),
              type: (m.type as Message['type']) ?? 'text', fileUrl: m.fileUrl, fileName: m.fileName, edited: m.edited, deleted: m.deleted, replyTo: m.replyTo, reactions: m.reactions, linkPreview: m.linkPreview, threadId: m.threadId, threadReplyCount: m.threadReplyCount, lastThreadReplyAt: m.lastThreadReplyAt
            }));
            setThreadMessages(prev => {
              const current = prev[threadId] || [];
              const newMessages = messages.filter(m => !current.some(c => c.id === m.id));
              return { ...prev, [threadId]: [...newMessages, ...current].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) };
            });
          } else if (data.type === 'chat') {
            const p = data.payload as any;
            const newMsg: Message = {
              id: p.id || Date.now().toString() + Math.random(), roomId: p.roomId, text: p.message, username: p.username, timestamp: new Date(p.timestamp),
              type: (p.type || p.messageType) ?? 'text', fileUrl: p.fileUrl, fileName: p.fileName, edited: p.edited, deleted: p.deleted, replyTo: p.replyTo, reactions: p.reactions, linkPreview: p.linkPreview, threadId: p.threadId, threadReplyCount: p.threadReplyCount, lastThreadReplyAt: p.lastThreadReplyAt
            };
            if (p.threadId) {
              setThreadMessages(prev => ({ ...prev, [p.threadId]: [...(prev[p.threadId] ?? []), newMsg] }));
              setMessagesByRoom(prev => ({
                ...prev,
                [p.roomId]: (prev[p.roomId] ?? []).map(m => m.id === p.threadId ? { ...m, threadReplyCount: (m.threadReplyCount || 0) + 1, lastThreadReplyAt: newMsg.timestamp.toISOString() } : m)
              }));
            } else {
              setMessagesByRoom(prev => ({ ...prev, [p.roomId]: [...(prev[p.roomId] ?? []), newMsg] }));
              setActiveRoom(current => { if (current !== p.roomId) setUnreadByRoom(u => ({ ...u, [p.roomId]: (u[p.roomId] ?? 0) + 1 })); return current; });
            }
            
            if (document.hidden && newMsg.username !== username && localStorage.getItem('chat_notifications') === 'true') {
              const mutedRooms = JSON.parse(localStorage.getItem('chat_muted_rooms') ?? '[]');
              if (!mutedRooms.includes(p.roomId)) {
                sendNotification(`New message in #${p.roomId}`, { body: `${newMsg.username}: ${newMsg.text || 'Sent a file'}` });
              }
            }
          } else if (data.type === 'messageUpdated') {
            const p = data.payload as any;
            const updatedMsg: Message = { id: p.id, roomId: p.roomId, text: p.message, username: p.username, timestamp: new Date(p.timestamp), type: p.type ?? 'text', fileUrl: p.fileUrl, fileName: p.fileName, edited: p.edited, deleted: p.deleted, replyTo: p.replyTo, reactions: p.reactions };
            setMessagesByRoom(prev => ({ ...prev, [p.roomId]: (prev[p.roomId] ?? []).map(m => m.id === updatedMsg.id ? updatedMsg : m) }));
          } else if (data.type === 'roomUsers') {
            const { roomId, users } = data.payload as { roomId: string; count: number; users: string[] };
            setOnlineUsersByRoom(prev => ({ ...prev, [roomId]: users }));
          } else if (data.type === 'typing') {
            const { roomId, username: typist, isTyping } = data.payload as { roomId: string; username: string; isTyping: boolean };
            if (typist === username) return;
            setTypingUsersByRoom(prev => {
              const current = prev[roomId] || [];
              if (isTyping && !current.includes(typist)) return { ...prev, [roomId]: [...current, typist] };
              else if (!isTyping && current.includes(typist)) return { ...prev, [roomId]: current.filter(u => u !== typist) };
              return prev;
            });
          } else if (data.type === 'dmHistory') {
            const conversationId = data.payload['conversationId'] as string;
            const messages = (data.payload['messages'] as Array<any>).map(parseDirectMessage);
            setDmMessagesByConversation(prev => ({ ...prev, [conversationId]: messages }));
          } else if (data.type === 'dmHistoryLoaded') {
            const conversationId = data.payload['conversationId'] as string;
            const messages = (data.payload['messages'] as Array<any>).map(parseDirectMessage);
            setDmMessagesByConversation(prev => {
              const current = prev[conversationId] || [];
              const newMessages = messages.filter(m => !current.some(c => c.id === m.id));
              return { ...prev, [conversationId]: [...newMessages, ...current].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) };
            });
          } else if (data.type === 'dmMessage') {
            const p = data.payload as any;
            const newMsg = parseDirectMessage(p);
            setDmMessagesByConversation(prev => ({ ...prev, [p.conversationId]: [...(prev[p.conversationId] ?? []), newMsg] }));
            setDirectConversations(prev => {
              const existing = prev.find(c => c.id === p.conversationId);
              if (!existing) return prev;
              const isActive = activeSectionRef.current === 'dm' && activeConversationIdRef.current === p.conversationId;
              const shouldIncrement = newMsg.username !== username && !isActive;
              const updated = {
                ...existing,
                lastMessage: { id: newMsg.id, text: newMsg.text, type: newMsg.type, fileName: newMsg.fileName, timestamp: newMsg.timestamp.toISOString(), senderId: newMsg.senderId, username: newMsg.username },
                lastMessageAt: newMsg.timestamp.toISOString(),
                unreadCount: shouldIncrement ? (existing.unreadCount ?? 0) + 1 : existing.unreadCount ?? 0,
              };
              return [updated, ...prev.filter(c => c.id !== p.conversationId)];
            });
            
            if (document.hidden && newMsg.username !== username && localStorage.getItem('chat_notifications') === 'true') {
              const mutedRooms = JSON.parse(localStorage.getItem('chat_muted_rooms') ?? '[]');
              if (!mutedRooms.includes(p.conversationId)) {
                sendNotification(`New direct message from ${newMsg.username}`, { body: newMsg.text || 'Sent a file' });
              }
            }
            
            if (!directConversationsRef.current.some(c => c.id === p.conversationId)) fetchDirectConversations().then(setDirectConversations).catch(() => undefined);
            if (activeSectionRef.current === 'dm' && activeConversationIdRef.current === p.conversationId) markDirectConversationRead(p.conversationId).catch(() => undefined);
          } else if (data.type === 'dmMessageUpdated') {
            const p = data.payload as any;
            const updated = parseDirectMessage(p);
            setDmMessagesByConversation(prev => ({ ...prev, [p.conversationId]: (prev[p.conversationId] ?? []).map(msg => msg.id === updated.id ? updated : msg) }));
          } else if (data.type === 'dmTyping') {
            const { conversationId, username: typist, isTyping } = data.payload as { conversationId: string; username: string; isTyping: boolean };
            if (typist === username) return;
            setDmTypingByConversation(prev => {
              const current = prev[conversationId] || [];
              if (isTyping && !current.includes(typist)) return { ...prev, [conversationId]: [...current, typist] };
              else if (!isTyping && current.includes(typist)) return { ...prev, [conversationId]: current.filter(u => u !== typist) };
              return prev;
            });
          } else if (data.type === 'presence') {
            const { userId, status, lastSeen } = data.payload as { userId: string; status: 'online' | 'offline'; lastSeen: string };
            setDirectConversations(prev => prev.map(conv => conv.user.id === userId ? { ...conv, user: { ...conv.user, status, lastSeen } } : conv));
          } else if (data.type === 'mention') {
            const payload = data.payload as { sender: string; roomId: string | null; conversationId: string | null; messageId: string; text: string };
            const isActiveRoom = payload.roomId && payload.roomId === activeRoomRef.current;
            const isActiveDm = payload.conversationId && payload.conversationId === activeConversationIdRef.current;
            
            if (localStorage.getItem('chat_notifications') === 'true' && (document.hidden || (!isActiveRoom && !isActiveDm))) {
              const mutedRooms = JSON.parse(localStorage.getItem('chat_muted_rooms') ?? '[]');
              const targetId = payload.roomId || payload.conversationId || '';
              if (!mutedRooms.includes(targetId)) {
                sendNotification(`You were mentioned by ${payload.sender}`, { body: payload.text });
              }
            }
          } else if (data.type === 'webrtc_signal') {
            const payload = data.payload as { conversationId: string, senderId: string, senderUsername: string, signalType: string, data: any };
            if (onWebRTCSignal) {
              onWebRTCSignal(payload);
            }
          }
        } catch { console.warn('Received non-JSON WS message'); }
      };

      ws.onerror = () => setIsConnected(false);

      ws.onclose = (ev) => {
        setIsConnected(false);
        if (ev.code === 1008) handleLogout();
        else if (isComponentMounted) {
          reconnectTimeout = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
            connectWs();
          }, reconnectDelay);
        }
      };
    };

    connectWs();
    return () => { 
      isComponentMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) ws.close(); 
    };
  }, [isAuthenticated, token, username, handleLogout, parseDirectMessage]);

  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    for (const conversation of directConversations) {
      wsRef.current.send(JSON.stringify({ type: 'joinDm', payload: { conversationId: conversation.id, includeHistory: 'false' } }));
    }
  }, [directConversations]);

  useEffect(() => {
    if (!activeConversationId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'joinDm', payload: { conversationId: activeConversationId, includeHistory: 'true' } }));
    markDirectConversationRead(activeConversationId).catch(() => undefined);
  }, [activeConversationId]);

  const joinRoom = useCallback((roomId: string) => {
    const id = roomId.trim().toUpperCase();
    if (!id || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'joinRoom', payload: { roomId: id } }));
    setJoinedRooms(prev => prev.includes(id) ? prev : [...prev, id]);
    setActiveRoom(id); setActiveSection('rooms');
    setUnreadByRoom(prev => ({ ...prev, [id]: 0 }));
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'leaveRoom', payload: { roomId } }));
    setJoinedRooms(prev => {
      const next = prev.filter(r => r !== roomId);
      setActiveRoom(cur => cur === roomId ? (next[0] ?? null) : cur);
      return next;
    });
    setMessagesByRoom(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    setUnreadByRoom(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    setOnlineUsersByRoom(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    setTypingUsersByRoom(prev => { const n = { ...prev }; delete n[roomId]; return n; });
  }, []);

  const switchRoom = useCallback((roomId: string) => {
    setActiveRoom(roomId); setActiveSection('rooms');
    setUnreadByRoom(prev => ({ ...prev, [roomId]: 0 }));
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId); setActiveSection('dm');
    setDirectConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'joinDm', payload: { conversationId, includeHistory: 'true' } }));
      wsRef.current.send(JSON.stringify({ type: 'dmRead', payload: { conversationId } }));
    }
    markDirectConversationRead(conversationId).catch(() => undefined);
  }, []);

  const startConversation = useCallback(async (userId: string) => {
    try {
      const conversation = await createDirectConversation(userId);
      setDirectConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id);
        if (exists) return prev.map(c => c.id === conversation.id ? { ...conversation, unreadCount: c.unreadCount } : c);
        return [conversation, ...prev];
      });
      setActiveConversationId(conversation.id); setActiveSection('dm');
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'joinDm', payload: { conversationId: conversation.id, includeHistory: 'true' } }));
      }
    } catch (err) { console.error('Failed to start conversation:', err); }
  }, []);

  const sendMessage = useCallback(async (inputValue: string, replyToId?: string, threadId?: string) => {
    if (!inputValue.trim() || !activeRoom || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    let linkPreview: any = undefined;
    const urlMatch = inputValue.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      try {
        const { fetchLinkPreview } = await import('../lib/api');
        linkPreview = await fetchLinkPreview(urlMatch[0]);
      } catch (err) {
        console.error("Failed to fetch link preview", err);
      }
    }
    
    wsRef.current.send(JSON.stringify({ type: 'chat', payload: { roomId: activeRoom, message: inputValue.trim(), messageType: 'text', replyTo: replyToId, linkPreview, threadId } }));
    wsRef.current.send(JSON.stringify({ type: 'typing', payload: { roomId: activeRoom, isTyping: 'false' } }));
  }, [activeRoom]);

  const editMessage = useCallback((msgId: string, text: string) => {
    if (!activeRoom || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'editMessage', payload: { roomId: activeRoom, messageId: msgId, message: text } }));
  }, [activeRoom]);

  const deleteMessage = useCallback((msgId: string) => {
    if (!activeRoom || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'deleteMessage', payload: { roomId: activeRoom, messageId: msgId } }));
  }, [activeRoom]);

  const reactMessage = useCallback((msgId: string, icon: string) => {
    if (!activeRoom || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'reactMessage', payload: { roomId: activeRoom, messageId: msgId, icon } }));
  }, [activeRoom]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!activeRoom || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'typing', payload: { roomId: activeRoom, isTyping: isTyping ? 'true' : 'false' } }));
  }, [activeRoom]);

  const sendFileMessage = useCallback(async (file: File, caption?: string, replyToId?: string, threadId?: string) => {
    if (!activeRoom || !token || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:8080`; const apiBase = rawBackendUrl.endsWith('/') ? rawBackendUrl.slice(0, -1) : rawBackendUrl;
    const formData = new FormData(); formData.append('file', file);
    const res = await fetch(`${apiBase}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    if (!res.ok) throw new Error(await res.text());
    const { url, fileName, fileType } = await res.json() as { url: string; fileName: string; fileType: 'image' | 'file' };
    wsRef.current.send(JSON.stringify({ type: 'chat', payload: { roomId: activeRoom, message: caption ?? '', messageType: fileType, fileUrl: url, fileName, replyTo: replyToId, threadId } }));
  }, [activeRoom, token]);

  const sendDirectMessage = useCallback(async (inputValue: string, replyToId?: string) => {
    if (!inputValue.trim() || !activeConversationId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    let linkPreview: any = undefined;
    const urlMatch = inputValue.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      try {
        const { fetchLinkPreview } = await import('../lib/api');
        linkPreview = await fetchLinkPreview(urlMatch[0]);
      } catch (err) {
        console.error("Failed to fetch link preview", err);
      }
    }

    // Attempt E2EE
    let payload: any = { conversationId: activeConversationId, message: inputValue.trim(), messageType: 'text', replyTo: replyToId, linkPreview };
    
    try {
      const activeConvo = directConversationsRef.current.find(c => c.id === activeConversationId);
      if (activeConvo && activeConvo.user.publicKey) {
        const myPubKeyJwk = localStorage.getItem(`chat_pubkey_${username}`);
        if (myPubKeyJwk) {
          const { importPublicKey, encryptMessage } = await import('../lib/e2ee');
          const recipientPubKey = await importPublicKey(activeConvo.user.publicKey);
          const senderPubKey = await importPublicKey(myPubKeyJwk);
          
          // Stringify the message + linkPreview into the ciphertext
          const e2eePayloadText = JSON.stringify({ text: inputValue.trim(), linkPreview });
          const e2eeResult = await encryptMessage(e2eePayloadText, senderPubKey, recipientPubKey);
          
          payload.isE2EE = 'true';
          payload.message = ''; // Don't send plaintext
          delete payload.linkPreview; // Don't send plaintext linkPreview
          payload.e2eeData = JSON.stringify({
            iv: e2eeResult.iv,
            encryptedKeySender: e2eeResult.encryptedKeySender,
            encryptedKeyRecipient: e2eeResult.encryptedKeyRecipient
          });
        }
      }
    } catch (e) {
      console.error("E2EE encryption failed, sending plaintext...", e);
    }

    wsRef.current.send(JSON.stringify({ type: 'dmMessage', payload }));
    wsRef.current.send(JSON.stringify({ type: 'dmTyping', payload: { conversationId: activeConversationId, isTyping: 'false' } }));
  }, [activeConversationId, username]);

  const sendDirectFileMessage = useCallback(async (file: File, caption?: string, replyToId?: string) => {
    if (!activeConversationId || !token || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:8080`; const apiBase = rawBackendUrl.endsWith('/') ? rawBackendUrl.slice(0, -1) : rawBackendUrl;
    const formData = new FormData(); formData.append('file', file);
    const res = await fetch(`${apiBase}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    if (!res.ok) throw new Error(await res.text());
    const { url, fileName, fileType } = await res.json() as { url: string; fileName: string; fileType: 'image' | 'file' };
    wsRef.current.send(JSON.stringify({ type: 'dmMessage', payload: { conversationId: activeConversationId, message: caption ?? '', messageType: fileType, fileUrl: url, fileName, replyTo: replyToId } }));
  }, [activeConversationId, token]);

  const editDirectMessage = useCallback((msgId: string, text: string) => {
    if (!activeConversationId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'editDmMessage', payload: { conversationId: activeConversationId, messageId: msgId, message: text } }));
  }, [activeConversationId]);

  const deleteDirectMessage = useCallback((msgId: string) => {
    if (!activeConversationId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'deleteDmMessage', payload: { conversationId: activeConversationId, messageId: msgId } }));
  }, [activeConversationId]);

  const reactDirectMessage = useCallback((msgId: string, icon: string) => {
    if (!activeConversationId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'reactDmMessage', payload: { conversationId: activeConversationId, messageId: msgId, icon } }));
  }, [activeConversationId]);

  const handleDirectTyping = useCallback((isTyping: boolean) => {
    if (!activeConversationId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'dmTyping', payload: { conversationId: activeConversationId, isTyping: isTyping ? 'true' : 'false' } }));
  }, [activeConversationId]);

  const loadMoreMessages = useCallback((roomId: string, beforeDate: Date) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'loadMoreRoomHistory', payload: { roomId, before: beforeDate.toISOString() } }));
  }, []);

  const loadThreadMessages = useCallback((threadId: string, beforeDate?: Date) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'loadThreadHistory', payload: { threadId, before: beforeDate?.toISOString() } }));
  }, []);

  const loadMoreDmMessages = useCallback((conversationId: string, beforeDate: Date) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'loadMoreDmHistory', payload: { conversationId, before: beforeDate.toISOString() } }));
  }, []);

  return {
    isConnected, joinedRooms, activeRoom, messagesByRoom, unreadByRoom, onlineUsersByRoom, typingUsersByRoom,
    activeSection, directConversations, activeConversationId, dmMessagesByConversation, dmTypingByConversation,
    threadMessages, wsRef,
    joinRoom, leaveRoom, switchRoom, selectConversation, startConversation,
    sendMessage, editMessage, deleteMessage, reactMessage, handleTyping, sendFileMessage,
    sendDirectMessage, sendDirectFileMessage, editDirectMessage, deleteDirectMessage, reactDirectMessage, handleDirectTyping,
    loadMoreMessages, loadMoreDmMessages, loadThreadMessages, userRooms, setUserRooms,
    onTyping: handleTyping,
    onDirectTyping: handleDirectTyping,
    setJoinedRooms, setActiveRoom, setMessagesByRoom, setUnreadByRoom, setOnlineUsersByRoom, setTypingUsersByRoom,
    setActiveSection, setDirectConversations, setActiveConversationId, setDmMessagesByConversation, setDmTypingByConversation
  };
}
