import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { calculateGameScore } from "@/lib/game/scoring";
import { evaluateAchievements } from "@/lib/game/achievements";
import {
  getUserById,
  recordGameSession,
  getUserAchievements,
  unlockAchievement,
  recordDailyChallengeAttempt,
  getOrCreateDailyChallenge,
} from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const {
      mode = "recall",
      categoryId = "mixed",
      wordCount = 5,
      displayDuration = 5,
      difficulty = "normal",
      answers = [], // Array of { wordId, wordText, answerText, wasCorrect, responseTimeMs }
      clientScore,
      survivalRound = 1,
      isDailyChallenge = false,
      dailyChallengeId,
      clientSeed,
    } = body;

    const totalWords = Number(wordCount);
    // Count correct answers based on answers list or input
    const correctCount = answers.filter((a: { wasCorrect: boolean }) => a.wasCorrect).length;

    // Server-side calculated score
    const scoreBreakdown = calculateGameScore({
      mode,
      wordCount: totalWords,
      displayDuration: Number(displayDuration),
      difficulty,
      correctCount,
      totalWords,
      isDailyChallenge,
      survivalRound: Number(survivalRound),
    });

    const sessionId = `ses_${Math.random().toString(36).slice(2, 11)}`;

    // Prepare session words for database
    const sessionWords = answers.map((a: { wordId?: string; wordText: string; wasCorrect: boolean; responseTimeMs?: number }, index: number) => ({
      wordId: a.wordId,
      wordText: a.wordText,
      position: index,
      wasCorrect: a.wasCorrect,
      responseTimeMs: a.responseTimeMs,
    }));

    // Record session to DB
    recordGameSession({
      sessionId,
      userId: user?.id || null,
      mode,
      categoryId,
      wordCount: totalWords,
      displayDuration: Number(displayDuration),
      difficulty,
      score: scoreBreakdown.totalScore,
      accuracy: scoreBreakdown.accuracy,
      speedBonus: scoreBreakdown.speedBonus,
      clientSeed,
      words: sessionWords,
    });

    let newlyUnlocked: Array<{ id: string; slug: string; name: string; description: string; xpReward: number }> = [];
    let updatedProfile = null;

    if (user) {
      // If Daily Challenge, record attempt
      if (isDailyChallenge && dailyChallengeId) {
        recordDailyChallengeAttempt(user.id, dailyChallengeId, scoreBreakdown.totalScore, scoreBreakdown.accuracy);
      }

      // Fetch fresh user profile
      const freshUser = getUserById(user.id);
      if (freshUser) {
        const existingAchievements = getUserAchievements(user.id);
        const unlockedSlugs = existingAchievements.map((a) => a.slug);

        // Evaluate achievements
        const unlocked = evaluateAchievements({
          roundAccuracy: scoreBreakdown.accuracy,
          roundCorrectCount: correctCount,
          roundTotalWords: totalWords,
          displayDuration: Number(displayDuration),
          totalScore: scoreBreakdown.totalScore,
          mode,
          survivalRoundsSurvived: survivalRound,
          isDailyChallenge,
          userStats: {
            totalRounds: freshUser.total_rounds,
            totalCorrect: freshUser.total_correct,
            currentStreak: freshUser.current_streak,
            bestStreak: freshUser.best_streak,
            level: freshUser.level,
            categoriesPlayed: [categoryId],
            dailyChallengesCompleted: isDailyChallenge ? 1 : 0,
          },
          unlockedAchievementSlugs: unlockedSlugs,
        });

        // Save newly unlocked achievements
        for (const ach of unlocked) {
          unlockAchievement(user.id, ach.slug);
          newlyUnlocked.push(ach);
        }

        const afterAchUser = getUserById(user.id);
        updatedProfile = afterAchUser
          ? {
              xp: afterAchUser.xp,
              level: afterAchUser.level,
              currentStreak: afterAchUser.current_streak,
              bestStreak: afterAchUser.best_streak,
              totalRounds: afterAchUser.total_rounds,
              totalCorrect: afterAchUser.total_correct,
            }
          : null;
      }
    }

    return NextResponse.json({
      success: true,
      sessionId,
      breakdown: scoreBreakdown,
      newlyUnlockedAchievements: newlyUnlocked,
      updatedProfile,
    });
  } catch (error) {
    console.error("Game submit error:", error);
    return NextResponse.json({ error: "Failed to submit game session." }, { status: 500 });
  }
}
