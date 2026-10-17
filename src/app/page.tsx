"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { AuthProvider } from "@/context/AuthContext";
import {
  Zap,
  Play,
  Flame,
  Trophy,
  Brain,
  Timer,
  Sparkles,
  ArrowRight,
  Shield,
  Eye,
  CheckCircle2,
  Lock,
  RotateCcw,
} from "lucide-react";

export default function HomePage() {
  // Interactive live micro-demo
  const sampleWords = ["SYNAPSE", "QUANTUM", "HORIZON", "VELOCITY", "ECHO", "NEBULA", "MATRIX", "VORTEX"];
  const [demoState, setDemoState] = useState<"ready" | "flashing" | "recalling" | "solved">("ready");
  const [activeWords, setActiveWords] = useState<string[]>(["QUANTUM", "HORIZON", "VELOCITY"]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(3.0);

  const startDemo = () => {
    // Pick 3 random words
    const shuffled = [...sampleWords].sort(() => 0.5 - Math.random()).slice(0, 3);
    setActiveWords(shuffled);
    setSelectedWord(null);
    setSecondsLeft(3.0);
    setDemoState("flashing");
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (demoState === "flashing") {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 0.2) {
            clearInterval(interval);
            setDemoState("recalling");
            return 0;
          }
          return Number((prev - 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [demoState]);

  const handleSelectChoice = (word: string) => {
    setSelectedWord(word);
    setDemoState("solved");
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
        <Navbar />
        <AuthModal />

        <main className="flex-1">
          {/* HERO SECTION */}
          <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--accent-primary)] mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                Minimalist Word Flash & Memory Training
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08] mb-6">
                Your brain. <br />
                <span className="text-[var(--accent-primary)]">
                  On the clock.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
                See the words. Beat the timer. Sharpen your memory. A high-velocity cognitive workout designed for teenagers and adults.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12">
                <Link
                  href="/play"
                  className="w-full sm:w-auto btn-primary px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2 group"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Play Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/challenges"
                  className="w-full sm:w-auto btn-secondary px-8 py-3.5 text-base font-semibold flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-[var(--accent-primary)]" />
                  Daily Challenge
                </Link>
              </div>

              {/* REAL INTERACTIVE LIVE DEMO CARD */}
              <div className="max-w-lg mx-auto p-5 sm:p-6 flash-card rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-left shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-subtle)] text-xs font-mono text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5 text-[var(--accent-primary)] font-bold">
                    <Timer className="w-3.5 h-3.5" />
                    LIVE DEMO
                  </span>
                  <span>3 WORDS • 3.0s</span>
                  {demoState === "flashing" && (
                    <span className="text-[var(--accent-primary)] font-bold font-mono">
                      {secondsLeft.toFixed(1)}s
                    </span>
                  )}
                </div>

                <div className="min-h-[140px] flex flex-col items-center justify-center text-center py-2">
                  {demoState === "ready" && (
                    <div className="space-y-3">
                      <p className="text-xs text-[var(--text-secondary)]">
                        Experience how Flashword works in 3 seconds.
                      </p>
                      <button
                        onClick={startDemo}
                        className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Flash 3 Words Now
                      </button>
                    </div>
                  )}

                  {demoState === "flashing" && (
                    <div className="w-full space-y-3">
                      <span className="text-[11px] font-mono tracking-widest text-[var(--text-muted)] uppercase">
                        MEMORIZE THESE WORDS
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {activeWords.map((w, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-active)] font-mono font-bold text-sm text-white text-center shadow-sm"
                          >
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {demoState === "recalling" && (
                    <div className="w-full space-y-3">
                      <span className="text-[11px] font-bold tracking-wider text-[var(--accent-primary)] uppercase">
                        WHICH WORD WAS IN POSITION #1?
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[activeWords[0], "ORBIT", "CRYSTAL"].sort().map((word, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectChoice(word)}
                            className="p-2.5 rounded-xl text-xs font-bold font-mono bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-white transition-all text-center"
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {demoState === "solved" && (
                    <div className="w-full space-y-3">
                      {selectedWord === activeWords[0] ? (
                        <div className="flex items-center justify-center gap-2 text-[var(--color-mint)] font-bold text-sm">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Exact Match! +100 Points</span>
                        </div>
                      ) : (
                        <div className="text-red-400 font-bold text-sm">
                          Correct word was: <span className="text-white">{activeWords[0]}</span>
                        </div>
                      )}
                      <div>
                        <button
                          onClick={startDemo}
                          className="btn-secondary text-xs py-1.5 px-4 inline-flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[var(--text-muted)] pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span>No login required for guest play</span>
                  <Link href="/play" className="text-[var(--accent-primary)] font-semibold hover:underline">
                    Play Full Round →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURED GAME MODES */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  5 Focused Game Modes
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5">
                  Engineered to challenge cognitive reaction speed and spatial retention.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Classic Flash */}
                <div className="flash-card p-6 rounded-xl bg-[var(--bg-card)] hover:border-[var(--border-active)] transition-all">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
                    <Eye className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Classic Flash</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    Display words in a responsive grid for 1–30 seconds. Perfect for speed-reading practice and visual memory drills.
                  </p>
                  <span className="text-[11px] font-semibold text-[var(--color-mint)]">Casual & Warmup</span>
                </div>

                {/* Memory Recall */}
                <div className="flash-card p-6 rounded-xl bg-[var(--bg-card)] border-[var(--border-active)] shadow-sm relative overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center mb-4">
                    <Brain className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Memory Recall</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    Words disappear when time expires! Test your memory by typing what you recall or picking from categorical distractors.
                  </p>
                  <span className="text-[11px] font-semibold text-[var(--accent-primary)]">Type or Multi-Choice</span>
                </div>

                {/* Speed Rush */}
                <div className="flash-card p-6 rounded-xl bg-[var(--bg-card)] hover:border-[var(--border-active)] transition-all">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Speed Rush</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    Visibility duration shrinks with each round. Push your reaction speed and peripheral vision to the limit.
                  </p>
                  <span className="text-[11px] font-semibold text-[var(--accent-primary)]">Escalating Multipliers</span>
                </div>
              </div>

              {/* Extra row: Survival & Daily Challenge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flash-card p-5 rounded-xl bg-[var(--bg-card)] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Survival Mode</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      3 strikes system. Hit the accuracy threshold to advance to the next level. One stumble ends your streak.
                    </p>
                  </div>
                </div>

                <div className="flash-card p-5 rounded-xl bg-[var(--bg-card)] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Daily Challenge</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      One shared puzzle every day for every player worldwide. Compete on the daily leaderboard with verified scores.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HOW TO PLAY */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                How Flashword Works
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Zero clutter. Maximum focus. Real memory training.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-active)] text-white font-mono font-bold flex items-center justify-center mx-auto mb-3 text-xs">
                  01
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Pick Your Settings</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Select 1 to 20 words, duration from 1–30 seconds, and category from 18 rich vocabulary banks.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-active)] text-[var(--accent-primary)] font-mono font-bold flex items-center justify-center mx-auto mb-3 text-xs">
                  02
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Flash & Memorize</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Words appear on your screen in a high-contrast grid. Focus, absorb, and beat the clock before they vanish.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-active)] text-[var(--color-mint)] font-mono font-bold flex items-center justify-center mx-auto mb-3 text-xs">
                  03
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Recall & Level Up</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Recall what you saw, score points, earn XP, maintain streaks, and unlock achievements.
                </p>
              </div>
            </div>

            {/* FINAL CTA */}
            <div className="mt-14 p-8 sm:p-10 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-active)] text-center relative">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-black text-white mb-2">
                  Ready to test your memory?
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mb-6">
                  Jump right into a round in seconds. No credit card, no ads, and no email required.
                </p>
                <Link
                  href="/play"
                  className="btn-primary inline-flex items-center gap-2 px-7 py-3 text-sm font-bold"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Playing Now
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-[var(--border-subtle)] py-6 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="font-black text-white">FLASHWORD</span>
              <span>•</span>
              <span>Speed Memory Platform</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero Email Requirement • 100% Privacy</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
