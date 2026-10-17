import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWord, getWordsForCategory, ALL_WORDS } from "../src/data/words/index";
import { selectWordsForRound, createPRNG, generateDistractors } from "../src/lib/game/engine";

test("Word normalization strips whitespace, casing, and special punctuation", () => {
  assert.equal(normalizeWord("  Hello "), "hello");
  assert.equal(normalizeWord("Mitochondria!"), "mitochondria");
  assert.equal(normalizeWord("Micro-processor"), "microprocessor");
  assert.equal(normalizeWord("James-Webb"), "jameswebb");
});

test("Categories contain substantial distinct words with zero duplicates", () => {
  const categories = ["english-vocab", "advanced-vocab", "biology", "physics", "chemistry", "technology", "programming", "mathematics"];
  for (const cat of categories) {
    const words = getWordsForCategory(cat);
    assert.ok(words.length >= 100, `Category ${cat} should have >= 100 words, got ${words.length}`);
    const normalizedSet = new Set(words.map((w) => normalizeWord(w.word)));
    assert.equal(normalizedSet.size, words.length, `Category ${cat} has duplicate words!`);
  }
});

test("selectWordsForRound guarantees zero intra-round duplicates", () => {
  for (let count of [1, 5, 10, 15, 20]) {
    const result = selectWordsForRound({
      categoryId: "physics",
      wordCount: count,
      seed: 42,
    });
    assert.equal(result.words.length, count);
    const set = new Set(result.words.map((w) => w.id));
    assert.equal(set.size, count, "No duplicate IDs should exist in a single round");
  }
});

test("selectWordsForRound handles deterministic seed reproducibility", () => {
  const roundA = selectWordsForRound({
    categoryId: "biology",
    wordCount: 10,
    seed: "daily_2026_10_17",
  });
  const roundB = selectWordsForRound({
    categoryId: "biology",
    wordCount: 10,
    seed: "daily_2026_10_17",
  });
  assert.deepEqual(
    roundA.words.map((w) => w.id),
    roundB.words.map((w) => w.id),
    "Identical seed must yield identical word sequence"
  );
});

test("Deck cycle tracks seen words and prevents immediate repeats", () => {
  const round1 = selectWordsForRound({
    categoryId: "food",
    wordCount: 5,
    seed: 123,
  });

  const round2 = selectWordsForRound({
    categoryId: "food",
    wordCount: 5,
    seenWordIds: round1.updatedSeenWordIds,
    lastRoundWordIds: round1.words.map((w) => w.id),
    seed: 456,
  });

  const round1Ids = new Set(round1.words.map((w) => w.id));
  const hasImmediateRepeat = round2.words.some((w) => round1Ids.has(w.id));
  assert.equal(hasImmediateRepeat, false, "Consecutive rounds should not repeat words when sufficient pool exists");
});

test("generateDistractors returns distinct options from same category without target", () => {
  const pool = getWordsForCategory("biology");
  const target = pool[0];
  const distractors = generateDistractors(target, pool);
  assert.equal(distractors.length, 3);
  assert.ok(!distractors.includes(target.word), "Distractors must not include the target word");
});
