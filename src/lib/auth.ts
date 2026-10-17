import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { DbProfile, getUserByUsername, getUserById, createUser, checkRateLimit } from "./db";

const COOKIE_NAME = "flashword_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "flashword_production_super_secret_key_2026_salt_xyz";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
}

/**
 * Creates a cryptographically signed session token: base64(payload).signature
 */
export function createSessionToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    created: Date.now(),
    expires: Date.now() + SESSION_MAX_AGE * 1000,
  });
  const b64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(b64Payload).digest("base64url");
  return `${b64Payload}.${signature}`;
}

/**
 * Verifies and decodes a session token. Returns userId if valid, or null if tampered/expired.
 */
export function verifySessionToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [b64Payload, signature] = parts;

    const expectedSignature = crypto.createHmac("sha256", AUTH_SECRET).update(b64Payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadStr = Buffer.from(b64Payload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr);

    if (Date.now() > payload.expires) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

/**
 * Generates an 18-character readable recovery code (e.g. FLASH-9A4B-8C2D-E7F1)
 */
export function generateRecoveryCode(): string {
  const bytes = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `FLASH-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}-${bytes.slice(8, 12)}`;
}

/**
 * Validates username syntax (3-24 alphanumeric and underscores/hyphens)
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 24) {
    return { valid: false, error: "Username must be between 3 and 24 characters long." };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: "Username can only contain letters, numbers, underscores, and hyphens." };
  }
  return { valid: true };
}

/**
 * Validates password strength (min 6 characters)
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters long." };
  }
  return { valid: true };
}

async function getSafeCookies() {
  const { cookies } = await import("next/headers");
  return cookies();
}

/**
 * Sets session cookie on Next.js response headers
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await getSafeCookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clears session cookie on logout
 */
export async function clearSessionCookie() {
  const cookieStore = await getSafeCookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Retrieves the currently authenticated user from the request session cookie
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await getSafeCookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const userId = verifySessionToken(token);
    if (!userId) return null;

    const user = getUserById(userId);
    if (!user || user.is_disabled === 1) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name || user.username,
      avatar: user.avatar || "⚡",
      role: user.role,
      xp: user.xp,
      level: user.level,
      currentStreak: user.current_streak,
      bestStreak: user.best_streak,
    };
  } catch {
    return null;
  }
}
