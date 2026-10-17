import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByUsername, checkRateLimit } from "@/lib/db";
import {
  validateUsername,
  validatePassword,
  generateRecoveryCode,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rate = checkRateLimit(ip, "register", 8, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password, confirmPassword, displayName, avatar } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    // Check unique username (case-insensitive)
    const existing = getUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: "That username is already taken. Please choose another." }, { status: 409 });
    }

    // Hash password & recovery code
    const passwordHash = await bcrypt.hash(password, 10);
    const recoveryCode = generateRecoveryCode();
    const recoveryCodeHash = await bcrypt.hash(recoveryCode, 10);

    const userId = `usr_${Math.random().toString(36).slice(2, 11)}`;
    const user = createUser({
      id: userId,
      username,
      displayName: displayName?.trim() || username.trim(),
      avatar: avatar || "⚡",
      passwordHash,
      recoveryCodeHash,
    });

    // Create session token and set cookie
    const token = createSessionToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatar: user.avatar,
        role: user.role,
        xp: user.xp,
        level: user.level,
      },
      recoveryCode, // Displayed ONCE to user on registration modal/screen
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
  }
}
