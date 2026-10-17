import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminStats } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const stats = getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
