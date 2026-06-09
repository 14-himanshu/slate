import express, { type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { verifyToken } from "../services/auth.service.js";
import { uploadToCloudinary } from "../services/upload.service.js";

const router = express.Router();

// ── Multer: memory storage, 10 MB limit, allowed types ────────
const ALLOWED_MIMES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "audio/webm", "audio/mpeg", "audio/ogg", "audio/mp4", "video/mp4"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

// ── JWT guard for REST routes ─────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyToken(auth.slice(7));
    (req as Request & { user?: unknown }).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ── POST /api/upload ──────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file provided or unsupported type." });
      return;
    }
    try {
      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Upload failed:", msg);
      res.status(500).json({ error: "Upload failed. Please try again." });
    }
  }
);

export default router;
