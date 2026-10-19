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
              <div className="clay-badge text-zinc-300 mb-6 border-white/10 bg-zinc-900/80">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="tracking-wide">Word Flash & Cognitive Speed Platform</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08] mb-6">
                Your brain. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                  On the clock.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
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
                  className="w-full sm:w-auto btn-secondary px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-red-500" />
                  Daily Challenge
                </Link>
              </div>

              {/* REAL INTERACTIVE LIVE DEMO CARD */}
              <div className="max-w-lg mx-auto p-6 sm:p-7 clay-card rounded-2xl bg-zinc-950 border border-white/10 text-left">
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10 text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5 text-red-400 font-bold">
                    <Timer className="w-4 h-4" />
                    LIVE DEMO
                  </span>
                  <span className="font-semibold text-zinc-400">3 WORDS • 3.0s</span>
                  {demoState === "flashing" && (
                    <span className="text-red-400 font-bold font-mono text-sm">
                      {secondsLeft.toFixed(1)}s
                    </span>
                  )}
                </div>

                <div className="min-h-[140px] flex flex-col items-center justify-center text-center py-2">
                  {demoState === "ready" && (
                    <div className="space-y-3.5">
                      <p className="text-xs text-zinc-400 font-medium">
                        Experience how Flashword works in 3 seconds.
                      </p>
                      <button
                        onClick={startDemo}
                        className="btn-primary text-xs py-2.5 px-6 inline-flex items-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Flash 3 Words Now
                      </button>
                    </div>
                  )}

                  {demoState === "flashing" && (
                    <div className="w-full space-y-3">
                      <span className="text-[11px] font-mono tracking-widest text-zinc-400 font-bold uppercase">
                        MEMORIZE THESE WORDS
                      </span>
                      <div className="grid grid-cols-3 gap-2.5">
                        {activeWords.map((w, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-zinc-900 border border-white/20 font-mono font-bold text-sm text-white text-center shadow-sm"
                          >
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {demoState === "recalling" && (
                    <div className="w-full space-y-3">
                      <span className="text-[11px] font-bold tracking-wider text-red-400 uppercase">
                        WHICH WORD WAS IN POSITION #1?
                      </span>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[activeWords[0], "ORBIT", "CRYSTAL"].sort().map((word, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectChoice(word)}
                            className="p-3 rounded-xl text-xs font-mono font-bold bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-white/30 hover:bg-zinc-800 transition-all text-center"
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {demoState === "solved" && (
                    <div className="w-full space-y-3.5">
                      {selectedWord === activeWords[0] ? (
                        <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-sm">
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
                          className="btn-secondary text-xs py-2 px-5 inline-flex items-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-zinc-500 pt-3.5 border-t border-white/10 flex items-center justify-between font-medium">
                  <span>No login required for guest play</span>
                  <Link href="/play" className="text-zinc-300 hover:text-white font-semibold transition-colors">
                    Play Full Round →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURED GAME MODES */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-zinc-950">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <div className="clay-badge text-zinc-300 mb-3 border-white/10 bg-zinc-900">
                  Game System
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  5 Focused Game Modes
                </h2>
                <p className="text-sm text-zinc-400 mt-2">
                  Engineered to challenge cognitive reaction speed and spatial retention.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Classic Flash */}
                <div className="clay-card clay-card-interactive p-6 rounded-2xl bg-zinc-900 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center mb-4">
                    <Eye className="w-5 h-5 text-zinc-300" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">Classic Flash</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Display words in a responsive grid for 1–30 seconds. Perfect for speed-reading practice and visual memory drills.
                  </p>
                  <span className="text-[11px] font-semibold text-zinc-400">Casual & Warmup</span>
                </div>

                {/* Memory Recall */}
                <div className="clay-card clay-card-interactive p-6 rounded-2xl bg-zinc-900 border border-white/10 relative overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center mb-4">
                    <Brain className="w-5 h-5 text-zinc-300" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">Memory Recall</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Words disappear when time expires! Test your memory by typing what you recall or picking from categorical distractors.
                  </p>
                  <span className="text-[11px] font-semibold text-red-400">Type or Multi-Choice</span>
                </div>

                {/* Speed Rush */}
                <div className="clay-card clay-card-interactive p-6 rounded-2xl bg-zinc-900 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-zinc-300" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">Speed Rush</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Visibility duration shrinks with each stage. Push your reaction speed and peripheral vision to the limit.
                  </p>
                  <span className="text-[11px] font-semibold text-zinc-300">Escalating Multipliers</span>
                </div>
              </div>

              {/* Extra row: Survival & Daily Challenge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div className="clay-card clay-card-interactive p-6 rounded-2xl bg-zinc-900 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 text-red-500 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Survival Mode</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      3 lives system with procedural heart loss. Hit the accuracy threshold to survive the stage. One stumble ends your streak.
                    </p>
                  </div>
                </div>

                <div className="clay-card clay-card-interactive p-6 rounded-2xl bg-zinc-900 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 text-zinc-300 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Daily Challenge</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      One shared puzzle every day for every player worldwide. Compete on the daily leaderboard with anti-cheat verified scores.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HOW TO PLAY */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                How Flashword Works
              </h2>
              <p className="text-sm text-zinc-400 mt-1.5">
                Zero clutter. Maximum focus. Real cognitive memory training.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="clay-card p-6 rounded-2xl bg-zinc-900 border border-white/10 text-center">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/10 text-white font-mono font-bold flex items-center justify-center mx-auto mb-3.5 text-xs">
                  01
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">Pick Your Settings</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Select 1 to 20 words, duration from 1–30 seconds, and category from 18 rich vocabulary banks.
                </p>
              </div>

              <div className="clay-card p-6 rounded-2xl bg-zinc-900 border border-white/10 text-center">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/10 text-white font-mono font-bold flex items-center justify-center mx-auto mb-3.5 text-xs">
                  02
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">Flash & Memorize</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Words appear on your screen in clean high-contrast tiles. Focus, absorb, and beat the clock before they vanish.
                </p>
              </div>

              <div className="clay-card p-6 rounded-2xl bg-zinc-900 border border-white/10 text-center">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/10 text-white font-mono font-bold flex items-center justify-center mx-auto mb-3.5 text-xs">
                  03
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">Recall & Level Up</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Recall what you saw, score points, earn XP, maintain streaks, and unlock achievements.
                </p>
              </div>
            </div>

            {/* FINAL CTA */}
            <div className="mt-16 p-8 sm:p-12 rounded-2xl clay-card bg-zinc-900 border border-white/10 text-center relative overflow-hidden">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2.5">
                  Ready to test your memory?
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mb-7 leading-relaxed">
                  Jump right into a round in seconds. No credit card, no ads, and no email required.
                </p>
                <Link
                  href="/play"
                  className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Playing Now
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/10 py-6 px-4 sm:px-6 lg:px-8 bg-black text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">FLASHWORD</span>
              <span>•</span>
              <span className="text-zinc-400">Minimalist Memory Gaming Platform</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Zero Email Requirement • 100% Privacy</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
