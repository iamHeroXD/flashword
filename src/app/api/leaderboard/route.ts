import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, getOrCreateDailyChallenge, getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "all_time") as "all_time" | "weekly" | "monthly" | "daily";
    const user = await getCurrentUser();

    if (period === "daily") {
      const todayChallenge = getOrCreateDailyChallenge();
      const db = getDb();
      const rows = db.prepare(`
        SELECT p.id as userId, p.username, p.display_name as displayName, p.avatar, p.level,
               udc.score, udc.accuracy, udc.completed_at
        FROM user_daily_challenges udc
        JOIN profiles p ON udc.user_id = p.id
        WHERE udc.challenge_id = ? AND p.is_disabled = 0 AND p.is_public_profile = 1
        ORDER BY udc.score DESC, udc.accuracy DESC
        LIMIT 50
      `).all(todayChallenge.id) as Record<string, unknown>[];

      const entries = rows.map((r, idx) => ({
        rank: idx + 1,
        userId: String(r.userId),
        username: String(r.username),
        displayName: String(r.displayName || r.username),
        avatar: String(r.avatar || "⚡"),
        score: Number(r.score),
        level: Number(r.level),
        accuracy: Number(r.accuracy),
      }));

      // Find current user's rank if not in top 50
      let userRank = entries.find((e) => e.userId === user?.id)?.rank || null;

      return NextResponse.json({
        period,
        entries,
        currentUserRank: userRank,
        dailyChallenge: {
          challengeDate: todayChallenge.challengeDate,
          config: todayChallenge.config,
        },
      });
    }

    const entries = getLeaderboard(period, 50);
    const userRank = entries.find((e) => e.userId === user?.id)?.rank || null;

    return NextResponse.json({
      period,
      entries,
      currentUserRank: userRank,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard." }, { status: 500 });
  }
}
