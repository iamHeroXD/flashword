import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser, clearSessionCookie } from "@/lib/auth";
import { getUserById, deleteUser, updateUserProfile } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, avatar, isPublicProfile } = body;

    const ok = updateUserProfile(session.id, {
      displayName: displayName?.trim(),
      avatar,
      isPublicProfile,
    });

    if (!ok) {
      return NextResponse.json({ error: "Failed to update profile." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Profile updated." });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password confirmation required." }, { status: 400 });
    }

    const fullUser = getUserById(session.id);
    if (!fullUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const match = await bcrypt.compare(password, fullUser.password_hash);
    if (!match) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }

    deleteUser(session.id);
    await clearSessionCookie();

    return NextResponse.json({ success: true, message: "Account deleted permanently." });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }
}
