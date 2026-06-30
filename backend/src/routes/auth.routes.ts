import { Router } from "express";
import rateLimit from "express-rate-limit";
import { signup, login, requestPasswordReset, resetPassword } from "../controllers/auth.controller.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: "Too many attempts, please try again after 15 minutes." },
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, requestPasswordReset);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
