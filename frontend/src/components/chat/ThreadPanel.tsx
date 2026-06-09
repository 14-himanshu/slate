import { useState, useRef, useEffect } from 'react';
import type { Message } from '../../types';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { Icon, Icons, IconButton } from '../ui';

interface ThreadPanelProps {
  parentMessage: Message;
  messages: Message[];
  username: string;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onSendFile: (file: File, caption?: string) => Promise<void>;
  onEditMessage: (msgId: string, text: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onReactMessage: (msgId: string, icon: string) => void;
  isConnected: boolean;
  availableMentions: string[];
}

export function ThreadPanel({ parentMessage, messages, username, onClose, onSendMessage, onSendFile, onEditMessage, onDeleteMessage, onReactMessage, isConnected, availableMentions }: ThreadPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div style={{
      width: '380px',
      flexShrink: 0,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      animation: 'slideInRight 0.2s ease-out'
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thread</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{parentMessage.roomId}</span>
        </div>
        <IconButton label="Close Thread" onClick={onClose} size="sm">
          <Icon d={Icons.x} size={18} />
        </IconButton>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {/* Parent Message */}
        <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
          <MessageItem
            msg={parentMessage}
            mine={parentMessage.username === username}
            hideHeader={false}
            isFirstInGroup={true}
            isLastInGroup={true}
            onReply={() => {}}
            onEdit={(msg: any) => onEditMessage(msg.id, msg.text)}
            onDelete={(msg: any) => onDeleteMessage(msg.id)}
            onReact={(msg: any, icon: string) => onReactMessage(msg.id, icon)}
            onJumpToMessage={() => {}}
            activeMenuMessageId={null}
            setActiveMenuMessageId={() => {}}
          />
        </div>

        {/* Replies */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {messages.length} {messages.length === 1 ? 'reply' : 'replies'}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {messages.map((msg, idx) => {
          const mine = msg.username === username;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const hideHeader = prevMsg != null && prevMsg.username === msg.username && (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 60000);
          
          return (
            <MessageItem
              key={msg.id}
              msg={msg}
              mine={mine}
              hideHeader={hideHeader}
              isFirstInGroup={!hideHeader}
              isLastInGroup={idx === messages.length - 1 || messages[idx + 1]?.username !== msg.username}
              onReply={() => {}}
              onEdit={(m: any) => onEditMessage(m.id, m.text)}
              onDelete={(m: any) => onDeleteMessage(m.id)}
              onReact={(m: any, icon: string) => onReactMessage(m.id, icon)}
              onJumpToMessage={() => {}}
              activeMenuMessageId={null}
              setActiveMenuMessageId={() => {}}
            />
          );
        })}
      </div>

      {/* Input */}
      <div style={{ padding: '0 16px 16px 16px' }}>
        <MessageInput
          value={inputValue}
          setValue={setInputValue}
          sendMessage={onSendMessage}
          sendFileMessage={onSendFile}
          isConnected={isConnected}
          inputRef={inputRef}
          disabled={false}
          onTyping={() => {}}
          replyToMsg={null}
          setReplyToMsg={() => {}}
          editingMsg={editingMsg}
          setEditingMsg={setEditingMsg}
          onEditMessage={(id: string, text: string) => onEditMessage(id, text)}
          activeTypingUsers={[]}
          availableMentions={availableMentions}
        />
      </div>
    </div>
  );
}
