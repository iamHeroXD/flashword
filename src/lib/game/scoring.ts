export interface ScoreCalculationInput {
  mode: "classic" | "recall" | "speed" | "survival" | "daily";
  wordCount: number;
  displayDuration: number; // in seconds
  difficulty: "easy" | "normal" | "hard" | "expert";
  correctCount: number;
  totalWords: number;
  averageResponseTimeMs?: number;
  isDailyChallenge?: boolean;
  survivalRound?: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  difficultyMultiplier: number;
  speedBonus: number;
  accuracy: number;
  totalScore: number;
  xpEarned: number;
}

export const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  easy: 1.0,
  normal: 1.25,
  hard: 1.6,
  expert: 2.0,
};

/**
 * Calculates genuine score and XP with anti-cheat caps
 */
export function calculateGameScore(input: ScoreCalculationInput): ScoreBreakdown {
  const {
    mode,
    wordCount,
    displayDuration,
    difficulty,
    correctCount,
    totalWords,
    averageResponseTimeMs,
    isDailyChallenge = false,
    survivalRound = 1,
  } = input;

  const validTotal = Math.max(1, totalWords);
  const clampedCorrect = Math.max(0, Math.min(validTotal, correctCount));
  const accuracy = Math.round((clampedCorrect / validTotal) * 100);

  // Base score per correct word
  const pointsPerWord = 50;
  let baseScore = clampedCorrect * pointsPerWord;

  // In Classic flash mode where recall is casual observation:
  if (mode === "classic") {
    baseScore = wordCount * 20; // completion score
  }

  // Difficulty multiplier
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;

  // Speed Bonus calculation:
  // Lower duration per word grants higher bonus (e.g. 3s for 10 words is 0.3s/word)
  const secondsPerWord = displayDuration / wordCount;
  let speedMultiplier = 1.0;
  if (secondsPerWord <= 0.5) speedMultiplier = 1.5;
  else if (secondsPerWord <= 1.0) speedMultiplier = 1.3;
  else if (secondsPerWord <= 1.5) speedMultiplier = 1.15;
  else if (secondsPerWord >= 3.0) speedMultiplier = 0.9;

  let speedBonus = 0;
  if (clampedCorrect > 0 && accuracy >= 50) {
    speedBonus = Math.round(baseScore * (speedMultiplier - 1.0));
    if (speedBonus < 0) speedBonus = 0;
  }

  // Response time bonus if typed quickly during recall
  if (averageResponseTimeMs && averageResponseTimeMs < 3000 && clampedCorrect > 0) {
    const quickBonus = Math.min(100, Math.round((3000 - averageResponseTimeMs) / 30));
    speedBonus += quickBonus;
  }

  // Survival round bonus
  let survivalBonus = 0;
  if (mode === "survival" && survivalRound > 1) {
    survivalBonus = (survivalRound - 1) * 75;
  }

  // Daily Challenge flat bonus
  let dailyBonus = 0;
  if (isDailyChallenge && accuracy >= 50) {
    dailyBonus = 150;
  }

  let totalScore = Math.round((baseScore + speedBonus + survivalBonus + dailyBonus) * difficultyMultiplier);

  // Perfect round bonus
  if (accuracy === 100 && clampedCorrect >= 5) {
    totalScore += 100;
  }

  // XP calculation (XP awarded for legitimate gameplay)
  // XP scales nicely with accuracy and difficulty
  const xpEarned = Math.max(10, Math.round(totalScore * 0.4));

  return {
    baseScore,
    difficultyMultiplier,
    speedBonus: speedBonus + survivalBonus + dailyBonus,
    accuracy,
    totalScore,
    xpEarned,
  };
}

/**
 * Calculates level from cumulative XP
 * Level curve: Level 1 starts at 0 XP, Level 2 at 100 XP, Level 3 at 250 XP, etc.
 * Formula: level = Math.floor(Math.sqrt(totalXP / 50)) + 1
 */
export function calculateLevelFromXP(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
} {
  const safeXP = Math.max(0, totalXP);
  const level = Math.floor(Math.sqrt(safeXP / 50)) + 1;

  // XP needed for current level
  const currentLevelBaseXP = Math.pow(level - 1, 2) * 50;
  // XP needed for next level
  const nextLevelBaseXP = Math.pow(level, 2) * 50;

  const xpIntoCurrentLevel = safeXP - currentLevelBaseXP;
  const xpRequiredForNext = nextLevelBaseXP - currentLevelBaseXP;

  const progressPercent = Math.min(100, Math.max(0, Math.round((xpIntoCurrentLevel / xpRequiredForNext) * 100)));

  return {
    level,
    currentLevelXP: safeXP,
    nextLevelXP: nextLevelBaseXP,
    progressPercent,
  };
}

/**
 * Checks if streak should increment, maintain, or reset based on last played timestamp
 */
export function updateStreak(lastPlayedIso: string | null | undefined, currentStreak: number): {
  newStreak: number;
  isToday: boolean;
  streakMaintained: boolean;
} {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

  if (!lastPlayedIso) {
    return { newStreak: 1, isToday: false, streakMaintained: true };
  }

  const lastPlayedDate = new Date(lastPlayedIso);
  const lastPlayedStr = lastPlayedDate.toISOString().split("T")[0];

  if (lastPlayedStr === todayStr) {
    // Already played today, preserve current streak
    return { newStreak: Math.max(1, currentStreak), isToday: true, streakMaintained: true };
  }

  // Check if last played was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastPlayedStr === yesterdayStr) {
    // Played yesterday, increment streak!
    return { newStreak: currentStreak + 1, isToday: false, streakMaintained: true };
  }

  // More than 1 day missed, streak resets to 1
  return { newStreak: 1, isToday: false, streakMaintained: false };
}
