import mongoose from "mongoose";
import { DirectMessage, type DirectMessageType } from "../models/DirectMessage.js";
import { DirectConversation } from "../models/DirectConversation.js";
import { markConversationRead } from "./direct-conversation.service.js";
import type { IDirectReaction } from "../models/DirectMessage.js";

const HISTORY_LIMIT = 50;

export interface SerializedDirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  username: string;
  message: string;
  type: DirectMessageType;
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  edited?: boolean;
  deleted?: boolean;
  replyTo?: string | SerializedDirectMessage;
  reactions?: IDirectReaction[];
  isE2EE?: boolean;
  e2eeData?: {
    iv: string;
    encryptedKeySender: string;
    encryptedKeyRecipient: string;
  };
}

export async function saveDirectMessage(
  conversationId: string,
  senderId: mongoose.Types.ObjectId | string,
  username: string,
  message: string,
  type: DirectMessageType = "text",
  fileUrl?: string,
  fileName?: string,
  replyTo?: string,
  isE2EE?: boolean,
  e2eeData?: { iv: string; encryptedKeySender: string; encryptedKeyRecipient: string; }
): Promise<SerializedDirectMessage> {
  const payload: any = { conversationId, senderId, username, message, type };
  if (fileUrl) payload.fileUrl = fileUrl;
  if (fileName) payload.fileName = fileName;
  if (replyTo) payload.replyTo = new mongoose.Types.ObjectId(replyTo);
  if (isE2EE) {
    payload.isE2EE = isE2EE;
    payload.e2eeData = e2eeData;
  }

  const doc = await DirectMessage.create(payload);
  await DirectConversation.findByIdAndUpdate(
    conversationId,
    { lastMessage: doc._id, lastMessageAt: doc.timestamp },
    { new: false }
  );
  await markConversationRead(conversationId, senderId.toString(), doc.timestamp);
  return serialize(doc);
}

export async function getDirectHistory(
  conversationId: string,
  before?: Date,
  limit: number = HISTORY_LIMIT
): Promise<SerializedDirectMessage[]> {
  const query: Record<string, unknown> = { conversationId };
  if (before) query["timestamp"] = { $lt: before };

  const docs = await DirectMessage.find(query)
    .populate("replyTo")
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return docs.reverse().map(serialize);
}

export async function editDirectMessage(
  id: string,
  senderId: string,
  newText: string
): Promise<SerializedDirectMessage | null> {
  const doc = await DirectMessage.findOneAndUpdate(
    { _id: id, senderId },
    { message: newText, edited: true },
    { new: true }
  ).populate("replyTo").lean();

  return doc ? serialize(doc) : null;
}

export async function deleteDirectMessage(
  id: string,
  senderId: string
): Promise<SerializedDirectMessage | null> {
  const doc = await DirectMessage.findOneAndUpdate(
    { _id: id, senderId },
    { deleted: true, message: "This message was removed", fileUrl: undefined, fileName: undefined, type: "text" },
    { new: true }
  ).populate("replyTo").lean();

  return doc ? serialize(doc) : null;
}

export async function addDirectReaction(
  id: string,
  userId: mongoose.Types.ObjectId,
  username: string,
  icon: string
): Promise<SerializedDirectMessage | null> {
  const doc = await DirectMessage.findById(id).populate("replyTo");
  if (!doc) return null;

  const existingIndex = doc.reactions?.findIndex(
    r => r.userId.toString() === userId.toString() && r.icon === icon
  );
  if (existingIndex !== undefined && existingIndex >= 0) {
    doc.reactions?.splice(existingIndex, 1);
  } else {
    if (!doc.reactions) doc.reactions = [];
    doc.reactions.push({ icon, userId, username });
  }

  await doc.save();
  return serialize(doc);
}

function serialize(doc: any): SerializedDirectMessage {
  let replyToSerialized: string | SerializedDirectMessage | undefined = undefined;
  if (doc.replyTo) {
    if (typeof doc.replyTo === "string" || doc.replyTo instanceof mongoose.Types.ObjectId) {
      replyToSerialized = doc.replyTo.toString();
    } else {
      replyToSerialized = serialize(doc.replyTo);
    }
  }

  const payload: SerializedDirectMessage = {
    id: doc._id.toString(),
    conversationId: doc.conversationId.toString(),
    senderId: doc.senderId.toString(),
    username: doc.username,
    message: doc.message,
    type: doc.type ?? "text",
    timestamp: doc.timestamp.toISOString(),
    ...(doc.edited ? { edited: doc.edited } : {}),
    ...(doc.deleted ? { deleted: doc.deleted } : {}),
    ...(replyToSerialized ? { replyTo: replyToSerialized } : {}),
    ...(doc.reactions?.length ? { reactions: doc.reactions } : {}),
    ...(doc.fileUrl ? { fileUrl: doc.fileUrl } : {}),
    ...(doc.fileName ? { fileName: doc.fileName } : {}),
    ...(doc.isE2EE ? { isE2EE: doc.isE2EE, e2eeData: doc.e2eeData } : {})
  };

  return payload;
}
