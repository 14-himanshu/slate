import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const SALT_ROUNDS = 12;

function getJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET is not defined.");
  return secret;
}

export interface TokenPayload {
  userId: string;
  username: string;
}

/** Hash a plaintext password */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Compare a plaintext password against a stored hash */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Sign a JWT containing userId and username */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

/** Verify and decode a JWT — throws on invalid/expired */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded === "string" || !("userId" in decoded)) {
    throw new Error("Invalid token payload");
  }
  return decoded as TokenPayload;
}

/** Register a new user; throws if username is taken */
export async function registerUser(
  username: string,
  password: string
): Promise<string> {
  const existing = await User.findOne({ username });
  if (existing) throw new Error("Username already taken.");

  const hashed = await hashPassword(password);
  const user = await User.create({ username, password: hashed });

  return signToken({ userId: user._id.toString(), username: user.username });
}

/** Authenticate an existing user; throws on bad credentials */
export async function authenticateUser(
  username: string,
  password: string
): Promise<string> {
  const user = await User.findOne({ username });
  if (!user) throw new Error("User not found.");

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new Error("Incorrect password.");

  return signToken({ userId: user._id.toString(), username: user.username });
}

/** Generate a 6-digit password reset code for a user */
export async function generateResetCode(username: string): Promise<string> {
  const user = await User.findOne({ username });
  if (!user) throw new Error("User not found.");

  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 15 mins from now
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 15);

  user.resetPasswordCode = code;
  user.resetPasswordExpires = expires;
  await user.save();

  return code;
}

/** Reset password using the 6-digit code */
export async function resetPassword(username: string, code: string, newPassword: string): Promise<void> {
  const user = await User.findOne({ username });
  if (!user) throw new Error("User not found.");
  if (!user.resetPasswordCode || !user.resetPasswordExpires) {
    throw new Error("No password reset requested.");
  }
  
  if (user.resetPasswordCode !== code) {
    throw new Error("Invalid reset code.");
  }

  if (user.resetPasswordExpires < new Date()) {
    throw new Error("Reset code has expired.");
  }

  const hashed = await hashPassword(newPassword);
  user.password = hashed;
  user.set('resetPasswordCode', undefined);
  user.set('resetPasswordExpires', undefined);
  await user.save();
}
