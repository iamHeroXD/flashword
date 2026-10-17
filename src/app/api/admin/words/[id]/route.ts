import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toggleWordStatusAdmin, deleteWordAdmin } from "@/lib/db";

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
    const { isActive } = body;

    toggleWordStatusAdmin(id, !!isActive);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin toggle word error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    deleteWordAdmin(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete word error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
