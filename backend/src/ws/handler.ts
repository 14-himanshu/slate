import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { authenticateWsRequest } from "../middleware/auth.middleware.js";
import { saveMessage, getRoomHistory, editMessage, deleteMessage, addReaction } from "../services/message.service.js";
import {
  saveDirectMessage,
  getDirectHistory,
  editDirectMessage,
  deleteDirectMessage,
  addDirectReaction
} from "../services/direct-message.service.js";
import {
  ensureConversationAccess,
  markConversationRead
} from "../services/direct-conversation.service.js";
import { updateLastSeen } from "../services/user.service.js";
import { DirectConversation } from "../models/DirectConversation.js";

interface ConnectedUser {
  socket: WebSocket;
  userId: string;
  username: string;
  /** All rooms this socket is currently subscribed to */
  rooms: Set<string>;
  /** All direct conversations this socket is subscribed to */
  conversations: Set<string>;
}

let connectedUsers: ConnectedUser[] = [];

function send(socket: WebSocket, data: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function getRoomUserCount(roomId: string): number {
  return connectedUsers.filter((u) => u.rooms.has(roomId)).length;
}

/** Broadcast to every socket subscribed to roomId */
function broadcastToRoom(roomId: string, data: object): void {
  for (const user of connectedUsers) {
    if (user.rooms.has(roomId)) {
      send(user.socket, data);
    }
  }
}

async function broadcastToConversation(conversationId: string, data: object): Promise<void> {
  try {
    const conversation = await DirectConversation.findById(conversationId);
    if (!conversation) return;
    const participantIds = conversation.participants.map(p => p.toString());
    for (const user of connectedUsers) {
      if (participantIds.includes(user.userId)) {
        send(user.socket, data);
      }
    }
  } catch (err) {
    console.error("Failed to broadcast to conversation:", err);
  }
}

function broadcastPresence(userId: string, status: "online" | "offline"): void {
  const lastSeen = new Date().toISOString();
  for (const user of connectedUsers) {
    send(user.socket, { type: "presence", payload: { userId, status, lastSeen } });
  }
}

function broadcastUserCount(roomId: string): void {
  const users = connectedUsers.filter(u => u.rooms.has(roomId)).map(u => u.username);
  // Remove duplicates just in case one user has multiple connections
  const uniqueUsers = Array.from(new Set(users));
  const count = uniqueUsers.length;
  broadcastToRoom(roomId, { type: "roomUsers", payload: { roomId, count, users: uniqueUsers } });
}

export function setupWebSocketServer(httpServer: Server): void {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (socket: WebSocket, request: IncomingMessage) => {
    // ── Authenticate ───────────────────────────────────────────
    let userId: string;
    let username: string;

    try {
      const payload = authenticateWsRequest(request);
      userId = payload.userId;
      username = payload.username;
    } catch (err) {
      console.warn("WS rejected — invalid token:", (err as Error).message);
      socket.close(1008, "Unauthorized");
      return;
    }

    console.log(`🔌 ${username} connected`);

    const user: ConnectedUser = { socket, userId, username, rooms: new Set(), conversations: new Set() };
    connectedUsers.push(user);
    void updateLastSeen(userId, "online").then(() => broadcastPresence(userId, "online")).catch(() => undefined);

    // ── Message handler ────────────────────────────────────────
    socket.on("message", async (raw) => {
      let parsed: { type: string; payload: Record<string, string> };

      try {
        parsed = JSON.parse(raw.toString()) as typeof parsed;
      } catch {
        send(socket, { type: "error", payload: { message: "Invalid JSON." } });
        return;
      }

      // ── JOIN ROOM ──────────────────────────────────────────
      if (parsed.type === "joinRoom") {
        const roomId = parsed.payload?.["roomId"]?.trim().toUpperCase();
        if (!roomId) {
          send(socket, { type: "error", payload: { message: "roomId is required." } });
          return;
        }

        // Always send history (handles re-joins on reconnect)
        if (!user.rooms.has(roomId)) {
          user.rooms.add(roomId);
          console.log(`👥 ${username} joined room ${roomId} (in ${user.rooms.size} room(s))`);
        }

        try {
          const history = await getRoomHistory(roomId);
          send(socket, { type: "history", payload: { roomId, messages: history } });
        } catch (err) {
          console.error("Failed to fetch history:", err);
        }

        broadcastUserCount(roomId);
        return;
      }

      // ── LOAD MORE ROOM HISTORY ─────────────────────────────
      if (parsed.type === "loadMoreRoomHistory") {
        const roomId = parsed.payload?.["roomId"]?.trim().toUpperCase();
        const beforeString = parsed.payload?.["before"];
        
        if (!roomId || !user.rooms.has(roomId) || !beforeString) return;

        try {
          const beforeDate = new Date(beforeString);
          const history = await getRoomHistory(roomId, beforeDate);
          send(socket, { type: "historyLoaded", payload: { roomId, messages: history } });
        } catch (err) {
          console.error("Failed to load more room history:", err);
        }
        return;
      }

      // ── JOIN DIRECT CONVERSATION ───────────────────────────
      if (parsed.type === "joinDm") {
        const conversationId = parsed.payload?.["conversationId"];
        const includeHistory = parsed.payload?.["includeHistory"] !== "false";

        if (!conversationId) {
          send(socket, { type: "error", payload: { message: "conversationId is required." } });
          return;
        }

        const canAccess = await ensureConversationAccess(conversationId, userId);
        if (!canAccess) {
          send(socket, { type: "error", payload: { message: "Not authorized for this conversation." } });
          return;
        }

        if (!user.conversations.has(conversationId)) {
          user.conversations.add(conversationId);
          console.log(`💬 ${username} joined DM ${conversationId}`);
        }

        if (includeHistory) {
          try {
            const history = await getDirectHistory(conversationId);
            send(socket, { type: "dmHistory", payload: { conversationId, messages: history } });
          } catch (err) {
            console.error("Failed to fetch DM history:", err);
          }
        }
        return;
      }

      // ── LOAD MORE DM HISTORY ─────────────────────────────
      if (parsed.type === "loadMoreDmHistory") {
        const conversationId = parsed.payload?.["conversationId"];
        const beforeString = parsed.payload?.["before"];

        if (!conversationId || !user.conversations.has(conversationId) || !beforeString) return;

        try {
          const beforeDate = new Date(beforeString);
          const history = await getDirectHistory(conversationId, beforeDate);
          send(socket, { type: "dmHistoryLoaded", payload: { conversationId, messages: history } });
        } catch (err) {
          console.error("Failed to load more DM history:", err);
        }
        return;
      }

      // ── LEAVE DIRECT CONVERSATION ───────────────────────────
      if (parsed.type === "leaveDm") {
        const conversationId = parsed.payload?.["conversationId"];
        if (!conversationId || !user.conversations.has(conversationId)) return;
        user.conversations.delete(conversationId);
        console.log(`👋 ${username} left DM ${conversationId}`);
        return;
      }

      // ── LEAVE ROOM ─────────────────────────────────────────
      if (parsed.type === "leaveRoom") {
        const roomId = parsed.payload?.["roomId"]?.trim().toUpperCase();
        if (!roomId || !user.rooms.has(roomId)) return;

        user.rooms.delete(roomId);
        console.log(`👋 ${username} left room ${roomId}`);
        broadcastUserCount(roomId);
        return;
      }

      // ── DIRECT MESSAGE ─────────────────────────────────────
      if (parsed.type === "dmMessage") {
        const conversationId = parsed.payload?.["conversationId"];
        const message = parsed.payload?.["message"]?.trim() ?? "";
        const messageType = (parsed.payload?.["messageType"] as "text" | "image" | "file") ?? "text";
        const fileUrl = parsed.payload?.["fileUrl"];
        const fileName = parsed.payload?.["fileName"];
        const replyTo = parsed.payload?.["replyTo"];
        const isE2EE = parsed.payload?.["isE2EE"] === "true";
        const e2eeDataRaw = parsed.payload?.["e2eeData"];
        let e2eeData: { iv: string; encryptedKeySender: string; encryptedKeyRecipient: string; } | undefined;

        if (isE2EE && e2eeDataRaw) {
          try {
            e2eeData = typeof e2eeDataRaw === 'string' ? JSON.parse(e2eeDataRaw) : e2eeDataRaw;
          } catch (e) {
            console.error("Invalid e2eeData");
          }
        }

        if (!conversationId || !user.conversations.has(conversationId)) {
          send(socket, { type: "error", payload: { message: "Join the conversation first." } });
          return;
        }

        if (!message && !fileUrl) return;

        const canAccess = await ensureConversationAccess(conversationId, userId);
        if (!canAccess) {
          send(socket, { type: "error", payload: { message: "Not authorized for this conversation." } });
          return;
        }

        try {
          const savedMessage = await saveDirectMessage(
            conversationId,
            userId,
            username,
            message || fileName || "file",
            messageType,
            fileUrl,
            fileName,
            replyTo,
            isE2EE,
            e2eeData

          );
          broadcastToConversation(conversationId, { type: "dmMessage", payload: savedMessage });
        } catch (err) {
          console.error("Failed to save DM:", err);
          send(socket, { type: "error", payload: { message: "Failed to send direct message." } });
        }
        return;
      }

      // ── EDIT DIRECT MESSAGE ────────────────────────────────
      if (parsed.type === "editDmMessage") {
        const conversationId = parsed.payload?.["conversationId"];
        const msgId = parsed.payload["messageId"];
        const newText = parsed.payload["message"]?.trim();

        if (conversationId && user.conversations.has(conversationId) && msgId && newText) {
          try {
            const updated = await editDirectMessage(msgId, userId, newText);
            if (updated) {
              broadcastToConversation(conversationId, { type: "dmMessageUpdated", payload: updated });
            }
          } catch (err) {
            console.error("Failed to edit DM:", err);
          }
        }
        return;
      }

      // ── DELETE DIRECT MESSAGE ──────────────────────────────
      if (parsed.type === "deleteDmMessage") {
        const conversationId = parsed.payload?.["conversationId"];
        const msgId = parsed.payload["messageId"];

        if (conversationId && user.conversations.has(conversationId) && msgId) {
          try {
            const updated = await deleteDirectMessage(msgId, userId);
            if (updated) {
              broadcastToConversation(conversationId, { type: "dmMessageUpdated", payload: updated });
            }
          } catch (err) {
            console.error("Failed to delete DM:", err);
          }
        }
        return;
      }

      // ── REACT DIRECT MESSAGE ───────────────────────────────
      if (parsed.type === "reactDmMessage") {
        const conversationId = parsed.payload?.["conversationId"];
        const msgId = parsed.payload["messageId"];
        const icon = parsed.payload["icon"];

        if (conversationId && user.conversations.has(conversationId) && msgId && icon) {
          try {
            const mongoose = (await import("mongoose")).default;
            const updated = await addDirectReaction(
              msgId,
              new mongoose.Types.ObjectId(userId),
              username,
              icon
            );
            if (updated) {
              broadcastToConversation(conversationId, { type: "dmMessageUpdated", payload: updated });
            }
          } catch (err) {
            console.error("Failed to react to DM:", err);
          }
        }
        return;
      }

      // ── DM TYPING ───────────────────────────────────────────
      if (parsed.type === "dmTyping") {
        const conversationId = parsed.payload?.["conversationId"];
        const isTyping = parsed.payload["isTyping"] === "true";
        if (conversationId && user.conversations.has(conversationId)) {
          broadcastToConversation(conversationId, { type: "dmTyping", payload: { conversationId, username, isTyping } });
        }
        return;
      }

      // ── WEBRTC SIGNALING ────────────────────────────────────
      if (parsed.type === "webrtc_signal") {
        const conversationId = parsed.payload?.["conversationId"];
        const signalType = parsed.payload?.["signalType"];
        const data = parsed.payload?.["data"];
        if (conversationId && user.conversations.has(conversationId)) {
          broadcastToConversation(conversationId, { 
            type: "webrtc_signal", 
            payload: { conversationId, senderId: userId, senderUsername: username, signalType, data } 
          });
        }
        return;
      }

      // ── DM READ ─────────────────────────────────────────────
      if (parsed.type === "dmRead") {
        const conversationId = parsed.payload?.["conversationId"];
        if (conversationId && user.conversations.has(conversationId)) {
          await markConversationRead(conversationId, userId);
          broadcastToConversation(conversationId, { type: "dmRead", payload: { conversationId, userId } });
        }
        return;
      }

      // ── CHAT ───────────────────────────────────────────────
      if (parsed.type === "chat") {
        const roomId      = parsed.payload?.["roomId"]?.trim().toUpperCase();
        const message     = parsed.payload?.["message"]?.trim() ?? "";
        const messageType = (parsed.payload?.["messageType"] as "text" | "image" | "file") ?? "text";
        const fileUrl     = parsed.payload?.["fileUrl"];
        const fileName    = parsed.payload?.["fileName"];
        const replyTo     = parsed.payload?.["replyTo"];
        const linkPreviewRaw = parsed.payload?.["linkPreview"];
        let linkPreview: { title: string | null; description: string | null; image: string | null; url: string; } | undefined;

        if (linkPreviewRaw) {
          try {
            linkPreview = typeof linkPreviewRaw === 'string' ? JSON.parse(linkPreviewRaw) : linkPreviewRaw;
            console.log("Parsed Link Preview:", linkPreview);
          } catch (e) {
            console.error("Invalid linkPreview", e);
          }
        } else {
          console.log("No linkPreview received in payload");
        }

        if (!roomId || !user.rooms.has(roomId)) {
          send(socket, { type: "error", payload: { message: "Join the room first." } });
          return;
        }

        // Must have text OR a file
        if (!message && !fileUrl) return;

        try {
          const savedMessage = await saveMessage(roomId, userId, username, message || fileName || "file", messageType, fileUrl, fileName, replyTo, linkPreview);
          // Broadcast the fully populated message
          broadcastToRoom(roomId, {
            type:    "chat",
            payload: savedMessage,
          });
        } catch (err) {
          console.error("Failed to save message:", err);
          send(socket, { type: "error", payload: { message: "Failed to send message." } });
        }
        return;
      }

      // ── EDIT MESSAGE ────────────────────────────────────────
      if (parsed.type === "editMessage") {
        const roomId  = parsed.payload["roomId"]?.trim().toUpperCase();
        const msgId   = parsed.payload["messageId"];
        const newText = parsed.payload["message"]?.trim();

        if (roomId && user.rooms.has(roomId) && msgId && newText) {
          try {
            const updated = await editMessage(msgId, userId, newText);
            if (updated) {
              broadcastToRoom(roomId, { type: "messageUpdated", payload: updated });
            }
          } catch (err) {
            console.error("Failed to edit message:", err);
          }
        }
        return;
      }

      // ── DELETE MESSAGE ──────────────────────────────────────
      if (parsed.type === "deleteMessage") {
        const roomId = parsed.payload?.["roomId"]?.trim().toUpperCase();
        const msgId  = parsed.payload["messageId"];

        if (roomId && user.rooms.has(roomId) && msgId) {
          try {
            const updated = await deleteMessage(msgId, userId);
            if (updated) {
              broadcastToRoom(roomId, { type: "messageUpdated", payload: updated });
            }
          } catch (err) {
            console.error("Failed to delete message:", err);
          }
        }
        return;
      }

      // ── REACT MESSAGE ───────────────────────────────────────
      if (parsed.type === "reactMessage") {
        const roomId = parsed.payload?.["roomId"]?.trim().toUpperCase();
        const msgId  = parsed.payload["messageId"];
        const icon   = parsed.payload["icon"];

        if (roomId && user.rooms.has(roomId) && msgId && icon) {
          try {
            // Need ObjectId conversion
            const mongoose = (await import("mongoose")).default;
            const updated = await addReaction(msgId, new mongoose.Types.ObjectId(userId), username, icon);
            if (updated) {
              broadcastToRoom(roomId, { type: "messageUpdated", payload: updated });
            }
          } catch (err) {
            console.error("Failed to react to message:", err);
          }
        }
        return;
      }

      // ── TYPING ─────────────────────────────────────────────
      if (parsed.type === "typing") {
        const roomId = parsed.payload?.["roomId"]?.trim().toUpperCase();
        const isTyping = parsed.payload["isTyping"] === "true";
        if (roomId && user.rooms.has(roomId)) {
          broadcastToRoom(roomId, { type: "typing", payload: { roomId, username, isTyping } });
        }
        return;
      }


      send(socket, { type: "error", payload: { message: "Unknown message type." } });
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on("close", () => {
      const rooms = [...user.rooms];
      connectedUsers = connectedUsers.filter((u) => u.socket !== socket);
      console.log(`🔌 ${username} disconnected (was in: ${rooms.join(", ") || "none"})`);
      for (const roomId of rooms) broadcastUserCount(roomId);
      void updateLastSeen(userId, "offline").then(() => broadcastPresence(userId, "offline")).catch(() => undefined);
    });

    socket.on("error", (err) => {
      console.error(`WS error for ${username}:`, err.message);
    });
  });

  console.log("✅ WebSocket server attached to HTTP server");
}
