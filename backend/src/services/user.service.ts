import { User } from "../models/User.js";
import { comparePassword, hashPassword } from "./auth.service.js";
import { uploadToCloudinary } from "./upload.service.js";

export async function getUserById(userId: string) {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found.");
  return user;
}

export async function updateProfile(
  userId: string,
  data: { username?: string; bio?: string; status?: string; statusMessage?: string }
) {
  const { username, bio, status, statusMessage } = data;

  // Username uniqueness check (only if changing)
  if (username) {
    const existing = await User.findOne({ username, _id: { $ne: userId } });
    if (existing) throw new Error("Username already taken.");
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    {
      ...(username && { username: username.trim() }),
      ...(bio !== undefined && { bio: bio.slice(0, 150) }),
      ...(status && { status }),
      ...(statusMessage !== undefined && { statusMessage: statusMessage.slice(0, 100) }),
    },
    { new: true, select: "-password" }
  );

  if (!updated) throw new Error("User not found.");

  if (username) {
    const trimmedUsername = username.trim();
    
    // Import dynamically to avoid circular dependencies
    const { Message } = await import("../models/Message.js");
    const { DirectMessage } = await import("../models/DirectMessage.js");

    await Message.updateMany({ userId }, { $set: { username: trimmedUsername } });
    await DirectMessage.updateMany({ senderId: userId }, { $set: { username: trimmedUsername } });

    // Update reactions in Message and DirectMessage
    await Message.updateMany(
      { "reactions.userId": userId },
      { $set: { "reactions.$[elem].username": trimmedUsername } },
      { arrayFilters: [{ "elem.userId": userId }] }
    );
    await DirectMessage.updateMany(
      { "reactions.userId": userId },
      { $set: { "reactions.$[elem].username": trimmedUsername } },
      { arrayFilters: [{ "elem.userId": userId }] }
    );
  }

  return updated;
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  const valid = await comparePassword(oldPassword, user.password);
  if (!valid) throw new Error("Current password is incorrect.");

  if (newPassword.length < 4) throw new Error("New password must be at least 4 characters.");

  user.password = await hashPassword(newPassword);
  await user.save();
}

export async function updateAvatar(
  userId: string,
  buffer: Buffer,
  originalName: string,
  mimeType: string
) {
  const result = await uploadToCloudinary(buffer, originalName, mimeType);
  const updated = await User.findByIdAndUpdate(
    userId,
    { avatar: result.url },
    { new: true, select: "-password" }
  );
  if (!updated) throw new Error("User not found.");
  return updated;
}

export async function updateLastSeen(userId: string, status: "online" | "offline") {
  await User.findByIdAndUpdate(userId, { lastSeen: new Date(), status });
}

export async function updatePublicKey(userId: string, publicKey: string) {
  const updated = await User.findByIdAndUpdate(
    userId,
    { publicKey },
    { new: true, select: "-password" }
  );
  if (!updated) throw new Error("User not found.");
  return updated;
}

export async function searchUsers(query: string, excludeUserId: string) {
  const users = await User.find({
    username: { $regex: query, $options: "i" },
    _id: { $ne: excludeUserId },
  })
    .select("_id username avatar status")
    .limit(20);
  return users;
}

export async function saveMessage(userId: string, messageId: string, type: 'room' | 'dm') {
  const updated = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { savedMessages: { messageId, type, addedAt: new Date() } } },
    { new: true, select: "-password" }
  );
  if (!updated) throw new Error("User not found.");
  return updated;
}

export async function unsaveMessage(userId: string, messageId: string) {
  const updated = await User.findByIdAndUpdate(
    userId,
    { $pull: { savedMessages: { messageId } } },
    { new: true, select: "-password" }
  );
  if (!updated) throw new Error("User not found.");
  return updated;
}

export async function getSavedMessages(userId: string) {
  const user = await User.findById(userId).select("savedMessages");
  if (!user) throw new Error("User not found.");

  const { Message } = await import("../models/Message.js");
  const { DirectMessage } = await import("../models/DirectMessage.js");

  const roomMessageIds = user.savedMessages.filter(sm => sm.type === 'room').map(sm => sm.messageId);
  const dmMessageIds = user.savedMessages.filter(sm => sm.type === 'dm').map(sm => sm.messageId);

  const roomMessages = await Message.find({ _id: { $in: roomMessageIds } });
  const dmMessages = await DirectMessage.find({ _id: { $in: dmMessageIds } });

  const allMessages = [...roomMessages, ...dmMessages].map(m => {
    const sm = user.savedMessages.find(s => s.messageId === m.id);
    return {
      ...(m as any).toObject(),
      savedAt: sm?.addedAt
    };
  });

  return allMessages.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
}
