export interface AchievementDef {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_flash",
    slug: "first_flash",
    name: "First Flash",
    description: "Complete your first ever round on Flashword.",
    icon: "Zap",
    xpReward: 50,
  },
  {
    id: "sharp_start",
    slug: "sharp_start",
    name: "Sharp Start",
    description: "Achieve 100% accuracy in any recall round.",
    icon: "Target",
    xpReward: 75,
  },
  {
    id: "memory_master",
    slug: "memory_master",
    name: "Memory Master",
    description: "Recall 10 or more words correctly in a single round.",
    icon: "Brain",
    xpReward: 150,
  },
  {
    id: "speed_demon",
    slug: "speed_demon",
    name: "Speed Demon",
    description: "Complete a round with a flash duration of 3 seconds or less.",
    icon: "Flame",
    xpReward: 100,
  },
  {
    id: "perfect_round",
    slug: "perfect_round",
    name: "Perfect Round",
    description: "Recall every word perfectly with at least 5 words displayed.",
    icon: "Award",
    xpReward: 120,
  },
  {
    id: "explorer",
    slug: "explorer",
    name: "Explorer",
    description: "Play rounds across at least 5 distinct categories.",
    icon: "Compass",
    xpReward: 100,
  },
  {
    id: "streak_starter",
    slug: "streak_starter",
    name: "Streak Starter",
    description: "Maintain a daily brain training streak of at least 3 days.",
    icon: "CalendarCheck",
    xpReward: 150,
  },
  {
    id: "streak_master",
    slug: "streak_master",
    name: "Streak Master",
    description: "Achieve an uninterrupted 7-day daily play streak.",
    icon: "Sparkles",
    xpReward: 300,
  },
  {
    id: "daily_regular",
    slug: "daily_regular",
    name: "Daily Regular",
    description: "Complete 3 Daily Challenges.",
    icon: "Trophy",
    xpReward: 200,
  },
  {
    id: "survivalist",
    slug: "survivalist",
    name: "Survivalist",
    description: "Survive 5 or more consecutive rounds in Survival Mode.",
    icon: "ShieldAlert",
    xpReward: 250,
  },
  {
    id: "high_roller",
    slug: "high_roller",
    name: "High Roller",
    description: "Score 1,000 points or more in a single game session.",
    icon: "Crown",
    xpReward: 200,
  },
  {
    id: "centurion",
    slug: "centurion",
    name: "Centurion",
    description: "Recall 100 total words across your account history.",
    icon: "CheckCircle",
    xpReward: 300,
  },
];

export interface EvaluationContext {
  roundAccuracy: number;
  roundCorrectCount: number;
  roundTotalWords: number;
  displayDuration: number;
  totalScore: number;
  mode: string;
  survivalRoundsSurvived?: number;
  isDailyChallenge?: boolean;
  userStats: {
    totalRounds: number;
    totalCorrect: number;
    currentStreak: number;
    bestStreak: number;
    level: number;
    categoriesPlayed: string[];
    dailyChallengesCompleted: number;
  };
  unlockedAchievementSlugs: string[];
}

/**
 * Evaluates which achievements are newly unlocked after a session
 */
export function evaluateAchievements(ctx: EvaluationContext): AchievementDef[] {
  const newlyUnlocked: AchievementDef[] = [];
  const existing = new Set(ctx.unlockedAchievementSlugs);

  const checkAndUnlock = (slug: string, condition: boolean) => {
    if (condition && !existing.has(slug)) {
      const found = ACHIEVEMENTS.find((a) => a.slug === slug);
      if (found) {
        newlyUnlocked.push(found);
        existing.add(slug);
      }
    }
  };

  // 1. First Flash
  checkAndUnlock("first_flash", ctx.userStats.totalRounds >= 1);

  // 2. Sharp Start (100% accuracy)
  checkAndUnlock("sharp_start", ctx.roundAccuracy === 100 && ctx.roundCorrectCount > 0);

  // 3. Memory Master (>= 10 recalled words in one round)
  checkAndUnlock("memory_master", ctx.roundCorrectCount >= 10);

  // 4. Speed Demon (<= 3s duration with legitimate recall)
  checkAndUnlock("speed_demon", ctx.displayDuration <= 3 && ctx.roundCorrectCount >= 1);

  // 5. Perfect Round (100% accuracy on >= 5 words)
  checkAndUnlock("perfect_round", ctx.roundAccuracy === 100 && ctx.roundTotalWords >= 5);

  // 6. Explorer (>= 5 categories)
  checkAndUnlock("explorer", ctx.userStats.categoriesPlayed.length >= 5);

  // 7. Streak Starter (>= 3 days)
  checkAndUnlock("streak_starter", ctx.userStats.currentStreak >= 3);

  // 8. Streak Master (>= 7 days)
  checkAndUnlock("streak_master", ctx.userStats.currentStreak >= 7);

  // 9. Daily Regular (>= 3 daily challenges)
  checkAndUnlock("daily_regular", ctx.userStats.dailyChallengesCompleted >= 3);

  // 10. Survivalist (>= 5 survival rounds)
  checkAndUnlock("survivalist", (ctx.survivalRoundsSurvived || 0) >= 5);

  // 11. High Roller (score >= 1000)
  checkAndUnlock("high_roller", ctx.totalScore >= 1000);

  // 12. Centurion (>= 100 total recalled words)
  checkAndUnlock("centurion", ctx.userStats.totalCorrect >= 100);

  return newlyUnlocked;
}
