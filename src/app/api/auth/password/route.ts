import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser, validatePassword } from "@/lib/auth";
import { getUserById, updateUserPassword } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.valid) {
      return NextResponse.json({ error: passCheck.error }, { status: 400 });
    }

    const fullUser = getUserById(session.id);
    if (!fullUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!match) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    updateUserPassword(session.id, newHash);

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
