import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAchievements, ACHIEVEMENTS } from "../src/lib/game/achievements";

test("evaluateAchievements unlocks First Flash on first round", () => {
  const unlocked = evaluateAchievements({
    roundAccuracy: 60,
    roundCorrectCount: 3,
    roundTotalWords: 5,
    displayDuration: 5,
    totalScore: 200,
    mode: "recall",
    userStats: {
      totalRounds: 1,
      totalCorrect: 3,
      currentStreak: 1,
      bestStreak: 1,
      level: 1,
      categoriesPlayed: ["mixed"],
      dailyChallengesCompleted: 0,
    },
    unlockedAchievementSlugs: [],
  });

  const slugs = unlocked.map((a) => a.slug);
  assert.ok(slugs.includes("first_flash"), "First flash should be unlocked");
  assert.ok(!slugs.includes("sharp_start"), "Sharp start should not be unlocked on 60% accuracy");
});

test("evaluateAchievements unlocks Sharp Start and Perfect Round on 100% accuracy", () => {
  const unlocked = evaluateAchievements({
    roundAccuracy: 100,
    roundCorrectCount: 5,
    roundTotalWords: 5,
    displayDuration: 5,
    totalScore: 400,
    mode: "recall",
    userStats: {
      totalRounds: 2,
      totalCorrect: 8,
      currentStreak: 1,
      bestStreak: 1,
      level: 1,
      categoriesPlayed: ["physics"],
      dailyChallengesCompleted: 0,
    },
    unlockedAchievementSlugs: ["first_flash"],
  });

  const slugs = unlocked.map((a) => a.slug);
  assert.ok(slugs.includes("sharp_start"), "Sharp start should unlock on 100% accuracy");
  assert.ok(slugs.includes("perfect_round"), "Perfect round should unlock on 5 words at 100%");
});

test("evaluateAchievements does not re-unlock already earned achievements", () => {
  const unlocked = evaluateAchievements({
    roundAccuracy: 100,
    roundCorrectCount: 5,
    roundTotalWords: 5,
    displayDuration: 5,
    totalScore: 400,
    mode: "recall",
    userStats: {
      totalRounds: 3,
      totalCorrect: 15,
      currentStreak: 1,
      bestStreak: 1,
      level: 2,
      categoriesPlayed: ["biology"],
      dailyChallengesCompleted: 0,
    },
    unlockedAchievementSlugs: ["first_flash", "sharp_start", "perfect_round"],
  });

  assert.equal(unlocked.length, 0, "No already earned achievements should re-unlock");
});
