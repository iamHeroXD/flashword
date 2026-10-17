import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateDailyChallenge, getUserDailyChallengeAttempt } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const challenge = getOrCreateDailyChallenge();

    let userAttempt = null;
    if (user) {
      const attempt = getUserDailyChallengeAttempt(user.id, challenge.id) as { score: number; accuracy: number; completed_at: string } | undefined;
      if (attempt) {
        userAttempt = {
          completed: true,
          score: attempt.score,
          accuracy: attempt.accuracy,
          completedAt: attempt.completed_at,
        };
      }
    }

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        challengeDate: challenge.challengeDate,
        config: challenge.config,
        seed: challenge.seed,
      },
      userAttempt,
    });
  } catch (error) {
    console.error("Daily challenge error:", error);
    return NextResponse.json({ error: "Failed to fetch daily challenge." }, { status: 500 });
  }
}
