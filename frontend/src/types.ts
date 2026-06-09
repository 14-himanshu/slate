// Shared TypeScript types for the entire frontend

export type MessageType = "text" | "image" | "file" | "audio";

export interface Reaction {
  icon: string;
  userId: string;
  username: string;
}

export interface Message {
  id: string;
  roomId: string;
  userId?: string;
  username: string;
  text: string;
  timestamp: Date;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'seen';
  edited?: boolean;
  deleted?: boolean;
  isPinned?: boolean;
  replyTo?: string | Message;
  reactions?: Reaction[];
  linkPreview?: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string;
  };
  threadId?: string;
  threadReplyCount?: number;
  lastThreadReplyAt?: string;
}

export type UserStatus = "online" | "offline" | "busy" | "away";

export interface UserProfile {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  status: UserStatus;
  publicKey?: string;
  lastSeen: string;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  username: string;
  avatar?: string;
  status?: UserStatus;
  lastSeen?: string;
  publicKey?: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  username: string;
  text: string;
  timestamp: Date;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  edited?: boolean;
  deleted?: boolean;
  isPinned?: boolean;
  replyTo?: string | DirectMessage;
  reactions?: Reaction[];
  isE2EE?: boolean;
  linkPreview?: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string;
  };
  e2eeData?: {
    iv: string;
    encryptedKeySender: string;
    encryptedKeyRecipient: string;
  };
  seenAt?: string;
}

export interface DirectConversationSummary {
  id: string;
  user: UserSummary;
  lastMessage?: {
    id: string;
    text: string;
    type: MessageType;
    fileName?: string;
    timestamp: string;
    senderId: string;
    username: string;
  };
  lastMessageAt?: string;
  unreadCount: number;
}

export interface RoomSummary {
  roomId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
}
