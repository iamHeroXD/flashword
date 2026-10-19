"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CATEGORIES } from "@/data/categories";
import { sounds } from "@/lib/audio";
import { normalizeWord } from "@/data/words";
import {
  Play,
  RotateCcw,
  Pause,
  Timer,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Flame,
  Zap,
  Eye,
  Brain,
  Shield,
  Heart,
  Award,
  Share2,
  Check,
  Calendar,
  Grid,
  Layers,
} from "lucide-react";

type GameState = "idle" | "countdown" | "showing_words" | "words_hidden" | "recalling" | "paused" | "results";
type RecallInputMethod = "typing" | "choice";
type GameMode = "recall" | "classic" | "speed" | "survival" | "daily";

interface RoundWord {
  id: string;
  word: string;
  definition?: string;
  difficulty: string;
  choices: string[];
}

export default function PlayPage() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
            <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <PlayContent />
      </Suspense>
    </AuthProvider>
  );
}

function PlayContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Settings
  const [wordCount, setWordCount] = useState<number>(5);
  const [displayDuration, setDisplayDuration] = useState<number>(5);
  const [categoryId, setCategoryId] = useState<string>("mixed");
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard" | "expert">("normal");
  const [mode, setMode] = useState<GameMode>("recall");
  const [recallMethod, setRecallMethod] = useState<RecallInputMethod>("choice");
  const [recallViewMode, setRecallViewMode] = useState<"focus" | "grid">("focus");

  // Daily Challenge specific state
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [dailyChallengeId, setDailyChallengeId] = useState<string | null>(null);
  const [dailySeed, setDailySeed] = useState<number | null>(null);
  const [dailyDate, setDailyDate] = useState<string>("");
  const [dailyAlreadyCompleted, setDailyAlreadyCompleted] = useState<boolean>(false);

  // Survival & Speed Rush specific state
  const [lives, setLives] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [survivalRound, setSurvivalRound] = useState<number>(1);
  const [survivalBestStreak, setSurvivalBestStreak] = useState<number>(0);
  const [speedStage, setSpeedStage] = useState<number>(1);

  // Game Engine State
  const [gameState, setGameState] = useState<GameState>("idle");
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [roundWords, setRoundWords] = useState<RoundWord[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(5);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Recall stage state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // wordId -> selected answer or typed text
  const [activeRecallIdx, setActiveRecallIdx] = useState<number>(0);
  const [currentCombo, setCurrentCombo] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>("");
  const [submittedTypedWords, setSubmittedTypedWords] = useState<string[]>([]);
  const [recallStartTime, setRecallStartTime] = useState<number>(0);

  // Share button state
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Results state
  const [resultData, setResultData] = useState<{
    score: number;
    accuracy: number;
    baseScore: number;
    speedBonus: number;
    difficultyMultiplier: number;
    xpEarned: number;
    avgResponseTime?: number;
    newlyUnlocked: Array<{ name: string; icon: string; xpReward: number }>;
  } | null>(null);

  // Timers and Animation refs
  const timerStartRef = useRef<number>(0);
  const timerDurationRef = useRef<number>(0);
  const timerRemainingRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastStateBeforePauseRef = useRef<GameState>("showing_words");

  // Read URL query parameters to configure round mode
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "daily") {
      setMode("daily");
      setIsDailyChallenge(true);
      fetch("/api/daily")
        .then((res) => res.json())
        .then((data) => {
          if (data.challenge) {
            setWordCount(data.challenge.config.wordCount || 5);
            setDisplayDuration(data.challenge.config.displayDuration || 5);
            setCategoryId(data.challenge.config.categoryId || "mixed");
            setDifficulty(data.challenge.config.difficulty || "normal");
            setDailySeed(data.challenge.seed);
            setDailyChallengeId(data.challenge.id);
            setDailyDate(data.challenge.challengeDate);
            if (data.userAttempt?.completed) {
              setDailyAlreadyCompleted(true);
            }
          }
        })
        .catch(() => {});
    } else if (urlMode === "speed") {
      setMode("speed");
      setSpeedStage(1);
      setDisplayDuration(5);
    } else if (urlMode === "survival") {
      setMode("survival");
      setSurvivalRound(1);
      setLives(3);
      setIsGameOver(false);
      setWordCount(3);
    } else if (urlMode === "classic") {
      setMode("classic");
    } else {
      // Load saved preferences from localStorage
      try {
        const storedCount = localStorage.getItem("flashword_pref_count");
        const storedDuration = localStorage.getItem("flashword_pref_duration");
        const storedCat = localStorage.getItem("flashword_pref_category");
        const storedDiff = localStorage.getItem("flashword_pref_difficulty");
        const storedMode = localStorage.getItem("flashword_pref_mode");
        const storedMethod = localStorage.getItem("flashword_pref_method");

        if (storedCount) setWordCount(Number(storedCount));
        if (storedDuration) setDisplayDuration(Number(storedDuration));
        if (storedCat) setCategoryId(storedCat);
        if (storedDiff) setDifficulty(storedDiff as any);
        if (storedMode && ["recall", "classic", "speed", "survival"].includes(storedMode)) {
          setMode(storedMode as any);
        }
        if (storedMethod) setRecallMethod(storedMethod as any);
      } catch {}
    }
  }, [searchParams]);

  // Save preferences
  const savePreference = (key: string, val: string) => {
    try {
      localStorage.setItem(`flashword_pref_${key}`, val);
    } catch {}
  };

  // ----------------- GAME CONTROLS -----------------

  const startGame = async () => {
    // Reset temporary round states
    setUserAnswers({});
    setSubmittedTypedWords([]);
    setTypedInput("");
    setResultData(null);
    setActiveRecallIdx(0);
    setCurrentCombo(0);

    // Calculate effective duration & word count based on mode
    let effectiveDuration = displayDuration;
    let effectiveCount = wordCount;

    if (mode === "speed") {
      const speedDurations = [5.0, 4.2, 3.5, 2.8, 2.2, 1.8, 1.4, 1.0];
      effectiveDuration = speedDurations[Math.min(speedStage - 1, speedDurations.length - 1)];
    } else if (mode === "survival") {
      effectiveCount = Math.min(15, 3 + (survivalRound - 1));
    }

    try {
      const res = await fetch("/api/game/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          wordCount: effectiveCount,
          difficulty,
          mode,
          seed: mode === "daily" ? dailySeed : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.words || data.words.length === 0) {
        throw new Error("Failed to load round words");
      }

      setRoundWords(data.words);
      startCountdown(effectiveDuration);
    } catch (e) {
      console.error(e);
      alert("Error starting round. Please try again.");
    }
  };

  // 3-2-1 Countdown
  const startCountdown = (duration: number) => {
    setGameState("countdown");
    setCountdownNum(3);
    sounds.tick(false);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdownNum(count);

      if (count > 0) {
        sounds.tick(false);
      } else if (count === 0) {
        sounds.tick(true);
      } else {
        clearInterval(interval);
        beginFlashStage(duration);
      }
    }, 750);
  };

  // FLASH STAGE
  const beginFlashStage = useCallback((duration: number) => {
    setGameState("showing_words");
    sounds.start();

    timerStartRef.current = performance.now();
    timerDurationRef.current = duration;
    timerRemainingRef.current = duration;
    setTimeRemaining(duration);

    const tick = () => {
      const now = performance.now();
      const elapsed = (now - timerStartRef.current) / 1000;
      const remaining = Math.max(0, timerDurationRef.current - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        finishFlashStage();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const finishFlashStage = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    sounds.cardFlip();

    if (mode === "classic") {
      handleSubmitClassic();
    } else {
      setGameState("recalling");
      setActiveRecallIdx(0);
      setRecallStartTime(Date.now());
    }
  };

  // PAUSE / RESUME
  const togglePause = () => {
    if (gameState === "paused") {
      setIsPaused(false);
      setGameState(lastStateBeforePauseRef.current);
      if (lastStateBeforePauseRef.current === "showing_words") {
        timerStartRef.current = performance.now() - (timerDurationRef.current - timerRemainingRef.current) * 1000;
        const tick = () => {
          const now = performance.now();
          const elapsed = (now - timerStartRef.current) / 1000;
          const remaining = Math.max(0, timerDurationRef.current - elapsed);
          setTimeRemaining(remaining);

          if (remaining <= 0) {
            finishFlashStage();
          } else {
            animFrameRef.current = requestAnimationFrame(tick);
          }
        };
        animFrameRef.current = requestAnimationFrame(tick);
      }
    } else if (gameState === "showing_words" || gameState === "recalling") {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      lastStateBeforePauseRef.current = gameState;
      timerRemainingRef.current = timeRemaining;
      setIsPaused(true);
      setGameState("paused");
    }
  };

  // RESET
  const resetGame = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setGameState("idle");
    setIsPaused(false);
    setSurvivalRound(1);
    setSpeedStage(1);
    setLives(3);
    setIsGameOver(false);
    setResultData(null);
  };

  // Tab blur pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === "showing_words") {
        togglePause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [gameState]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ----------------- RECALL STAGE LOGIC -----------------

  const handleSelectChoice = (wordId: string, choiceText: string, cardIndex?: number) => {
    const targetWord = roundWords.find((w) => w.id === wordId);
    const isCorrect = targetWord && normalizeWord(targetWord.word) === normalizeWord(choiceText);

    if (isCorrect) {
      const nextCombo = currentCombo + 1;
      setCurrentCombo(nextCombo);
      sounds.combo(nextCombo);
    } else {
      setCurrentCombo(0);
      sounds.tick(true);
    }

    setUserAnswers((prev) => ({
      ...prev,
      [wordId]: choiceText,
    }));

    // Auto-advance in Focus Mode to next unanswered card
    if (recallViewMode === "focus") {
      const nextUnanswered = roundWords.findIndex(
        (w, i) => i > (cardIndex ?? activeRecallIdx) && !userAnswers[w.id] && w.id !== wordId
      );
      if (nextUnanswered !== -1) {
        setActiveRecallIdx(nextUnanswered);
      } else if (typeof cardIndex === "number" && cardIndex + 1 < roundWords.length) {
        setActiveRecallIdx(cardIndex + 1);
      }
    }
  };

  const handleAddTypedWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;

    const norm = normalizeWord(typedInput);
    if (submittedTypedWords.map(normalizeWord).includes(norm)) {
      setTypedInput("");
      return;
    }

    // Check if entered word was in round
    const matchedWord = roundWords.find((w) => normalizeWord(w.word) === norm);
    if (matchedWord) {
      const nextCombo = currentCombo + 1;
      setCurrentCombo(nextCombo);
      sounds.combo(nextCombo);
    } else {
      sounds.tick(true);
    }

    setSubmittedTypedWords((prev) => [...prev, typedInput.trim()]);
    setTypedInput("");
  };

  const removeTypedWord = (word: string) => {
    setSubmittedTypedWords((prev) => prev.filter((w) => w !== word));
  };

  // Submit Classic round
  const handleSubmitClassic = async () => {
    setGameState("results");
    sounds.roundComplete();

    try {
      const res = await fetch("/api/game/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "classic",
          categoryId,
          wordCount,
          displayDuration,
          difficulty,
          answers: roundWords.map((w) => ({
            wordId: w.id,
            wordText: w.word,
            wasCorrect: true,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultData({
          score: data.breakdown.totalScore,
          accuracy: 100,
          baseScore: data.breakdown.baseScore,
          speedBonus: data.breakdown.speedBonus,
          difficultyMultiplier: data.breakdown.difficultyMultiplier,
          xpEarned: data.breakdown.xpEarned,
          newlyUnlocked: data.newlyUnlockedAchievements || [],
        });
      }
    } catch {}
  };

  // Submit Recall round
  const handleSubmitRecall = async () => {
    const elapsedRecallTime = Date.now() - recallStartTime;
    const avgResponseTime = Math.round(elapsedRecallTime / Math.max(1, roundWords.length));

    let answersPayload: Array<{
      wordId: string;
      wordText: string;
      answerText: string;
      wasCorrect: boolean;
      responseTimeMs: number;
    }> = [];

    if (recallMethod === "choice") {
      answersPayload = roundWords.map((w) => {
        const selected = userAnswers[w.id] || "";
        const correct = normalizeWord(selected) === normalizeWord(w.word);
        return {
          wordId: w.id,
          wordText: w.word,
          answerText: selected,
          wasCorrect: correct,
          responseTimeMs: avgResponseTime,
        };
      });
    } else {
      const typedNorms = new Set(submittedTypedWords.map(normalizeWord));
      answersPayload = roundWords.map((w) => {
        const correct = typedNorms.has(normalizeWord(w.word));
        return {
          wordId: w.id,
          wordText: w.word,
          answerText: correct ? w.word : "",
          wasCorrect: correct,
          responseTimeMs: avgResponseTime,
        };
      });
    }

    const correctCount = answersPayload.filter((a) => a.wasCorrect).length;
    const accuracy = Math.round((correctCount / roundWords.length) * 100);

    if (accuracy >= 80) {
      sounds.roundComplete();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#FFFFFF", "#E4E4E7", "#A1A1AA", "#EF4444", "#DC2626"],
      });
    } else {
      sounds.incorrect();
    }

    // Mode-specific progression / lives
    if (mode === "survival") {
      if (accuracy >= 80) {
        setSurvivalRound((r) => {
          const next = r + 1;
          setSurvivalBestStreak((cur) => Math.max(cur, next - 1));
          return next;
        });
      } else {
        const remainingLives = lives - 1;
        setLives(remainingLives);
        sounds.heartLoss();
        if (remainingLives <= 0) {
          setIsGameOver(true);
        }
      }
    } else if (mode === "speed") {
      if (accuracy >= 80) {
        setSpeedStage((s) => s + 1);
      }
    }

    setGameState("results");

    try {
      const res = await fetch("/api/game/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          categoryId,
          wordCount: roundWords.length,
          displayDuration,
          difficulty,
          survivalRound,
          isDailyChallenge,
          dailyChallengeId,
          answers: answersPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultData({
          score: data.breakdown.totalScore,
          accuracy: data.breakdown.accuracy,
          baseScore: data.breakdown.baseScore,
          speedBonus: data.breakdown.speedBonus,
          difficultyMultiplier: data.breakdown.difficultyMultiplier,
          xpEarned: data.breakdown.xpEarned,
          avgResponseTime,
          newlyUnlocked: data.newlyUnlockedAchievements || [],
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Next round
  const handleNextRound = () => {
    if (isGameOver) {
      resetGame();
    } else {
      startGame();
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        if (gameState === "idle") {
          e.preventDefault();
          startGame();
        } else if (gameState === "showing_words") {
          e.preventDefault();
          togglePause();
        } else if (gameState === "results") {
          e.preventDefault();
          handleNextRound();
        }
      } else if (e.code === "KeyR" && (gameState === "results" || gameState === "idle")) {
        e.preventDefault();
        if (isGameOver) {
          resetGame();
        } else {
          startGame();
        }
      } else if (e.code === "KeyS" && gameState === "results") {
        e.preventDefault();
        resetGame();
      } else if (e.code === "Escape") {
        if (gameState === "showing_words" || gameState === "paused") {
          e.preventDefault();
          togglePause();
        }
      } else if (gameState === "recalling" && recallMethod === "choice") {
        // Choice hotkeys 1, 2, 3, 4
        if (["Digit1", "Digit2", "Digit3", "Digit4", "Numpad1", "Numpad2", "Numpad3", "Numpad4"].includes(e.code)) {
          const choiceIdx = parseInt(e.key, 10) - 1;
          const currentCard = roundWords[activeRecallIdx] || roundWords[0];
          if (currentCard && currentCard.choices && currentCard.choices[choiceIdx]) {
            e.preventDefault();
            handleSelectChoice(currentCard.id, currentCard.choices[choiceIdx], activeRecallIdx);
          }
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          setActiveRecallIdx((prev) => Math.min(roundWords.length - 1, prev + 1));
        } else if (e.code === "ArrowLeft") {
          e.preventDefault();
          setActiveRecallIdx((prev) => Math.max(0, prev - 1));
        } else if (e.code === "Enter") {
          e.preventDefault();
          handleSubmitRecall();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, activeRecallIdx, roundWords, recallMethod, isGameOver]);

  // Social Share
  const handleShareScore = () => {
    if (!resultData) return;
    const grade =
      resultData.accuracy === 100 ? "S+" : resultData.accuracy >= 80 ? "A" : resultData.accuracy >= 60 ? "B" : "C";
    const modeName =
      mode === "daily"
        ? `Daily Challenge #${dailyDate || "Official"}`
        : mode === "speed"
        ? `Speed Rush (Stage ${speedStage})`
        : mode === "survival"
        ? `Survival (Stage ${survivalRound})`
        : `${mode.toUpperCase()} Mode`;

    const text = `⚡ FLASHWORD — ${modeName}\n🏆 Score: ${resultData.score.toLocaleString()} PTS | Tier: ${grade}\n🎯 Accuracy: ${resultData.accuracy}%\n⏱ Speed: ${resultData.avgResponseTime || 500}ms/word\nPlay now: https://vibrant-chandrasekhar.vercel.app/play`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  };

  // Performance Grade Helper
  const getGradeInfo = (accuracy: number) => {
    if (accuracy === 100) return { grade: "S+", title: "Apex Memory", border: "border-white text-white" };
    if (accuracy >= 85) return { grade: "S", title: "Flawless Retention", border: "border-zinc-300 text-zinc-200" };
    if (accuracy >= 75) return { grade: "A", title: "High Focus", border: "border-zinc-400 text-zinc-300" };
    if (accuracy >= 60) return { grade: "B", title: "Solid Recall", border: "border-zinc-500 text-zinc-400" };
    if (accuracy >= 40) return { grade: "C", title: "Developing Reflex", border: "border-zinc-600 text-zinc-400" };
    return { grade: "D", title: "Keep Training", border: "border-red-500 text-red-400" };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />
      <AuthModal />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center justify-center">
        {/* ==================== 1. IDLE / SETUP SCREEN ==================== */}
        {gameState === "idle" && (
          <div className="w-full max-w-3xl animate-fadeIn">
            {/* Mode Specific Badges */}
            {mode === "daily" ? (
              <div className="p-4 rounded-xl bg-zinc-950 border border-white/15 text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono font-bold mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  OFFICIAL DAILY CHALLENGE • {dailyDate || "TODAY"}
                </div>
                <h1 className="text-2xl font-black text-white">Universal Global Seed</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  {dailyAlreadyCompleted
                    ? "You already completed today's official challenge! Playing now is practice mode."
                    : "Everyone in the world sees the exact same words today. 1 official score submission."}
                </p>
              </div>
            ) : mode === "survival" ? (
              <div className="p-4 rounded-xl bg-zinc-950 border border-red-500/30 text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {[1, 2, 3].map((heart) => (
                    <Heart
                      key={heart}
                      className={`w-5 h-5 ${
                        heart <= lives ? "text-red-500 fill-red-500 animate-pulse" : "text-zinc-700 fill-zinc-800"
                      }`}
                    />
                  ))}
                </div>
                <h1 className="text-2xl font-black text-white">Survival Mode — Stage {survivalRound}</h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Achieve at least 80% accuracy each stage. Lose 3 lives and the run ends!
                </p>
              </div>
            ) : mode === "speed" ? (
              <div className="p-4 rounded-xl bg-zinc-950 border border-white/15 text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  SPEED RUSH GAUNTLET • STAGE {speedStage}
                </div>
                <h1 className="text-2xl font-black text-white">Escalating Multipliers</h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Flash duration shrinks each stage. Test your peripheral reaction time!
                </p>
              </div>
            ) : (
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Configure Your Round
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
                  Adjust words, timer, category, and game mode to your training preference.
                </p>
              </div>
            )}

            <div className="space-y-6 clay-card p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-white/10">
              {/* CONTROL A: Word Count */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  A. Number of Words Displayed
                </label>
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {[1, 5, 10, 15, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={mode === "daily"}
                      onClick={() => {
                        setWordCount(cnt);
                        savePreference("count", String(cnt));
                      }}
                      className={`py-3 rounded-xl text-center text-sm sm:text-base font-bold transition-all ${
                        wordCount === cnt
                          ? "bg-white text-black shadow-[0_1px_8px_rgba(255,255,255,0.25)]"
                          : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/25"
                      } ${mode === "daily" ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {cnt}
                      <span className="block text-[10px] font-medium opacity-80">
                        {cnt === 1 ? "word" : "words"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTROL B: Display Duration */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    B. Flash Duration
                  </label>
                  <span className="text-sm font-mono font-bold text-white">
                    {displayDuration} seconds
                  </span>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-3">
                  {[3, 5, 8, 10, 15].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      disabled={mode === "daily" || mode === "speed"}
                      onClick={() => {
                        setDisplayDuration(sec);
                        savePreference("duration", String(sec));
                      }}
                      className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        displayDuration === sec
                          ? "bg-white text-black shadow-[0_1px_8px_rgba(255,255,255,0.25)]"
                          : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/25"
                      } ${mode === "daily" || mode === "speed" ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>

                {/* Custom Slider */}
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  disabled={mode === "daily" || mode === "speed"}
                  value={displayDuration}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDisplayDuration(val);
                    savePreference("duration", String(val));
                  }}
                  className="w-full accent-white cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-medium mt-1">
                  <span>1s (Rapid)</span>
                  <span>15s (Standard)</span>
                  <span>30s (Extended)</span>
                </div>
              </div>

              {/* CONTROL C: Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  C. Word Category
                </label>
                <select
                  value={categoryId}
                  disabled={mode === "daily"}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    savePreference("category", e.target.value);
                  }}
                  className={`w-full py-3 px-4 rounded-xl bg-zinc-900 border border-white/10 text-sm font-bold text-white cursor-pointer focus:border-white focus:outline-none ${
                    mode === "daily" ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.slug} className="bg-zinc-900 text-white">
                      {cat.name} ({cat.difficulty.toUpperCase()})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 mt-1.5 font-medium">
                  {CATEGORIES.find((c) => c.slug === categoryId)?.description}
                </p>
              </div>

              {/* CONTROL D & E: Difficulty and Game Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    D. Difficulty
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["easy", "normal", "hard", "expert"] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        disabled={mode === "daily"}
                        onClick={() => {
                          setDifficulty(diff);
                          savePreference("difficulty", diff);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                          difficulty === diff
                            ? "bg-white text-black shadow-[0_1px_8px_rgba(255,255,255,0.25)]"
                            : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                        } ${mode === "daily" ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    E. Game Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "recall", label: "Recall Test", icon: Brain },
                      { id: "classic", label: "Classic Flash", icon: Eye },
                      { id: "speed", label: "Speed Rush", icon: Zap },
                      { id: "survival", label: "Survival", icon: Shield },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMode(m.id as any);
                          setIsDailyChallenge(false);
                          savePreference("mode", m.id);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          mode === m.id
                            ? "bg-white text-black shadow-[0_1px_8px_rgba(255,255,255,0.25)]"
                            : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <m.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recall Mode Preferences (if recall/speed/survival/daily) */}
              {mode !== "classic" && (
                <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-400 font-bold">
                    Recall Input Method:
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecallMethod("choice");
                        savePreference("method", "choice");
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        recallMethod === "choice"
                          ? "bg-white text-black shadow-[0_1px_6px_rgba(255,255,255,0.2)]"
                          : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Multiple Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecallMethod("typing");
                        savePreference("method", "typing");
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        recallMethod === "typing"
                          ? "bg-white text-black shadow-[0_1px_6px_rgba(255,255,255,0.2)]"
                          : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Type Words
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                  <span>Selected:</span>
                  <span className="font-bold text-white">
                    {wordCount} words • {displayDuration}s • {CATEGORIES.find((c) => c.slug === categoryId)?.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setWordCount(5);
                      setDisplayDuration(5);
                      setCategoryId("mixed");
                      setDifficulty("normal");
                      setMode("recall");
                      setIsDailyChallenge(false);
                    }}
                    className="btn-secondary py-2.5 px-5 text-xs font-semibold"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={startGame}
                    className="btn-primary flex-1 sm:flex-none py-3 px-8 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Game
                    <span className="kbd-shortcut bg-zinc-200 border-zinc-300 text-zinc-900 hidden sm:inline-block">
                      Space
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. COUNTDOWN SCREEN ==================== */}
        {gameState === "countdown" && (
          <div className="text-center animate-fadeIn py-20 flex flex-col items-center">
            <span className="clay-badge text-[var(--accent-primary)] font-extrabold mb-5">
              FOCUS & MEMORIZE
            </span>
            <div className="w-32 h-32 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-active)] shadow-[var(--clay-card-shadow)] flex items-center justify-center">
              <span className="text-6xl font-mono font-black text-white drop-shadow-md">
                {countdownNum === 0 ? "GO" : countdownNum}
              </span>
            </div>
          </div>
        )}

        {/* ==================== 3. SHOWING WORDS (FLASH STAGE) ==================== */}
        {gameState === "showing_words" && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            {/* Gameplay Compact Header */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-6 pb-3.5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePause}
                  className="p-2.5 rounded-2xl clay-card bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-white transition-all flex items-center gap-1.5 shadow-[var(--clay-pill-shadow)]"
                  title="Pause game"
                >
                  <Pause className="w-4 h-4" />
                  <span className="kbd-shortcut hidden sm:inline-block">Space</span>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[var(--accent-primary)] uppercase tracking-wider block">
                      {mode.toUpperCase()} MODE
                    </span>
                    {mode === "survival" && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((heart) => (
                          <Heart
                            key={heart}
                            className={`w-3.5 h-3.5 ${
                              heart <= lives ? "text-red-500 fill-red-500 drop-shadow-sm" : "text-slate-600 fill-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    {CATEGORIES.find((c) => c.slug === categoryId)?.name}
                  </span>
                </div>
              </div>

              {/* Central Timer */}
              <div className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 border border-white/15">
                <Timer
                  className={`w-4 h-4 ${
                    timeRemaining <= 2 ? "text-red-500 animate-pulse" : "text-white"
                  }`}
                />
                <span
                  className={`text-2xl font-mono font-bold tracking-wider ${
                    timeRemaining <= 2 ? "text-red-500 animate-pulse" : "text-white"
                  }`}
                >
                  {timeRemaining.toFixed(1)}s
                </span>
              </div>

              <button
                onClick={resetGame}
                className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                title="Abandon round"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Timer Progress Bar */}
            <div className="w-full max-w-4xl h-2 bg-zinc-900 rounded-full mb-8 overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  timeRemaining <= 2
                    ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                    : "bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                }`}
                style={{ width: `${(timeRemaining / timerDurationRef.current) * 100}%` }}
              />
            </div>

            {/* Word Grid Layout (Clean High-Contrast Minimalist Tiles) */}
            <div
              className={`w-full max-w-4xl gap-3 sm:gap-4 ${
                roundWords.length === 1
                  ? "flex items-center justify-center py-12"
                  : roundWords.length <= 5
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                  : roundWords.length <= 10
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                  : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
              }`}
            >
              {roundWords.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 transition-all ${
                    roundWords.length === 1 ? "max-w-md w-full py-16" : ""
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-zinc-400 mb-2 px-2 py-0.5 rounded bg-zinc-800 border border-white/10">
                    #{String(index + 1).padStart(2, "0")}
                  </span>
                  <div
                    className={`font-mono font-bold tracking-wider text-white uppercase select-none ${
                      roundWords.length === 1
                        ? "text-3xl sm:text-5xl"
                        : roundWords.length <= 5
                        ? "text-xl sm:text-2xl"
                        : "text-sm sm:text-base"
                    }`}
                  >
                    {item.word}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 4. PAUSED OVERLAY ==================== */}
        {gameState === "paused" && (
          <div className="text-center p-8 max-w-md w-full rounded-2xl bg-zinc-950 border border-white/15 animate-fadeIn">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center mx-auto mb-3.5">
              <Pause className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Game Paused</h2>
            <p className="text-xs text-zinc-400 mb-6 font-medium">
              Timer frozen at {timeRemaining.toFixed(1)}s. Take a breather.
            </p>

            <div className="flex flex-col gap-3">
              <button onClick={togglePause} className="btn-primary py-3 text-sm font-bold">
                Resume Game
              </button>
              <button onClick={resetGame} className="btn-secondary py-2.5 text-xs font-semibold">
                Abandon Round & Return to Setup
              </button>
            </div>
          </div>
        )}

        {/* ==================== 5. RECALL STAGE ==================== */}
        {gameState === "recalling" && (
          <div className="w-full max-w-4xl flex flex-col items-center animate-fadeIn">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-1">
                <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                  RECALL STAGE
                </span>
                {currentCombo >= 2 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-[10px] font-bold">
                    ⚡ {currentCombo}x STREAK
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                What words were displayed?
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {recallMethod === "choice"
                  ? "Select the word you remember, or press keys [1]-[4]."
                  : "Type each remembered word and press Enter."}
              </p>
            </div>

            {/* MULTIPLE CHOICE METHOD */}
            {recallMethod === "choice" && (
              <div className="w-full space-y-6 mb-8">
                {/* View Mode Toggle & Step Dots */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 pb-4 border-b border-white/10 text-xs">
                  {/* Step dots */}
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {roundWords.map((_, i) => {
                      const isAnswered = !!userAnswers[roundWords[i].id];
                      const isCurrent = activeRecallIdx === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveRecallIdx(i)}
                          className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                            isCurrent
                              ? "bg-white text-black shadow-[0_1px_6px_rgba(255,255,255,0.3)] scale-105"
                              : isAnswered
                              ? "bg-green-500 text-black font-bold"
                              : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {isAnswered ? "✓" : i + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Focus vs Grid Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecallViewMode("focus")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        recallViewMode === "focus"
                          ? "bg-white text-black"
                          : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" /> Focus Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecallViewMode("grid")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        recallViewMode === "grid"
                          ? "bg-white text-black"
                          : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" /> Grid View
                    </button>
                  </div>
                </div>

                {/* 1. FOCUS VIEW (Card-by-Card Rapid Fire) */}
                {recallViewMode === "focus" && roundWords[activeRecallIdx] && (
                  <div className="w-full max-w-xl mx-auto p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-white/10 animate-fadeIn">
                    <div className="flex items-center justify-between mb-5 text-xs font-mono">
                      <span className="clay-badge text-white font-bold bg-zinc-900 border-white/15">
                        CARD {activeRecallIdx + 1} OF {roundWords.length}
                      </span>
                      <span className="text-zinc-400 font-semibold">
                        Answered: {Object.keys(userAnswers).length} / {roundWords.length}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      {roundWords[activeRecallIdx].choices.map((choice, choiceIdx) => {
                        const selected = userAnswers[roundWords[activeRecallIdx].id] === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() =>
                              handleSelectChoice(roundWords[activeRecallIdx].id, choice, activeRecallIdx)
                            }
                            className={`w-full p-4 rounded-xl text-sm sm:text-base font-bold transition-all text-left flex items-center justify-between group ${
                              selected
                                ? "bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.2)] scale-101"
                                : "bg-zinc-900 border border-white/10 text-zinc-200 hover:text-white hover:border-white/30 hover:bg-zinc-850"
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <span
                                className={`w-6 h-6 rounded font-mono text-xs font-bold flex items-center justify-center ${
                                  selected
                                    ? "bg-zinc-200 text-black"
                                    : "bg-zinc-800 text-zinc-400 border border-white/10"
                                }`}
                              >
                                {choiceIdx + 1}
                              </span>
                              <span className="tracking-wide">{choice}</span>
                            </div>
                            {selected && <Check className="w-5 h-5 text-black stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Step Navigation Arrows */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                      <button
                        type="button"
                        disabled={activeRecallIdx === 0}
                        onClick={() => setActiveRecallIdx((p) => Math.max(0, p - 1))}
                        className="btn-secondary px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Previous Card
                      </button>

                      <button
                        type="button"
                        disabled={activeRecallIdx === roundWords.length - 1}
                        onClick={() => setActiveRecallIdx((p) => Math.min(roundWords.length - 1, p + 1))}
                        className="btn-secondary px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        Next Card <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. GRID VIEW (All Cards at Once) */}
                {recallViewMode === "grid" && (
                  <div className="space-y-4">
                    {roundWords.map((item, idx) => {
                      const isCurrentActive = activeRecallIdx === idx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setActiveRecallIdx(idx)}
                          className={`p-4 sm:p-5 rounded-xl bg-zinc-950 border transition-all ${
                            isCurrentActive ? "border-white shadow-lg" : "border-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3 text-xs text-zinc-400">
                            <span className="font-bold text-white font-mono">
                              POSITION #{String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="text-[11px] font-medium">Select 1 of 4:</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {item.choices.map((choice, choiceIdx) => {
                              const selected = userAnswers[item.id] === choice;
                              return (
                                <button
                                  key={choice}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectChoice(item.id, choice, idx);
                                  }}
                                  className={`p-3.5 rounded-lg text-xs sm:text-sm font-bold transition-all text-center relative flex items-center justify-center ${
                                    selected
                                      ? "bg-white text-black shadow-md scale-101"
                                      : "bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-white/25"
                                  }`}
                                >
                                  <span className="absolute top-1.5 left-2 text-[9px] font-mono opacity-50">
                                    {choiceIdx + 1}
                                  </span>
                                  <span>{choice}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Submit Recall Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitRecall}
                    className="w-full btn-primary py-3.5 text-base font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <span>
                      Submit Answers ({Object.keys(userAnswers).length} / {roundWords.length} completed)
                    </span>
                    <span className="kbd-shortcut bg-zinc-200 border-zinc-300 text-zinc-900">Enter</span>
                  </button>
                </div>
              </div>
            )}

            {/* TYPING METHOD */}
            {recallMethod === "typing" && (
              <div className="w-full max-w-xl space-y-6 mb-8">
                <form onSubmit={handleAddTypedWord} className="flex gap-2.5">
                  <input
                    type="text"
                    autoFocus
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder="Type a remembered word and press Enter..."
                    className="flex-1 px-4 py-3 text-sm rounded-xl bg-zinc-900 border border-white/10 text-white font-bold placeholder:font-normal placeholder:text-zinc-500 focus:border-white focus:outline-none"
                  />
                  <button type="submit" className="btn-primary py-3 px-6 text-sm font-bold rounded-xl">
                    Add
                  </button>
                </form>

                {/* Submitted Chips */}
                <div className="min-h-[90px] p-5 rounded-xl bg-zinc-950 border border-white/10">
                  <span className="text-xs text-zinc-400 block mb-3 font-semibold">
                    Your Recalled Words ({submittedTypedWords.length} / {roundWords.length} entered):
                  </span>
                  {submittedTypedWords.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">
                      Type words above as you remember them. Order does not matter.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {submittedTypedWords.map((w) => (
                        <span
                          key={w}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-white/15 text-xs font-bold text-white"
                        >
                          {w}
                          <button
                            type="button"
                            onClick={() => removeTypedWord(w)}
                            className="text-zinc-400 hover:text-red-400 font-bold ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitRecall}
                  className="w-full btn-primary py-3.5 text-base font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <span>Submit ({submittedTypedWords.length} / {roundWords.length} words entered)</span>
                  <span className="kbd-shortcut bg-zinc-200 border-zinc-300 text-zinc-900">Enter</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== 6. RESULTS SCREEN ==================== */}
        {gameState === "results" && resultData && (
          <div className="w-full max-w-2xl animate-fadeIn space-y-5">
            {/* Header Tier Banner */}
            <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-white/10 text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full clay-badge text-zinc-300 font-bold mb-4 bg-zinc-900 border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                {isGameOver
                  ? "SURVIVAL RUN CONCLUDED"
                  : isDailyChallenge
                  ? "OFFICIAL DAILY CHALLENGE RECORDED"
                  : "ROUND COMPLETE"}
              </div>

              {/* Tier Grade Display */}
              {(() => {
                const info = getGradeInfo(resultData.accuracy);
                return (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-3">
                    <div
                      className={`w-20 h-20 rounded-2xl border-2 ${info.border} bg-zinc-900 flex flex-col items-center justify-center shadow-lg`}
                    >
                      <span className="text-3xl font-mono font-black leading-none">{info.grade}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-1">
                        {info.title}
                      </span>
                    </div>

                    <div className="text-center sm:text-left">
                      <h2 className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight">
                        {resultData.score.toLocaleString()} PTS
                      </h2>
                      <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5">
                        <span className="text-xs font-bold text-green-400">
                          +{resultData.xpEarned} XP Earned
                        </span>
                        {typeof resultData.avgResponseTime === "number" && (
                          <span className="text-xs font-mono font-semibold text-zinc-400">
                            • {resultData.avgResponseTime}ms / word
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Survival Hearts status */}
              {mode === "survival" && (
                <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-center gap-2.5">
                  <span className="text-xs text-zinc-400 font-bold">Lives Remaining:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((heart) => (
                      <Heart
                        key={heart}
                        className={`w-4 h-4 ${
                          heart <= lives ? "text-red-500 fill-red-500" : "text-zinc-700 fill-zinc-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Score Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Accuracy</span>
                <span className="text-2xl font-mono font-black text-white">{resultData.accuracy}%</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                  {mode === "survival" ? "Stage Cleared" : mode === "speed" ? "Speed Stage" : "Difficulty"}
                </span>
                <span className="text-2xl font-mono font-black text-white">
                  {mode === "survival" ? survivalRound : mode === "speed" ? speedStage : `${resultData.difficultyMultiplier}x`}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Speed Bonus</span>
                <span className="text-2xl font-mono font-black text-red-400">
                  +{resultData.speedBonus}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Mode</span>
                <span className="text-2xl font-mono font-black text-white capitalize">{mode}</span>
              </div>
            </div>

            {/* Unlocked Achievements Banner */}
            {resultData.newlyUnlocked.length > 0 && (
              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/15 text-white">
                <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                  <Award className="w-5 h-5 text-red-400" />
                  <span>Achievement Unlocked!</span>
                </div>
                {resultData.newlyUnlocked.map((ach) => (
                  <div key={ach.name} className="text-xs text-zinc-300 font-medium">
                    <strong className="text-white font-bold">{ach.name}</strong> — +{ach.xpReward} XP
                  </div>
                ))}
              </div>
            )}

            {/* Word Review List */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3.5">
                Round Word Review
              </h3>
              <div className="divide-y divide-white/10">
                {roundWords.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white mr-2">{item.word}</span>
                      <span className="text-[11px] text-zinc-400">{item.definition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleNextRound}
                className="flex-1 btn-primary py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl"
              >
                <Play className="w-4 h-4 fill-current" />
                {isGameOver ? "Play Again (Reset)" : mode === "survival" ? "Next Stage →" : "Play Again"}
                <span className="kbd-shortcut bg-zinc-200 border-zinc-300 text-zinc-900">Space</span>
              </button>

              <button
                type="button"
                onClick={handleShareScore}
                className="btn-secondary py-3.5 px-5 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-xl"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-green-400 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Share Score</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetGame}
                className="btn-secondary py-3.5 px-6 text-xs font-semibold flex items-center justify-center gap-2 rounded-xl"
              >
                Setup <span className="kbd-shortcut">S</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
