import { Room } from "../models/Room.js";
import { Message } from "../models/Message.js";
import mongoose from "mongoose";

// Generate a random room ID (e.g. 6 chars alphanumeric)
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createRoom(userId: string, name: string, description?: string) {
  let roomId = generateRoomId();
  // Ensure uniqueness
  while (await Room.findOne({ roomId })) {
    roomId = generateRoomId();
  }

  const room = new Room({
    roomId,
    name,
    description,
    createdBy: new mongoose.Types.ObjectId(userId)
  });

  await room.save();
  return room;
}

export async function getRoom(roomId: string) {
  return await Room.findOne({ roomId }).lean();
}

export async function getUserRooms(userId: string) {
  // Find all distinct roomIds the user has sent messages in
  const roomIds = await Message.distinct("roomId", { userId: new mongoose.Types.ObjectId(userId) });
  
  // Also include rooms they created, even if they haven't sent a message yet
  const createdRooms = await Room.find({ createdBy: new mongoose.Types.ObjectId(userId) }).lean();
  const createdRoomIds = createdRooms.map(r => r.roomId);

  const allRoomIds = Array.from(new Set([...roomIds, ...createdRoomIds]));

  // Get details for all these rooms. If a room doesn't exist in the Room collection
  // (e.g. legacy room created before this feature), we can either ignore it or return a mock.
  // We'll return what's in the DB.
  const rooms = await Room.find({ roomId: { $in: allRoomIds } }).lean();
  
  // For legacy rooms without a Room record, let's inject a mock one so the user still sees it
  const existingRoomIds = new Set(rooms.map(r => r.roomId));
  const legacyRoomIds = allRoomIds.filter(id => !existingRoomIds.has(id));

  const legacyRooms = legacyRoomIds.map(id => ({
    roomId: id,
    name: id, // Default name to ID
    createdBy: new mongoose.Types.ObjectId(userId), // mock
    createdAt: new Date(), // mock
    isPublic: true
  }));

  return [...rooms, ...legacyRooms];
}
