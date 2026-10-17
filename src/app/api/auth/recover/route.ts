import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByUsername, updateUserPassword, checkRateLimit } from "@/lib/db";
import { validatePassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rate = checkRateLimit(ip, "recover", 5, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many recovery attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, recoveryCode, newPassword, confirmPassword } = body;

    if (!username || !recoveryCode || !newPassword) {
      return NextResponse.json(
        { error: "Username, recovery code, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.valid) {
      return NextResponse.json({ error: passCheck.error }, { status: 400 });
    }

    const user = getUserByUsername(username);
    if (!user || !user.recovery_code_hash) {
      return NextResponse.json(
        { error: "Invalid username or recovery code." },
        { status: 400 }
      );
    }

    const cleanCode = recoveryCode.trim().toUpperCase();
    const match = await bcrypt.compare(cleanCode, user.recovery_code_hash);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid username or recovery code." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    updateUserPassword(user.id, newHash);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You may now log in with your new password.",
    });
  } catch (error) {
    console.error("Recovery error:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
