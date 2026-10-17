export type WordDifficulty = "easy" | "normal" | "hard" | "expert";

export interface WordItem {
  id: string;
  category_id: string;
  word: string;
  normalized_word: string;
  difficulty: WordDifficulty;
  definition?: string;
  is_active: boolean;
}
