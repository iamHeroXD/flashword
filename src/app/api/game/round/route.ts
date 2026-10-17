import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { selectWordsForRound, generateDistractors } from "@/lib/game/engine";
import { getWordsForCategory } from "@/data/words";
import { getUserCategoryDeckHistory, updateUserCategoryDeckHistory } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      categoryId = "mixed",
      wordCount = 5,
      difficulty,
      mode = "recall",
      seed,
      guestSeenIds = [],
      guestLastRoundIds = [],
      customWords = [],
    } = body;

    const user = await getCurrentUser();

    let seenWordIds: string[] = [];
    let lastRoundWordIds: string[] = [];

    if (user) {
      const history = getUserCategoryDeckHistory(user.id, categoryId);
      seenWordIds = history.seenWordIds;
      lastRoundWordIds = history.lastRoundWordIds;
    } else {
      seenWordIds = guestSeenIds;
      lastRoundWordIds = guestLastRoundIds;
    }

    // Select words
    const selection = selectWordsForRound({
      categoryId,
      wordCount: Number(wordCount),
      difficulty,
      seenWordIds,
      lastRoundWordIds,
      seed,
      customWords,
    });

    // Update history if logged in
    if (user) {
      updateUserCategoryDeckHistory(
        user.id,
        categoryId,
        selection.updatedSeenWordIds,
        selection.words.map((w) => w.id)
      );
    }

    // Generate multiple choice options/distractors if recall mode
    const categoryPool = getWordsForCategory(categoryId);
    const wordsWithChoices = selection.words.map((target) => {
      const distractors = generateDistractors(target, categoryPool);
      // Combine target + distractors and shuffle
      const allChoices = [target.word, ...distractors].sort(() => Math.random() - 0.5);
      return {
        id: target.id,
        word: target.word,
        definition: target.definition,
        difficulty: target.difficulty,
        choices: allChoices,
      };
    });

    return NextResponse.json({
      success: true,
      words: wordsWithChoices,
      cycleReset: selection.cycleReset,
      actualCount: selection.actualCount,
      updatedSeenWordIds: selection.updatedSeenWordIds,
      lastRoundWordIds: selection.words.map((w) => w.id),
    });
  } catch (error) {
    console.error("Game round error:", error);
    return NextResponse.json({ error: "Failed to generate game round." }, { status: 500 });
  }
}
