import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserDisabledStatusAdmin } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { isDisabled } = body;

    setUserDisabledStatusAdmin(id, !!isDisabled);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user status error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
