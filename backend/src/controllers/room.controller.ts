import type { Response } from "express";
import type { AuthRequest } from "../middleware/requireAuth.js";
import { createRoom, getRoom, getUserRooms } from "../services/room.service.js";

export async function createRoomHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, description } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Room name is required" });
      return;
    }

    const room = await createRoom(userId, name, description);
    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
}

export async function getRoomHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      res.status(400).json({ error: "Room ID is required" });
      return;
    }

    const room = await getRoom(roomId as string);
    if (!room) {
      // Return a basic mock for legacy rooms that don't exist in the DB
      res.status(200).json({ roomId, name: roomId, isPublic: true });
      return;
    }

    res.status(200).json(room);
  } catch (error) {
    console.error("Error getting room:", error);
    res.status(500).json({ error: "Failed to get room" });
  }
}

export async function getUserRoomsHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const rooms = await getUserRooms(userId);
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error getting user rooms:", error);
    res.status(500).json({ error: "Failed to get user rooms" });
  }
}
