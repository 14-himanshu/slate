import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import Auth from './Auth';
import ChatRoom from './components/ChatRoom';
import ProfilePage from './components/profile/ProfilePage';
import type { Message } from './types';

// ── Restore session ────────────────────────────────────────────
const storedToken    = localStorage.getItem('chat_token');
const storedUsername = localStorage.getItem('chat_username');
const storedRooms    = JSON.parse(localStorage.getItem('chat_rooms') ?? '[]') as string[];

function App() {
  // ── Auth state ───────────────────────────────────────────────
  const [username,        setUsername]        = useState<string | null>(storedUsername);
  const [token,           setToken]           = useState<string | null>(storedToken);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth,  setIsCheckingAuth]  = useState(true);
  const [isConnected,     setIsConnected]     = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const [msgCount,        setMsgCount]        = useState(0);

  // ── Multi-room state ─────────────────────────────────────────
  const [joinedRooms,    setJoinedRooms]    = useState<string[]>(storedRooms);
  const [activeRoom,     setActiveRoom]     = useState<string | null>(storedRooms[0] ?? null);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});
  const [unreadByRoom,   setUnreadByRoom]   = useState<Record<string, number>>({});
  const [onlineUsersByRoom, setOnlineUsersByRoom] = useState<Record<string, string[]>>({});
  const [typingUsersByRoom, setTypingUsersByRoom] = useState<Record<string, string[]>>({});

  const wsRef          = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const [inputValue,   setInputValue]  = useState('');

  // ── Scroll to bottom when active room messages change ────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByRoom, activeRoom]);

  // ── Persist joined rooms ─────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('chat_rooms', JSON.stringify(joinedRooms));
  }, [joinedRooms]);

  // ── Auth Check on Mount ──────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      if (!storedToken || !storedUsername) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8080' : '');
        if (!rawBackendUrl) {
          throw new Error('Backend URL not configured');
        }
        const cleanUrl = rawBackendUrl.endsWith('/') ? rawBackendUrl.slice(0, -1) : rawBackendUrl;
        const res = await fetch(`${cleanUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          handleLogout();
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // ── WebSocket connection ─────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8080' : '');
    const cleanBackendUrl = rawBackendUrl.endsWith('/') ? rawBackendUrl.slice(0, -1) : rawBackendUrl;
    
    // Derive WS URL if not provided
    let wsBase = import.meta.env.VITE_WS_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'ws://localhost:8080' : cleanBackendUrl.replace(/^http/, 'ws'));
    
    // Enforce wss:// in production environments
    if (wsBase.startsWith('ws://') && !wsBase.includes('localhost')) {
      wsBase = wsBase.replace('ws://', 'wss://');
    }

    const ws = new WebSocket(`${wsBase}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      setIsConnected(true);
      // Re-subscribe to all persisted rooms on reconnect
      const rooms = JSON.parse(localStorage.getItem('chat_rooms') ?? '[]') as string[];
      for (const roomId of rooms) {
        ws.send(JSON.stringify({ type: 'joinRoom', payload: { roomId } }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          payload: Record<string, unknown>;
        };

        if (data.type === 'history') {
          const roomId   = data.payload['roomId'] as string;
          const rawMsgs  = data.payload['messages'] as Array<any>;
          const messages: Message[] = rawMsgs.map(m => ({
            id:        m.id,
            roomId:    m.roomId,
            text:      m.message,
            username:  m.username,
            timestamp: new Date(m.timestamp),
            type:      (m.type as Message['type']) ?? 'text',
            fileUrl:   m.fileUrl,
            fileName:  m.fileName,
            edited:    m.edited,
            deleted:   m.deleted,
            replyTo:   m.replyTo,
            reactions: m.reactions,
          }));
          setMessagesByRoom(prev => ({ ...prev, [roomId]: messages }));

        } else if (data.type === 'chat') {
          const p = data.payload as any;
          const newMsg: Message = {
            id:        p.id || Date.now().toString() + Math.random(),
            roomId:    p.roomId,
            text:      p.message,
            username:  p.username,
            timestamp: new Date(p.timestamp),
            type:      (p.type || p.messageType) ?? 'text',
            fileUrl:   p.fileUrl,
            fileName:  p.fileName,
            edited:    p.edited,
            deleted:   p.deleted,
            replyTo:   p.replyTo,
            reactions: p.reactions,
          };
          setMessagesByRoom(prev => ({
            ...prev,
            [p.roomId]: [...(prev[p.roomId] ?? []), newMsg],
          }));
          // Increment unread if this room is not active
          setActiveRoom(current => {
            if (current !== p.roomId) {
              setUnreadByRoom(u => ({ ...u, [p.roomId]: (u[p.roomId] ?? 0) + 1 }));
            }
            return current;
          });

        } else if (data.type === 'messageUpdated') {
          const p = data.payload as any;
          const updatedMsg: Message = {
            id:        p.id,
            roomId:    p.roomId,
            text:      p.message,
            username:  p.username,
            timestamp: new Date(p.timestamp),
            type:      p.type ?? 'text',
            fileUrl:   p.fileUrl,
            fileName:  p.fileName,
            edited:    p.edited,
            deleted:   p.deleted,
            replyTo:   p.replyTo,
            reactions: p.reactions,
          };
          setMessagesByRoom(prev => {
            const roomMsgs = prev[p.roomId] ?? [];
            return {
              ...prev,
              [p.roomId]: roomMsgs.map(m => m.id === updatedMsg.id ? updatedMsg : m),
            };
          });

        } else if (data.type === 'roomUsers') {
          const { roomId, users } = data.payload as { roomId: string; count: number; users: string[] };
          setOnlineUsersByRoom(prev => ({ ...prev, [roomId]: users }));
        } else if (data.type === 'typing') {
          const { roomId, username: typist, isTyping } = data.payload as { roomId: string; username: string; isTyping: boolean };
          if (typist === username) return; // ignore our own typing
          setTypingUsersByRoom(prev => {
            const current = prev[roomId] || [];
            if (isTyping && !current.includes(typist)) {
              return { ...prev, [roomId]: [...current, typist] };
            } else if (!isTyping && current.includes(typist)) {
              return { ...prev, [roomId]: current.filter(u => u !== typist) };
            }
            return prev;
          });
        }
      } catch {
        console.warn('Received non-JSON WS message');
      }
    };

    ws.onerror = () => setIsConnected(false);

    ws.onclose = (ev) => {
      setIsConnected(false);
      if (ev.code === 1008) {
        localStorage.removeItem('chat_token');
        localStorage.removeItem('chat_username');
        setIsAuthenticated(false);
        setToken(null);
        setUsername(null);
      }
    };

    wsRef.current = ws;
    return () => { if (ws.readyState === WebSocket.OPEN) ws.close(); };
  }, [isAuthenticated, token]);

  // ── Auth ─────────────────────────────────────────────────────
  const handleAuth = (u: string, t: string) => {
    setUsername(u); setToken(t); setIsAuthenticated(true);
  };

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_username');
    localStorage.removeItem('chat_rooms');
    setIsAuthenticated(false);
    setToken(null);
    setUsername(null);
    setShowProfile(false);
  }, []);

  // ── Track total message count for stats ───────────────────────
  useEffect(() => {
    const total = Object.values(messagesByRoom).reduce((sum, msgs) => sum + msgs.length, 0);
    setMsgCount(total);
  }, [messagesByRoom]);

  // ── Join a room ───────────────────────────────────────────────
  const joinRoom = useCallback((roomId: string) => {
    const id = roomId.trim().toUpperCase();
    if (!id || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ type: 'joinRoom', payload: { roomId: id } }));

    setJoinedRooms(prev => prev.includes(id) ? prev : [...prev, id]);
    setActiveRoom(id);
    setUnreadByRoom(prev => ({ ...prev, [id]: 0 }));
  }, []);

  // ── Leave a room ─────────────────────────────────────────────
  const leaveRoom = useCallback((roomId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ type: 'leaveRoom', payload: { roomId } }));

    setJoinedRooms(prev => {
      const next = prev.filter(r => r !== roomId);
      // Switch to adjacent room if we left the active one
      setActiveRoom(cur => cur === roomId ? (next[0] ?? null) : cur);
      return next;
    });
    setMessagesByRoom(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    setUnreadByRoom  (prev => { const n = { ...prev }; delete n[roomId]; return n; });
    setOnlineUsersByRoom(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    setTypingUsersByRoom(prev => { const n = { ...prev }; delete n[roomId]; return n; });
  }, []);

  // ── Switch active room ────────────────────────────────────────
  const switchRoom = useCallback((roomId: string) => {
    setActiveRoom(roomId);
    setUnreadByRoom(prev => ({ ...prev, [roomId]: 0 }));
  }, []);

  // ── Send text message ─────────────────────────────────────────
  const sendMessage = useCallback((replyToId?: string) => {
    if (!inputValue.trim() || !activeRoom ||
        !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type:    'chat',
      payload: { roomId: activeRoom, message: inputValue.trim(), messageType: 'text', replyTo: replyToId },
    }));
    // Send stop typing
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      payload: { roomId: activeRoom, isTyping: 'false' }
    }));
    setInputValue('');
  }, [inputValue, activeRoom]);

  // ── Advanced Message Actions ──────────────────────────────────
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

  // ── Typing indicator ──────────────────────────────────────────
  const handleTyping = useCallback((isTyping: boolean) => {
    if (!activeRoom || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      payload: { roomId: activeRoom, isTyping: isTyping ? 'true' : 'false' }
    }));
  }, [activeRoom]);

  // ── Upload file then send via WS ──────────────────────────────
  const sendFileMessage = useCallback(async (file: File, caption?: string, replyToId?: string) => {
    if (!activeRoom || !token || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8080' : '');
    const apiBase = rawBackendUrl.endsWith('/') ? rawBackendUrl.slice(0, -1) : rawBackendUrl;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${apiBase}/api/upload`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData,
    });
    if (!res.ok) throw new Error(await res.text());

    const { url, fileName, fileType } = await res.json() as { url: string; fileName: string; fileType: 'image' | 'file' };

    wsRef.current.send(JSON.stringify({
      type:    'chat',
      payload: { roomId: activeRoom, message: caption ?? '', messageType: fileType, fileUrl: url, fileName, replyTo: replyToId },
    }));
  }, [activeRoom, token]);

  // ── Render ────────────────────────────────────────────────────
  if (isCheckingAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>SyncTalk is loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Auth onAuth={handleAuth} />;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 1100,
        height: '100%', maxHeight: 820, minHeight: 560,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
      }}>
        <ChatRoom
          // rooms
          joinedRooms={joinedRooms}
          activeRoom={activeRoom}
          messagesByRoom={messagesByRoom}
          unreadByRoom={unreadByRoom}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
          onSwitchRoom={switchRoom}
          // chat
          inputValue={inputValue}
          setInputValue={setInputValue}
          sendMessage={sendMessage}
          sendFileMessage={sendFileMessage}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
          onReactMessage={reactMessage}
          onTyping={handleTyping}
          isConnected={isConnected}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
          currentUser={username}
          onlineUsers={activeRoom ? (onlineUsersByRoom[activeRoom] ?? []) : []}
          typingUsers={activeRoom ? (typingUsersByRoom[activeRoom] ?? []) : []}
          // profile
          onOpenProfile={() => setShowProfile(true)}
        />
      </div>

      {/* Profile slide-in panel */}
      {showProfile && (
        <ProfilePage
          currentUser={username}
          token={token}
          joinedRooms={joinedRooms}
          messageCount={msgCount}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onUsernameChange={(newName) => {
            setUsername(newName);
            localStorage.setItem('chat_username', newName);
          }}
        />
      )}
    </div>
  );
}

export default App;

