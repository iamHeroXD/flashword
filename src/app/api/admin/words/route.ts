import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllWordsAdmin, addWordAdmin } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || "all";
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = getAllWordsAdmin({ categoryId, search, limit, offset });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin words error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { categoryId, word, definition, difficulty } = body;

    if (!categoryId || !word) {
      return NextResponse.json({ error: "Category and word are required." }, { status: 400 });
    }

    const created = addWordAdmin({
      categoryId,
      word,
      definition,
      difficulty,
    });

    return NextResponse.json({ success: true, word: created });
  } catch (error) {
    console.error("Admin add word error:", error);
    return NextResponse.json({ error: "Failed to add word." }, { status: 500 });
  }
}
