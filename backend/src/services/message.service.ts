import { Message } from "../models/Message.js";
import type { MessageType } from "../models/Message.js";
import mongoose from "mongoose";

const HISTORY_LIMIT = 50;

import type { IReaction } from "../models/Message.js";

export interface SerializedMessage {
  id: string;
  roomId: string;
  username: string;
  message: string;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  edited?: boolean;
  deleted?: boolean;
  replyTo?: string | SerializedMessage;
  reactions?: IReaction[];
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

/** Persist a chat message (text or file) to the database */
export async function saveMessage(
  roomId: string,
  userId: mongoose.Types.ObjectId | string,
  username: string,
  message: string,
  type: MessageType = "text",
  fileUrl?: string,
  fileName?: string,
  replyTo?: string,
  linkPreview?: { title: string | null; description: string | null; image: string | null; url: string; },
  threadId?: string
): Promise<SerializedMessage> {
  const payload: any = { roomId, userId, username, message, type };
  if (fileUrl) payload.fileUrl = fileUrl;
  if (fileName) payload.fileName = fileName;
  if (replyTo) payload.replyTo = new mongoose.Types.ObjectId(replyTo);
  if (linkPreview) payload.linkPreview = linkPreview;
  if (threadId) {
    payload.threadId = new mongoose.Types.ObjectId(threadId);
    await Message.findByIdAndUpdate(threadId, {
      $inc: { threadReplyCount: 1 },
      $set: { lastThreadReplyAt: new Date() }
    });
  }

  const doc = await Message.create(payload);
  return serialize(doc);
}

export async function getRoomHistory(roomId: string, before?: Date, limit: number = HISTORY_LIMIT): Promise<SerializedMessage[]> {
  const query: Record<string, unknown> = { roomId, threadId: { $exists: false } };
  if (before) query["timestamp"] = { $lt: before };

  const docs = await Message.find(query)
    .populate("replyTo")
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
  return docs.reverse().map(serialize);
}

export async function getThreadHistory(threadId: string, before?: Date, limit: number = HISTORY_LIMIT): Promise<SerializedMessage[]> {
  const query: Record<string, unknown> = { threadId };
  if (before) query["timestamp"] = { $lt: before };

  const docs = await Message.find(query)
    .populate("replyTo")
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
  return docs.reverse().map(serialize);
}

export async function editMessage(id: string, userId: string, newText: string): Promise<SerializedMessage | null> {
  const doc = await Message.findOneAndUpdate(
    { _id: id, userId },
    { message: newText, edited: true },
    { new: true }
  ).populate("replyTo").lean();
  return doc ? serialize(doc) : null;
}

export async function deleteMessage(id: string, userId: string): Promise<SerializedMessage | null> {
  const doc = await Message.findOneAndUpdate(
    { _id: id, userId },
    { deleted: true, message: "This message was removed", fileUrl: undefined, fileName: undefined, type: "text" },
    { new: true }
  ).populate("replyTo").lean();
  return doc ? serialize(doc) : null;
}

export async function addReaction(id: string, userId: mongoose.Types.ObjectId, username: string, icon: string): Promise<SerializedMessage | null> {
  const doc = await Message.findById(id).populate("replyTo");
  if (!doc) return null;
  // If user already reacted with same icon, remove it
  const existingIndex = doc.reactions?.findIndex(r => r.userId.toString() === userId.toString() && r.icon === icon);
  if (existingIndex !== undefined && existingIndex >= 0) {
    doc.reactions?.splice(existingIndex, 1);
  } else {
    if (!doc.reactions) doc.reactions = [];
    doc.reactions.push({ icon, userId, username });
  }
  await doc.save();
  return serialize(doc);
}

function serialize(doc: any): SerializedMessage {
  let replyToSerialized: string | SerializedMessage | undefined = undefined;
  if (doc.replyTo) {
    if (typeof doc.replyTo === "string" || doc.replyTo instanceof mongoose.Types.ObjectId) {
      replyToSerialized = doc.replyTo.toString();
    } else {
      replyToSerialized = serialize(doc.replyTo);
    }
  }

  const payload: SerializedMessage = {
    id:        doc._id.toString(),
    roomId:    doc.roomId,
    username:  doc.username,
    message:   doc.message,
    type:      doc.type ?? "text",
    timestamp: doc.timestamp.toISOString(),
    ...(doc.edited ? { edited: doc.edited } : {}),
    ...(doc.deleted ? { deleted: doc.deleted } : {}),
    ...(replyToSerialized ? { replyTo: replyToSerialized } : {}),
    ...(doc.reactions?.length ? { reactions: doc.reactions } : {}),
    ...(doc.fileUrl  ? { fileUrl:  doc.fileUrl }  : {}),
    ...(doc.fileName ? { fileName: doc.fileName } : {}),
    ...(doc.linkPreview ? { linkPreview: doc.linkPreview } : {}),
    ...(doc.threadId ? { threadId: doc.threadId.toString() } : {}),
    ...(doc.threadReplyCount !== undefined ? { threadReplyCount: doc.threadReplyCount } : {}),
    ...(doc.lastThreadReplyAt ? { lastThreadReplyAt: doc.lastThreadReplyAt.toISOString() } : {}),
  };

  return payload;
}
