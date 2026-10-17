import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByUsername, checkRateLimit } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rate = checkRateLimit(ip, "login", 10, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 400 });
    }

    const user = getUserByUsername(username);
    if (!user || user.is_disabled === 1) {
      // Intentionally generic error to prevent username enumeration
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

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
        currentStreak: user.current_streak,
        bestStreak: user.best_streak,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Invalid username or password." }, { status: 500 });
  }
}
