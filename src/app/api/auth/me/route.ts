import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserById, getUserAchievements } from "@/lib/db";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const fullUser = getUserById(session.id);
    if (!fullUser) {
      return NextResponse.json({ user: null });
    }

    const achievements = getUserAchievements(session.id);

    return NextResponse.json({
      user: {
        id: fullUser.id,
        username: fullUser.username,
        displayName: fullUser.display_name,
        avatar: fullUser.avatar,
        role: fullUser.role,
        xp: fullUser.xp,
        level: fullUser.level,
        totalRounds: fullUser.total_rounds,
        totalWordsSeen: fullUser.total_words_seen,
        totalCorrect: fullUser.total_correct,
        currentStreak: fullUser.current_streak,
        bestStreak: fullUser.best_streak,
        isPublicProfile: fullUser.is_public_profile === 1,
        achievements,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null });
  }
}
