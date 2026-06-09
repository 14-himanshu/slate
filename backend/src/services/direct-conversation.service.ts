import mongoose from "mongoose";
import { DirectConversation } from "../models/DirectConversation.js";
import { DirectConversationMember } from "../models/DirectConversationMember.js";
import { DirectMessage } from "../models/DirectMessage.js";
import { User } from "../models/User.js";
import type { IDirectConversation } from "../models/DirectConversation.js";
import type { IDirectMessage } from "../models/DirectMessage.js";

export interface DirectConversationUser {
  id: string;
  username: string;
  avatar?: string;
  status?: "online" | "offline" | "busy" | "away";
  lastSeen?: string;
}

export interface DirectConversationSummary {
  id: string;
  user: DirectConversationUser;
  lastMessage?: {
    id: string;
    text: string;
    type: "text" | "image" | "file" | "audio";
    fileName?: string;
    timestamp: string;
    senderId: string;
    username: string;
  };
  lastMessageAt?: string;
  unreadCount: number;
}

function getParticipantPair(userId: string, otherUserId: string): string {
  return [userId, otherUserId].sort().join(":");
}

function isDirectMessage(value: unknown): value is IDirectMessage {
  if (!value || typeof value !== "object") return false;
  return "message" in value && "senderId" in value && "timestamp" in value;
}

export async function findOrCreateDirectConversation(
  userId: string,
  otherUserId: string
): Promise<IDirectConversation> {
  if (userId === otherUserId) {
    throw new Error("Cannot start a conversation with yourself.");
  }

  const participantPair = getParticipantPair(userId, otherUserId);
  let conversation = await DirectConversation.findOne({ participantPair });
  if (conversation) return conversation;

  conversation = await DirectConversation.create({
    participants: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(otherUserId)],
    participantPair
  });

  const now = new Date();
  await DirectConversationMember.findOneAndUpdate(
    { conversationId: conversation._id, userId: new mongoose.Types.ObjectId(userId) },
    { $set: { visible: true }, $setOnInsert: { lastReadAt: now } },
    { upsert: true }
  );
  await DirectConversationMember.findOneAndUpdate(
    { conversationId: conversation._id, userId: new mongoose.Types.ObjectId(otherUserId) },
    { $set: { visible: true }, $setOnInsert: { lastReadAt: now } },
    { upsert: true }
  );

  return conversation;
}

export async function ensureConversationAccess(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const exists = await DirectConversation.exists({
    _id: conversationId,
    participants: new mongoose.Types.ObjectId(userId)
  });
  return Boolean(exists);
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
  at: Date = new Date()
): Promise<void> {
  await DirectConversationMember.findOneAndUpdate(
    { conversationId, userId },
    { lastReadAt: at },
    { upsert: true }
  );
}

export async function hideDirectConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  await DirectConversationMember.findOneAndUpdate(
    { conversationId, userId },
    { visible: false }
  );
}

export async function listDirectConversations(userId: string): Promise<DirectConversationSummary[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  const memberDocs = await DirectConversationMember.find({
    userId: userObjectId,
    visible: true
  }).lean();
  
  if (!memberDocs.length) return [];
  
  const conversationIds = memberDocs.map(d => d.conversationId);

  const conversations = await DirectConversation.find({ _id: { $in: conversationIds } })
    .populate("lastMessage")
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  if (!conversations.length) return [];

  const lastReadMap = new Map<string, Date>();
  for (const doc of memberDocs) {
    lastReadMap.set(doc.conversationId.toString(), doc.lastReadAt ?? new Date(0));
  }

  const otherUserIds = conversations.map(conv => {
    const participant = (conv.participants as mongoose.Types.ObjectId[]).find(
      p => p.toString() !== userId
    );
    return participant?.toString();
  }).filter(Boolean) as string[];

  const users = await User.find({ _id: { $in: otherUserIds } })
    .select("_id username avatar status lastSeen")
    .lean();
  const userMap = new Map(users.map(user => [user._id.toString(), user]));

  const summaries: DirectConversationSummary[] = [];

  for (const conv of conversations) {
    const otherUserId = (conv.participants as mongoose.Types.ObjectId[])
      .find(p => p.toString() !== userId)
      ?.toString();
    if (!otherUserId) continue;

    const otherUser = userMap.get(otherUserId);
    if (!otherUser) continue;

    const lastReadAt = lastReadMap.get(conv._id.toString()) ?? new Date(0);
    const unreadCount = await DirectMessage.countDocuments({
      conversationId: conv._id,
      timestamp: { $gt: lastReadAt },
      senderId: { $ne: userObjectId }
    });

    const lastMessage = isDirectMessage(conv.lastMessage) ? conv.lastMessage : null;
    const userPayload: DirectConversationUser = {
      id: otherUser._id.toString(),
      username: otherUser.username,
      status: otherUser.status,
      ...(otherUser.avatar ? { avatar: otherUser.avatar } : {}),
      ...(otherUser.lastSeen ? { lastSeen: new Date(otherUser.lastSeen).toISOString() } : {}),
    };

    const lastMessagePayload = lastMessage ? {
      id: lastMessage._id.toString(),
      text: lastMessage.message,
      type: lastMessage.type,
      timestamp: lastMessage.timestamp.toISOString(),
      senderId: lastMessage.senderId.toString(),
      username: lastMessage.username,
      ...(lastMessage.fileName ? { fileName: lastMessage.fileName } : {})
    } : null;

    summaries.push({
      id: conv._id.toString(),
      user: userPayload,
      ...(lastMessagePayload ? { lastMessage: lastMessagePayload } : {}),
      ...(conv.lastMessageAt ? { lastMessageAt: conv.lastMessageAt.toISOString() } : {}),
      unreadCount
    });
  }

  return summaries;
}
