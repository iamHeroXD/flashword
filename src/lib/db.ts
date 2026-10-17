import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { ALL_WORDS } from "@/data/words";
import { CATEGORIES } from "@/data/categories";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import { calculateLevelFromXP, updateStreak } from "@/lib/game/scoring";

let dbInstance: DatabaseSync | null = null;

function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "flashword.db");
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "flashword.db");
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = getDatabasePath();
    dbInstance = new DatabaseSync(dbPath);
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  // 1. Profiles
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      normalized_username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar TEXT,
      password_hash TEXT NOT NULL,
      recovery_code_hash TEXT,
      role TEXT DEFAULT 'user',
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      total_rounds INTEGER DEFAULT 0,
      total_words_seen INTEGER DEFAULT 0,
      total_correct INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      last_played_date TEXT,
      is_disabled INTEGER DEFAULT 0,
      is_public_profile INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);
    CREATE INDEX IF NOT EXISTS idx_profiles_norm_user ON profiles(normalized_username);
  `);

  // 2. Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      difficulty TEXT DEFAULT 'normal',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Words
  db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      word TEXT NOT NULL,
      normalized_word TEXT NOT NULL,
      definition TEXT,
      difficulty TEXT DEFAULT 'normal',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_words_cat ON words(category_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_words_norm ON words(normalized_word);
  `);

  // 4. Game Sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      mode TEXT NOT NULL,
      category_id TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      display_duration REAL NOT NULL,
      difficulty TEXT NOT NULL,
      score INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      speed_bonus INTEGER DEFAULT 0,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      client_seed TEXT,
      is_suspicious INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON game_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_completed ON game_sessions(completed_at DESC);
  `);

  // 5. Session Words
  db.exec(`
    CREATE TABLE IF NOT EXISTS session_words (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      word_id TEXT,
      word_text TEXT NOT NULL,
      position INTEGER NOT NULL,
      was_correct INTEGER,
      response_time_ms INTEGER,
      FOREIGN KEY(session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_session_words ON session_words(session_id);
  `);

  // 6. Achievements & User Achievements
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY(achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(user_id, achievement_id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_achievements ON user_achievements(user_id);
  `);

  // 7. Daily Challenges & User Daily Challenges
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id TEXT PRIMARY KEY,
      challenge_date TEXT UNIQUE NOT NULL,
      configuration TEXT NOT NULL,
      seed TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_daily_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      score INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY(challenge_id) REFERENCES daily_challenges(id) ON DELETE CASCADE,
      UNIQUE(user_id, challenge_id)
    );
    CREATE INDEX IF NOT EXISTS idx_daily_user ON user_daily_challenges(user_id);
  `);

  // 8. User Category History (Deck cycle tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_category_history (
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      seen_word_ids TEXT NOT NULL,
      last_round_word_ids TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, category_id)
    );
  `);

  // 9. Rate Limits
  db.exec(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      attempts INTEGER DEFAULT 1,
      reset_at INTEGER NOT NULL
    );
  `);

  // Seed default categories if none
  seedInitialData(db);
}

function seedInitialData(db: DatabaseSync) {
  // Check categories count
  const catCountResult = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
  if (catCountResult.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (id, slug, name, description, icon, difficulty, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const cat of CATEGORIES) {
      insertCat.run(cat.id, cat.slug, cat.name, cat.description, cat.icon, cat.difficulty, cat.is_active ? 1 : 0);
    }
  }

  // Check achievements count
  const achCountResult = db.prepare("SELECT COUNT(*) as count FROM achievements").get() as { count: number };
  if (achCountResult.count === 0) {
    const insertAch = db.prepare(`
      INSERT INTO achievements (id, slug, name, description, icon, xp_reward)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const ach of ACHIEVEMENTS) {
      insertAch.run(ach.id, ach.slug, ach.name, ach.description, ach.icon, ach.xpReward);
    }
  }

  // Check words count
  const wordCountResult = db.prepare("SELECT COUNT(*) as count FROM words").get() as { count: number };
  if (wordCountResult.count === 0) {
    const insertWord = db.prepare(`
      INSERT INTO words (id, category_id, word, normalized_word, definition, difficulty, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    // Insert words in a batch transaction
    db.exec("BEGIN TRANSACTION");
    try {
      for (const w of ALL_WORDS) {
        insertWord.run(w.id, w.category_id, w.word, w.normalized_word, w.definition || "", w.difficulty, w.is_active ? 1 : 0);
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      console.error("Error seeding words:", e);
    }
  }
}

// ----------------- PROFILE & AUTH QUERIES -----------------

export interface DbProfile {
  id: string;
  username: string;
  normalized_username: string;
  display_name: string | null;
  avatar: string | null;
  password_hash: string;
  recovery_code_hash: string | null;
  role: string;
  xp: number;
  level: number;
  total_rounds: number;
  total_words_seen: number;
  total_correct: number;
  current_streak: number;
  best_streak: number;
  last_played_date: string | null;
  is_disabled: number;
  is_public_profile: number;
  created_at: string;
}

export function getUserByUsername(username: string): DbProfile | null {
  const db = getDb();
  const normalized = username.toLowerCase().trim();
  const row = db.prepare("SELECT * FROM profiles WHERE normalized_username = ?").get(normalized) as DbProfile | undefined;
  return row || null;
}

export function getUserById(id: string): DbProfile | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id) as DbProfile | undefined;
  return row || null;
}

export function createUser(data: {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  passwordHash: string;
  recoveryCodeHash?: string;
  role?: string;
}): DbProfile {
  const db = getDb();
  const normalized = data.username.toLowerCase().trim();

  // First registered user gets admin automatically, or check role
  const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM profiles").get() as { count: number }).count;
  const role = data.role || (totalUsers === 0 ? "admin" : "user");

  db.prepare(`
    INSERT INTO profiles (
      id, username, normalized_username, display_name, avatar,
      password_hash, recovery_code_hash, role, xp, level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
  `).run(
    data.id,
    data.username.trim(),
    normalized,
    data.displayName || data.username.trim(),
    data.avatar || "⚡",
    data.passwordHash,
    data.recoveryCodeHash || null,
    role
  );

  return getUserById(data.id)!;
}

export function updateUserPassword(userId: string, newHash: string): boolean {
  const db = getDb();
  const res = db.prepare("UPDATE profiles SET password_hash = ? WHERE id = ?").run(newHash, userId);
  return Number(res.changes) > 0;
}

export function updateUserProfile(userId: string, updates: {
  displayName?: string;
  avatar?: string;
  isPublicProfile?: boolean;
}): boolean {
  const db = getDb();
  const current = getUserById(userId);
  if (!current) return false;

  const newDisplayName = updates.displayName !== undefined ? updates.displayName : current.display_name;
  const newAvatar = updates.avatar !== undefined ? updates.avatar : current.avatar;
  const newPublic = updates.isPublicProfile !== undefined ? (updates.isPublicProfile ? 1 : 0) : current.is_public_profile;

  const res = db.prepare(`
    UPDATE profiles
    SET display_name = ?, avatar = ?, is_public_profile = ?
    WHERE id = ?
  `).run(newDisplayName, newAvatar, newPublic, userId);

  return Number(res.changes) > 0;
}

export function deleteUser(userId: string): boolean {
  const db = getDb();
  db.exec("BEGIN TRANSACTION");
  try {
    db.prepare("DELETE FROM user_achievements WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM user_daily_challenges WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM user_category_history WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM game_sessions WHERE user_id = ?").run(userId);
    const res = db.prepare("DELETE FROM profiles WHERE id = ?").run(userId);
    db.exec("COMMIT");
    return Number(res.changes) > 0;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// ----------------- GAME SESSIONS & PROGRESSION -----------------

export interface SaveSessionInput {
  sessionId: string;
  userId?: string | null;
  mode: string;
  categoryId: string;
  wordCount: number;
  displayDuration: number;
  difficulty: string;
  score: number;
  accuracy: number;
  speedBonus?: number;
  clientSeed?: string;
  words?: Array<{
    wordId?: string;
    wordText: string;
    position: number;
    wasCorrect?: boolean;
    responseTimeMs?: number;
  }>;
}

export function recordGameSession(input: SaveSessionInput) {
  const db = getDb();
  db.exec("BEGIN TRANSACTION");
  try {
    // 1. Insert session
    db.prepare(`
      INSERT INTO game_sessions (
        id, user_id, mode, category_id, word_count, display_duration,
        difficulty, score, accuracy, speed_bonus, client_seed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.sessionId,
      input.userId || null,
      input.mode,
      input.categoryId,
      input.wordCount,
      input.displayDuration,
      input.difficulty,
      input.score,
      input.accuracy,
      input.speedBonus || 0,
      input.clientSeed || null
    );

    // 2. Insert session words
    if (input.words && input.words.length > 0) {
      const insertWordStmt = db.prepare(`
        INSERT INTO session_words (
          id, session_id, word_id, word_text, position, was_correct, response_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const w of input.words) {
        insertWordStmt.run(
          `sw_${Math.random().toString(36).slice(2, 10)}`,
          input.sessionId,
          w.wordId || null,
          w.wordText,
          w.position,
          w.wasCorrect !== undefined ? (w.wasCorrect ? 1 : 0) : null,
          w.responseTimeMs || null
        );
      }
    }

    // 3. If user is registered, update stats and progression
    if (input.userId) {
      const user = getUserById(input.userId);
      if (user) {
        const correctCount = input.words
          ? input.words.filter((w) => w.wasCorrect).length
          : Math.round((input.accuracy / 100) * input.wordCount);

        const newTotalRounds = user.total_rounds + 1;
        const newTotalWordsSeen = user.total_words_seen + input.wordCount;
        const newTotalCorrect = user.total_correct + correctCount;
        
        // XP and Level calculation
        const xpEarned = Math.max(10, Math.round(input.score * 0.4));
        const newXP = user.xp + xpEarned;
        const { level: newLevel } = calculateLevelFromXP(newXP);

        // Streak calculation
        const { newStreak } = updateStreak(user.last_played_date, user.current_streak);
        const bestStreak = Math.max(user.best_streak, newStreak);
        const nowIso = new Date().toISOString();

        db.prepare(`
          UPDATE profiles
          SET xp = ?, level = ?, total_rounds = ?, total_words_seen = ?,
              total_correct = ?, current_streak = ?, best_streak = ?,
              last_played_date = ?
          WHERE id = ?
        `).run(
          newXP,
          newLevel,
          newTotalRounds,
          newTotalWordsSeen,
          newTotalCorrect,
          newStreak,
          bestStreak,
          nowIso,
          input.userId
        );
      }
    }

    db.exec("COMMIT");
    return true;
  } catch (e) {
    db.exec("ROLLBACK");
    console.error("Failed to record game session:", e);
    throw e;
  }
}

// ----------------- LEADERBOARDS -----------------

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  score: number;
  level: number;
  accuracy?: number;
  totalRounds?: number;
}

export function getLeaderboard(period: "all_time" | "weekly" | "monthly" | "daily", limit: number = 50): LeaderboardEntry[] {
  const db = getDb();
  let query = "";

  if (period === "all_time") {
    query = `
      SELECT id as userId, username, display_name as displayName, avatar,
             xp as score, level, total_rounds as totalRounds
      FROM profiles
      WHERE is_disabled = 0 AND is_public_profile = 1 AND total_rounds > 0
      ORDER BY xp DESC, total_rounds DESC
      LIMIT ?
    `;
    const rows = db.prepare(query).all(limit) as Record<string, unknown>[];
    return rows.map((r, idx) => ({
      rank: idx + 1,
      userId: String(r.userId),
      username: String(r.username),
      displayName: String(r.displayName || r.username),
      avatar: String(r.avatar || "⚡"),
      score: Number(r.score),
      level: Number(r.level),
      totalRounds: Number(r.totalRounds),
    }));
  }

  // Periodic leaderboards derived from sessions completed within timeframe
  let dateFilter = "date('now', '-7 days')";
  if (period === "monthly") dateFilter = "date('now', '-30 days')";
  if (period === "daily") dateFilter = "date('now')";

  query = `
    SELECT p.id as userId, p.username, p.display_name as displayName, p.avatar, p.level,
           SUM(s.score) as score, COUNT(s.id) as totalRounds, ROUND(AVG(s.accuracy), 1) as accuracy
    FROM game_sessions s
    JOIN profiles p ON s.user_id = p.id
    WHERE p.is_disabled = 0 AND p.is_public_profile = 1
      AND s.completed_at >= ${dateFilter}
    GROUP BY p.id
    ORDER BY score DESC
    LIMIT ?
  `;

  const rows = db.prepare(query).all(limit) as Record<string, unknown>[];
  return rows.map((r, idx) => ({
    rank: idx + 1,
    userId: String(r.userId),
    username: String(r.username),
    displayName: String(r.displayName || r.username),
    avatar: String(r.avatar || "⚡"),
    score: Number(r.score),
    level: Number(r.level),
    totalRounds: Number(r.totalRounds),
    accuracy: Number(r.accuracy),
  }));
}

// ----------------- ACHIEVEMENTS -----------------

export function getUserAchievements(userId: string): Array<{
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string;
}> {
  const db = getDb();
  const query = `
    SELECT a.id, a.slug, a.name, a.description, a.icon, a.xp_reward as xpReward,
           ua.unlocked_at as unlockedAt
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ?
    ORDER BY ua.unlocked_at DESC
  `;
  const rows = db.prepare(query).all(userId) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description),
    icon: String(r.icon),
    xpReward: Number(r.xpReward),
    unlockedAt: String(r.unlockedAt),
  }));
}

export function unlockAchievement(userId: string, achievementSlug: string): boolean {
  const db = getDb();
  const achievement = db.prepare("SELECT * FROM achievements WHERE slug = ?").get(achievementSlug) as Record<string, unknown> | undefined;
  if (!achievement) return false;

  try {
    const uaId = `ua_${Math.random().toString(36).slice(2, 10)}`;
    db.prepare(`
      INSERT OR IGNORE INTO user_achievements (id, user_id, achievement_id)
      VALUES (?, ?, ?)
    `).run(uaId, userId, String(achievement.id));

    // Award achievement XP to profile
    db.prepare("UPDATE profiles SET xp = xp + ? WHERE id = ?").run(Number(achievement.xp_reward), userId);
    return true;
  } catch {
    return false;
  }
}

// ----------------- DAILY CHALLENGE -----------------

export interface DailyChallengeRecord {
  id: string;
  challenge_date: string;
  configuration: string;
  seed: string;
  active: number;
}

export function getOrCreateDailyChallenge(dateStr?: string): {
  id: string;
  challengeDate: string;
  config: {
    wordCount: number;
    displayDuration: number;
    categoryId: string;
    difficulty: "easy" | "normal" | "hard" | "expert";
    mode: string;
  };
  seed: string;
} {
  const db = getDb();
  const today = dateStr || new Date().toISOString().split("T")[0];

  let challenge = db.prepare("SELECT * FROM daily_challenges WHERE challenge_date = ?").get(today) as DailyChallengeRecord | undefined;

  if (!challenge) {
    // Generate deterministic config based on date
    const seed = `daily_${today}`;
    const categories = ["mixed", "english-vocab", "technology", "biology", "physics", "geography", "food", "space"];
    // Deterministic selection
    let charSum = 0;
    for (let i = 0; i < today.length; i++) charSum += today.charCodeAt(i);
    const chosenCat = categories[charSum % categories.length];

    const config = {
      wordCount: 10,
      displayDuration: 8,
      categoryId: chosenCat,
      difficulty: "normal" as const,
      mode: "recall",
    };

    const id = `dc_${today.replace(/-/g, "")}`;
    db.prepare(`
      INSERT INTO daily_challenges (id, challenge_date, configuration, seed, active)
      VALUES (?, ?, ?, ?, 1)
    `).run(id, today, JSON.stringify(config), seed);

    return {
      id,
      challengeDate: today,
      config,
      seed,
    };
  }

  return {
    id: challenge.id,
    challengeDate: challenge.challenge_date,
    config: JSON.parse(challenge.configuration),
    seed: challenge.seed,
  };
}

export function getUserDailyChallengeAttempt(userId: string, challengeId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM user_daily_challenges WHERE user_id = ? AND challenge_id = ?").get(userId, challengeId);
}

export function recordDailyChallengeAttempt(userId: string, challengeId: string, score: number, accuracy: number) {
  const db = getDb();
  const id = `udc_${Math.random().toString(36).slice(2, 10)}`;
  db.prepare(`
    INSERT OR REPLACE INTO user_daily_challenges (id, user_id, challenge_id, score, accuracy)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, challengeId, score, accuracy);
}

// ----------------- DECK CYCLE HISTORY -----------------

export function getUserCategoryDeckHistory(userId: string, categoryId: string): { seenWordIds: string[]; lastRoundWordIds: string[] } {
  const db = getDb();
  const row = db.prepare("SELECT seen_word_ids, last_round_word_ids FROM user_category_history WHERE user_id = ? AND category_id = ?").get(userId, categoryId) as { seen_word_ids: string; last_round_word_ids?: string } | undefined;
  if (!row) {
    return { seenWordIds: [], lastRoundWordIds: [] };
  }
  return {
    seenWordIds: JSON.parse(row.seen_word_ids || "[]"),
    lastRoundWordIds: JSON.parse(row.last_round_word_ids || "[]"),
  };
}

export function updateUserCategoryDeckHistory(userId: string, categoryId: string, seenWordIds: string[], lastRoundWordIds: string[]) {
  const db = getDb();
  db.prepare(`
    INSERT INTO user_category_history (user_id, category_id, seen_word_ids, last_round_word_ids, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, category_id) DO UPDATE SET
      seen_word_ids = excluded.seen_word_ids,
      last_round_word_ids = excluded.last_round_word_ids,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, categoryId, JSON.stringify(seenWordIds), JSON.stringify(lastRoundWordIds));
}

// ----------------- ADMIN TOOLS -----------------

export function getAdminStats() {
  const db = getDb();
  const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM profiles").get() as { c: number }).c;
  const totalSessions = (db.prepare("SELECT COUNT(*) as c FROM game_sessions").get() as { c: number }).c;
  const totalWords = (db.prepare("SELECT COUNT(*) as c FROM words").get() as { c: number }).c;
  const activeWords = (db.prepare("SELECT COUNT(*) as c FROM words WHERE is_active = 1").get() as { c: number }).c;

  // Words count per category
  const wordsByCat = db.prepare(`
    SELECT c.name, c.slug, COUNT(w.id) as word_count
    FROM categories c
    LEFT JOIN words w ON c.id = w.category_id
    GROUP BY c.id
    ORDER BY word_count DESC
  `).all() as Array<{ name: string; slug: string; word_count: number }>;

  // Recent 10 sessions
  const recentSessions = db.prepare(`
    SELECT s.id, s.mode, s.category_id, s.score, s.accuracy, s.completed_at,
           p.username
    FROM game_sessions s
    LEFT JOIN profiles p ON s.user_id = p.id
    ORDER BY s.completed_at DESC
    LIMIT 10
  `).all();

  return {
    totalUsers,
    totalSessions,
    totalWords,
    activeWords,
    wordsByCat,
    recentSessions,
  };
}

export function getAllWordsAdmin(options?: { categoryId?: string; search?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  let sql = "SELECT * FROM words WHERE 1=1";
  const params: unknown[] = [];

  if (options?.categoryId && options.categoryId !== "all") {
    sql += " AND category_id = ?";
    params.push(options.categoryId);
  }

  if (options?.search) {
    sql += " AND (word LIKE ? OR definition LIKE ?)";
    params.push(`%${options.search}%`, `%${options.search}%`);
  }

  sql += " ORDER BY word ASC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const words = db.prepare(sql).all(...params);
  const total = (db.prepare("SELECT COUNT(*) as c FROM words").get() as { c: number }).c;

  return { words, total };
}

export function addWordAdmin(data: {
  categoryId: string;
  word: string;
  definition?: string;
  difficulty?: string;
}) {
  const db = getDb();
  const id = `custom_${Math.random().toString(36).slice(2, 10)}`;
  const normalized = data.word.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  db.prepare(`
    INSERT INTO words (id, category_id, word, normalized_word, definition, difficulty, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(id, data.categoryId, data.word.trim(), normalized, data.definition || "", data.difficulty || "normal");

  return { id, ...data };
}

export function toggleWordStatusAdmin(wordId: string, isActive: boolean) {
  const db = getDb();
  db.prepare("UPDATE words SET is_active = ? WHERE id = ?").run(isActive ? 1 : 0, wordId);
  return true;
}

export function deleteWordAdmin(wordId: string) {
  const db = getDb();
  db.prepare("DELETE FROM words WHERE id = ?").run(wordId);
  return true;
}

export function setUserDisabledStatusAdmin(userId: string, isDisabled: boolean) {
  const db = getDb();
  db.prepare("UPDATE profiles SET is_disabled = ? WHERE id = ?").run(isDisabled ? 1 : 0, userId);
  return true;
}

// ----------------- RATE LIMITING -----------------

export function checkRateLimit(ipKey: string, action: string, maxAttempts: number = 10, windowSec: number = 60): {
  allowed: boolean;
  remaining: number;
} {
  const db = getDb();
  const key = `${ipKey}_${action}`;
  const now = Math.floor(Date.now() / 1000);

  const row = db.prepare("SELECT attempts, reset_at FROM rate_limits WHERE key = ?").get(key) as { attempts: number; reset_at: number } | undefined;

  if (!row || row.reset_at <= now) {
    db.prepare(`
      INSERT INTO rate_limits (key, attempts, reset_at)
      VALUES (?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET attempts = 1, reset_at = excluded.reset_at
    `).run(key, now + windowSec);
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (row.attempts >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  db.prepare("UPDATE rate_limits SET attempts = attempts + 1 WHERE key = ?").run(key);
  return { allowed: true, remaining: maxAttempts - row.attempts - 1 };
}
