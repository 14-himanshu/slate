import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getMe,
  updateUser,
  uploadAvatar,
  changeUserPassword,
  updateUserPublicKey,
  searchUsersHandler,
  bookmarkMessage,
  removeBookmark,
  fetchBookmarks,
} from "../controllers/user.controller.js";
import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/requireAuth.js";

const router = Router();

// Avatar upload — images only, 5 MB max
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed for avatars."));
  },
});

// Helper to cast Request → AuthRequest for typed controllers
type AuthHandler = (req: AuthRequest, res: Response) => Promise<void>;
function wrap(fn: AuthHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthRequest, res).catch(next);
  };
}

// ── Routes ─────────────────────────────────────────────────────
router.get("/me",              requireAuth, wrap(getMe));
router.put("/update",          requireAuth, wrap(updateUser));
router.post("/avatar",         requireAuth, avatarUpload.single("avatar"), wrap(uploadAvatar));
router.post("/change-password",requireAuth, wrap(changeUserPassword));
router.put("/me/public-key",   requireAuth, wrap(updateUserPublicKey));
router.put("/public-key",      requireAuth, wrap(updateUserPublicKey)); // alias
router.get("/search",          requireAuth, wrap(searchUsersHandler));

router.post("/bookmarks",      requireAuth, wrap(bookmarkMessage));
router.delete("/bookmarks/:messageId", requireAuth, wrap(removeBookmark));
router.get("/bookmarks",       requireAuth, wrap(fetchBookmarks));

export default router;
