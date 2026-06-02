import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { createRoomHandler, getRoomHandler, getUserRoomsHandler } from "../controllers/room.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import type { AuthRequest } from "../middleware/requireAuth.js";

const router = Router();

type AuthHandler = (req: AuthRequest, res: Response) => Promise<void>;
function wrap(fn: AuthHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthRequest, res).catch(next);
  };
}

router.use(requireAuth);

router.post("/", wrap(createRoomHandler));
router.get("/user", wrap(getUserRoomsHandler));
router.get("/:roomId", wrap(getRoomHandler));

export default router;
