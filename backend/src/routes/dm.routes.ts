import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import type { AuthRequest } from "../middleware/requireAuth.js";
import {
  searchUsers,
  listConversations,
  createConversation,
  getConversationMessages,
  markConversationAsRead
} from "../controllers/dm.controller.js";

const router = Router();

type AuthHandler = (req: AuthRequest, res: Response) => Promise<void>;
function wrap(fn: AuthHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthRequest, res).catch(next);
  };
}

router.get("/users", requireAuth, wrap(searchUsers));
router.get("/conversations", requireAuth, wrap(listConversations));
router.post("/conversations", requireAuth, wrap(createConversation));
router.get("/conversations/:id/messages", requireAuth, wrap(getConversationMessages));
router.post("/conversations/:id/read", requireAuth, wrap(markConversationAsRead));

export default router;
