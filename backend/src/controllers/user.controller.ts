import type { Response } from "express";
import type { AuthRequest } from "../middleware/requireAuth.js";
import {
  getUserById,
  updateProfile,
  changePassword,
  updateAvatar,
  searchUsers,
  saveMessage,
  unsaveMessage,
  getSavedMessages,
} from "../services/user.service.js";

/** GET /api/user/me */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await getUserById(req.user.userId);
    res.json({ user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch profile.";
    res.status(404).json({ error: msg });
  }
}

/** PUT /api/user/update */
export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username, bio, status, statusMessage } = req.body as {
      username?: string;
      bio?: string;
      status?: string;
      statusMessage?: string;
    };

    const VALID_STATUSES = ["online", "offline", "busy", "away"];

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length < 3) {
        res.status(400).json({ error: "Username must be at least 3 characters." });
        return;
      }
      if (username.trim().length > 30) {
        res.status(400).json({ error: "Username must be at most 30 characters." });
        return;
      }
    }

    if (bio !== undefined && bio.length > 150) {
      res.status(400).json({ error: "Bio must be 150 characters or fewer." });
      return;
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}.` });
      return;
    }

    if (statusMessage !== undefined && statusMessage.length > 100) {
      res.status(400).json({ error: "Status message must be 100 characters or fewer." });
      return;
    }

    const updateData: { username?: string; bio?: string; status?: string; statusMessage?: string } = {};
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (status !== undefined) updateData.status = status;
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage;

    const user = await updateProfile(req.user.userId, updateData);
    res.json({ user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update profile.";
    res.status(409).json({ error: msg });
  }
}

/** POST /api/user/avatar */
export async function uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided." });
    return;
  }
  try {
    const user = await updateAvatar(
      req.user.userId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.json({ user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Avatar upload failed.";
    res.status(500).json({ error: msg });
  }
}

/** POST /api/user/change-password */
export async function changeUserPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { oldPassword, newPassword } = req.body as {
      oldPassword?: string;
      newPassword?: string;
    };

    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: "Both oldPassword and newPassword are required." });
      return;
    }

    await changePassword(req.user.userId, oldPassword, newPassword);
    res.json({ message: "Password changed successfully." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Password change failed.";
    res.status(400).json({ error: msg });
  }
}

/** PUT /api/user/me/public-key */
export async function updateUserPublicKey(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { publicKey } = req.body as { publicKey?: string };
    if (!publicKey) {
      res.status(400).json({ error: "publicKey is required." });
      return;
    }
    const { updatePublicKey } = await import("../services/user.service.js");
    const user = await updatePublicKey(req.user.userId, publicKey);
    res.json({ user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update public key.";
    res.status(500).json({ error: msg });
  }
}

/** GET /api/user/search?q=... */
export async function searchUsersHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string ?? "").trim();
    if (!q || q.length < 1) {
      res.json({ users: [] });
      return;
    }
    const users = await searchUsers(q, req.user.userId);
    res.json({
      users: users.map(u => ({
        id: u._id.toString(),
        username: u.username,
        avatar: u.avatar,
        status: u.status,
      }))
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Search failed.";
    res.status(500).json({ error: msg });
  }
}

/** POST /api/user/bookmarks */
export async function bookmarkMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { messageId, type } = req.body as { messageId: string; type: 'room' | 'dm' };
    if (!messageId || !type) {
      res.status(400).json({ error: "messageId and type are required." });
      return;
    }
    await saveMessage(req.user.userId, messageId, type);
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save message.";
    res.status(500).json({ error: msg });
  }
}

/** DELETE /api/user/bookmarks/:messageId */
export async function removeBookmark(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { messageId } = req.params as { messageId: string };
    await unsaveMessage(req.user.userId, messageId);
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to unsave message.";
    res.status(500).json({ error: msg });
  }
}

/** GET /api/user/bookmarks */
export async function fetchBookmarks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const messages = await getSavedMessages(req.user.userId);
    res.json({ messages: messages.map(m => ({
      ...m,
      id: m._id ? m._id.toString() : (m as any).id,
    })) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch saved messages.";
    res.status(500).json({ error: msg });
  }
}
