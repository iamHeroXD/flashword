import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateGameScore,
  calculateLevelFromXP,
  updateStreak,
} from "../src/lib/game/scoring";

test("calculateGameScore scales with accuracy and difficulty", () => {
  const easyScore = calculateGameScore({
    mode: "recall",
    wordCount: 10,
    displayDuration: 8,
    difficulty: "easy",
    correctCount: 10,
    totalWords: 10,
  });

  const expertScore = calculateGameScore({
    mode: "recall",
    wordCount: 10,
    displayDuration: 8,
    difficulty: "expert",
    correctCount: 10,
    totalWords: 10,
  });

  assert.equal(easyScore.accuracy, 100);
  assert.equal(expertScore.accuracy, 100);
  assert.ok(expertScore.totalScore > easyScore.totalScore, "Expert score should exceed easy score");
  assert.ok(expertScore.xpEarned > easyScore.xpEarned, "Expert XP should exceed easy XP");
});

test("calculateGameScore awards speed bonus for rapid recall", () => {
  const normalSpeed = calculateGameScore({
    mode: "recall",
    wordCount: 5,
    displayDuration: 15, // 3s per word
    difficulty: "normal",
    correctCount: 5,
    totalWords: 5,
  });

  const fastSpeed = calculateGameScore({
    mode: "recall",
    wordCount: 5,
    displayDuration: 2.5, // 0.5s per word
    difficulty: "normal",
    correctCount: 5,
    totalWords: 5,
  });

  assert.ok(fastSpeed.speedBonus > normalSpeed.speedBonus, "Faster display duration should earn higher speed bonus");
});

test("calculateLevelFromXP calculates correct levels and thresholds", () => {
  assert.equal(calculateLevelFromXP(0).level, 1);
  assert.equal(calculateLevelFromXP(50).level, 2);
  assert.equal(calculateLevelFromXP(200).level, 3);
  assert.equal(calculateLevelFromXP(450).level, 4);
  assert.equal(calculateLevelFromXP(5000).level, 11);
});

test("updateStreak handles same day, consecutive day, and broken streaks", () => {
  const now = new Date();
  const todayIso = now.toISOString();

  // 1. Same day play
  const sameDay = updateStreak(todayIso, 3);
  assert.equal(sameDay.newStreak, 3);
  assert.equal(sameDay.isToday, true);

  // 2. Yesterday play
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const consecutive = updateStreak(yesterday.toISOString(), 3);
  assert.equal(consecutive.newStreak, 4);
  assert.equal(consecutive.streakMaintained, true);

  // 3. 3 days ago play (broken streak)
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const broken = updateStreak(threeDaysAgo.toISOString(), 5);
  assert.equal(broken.newStreak, 1);
  assert.equal(broken.streakMaintained, false);
});
