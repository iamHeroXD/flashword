import { WordItem } from "./types";
import { englishVocabWords, advancedVocabWords } from "./vocab";
import { biologyWords, physicsWords, chemistryWords } from "./science";
import { techWords, programmingWords, mathematicsWords } from "./tech";
import { geographyWords, animalWords, spaceWords } from "./world";
import { foodWords, humanBodyWords, sportsWords } from "./culture";
import { objectsWords, natureWords, historyWords } from "./everyday";

export * from "./types";

export const ALL_WORDS: WordItem[] = [
  ...englishVocabWords,
  ...advancedVocabWords,
  ...biologyWords,
  ...physicsWords,
  ...chemistryWords,
  ...techWords,
  ...programmingWords,
  ...mathematicsWords,
  ...geographyWords,
  ...animalWords,
  ...spaceWords,
  ...foodWords,
  ...humanBodyWords,
  ...sportsWords,
  ...objectsWords,
  ...natureWords,
  ...historyWords,
];

// Map of words keyed by category slug
export const WORDS_BY_CATEGORY: Record<string, WordItem[]> = {
  "english-vocab": englishVocabWords,
  "advanced-vocab": advancedVocabWords,
  "biology": biologyWords,
  "physics": physicsWords,
  "chemistry": chemistryWords,
  "technology": techWords,
  "programming": programmingWords,
  "mathematics": mathematicsWords,
  "geography": geographyWords,
  "animals": animalWords,
  "space": spaceWords,
  "food": foodWords,
  "human-body": humanBodyWords,
  "sports": sportsWords,
  "objects": objectsWords,
  "nature": natureWords,
  "history": historyWords,
};

export function getWordsForCategory(categorySlug: string): WordItem[] {
  if (categorySlug === "mixed" || !categorySlug) {
    return ALL_WORDS;
  }
  return WORDS_BY_CATEGORY[categorySlug] || [];
}

export function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}
