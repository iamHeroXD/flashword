import { WordItem, ALL_WORDS, WORDS_BY_CATEGORY, normalizeWord } from "@/data/words";

// Deterministic PRNG using Mulberry32
export function createPRNG(seed: number) {
  let s = Math.floor(seed) >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Fisher-Yates shuffle with optional PRNG
export function shuffleArray<T>(array: T[], rng?: () => number): T[] {
  const result = [...array];
  const random = rng || Math.random;
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface DeckCycleState {
  categoryId: string;
  seenWordIds: string[];
  lastRoundWordIds: string[];
}

export interface WordSelectionOptions {
  categoryId: string; // category slug or 'mixed'
  wordCount: number; // 1, 5, 10, 15, 20
  difficulty?: "easy" | "normal" | "hard" | "expert";
  seenWordIds?: string[];
  lastRoundWordIds?: string[];
  seed?: number | string;
  customWords?: WordItem[];
}

export interface WordSelectionResult {
  words: WordItem[];
  updatedSeenWordIds: string[];
  cycleReset: boolean;
  actualCount: number;
}

/**
 * Robust word selection algorithm enforcing:
 * 1. Zero intra-round duplicates
 * 2. Minimized repeats across consecutive rounds
 * 3. Deck-cycle exhaustion and automatic reset
 * 4. Boundary protection (avoiding immediate repeats from end of old cycle to start of new cycle)
 * 5. Deterministic reproducibility when a seed is provided
 */
export function selectWordsForRound(options: WordSelectionOptions): WordSelectionResult {
  const {
    categoryId,
    wordCount,
    difficulty,
    seenWordIds = [],
    lastRoundWordIds = [],
    seed,
    customWords = [],
  } = options;

  const count = Math.max(1, Math.min(20, wordCount));
  const rng = seed !== undefined ? createPRNG(typeof seed === "string" ? hashStringToSeed(seed) : seed) : Math.random;

  // 1. Determine base pool
  let basePool: WordItem[] = [];
  if (categoryId === "custom" && customWords.length > 0) {
    basePool = [...customWords];
  } else if (categoryId === "mixed" || !categoryId) {
    basePool = [...ALL_WORDS];
  } else {
    basePool = [...(WORDS_BY_CATEGORY[categoryId] || ALL_WORDS)];
  }

  // Filter active only
  basePool = basePool.filter((w) => w.is_active);

  // Optional difficulty filter (if enough words exist for this difficulty)
  if (difficulty) {
    const matchingDiff = basePool.filter((w) => w.difficulty === difficulty);
    if (matchingDiff.length >= count) {
      basePool = matchingDiff;
    }
  }

  // Deduplicate pool by normalized_word
  const uniquePoolMap = new Map<string, WordItem>();
  for (const item of basePool) {
    const norm = normalizeWord(item.word);
    if (!uniquePoolMap.has(norm)) {
      uniquePoolMap.set(norm, item);
    }
  }
  const pool = Array.from(uniquePoolMap.values());

  if (pool.length === 0) {
    return {
      words: [],
      updatedSeenWordIds: seenWordIds,
      cycleReset: false,
      actualCount: 0,
    };
  }

  // 2. Identify candidates not yet seen in current deck cycle
  const seenSet = new Set(seenWordIds);
  let unseenCandidates = pool.filter((w) => !seenSet.has(w.id));
  let cycleReset = false;

  // 3. If unseen pool is insufficient, reset the cycle
  if (unseenCandidates.length < count) {
    cycleReset = true;
    // When resetting cycle, exclude words from immediately preceding round to prevent boundary repetition
    const lastRoundSet = new Set(lastRoundWordIds);
    const nonImmediateRepeats = pool.filter((w) => !lastRoundSet.has(w.id));

    if (nonImmediateRepeats.length >= count) {
      unseenCandidates = nonImmediateRepeats;
    } else {
      unseenCandidates = [...pool];
    }
  } else {
    // Exclude last round words if we have enough other unseen words
    const lastRoundSet = new Set(lastRoundWordIds);
    const nonConsecutive = unseenCandidates.filter((w) => !lastRoundSet.has(w.id));
    if (nonConsecutive.length >= count) {
      unseenCandidates = nonConsecutive;
    }
  }

  // 4. Shuffle and select
  const shuffled = shuffleArray(unseenCandidates, rng);
  const selected = shuffled.slice(0, count);

  // 5. Update seen history
  const selectedIds = selected.map((w) => w.id);
  const newSeenWordIds = cycleReset ? selectedIds : [...seenWordIds, ...selectedIds];

  return {
    words: selected,
    updatedSeenWordIds: newSeenWordIds,
    cycleReset,
    actualCount: selected.length,
  };
}

/**
 * Generate 3 multiple choice distractor words for a given target word
 * Distractors come from the same category to provide a realistic challenge!
 */
export function generateDistractors(target: WordItem, pool: WordItem[], rng?: () => number): string[] {
  const targetNorm = normalizeWord(target.word);
  const eligible = pool.filter((w) => normalizeWord(w.word) !== targetNorm);
  const shuffled = shuffleArray(eligible, rng);
  return shuffled.slice(0, 3).map((w) => w.word);
}
