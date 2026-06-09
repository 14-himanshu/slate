import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import Auth from './Auth';
import ChatRoom from './components/ChatRoom';
import ProfilePage from './components/profile/ProfilePage';
import { useWebRTC } from './hooks/useWebRTC';
import { CallModal } from './components/chat/CallModal';
import { IncomingCallDialog } from './components/chat/IncomingCallDialog';
import { useChat } from './hooks/useChat';
import { searchUsers } from './lib/api';
import { useTheme } from './contexts/ThemeContext';

// ── Restore session ────────────────────────────────────────────
const storedToken    = localStorage.getItem('chat_token');
const storedUsername = localStorage.getItem('chat_username');

function App() {
  // ── Auth state ───────────────────────────────────────────────
  const [username,        setUsername]        = useState<string | null>(storedUsername);
  const [token,           setToken]           = useState<string | null>(storedToken);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth,  setIsCheckingAuth]  = useState(true);
  const [showProfile,     setShowProfile]     = useState(false);
  const [msgCount,        setMsgCount]        = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const [inputValue,   setInputValue]  = useState('');
  useTheme();

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_username');
    localStorage.removeItem('chat_rooms');
    localStorage.removeItem('chat_active_section');
    localStorage.removeItem('chat_active_dm');
    setIsAuthenticated(false);
    setToken(null);
    setUsername(null);
    setShowProfile(false);
  }, []);

  const onWebRTCSignalRef = useRef<((payload: any) => void) | null>(null);
  
  const chatState = useChat(isAuthenticated, token, username, handleLogout, (payload) => {
    onWebRTCSignalRef.current?.(payload);
  });

  const sendSignal = useCallback((conversationId: string, signalType: string, data: any) => {
    if (chatState.wsRef.current?.readyState === WebSocket.OPEN) {
      chatState.wsRef.current.send(JSON.stringify({ type: 'webrtc_signal', payload: { conversationId, signalType, data } }));
    }
  }, [chatState.wsRef]);

  const webRTC = useWebRTC(sendSignal);

  useEffect(() => {
    onWebRTCSignalRef.current = (payload) => {
      const { signalType, data, senderUsername, conversationId } = payload;
      if (signalType === 'callOffer') {
        webRTC.handleIncomingCall(conversationId, senderUsername, data);
      } else if (signalType === 'callAnswer') {
        webRTC.handleAnswer(data);
      } else if (signalType === 'iceCandidate') {
        webRTC.handleIceCandidate(data);
      } else if (signalType === 'endCall' || signalType === 'rejectCall') {
        webRTC.handleEndCallSignal();
      }
    };
  }, [webRTC]);

  // ── Auth Check on Mount ──────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      if (!storedToken || !storedUsername) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:8080`;
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

  // ── Auth ─────────────────────────────────────────────────────
  const handleAuth = (u: string, t: string) => {
    setUsername(u); setToken(t); setIsAuthenticated(true);
  };

  // ── Track total message count for stats ───────────────────────
  useEffect(() => {
    const total = Object.values(chatState.messagesByRoom).reduce((sum, msgs) => sum + msgs.length, 0);
    setMsgCount(total);
  }, [chatState.messagesByRoom]);

  const handleSearchUsers = useCallback((query: string) => {
    return searchUsers(query);
  }, []);

  const dmTypingUsers = chatState.activeConversationId ? (chatState.dmTypingByConversation[chatState.activeConversationId] ?? []) : [];

  // ── Scroll to bottom when active room messages change ────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messagesByRoom, chatState.dmMessagesByConversation, chatState.activeRoom, chatState.activeConversationId, chatState.activeSection]);


  // ── Render ────────────────────────────────────────────────────
  if (isCheckingAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Slate is loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Auth onAuth={handleAuth} />;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex',
      background: 'var(--bg-surface)',
      overflow: 'hidden',
    }}>
        <ChatRoom
          // rooms
          userRooms={chatState.userRooms}
          joinedRooms={chatState.joinedRooms}
          activeRoom={chatState.activeRoom}
          messagesByRoom={chatState.messagesByRoom}
          unreadByRoom={chatState.unreadByRoom}
          onJoinRoom={chatState.joinRoom}
          onLeaveRoom={chatState.leaveRoom}
          onSwitchRoom={chatState.switchRoom}
          // direct messages
          activeSection={chatState.activeSection}
          activeConversationId={chatState.activeConversationId}
          directConversations={chatState.directConversations}
          directMessagesByConversation={chatState.dmMessagesByConversation}
          dmTypingUsers={dmTypingUsers}
          onSelectConversation={chatState.selectConversation}
          onStartConversation={chatState.startConversation}
          onSearchUsers={handleSearchUsers}
          // chat
          inputValue={inputValue}
          setInputValue={setInputValue}
          sendMessage={chatState.sendMessage}
          sendFileMessage={chatState.sendFileMessage}
          sendDirectMessage={chatState.sendDirectMessage}
          sendDirectFileMessage={chatState.sendDirectFileMessage}
          onEditMessage={chatState.editMessage}
          onDeleteMessage={chatState.deleteMessage}
          onReactMessage={chatState.reactMessage}
          onEditDirectMessage={chatState.editDirectMessage}
          onDeleteDirectMessage={chatState.deleteDirectMessage}
          onReactDirectMessage={chatState.reactDirectMessage}
          loadMoreMessages={chatState.loadMoreMessages}
          loadMoreDmMessages={chatState.loadMoreDmMessages}
          threadMessages={chatState.threadMessages}
          loadThreadMessages={chatState.loadThreadMessages}
          onTyping={chatState.handleTyping}
          onDirectTyping={chatState.handleDirectTyping}
          isConnected={chatState.isConnected}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
          currentUser={username}
          onlineUsers={chatState.activeRoom ? (chatState.onlineUsersByRoom[chatState.activeRoom] ?? []) : []}
          typingUsers={chatState.activeRoom ? (chatState.typingUsersByRoom[chatState.activeRoom] ?? []) : []}
          // profile
          onOpenProfile={() => setShowProfile(true)}
          onStartVideoCall={() => {
            if (chatState.activeConversationId) webRTC.startCall(chatState.activeConversationId, true);
          }}
          onStartAudioCall={() => {
            if (chatState.activeConversationId) webRTC.startCall(chatState.activeConversationId, false);
          }}
        />
        
        {/* Profile Overlay */}
        {showProfile && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', borderRadius: 12, boxShadow: 'var(--shadow-xl)' }}>
              <button 
                onClick={() => setShowProfile(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg-hover)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
              <ProfilePage 
                currentUser={username}
                token={token!} 
                joinedRooms={chatState.joinedRooms}
                messageCount={msgCount}
                onClose={() => setShowProfile(false)}
                onLogout={handleLogout} 
                onUsernameChange={(newName: string) => {
                  const oldName = username;
                  setUsername(newName);
                  localStorage.setItem('chat_username', newName);
                  
                  if (oldName) {
                    chatState.setMessagesByRoom(prev => {
                      const next = { ...prev };
                      for (const room in next) {
                        next[room] = next[room].map(m => {
                          let updated = m.username === oldName ? { ...m, username: newName } : m;
                          if (updated.reactions) {
                            updated.reactions = updated.reactions.map(r => r.username === oldName ? { ...r, username: newName } : r);
                          }
                          return updated;
                        });
                      }
                      return next;
                    });
                    chatState.setDmMessagesByConversation(prev => {
                      const next = { ...prev };
                      for (const conv in next) {
                        next[conv] = next[conv].map(m => {
                          let updated = m.username === oldName ? { ...m, username: newName } : m;
                          if (updated.reactions) {
                            updated.reactions = updated.reactions.map(r => r.username === oldName ? { ...r, username: newName } : r);
                          }
                          return updated;
                        });
                      }
                      return next;
                    });
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* WebRTC Modals */}
        {webRTC.isReceivingCall && (
          <IncomingCallDialog 
            callerUsername={webRTC.callerUsername}
            isVideoCall={webRTC.isVideoCall}
            onAccept={webRTC.acceptCall}
            onDecline={webRTC.rejectCall}
          />
        )}
        {webRTC.isCalling && (
          <CallModal 
            localStream={webRTC.localStream}
            remoteStream={webRTC.remoteStream}
            isAudioMuted={webRTC.isAudioMuted}
            isVideoOff={webRTC.isVideoOff}
            onEndCall={webRTC.endCall}
            onToggleMute={webRTC.toggleMute}
            onToggleVideo={webRTC.toggleVideo}
          />
        )}
    </div>
  );
}

export default App;
