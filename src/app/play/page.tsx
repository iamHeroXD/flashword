"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
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
  HelpCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Eye,
  Brain,
  Shield,
  Volume2,
  VolumeX,
  Award,
} from "lucide-react";

type GameState = "idle" | "countdown" | "showing_words" | "words_hidden" | "recalling" | "paused" | "results";
type RecallInputMethod = "typing" | "choice";

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
      <PlayContent />
    </AuthProvider>
  );
}

function PlayContent() {
  const { user } = useAuth();

  // Settings
  const [wordCount, setWordCount] = useState<number>(5);
  const [displayDuration, setDisplayDuration] = useState<number>(5);
  const [categoryId, setCategoryId] = useState<string>("mixed");
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard" | "expert">("normal");
  const [mode, setMode] = useState<"recall" | "classic" | "speed" | "survival">("recall");
  const [recallMethod, setRecallMethod] = useState<RecallInputMethod>("choice");
  const [skipCountdown, setSkipCountdown] = useState<boolean>(false);

  // Game Engine State
  const [gameState, setGameState] = useState<GameState>("idle");
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [roundWords, setRoundWords] = useState<RoundWord[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(5);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [survivalRound, setSurvivalRound] = useState<number>(1);
  const [survivalBestStreak, setSurvivalBestStreak] = useState<number>(0);

  // Recall stage state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // wordId -> selected answer or typed text
  const [typedInput, setTypedInput] = useState<string>("");
  const [submittedTypedWords, setSubmittedTypedWords] = useState<string[]>([]);
  const [recallStartTime, setRecallStartTime] = useState<number>(0);

  const [activeRecallIdx, setActiveRecallIdx] = useState<number>(0);

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

  // Load preferences from localStorage on mount
  useEffect(() => {
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
      if (storedMode) setMode(storedMode as any);
      if (storedMethod) setRecallMethod(storedMethod as any);
    } catch {}
  }, []);

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

    // Speed rush mode duration adjustment
    let effectiveDuration = displayDuration;
    if (mode === "speed") {
      effectiveDuration = Math.max(1.5, displayDuration - (survivalRound - 1) * 0.5);
    }

    try {
      const res = await fetch("/api/game/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          wordCount,
          difficulty,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.words || data.words.length === 0) {
        alert("Failed to load words for this category. Please try another category.");
        return;
      }

      setRoundWords(data.words);
      timerDurationRef.current = effectiveDuration;
      timerRemainingRef.current = effectiveDuration;
      setTimeRemaining(effectiveDuration);

      if (skipCountdown) {
        beginFlashStage(effectiveDuration);
      } else {
        setGameState("countdown");
        setCountdownNum(3);
        sounds.tick(false);
      }
    } catch (e) {
      console.error(e);
      alert("Error preparing round.");
    }
  };

  // Countdown loop
  useEffect(() => {
    if (gameState !== "countdown") return;

    if (countdownNum > 1) {
      const t = setTimeout(() => {
        sounds.tick(false);
        setCountdownNum((prev) => prev - 1);
      }, 900);
      return () => clearTimeout(t);
    } else if (countdownNum === 1) {
      const t = setTimeout(() => {
        sounds.start();
        setCountdownNum(0); // "GO!"
        setTimeout(() => {
          beginFlashStage(timerDurationRef.current);
        }, 400);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [gameState, countdownNum]);

  // High-precision timestamp-based timer loop
  const beginFlashStage = useCallback((duration: number) => {
    setGameState("showing_words");
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
        // Time expired! Transition to next phase
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
      // Classic flash mode reveals complete results
      handleSubmitClassic();
    } else {
      // Recall, speed rush, or survival moves to recall stage
      setGameState("recalling");
      setRecallStartTime(Date.now());
    }
  };

  // PAUSE / RESUME
  const togglePause = () => {
    if (gameState === "paused") {
      // Resume
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
      // Pause
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
    setResultData(null);
  };

  // Visibility change handling (Pause on tab blur to ensure fair gameplay)
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
    sounds.tick(true);
    setUserAnswers((prev) => ({
      ...prev,
      [wordId]: choiceText,
    }));
    if (typeof cardIndex === "number" && cardIndex + 1 < roundWords.length) {
      setActiveRecallIdx(cardIndex + 1);
    }
  };

  // Keyboard controls for speed & flow
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
        startGame();
      } else if (e.code === "KeyS" && gameState === "results") {
        e.preventDefault();
        resetGame();
      } else if (e.code === "Escape") {
        if (gameState === "showing_words" || gameState === "paused") {
          e.preventDefault();
          togglePause();
        }
      } else if (gameState === "recalling" && recallMethod === "choice") {
        if (["Digit1", "Digit2", "Digit3", "Digit4", "Numpad1", "Numpad2", "Numpad3", "Numpad4"].includes(e.code)) {
          const choiceIdx = parseInt(e.key, 10) - 1;
          const currentCard = roundWords[activeRecallIdx] || roundWords[0];
          if (currentCard && currentCard.choices && currentCard.choices[choiceIdx]) {
            e.preventDefault();
            handleSelectChoice(currentCard.id, currentCard.choices[choiceIdx], activeRecallIdx);
          }
        } else if (e.code === "Enter") {
          e.preventDefault();
          handleSubmitRecall();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, activeRecallIdx, roundWords, recallMethod]);

  const handleAddTypedWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;

    const norm = normalizeWord(typedInput);
    if (submittedTypedWords.map(normalizeWord).includes(norm)) {
      setTypedInput("");
      return;
    }

    setSubmittedTypedWords((prev) => [...prev, typedInput.trim()]);
    setTypedInput("");
    sounds.tick(true);
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
      // Typing mode
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
        colors: ["#F59E0B", "#10B981", "#FBBF24", "#FFFFFF"],
      });
    } else {
      sounds.incorrect();
    }

    setGameState("results");

    try {
      const res = await fetch("/api/game/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          categoryId,
          wordCount,
          displayDuration,
          difficulty,
          survivalRound,
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

        // Survival mode advancement check
        if (mode === "survival") {
          if (accuracy >= 80) {
            setSurvivalRound((prev) => {
              const next = prev + 1;
              setSurvivalBestStreak((cur) => Math.max(cur, next - 1));
              return next;
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Next round in Survival or Speed Rush
  const handleNextRound = () => {
    startGame();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />
      <AuthModal />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center justify-center">
        {/* ==================== 1. IDLE / SETUP SCREEN ==================== */}
        {gameState === "idle" && (
          <div className="w-full max-w-3xl animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Configure Your Round
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5">
                Adjust words, timer, category, and game mode to your training preference.
              </p>
            </div>

            <div className="space-y-6 flash-card p-6 sm:p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-xl">
              {/* CONTROL A: Word Count */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
                  A. Number of Words Displayed
                </label>
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {[1, 5, 10, 15, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        setWordCount(cnt);
                        savePreference("count", String(cnt));
                      }}
                      className={`py-3 rounded-xl text-center text-sm sm:text-base font-extrabold border transition-all ${
                        wordCount === cnt
                          ? "border-[var(--accent-strong)] bg-[var(--accent-glow)] text-[var(--accent-primary)] shadow-sm scale-102"
                          : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-active)]"
                      }`}
                    >
                      {cnt}
                      <span className="block text-[10px] font-normal text-[var(--text-muted)]">
                        {cnt === 1 ? "word" : "words"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTROL B: Display Duration */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    B. Flash Duration
                  </label>
                  <span className="text-sm font-mono font-bold text-[var(--color-mint)]">
                    {displayDuration} seconds
                  </span>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-3">
                  {[3, 5, 8, 10, 15].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setDisplayDuration(sec);
                        savePreference("duration", String(sec));
                      }}
                      className={`py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                        displayDuration === sec
                          ? "border-[var(--color-mint)] bg-[var(--color-mint-glow)] text-[var(--color-mint)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-active)]"
                      }`}
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
                  value={displayDuration}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDisplayDuration(val);
                    savePreference("duration", String(val));
                  }}
                  className="w-full accent-[var(--accent-strong)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                  <span>1s (Rapid)</span>
                  <span>15s (Standard)</span>
                  <span>30s (Extended)</span>
                </div>
              </div>

              {/* CONTROL C: Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
                  C. Word Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    savePreference("category", e.target.value);
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-sm text-[var(--text-primary)] cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name} ({cat.difficulty.toUpperCase()})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                  {CATEGORIES.find((c) => c.slug === categoryId)?.description}
                </p>
              </div>

              {/* CONTROL D & E: Difficulty and Game Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    D. Difficulty
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["easy", "normal", "hard", "expert"] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          setDifficulty(diff);
                          savePreference("difficulty", diff);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                          difficulty === diff
                            ? "border-[var(--accent-strong)] bg-[var(--accent-glow)] text-[var(--accent-primary)]"
                            : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    E. Game Mode
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
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
                          savePreference("mode", m.id);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          mode === m.id
                            ? "border-[var(--accent-strong)] bg-[var(--accent-glow)] text-[var(--accent-primary)]"
                            : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                        }`}
                      >
                        <m.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recall Mode Preferences (if recall/speed/survival) */}
              {mode !== "classic" && (
                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">
                    Recall Input Method:
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecallMethod("choice");
                        savePreference("method", "choice");
                      }}
                      className={`px-3 py-1.5 rounded-xl border font-semibold ${
                        recallMethod === "choice"
                          ? "border-[var(--accent-strong)] bg-[var(--accent-glow)] text-[var(--accent-primary)]"
                          : "border-[var(--border-subtle)] text-[var(--text-muted)]"
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
                      className={`px-3 py-1.5 rounded-xl border font-semibold ${
                        recallMethod === "typing"
                          ? "border-[var(--accent-strong)] bg-[var(--accent-glow)] text-[var(--accent-primary)]"
                          : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      Type Words
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                  <span>Selected:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {wordCount} words • {displayDuration}s • {CATEGORIES.find((c) => c.slug === categoryId)?.name}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setWordCount(5);
                      setDisplayDuration(5);
                      setCategoryId("mixed");
                      setDifficulty("normal");
                      setMode("recall");
                    }}
                    className="btn-secondary py-2.5 px-4 text-xs font-semibold"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={startGame}
                    className="btn-primary flex-1 sm:flex-none py-2.5 px-6 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. COUNTDOWN SCREEN ==================== */}
        {gameState === "countdown" && (
          <div className="text-center animate-fadeIn py-20 flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-[var(--accent-primary)] font-bold block mb-4">
              FOCUS & MEMORIZE
            </span>
            <div className="w-28 h-28 rounded-2xl border border-[var(--border-active)] bg-[var(--bg-secondary)] flex items-center justify-center shadow-xl">
              <span className="text-6xl font-mono font-black text-white">
                {countdownNum === 0 ? "GO" : countdownNum}
              </span>
            </div>
          </div>
        )}

        {/* ==================== 3. SHOWING WORDS (FLASH STAGE) ==================== */}
        {gameState === "showing_words" && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            {/* Gameplay Compact Header */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-6 pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePause}
                  className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-active)] text-[var(--text-secondary)] hover:text-white transition-all flex items-center gap-1.5"
                  title="Pause game"
                >
                  <Pause className="w-4 h-4" />
                  <span className="kbd-shortcut hidden sm:inline-block">Space</span>
                </button>
                <div>
                  <span className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider block">
                    {mode.toUpperCase()} MODE
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {CATEGORIES.find((c) => c.slug === categoryId)?.name}
                  </span>
                </div>
              </div>

              {/* Large Central Timer */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-active)] shadow-sm">
                <Timer className={`w-4 h-4 ${timeRemaining <= 2 ? "text-red-400 animate-pulse" : "text-[var(--accent-primary)]"}`} />
                <span className={`text-2xl font-mono font-black tracking-wider ${timeRemaining <= 2 ? "text-red-400" : "text-white"}`}>
                  {timeRemaining.toFixed(1)}s
                </span>
              </div>

              <button
                onClick={resetGame}
                className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-active)] text-[var(--text-secondary)] hover:text-red-400 transition-all"
                title="Abandon round"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Timer Progress Bar */}
            <div className="w-full max-w-4xl h-1.5 bg-[var(--border-subtle)] rounded-full mb-8 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  timeRemaining <= 2 ? "bg-red-500" : "bg-[var(--accent-primary)]"
                }`}
                style={{ width: `${(timeRemaining / timerDurationRef.current) * 100}%` }}
              />
            </div>

            {/* Word Grid Layout depending on count */}
            <div
              className={`w-full max-w-4xl gap-3 sm:gap-4 ${
                wordCount === 1
                  ? "flex items-center justify-center py-12"
                  : wordCount <= 5
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                  : wordCount <= 10
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                  : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
              }`}
            >
              {roundWords.map((item, index) => (
                <div
                  key={item.id}
                  className={`flash-card flex flex-col items-center justify-center text-center p-6 sm:p-7 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm transition-all hover:border-[var(--border-active)] ${
                    wordCount === 1 ? "max-w-md w-full py-14" : ""
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] mb-1.5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div
                    className={`font-mono font-black tracking-wide text-white uppercase select-none ${
                      wordCount === 1
                        ? "text-3xl sm:text-5xl"
                        : wordCount <= 5
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
          <div className="text-center p-8 max-w-md w-full flash-card rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-active)] shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Pause className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-1">Game Paused</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-6">
              Timer frozen at {timeRemaining.toFixed(1)}s. Take a breather.
            </p>

            <div className="flex flex-col gap-2.5">
              <button onClick={togglePause} className="btn-primary py-2.5 text-sm font-bold">
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
              <span className="text-xs uppercase tracking-widest text-[var(--color-mint)] font-bold block mb-1">
                RECALL STAGE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                What words were displayed?
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {recallMethod === "choice"
                  ? "Select the word you remember for each card position, or use keys [1]-[4]."
                  : "Type each remembered word and press Enter."}
              </p>
            </div>

            {/* MULTIPLE CHOICE METHOD */}
            {recallMethod === "choice" && (
              <div className="w-full space-y-4 mb-8">
                {roundWords.map((item, idx) => {
                  const isCurrentActive = activeRecallIdx === idx;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveRecallIdx(idx)}
                      className={`flash-card p-4 sm:p-5 rounded-xl bg-[var(--bg-secondary)] border transition-all ${
                        isCurrentActive ? "border-[var(--border-focus)] shadow-md" : "border-[var(--border-subtle)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 text-xs text-[var(--text-muted)]">
                        <span className="font-bold text-[var(--accent-primary)] font-mono">
                          POSITION #{String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[11px]">Select 1 of 4:</span>
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
                              className={`p-3 rounded-lg text-xs sm:text-sm font-bold border transition-all text-center relative flex items-center justify-center ${
                                selected
                                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-black font-extrabold shadow-sm scale-102"
                                  : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-active)] hover:text-white"
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

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[var(--text-muted)]">
                  <span>
                    Hotkeys: Use <span className="kbd-shortcut">1</span>-<span className="kbd-shortcut">4</span> to select answers & advance.
                  </span>
                  <span className="font-semibold text-white">
                    Answered: {Object.keys(userAnswers).length} / {roundWords.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitRecall}
                  className="w-full btn-primary py-3.5 text-base font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <span>Submit Answers & View Score</span>
                  <span className="kbd-shortcut bg-black/10 border-black/20 text-black">Enter</span>
                </button>
              </div>
            )}

            {/* TYPING METHOD */}
            {recallMethod === "typing" && (
              <div className="w-full max-w-xl space-y-6 mb-8">
                <form onSubmit={handleAddTypedWord} className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder="Type a remembered word and press Enter..."
                    className="flex-1 px-4 py-3 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)]"
                  />
                  <button type="submit" className="btn-primary py-3 px-5 text-sm font-bold">
                    Add
                  </button>
                </form>

                {/* Submitted Chips */}
                <div className="min-h-[100px] p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-muted)] block mb-2 font-medium">
                    Your Recalled Words ({submittedTypedWords.length} entered):
                  </span>
                  {submittedTypedWords.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic">
                      Type words above as you remember them. Order does not matter.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {submittedTypedWords.map((w) => (
                        <span
                          key={w}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-active)] text-xs font-bold text-[var(--text-primary)]"
                        >
                          {w}
                          <button
                            type="button"
                            onClick={() => removeTypedWord(w)}
                            className="text-[var(--text-muted)] hover:text-red-400"
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
                  className="w-full btn-primary py-3.5 text-base font-bold shadow-lg"
                >
                  Submit ({submittedTypedWords.length} / {roundWords.length} words entered)
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== 6. RESULTS SCREEN ==================== */}
        {gameState === "results" && resultData && (
          <div className="w-full max-w-2xl animate-fadeIn space-y-5">
            {/* Header Tier Banner */}
            <div className="p-6 sm:p-8 rounded-2xl flash-card bg-[var(--bg-secondary)] border border-[var(--border-active)] shadow-xl text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--accent-primary)] mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                ROUND COMPLETE
              </div>

              <div className="flex items-center justify-center gap-5 my-2">
                <div className="w-16 h-16 rounded-2xl border-2 border-[var(--accent-primary)]/40 bg-[var(--bg-card)] flex flex-col items-center justify-center shadow-md">
                  <span className="text-3xl font-mono font-black text-[var(--accent-primary)] leading-none">
                    {resultData.accuracy === 100 ? "S" : resultData.accuracy >= 80 ? "A" : resultData.accuracy >= 60 ? "B" : resultData.accuracy >= 40 ? "C" : "D"}
                  </span>
                  <span className="text-[8px] font-bold uppercase text-[var(--text-muted)] mt-0.5">Tier</span>
                </div>
                <div className="text-left">
                  <h2 className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight">
                    {resultData.score} PTS
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-[var(--color-mint)]">
                      +{resultData.xpEarned} XP Earned
                    </span>
                    {typeof resultData.avgResponseTime === "number" && (
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        • {resultData.avgResponseTime}ms / word
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Accuracy</span>
                <span className="text-xl font-mono font-black text-white">{resultData.accuracy}%</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Difficulty</span>
                <span className="text-xl font-mono font-black text-white">{resultData.difficultyMultiplier}x</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Speed Bonus</span>
                <span className="text-xl font-mono font-black text-[var(--accent-primary)]">+{resultData.speedBonus}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Mode</span>
                <span className="text-xl font-mono font-bold text-white capitalize">{mode}</span>
              </div>
            </div>

            {/* Unlocked Achievements Banner */}
            {resultData.newlyUnlocked.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Achievement Unlocked!</span>
                </div>
                {resultData.newlyUnlocked.map((ach) => (
                  <div key={ach.name} className="text-xs text-[var(--text-secondary)]">
                    <strong className="text-white">{ach.name}</strong> — +{ach.xpReward} XP
                  </div>
                ))}
              </div>
            )}

            {/* Word Review List */}
            <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                Round Word Review
              </h3>
              <div className="divide-y divide-[var(--border-subtle)]">
                {roundWords.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white mr-2">{item.word}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{item.definition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleNextRound}
                className="flex-1 btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Play Again <span className="kbd-shortcut bg-black/10 border-black/20 text-black">Space</span>
              </button>
              <button
                type="button"
                onClick={resetGame}
                className="btn-secondary py-3 px-6 text-xs font-semibold flex items-center justify-center gap-2"
              >
                Change Settings <span className="kbd-shortcut">S</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
