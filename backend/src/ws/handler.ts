import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { authenticateWsRequest } from "../middleware/auth.middleware.js";
import { saveMessage, getRoomHistory, editMessage, deleteMessage, addReaction } from "../services/message.service.js";

interface ConnectedUser {
  socket: WebSocket;
  userId: string;
  username: string;
  /** All rooms this socket is currently subscribed to */
  rooms: Set<string>;
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

    const user: ConnectedUser = { socket, userId, username, rooms: new Set() };
    connectedUsers.push(user);

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

      // ── LEAVE ROOM ─────────────────────────────────────────
      if (parsed.type === "leaveRoom") {
        const roomId = parsed.payload?.["roomId"]?.trim().toUpperCase();
        if (!roomId || !user.rooms.has(roomId)) return;

        user.rooms.delete(roomId);
        console.log(`👋 ${username} left room ${roomId}`);
        broadcastUserCount(roomId);
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

        if (!roomId || !user.rooms.has(roomId)) {
          send(socket, { type: "error", payload: { message: "Join the room first." } });
          return;
        }
        // Must have text OR a file
        if (!message && !fileUrl) return;

        try {
          const savedMessage = await saveMessage(roomId, userId, username, message || fileName || "file", messageType, fileUrl, fileName, replyTo);
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
    });

    socket.on("error", (err) => {
      console.error(`WS error for ${username}:`, err.message);
    });
  });

  console.log("✅ WebSocket server attached to HTTP server");
}
