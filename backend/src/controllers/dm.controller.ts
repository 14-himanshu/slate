import type { Response } from "express";
import type { AuthRequest } from "../middleware/requireAuth.js";
import { User } from "../models/User.js";
import {
  ensureConversationAccess,
  findOrCreateDirectConversation,
  listDirectConversations,
  markConversationRead
} from "../services/direct-conversation.service.js";
import { getDirectHistory } from "../services/direct-message.service.js";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSingleParam(value: unknown): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return undefined;
}

export async function searchUsers(req: AuthRequest, res: Response): Promise<void> {
  const query = getSingleParam(req.query["query"])?.trim();
  if (!query) {
    res.json({ users: [] });
    return;
  }

  const regex = new RegExp(escapeRegExp(query), "i");
  const users = await User.find({ username: regex, _id: { $ne: req.user.userId } })
    .select("_id username avatar status lastSeen publicKey")
    .limit(10)
    .lean();

  res.json({
    users: users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      status: user.status,
      lastSeen: user.lastSeen ? new Date(user.lastSeen).toISOString() : undefined,
      publicKey: user.publicKey
    }))
  });
}

export async function listConversations(req: AuthRequest, res: Response): Promise<void> {
  const conversations = await listDirectConversations(req.user.userId);
  res.json({ conversations });
}

export async function createConversation(req: AuthRequest, res: Response): Promise<void> {
  const otherUserId = req.body?.["userId"];
  if (!otherUserId) {
    res.status(400).json({ error: "userId is required." });
    return;
  }

  const conversation = await findOrCreateDirectConversation(req.user.userId, otherUserId);
  const conversations = await listDirectConversations(req.user.userId);
  const summary = conversations.find(c => c.id === conversation._id.toString());

  res.status(201).json({ conversation: summary ?? { id: conversation._id.toString(), unreadCount: 0 } });
}

export async function getConversationMessages(req: AuthRequest, res: Response): Promise<void> {
  const conversationId = getSingleParam(req.params["id"]);
  if (!conversationId) {
    res.status(400).json({ error: "conversation id is required." });
    return;
  }

  const canAccess = await ensureConversationAccess(conversationId, req.user.userId);
  if (!canAccess) {
    res.status(403).json({ error: "You do not have access to this conversation." });
    return;
  }

  const beforeParam = getSingleParam(req.query["before"]);
  const limitParam = getSingleParam(req.query["limit"]);
  const before = beforeParam ? new Date(beforeParam) : undefined;
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 100) : 50;

  const messages = await getDirectHistory(conversationId, before, limit);
  res.json({ messages });
}

export async function markConversationAsRead(req: AuthRequest, res: Response): Promise<void> {
  const conversationId = getSingleParam(req.params["id"]);
  if (!conversationId) {
    res.status(400).json({ error: "conversation id is required." });
    return;
  }

  const canAccess = await ensureConversationAccess(conversationId, req.user.userId);
  if (!canAccess) {
    res.status(403).json({ error: "You do not have access to this conversation." });
    return;
  }

  await markConversationRead(conversationId, req.user.userId);
  res.json({ ok: true });
}

export async function hideConversation(req: AuthRequest, res: Response): Promise<void> {
  const conversationId = getSingleParam(req.params["id"]);
  if (!conversationId) {
    res.status(400).json({ error: "conversation id is required." });
    return;
  }

  const canAccess = await ensureConversationAccess(conversationId, req.user.userId);
  if (!canAccess) {
    res.status(403).json({ error: "You do not have access to this conversation." });
    return;
  }

  const { hideDirectConversation } = await import("../services/direct-conversation.service.js");
  await hideDirectConversation(conversationId, req.user.userId);
  res.json({ ok: true });
}
