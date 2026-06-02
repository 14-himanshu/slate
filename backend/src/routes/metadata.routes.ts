import { Router } from "express";
import { getLinkPreview } from "../controllers/metadata.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/requireAuth.js";

const router = Router();

// Helper to cast Request → AuthRequest for typed controllers
type AuthHandler = (req: AuthRequest, res: Response) => Promise<void>;
function wrap(fn: AuthHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthRequest, res).catch(next);
  };
}

// ── Routes ─────────────────────────────────────────────────────
router.get("/link-preview", requireAuth, wrap(async (req, res) => getLinkPreview(req, res)));

export default router;
