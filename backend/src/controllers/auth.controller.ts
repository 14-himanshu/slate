import type { Request, Response } from "express";
import { registerUser, authenticateUser } from "../services/auth.service.js";

/** POST /api/auth/signup */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required." });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: "Username must be at least 3 characters." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters." });
      return;
    }

    const token = await registerUser(username.trim(), password);
    res.status(201).json({ token, username: username.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed.";
    res.status(409).json({ error: message });
  }
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required." });
      return;
    }

    const token = await authenticateUser(username.trim(), password);
    res.status(200).json({ token, username: username.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    res.status(401).json({ error: message });
  }
}
