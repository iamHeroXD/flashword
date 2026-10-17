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
} from "lucide-react";

export default function HomePage() {
  // Mini animated gameplay preview state
  const demoWords = ["SYNAPSE", "QUANTUM", "HORIZON", "VELOCITY", "ECHO"];
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [previewPhase, setPreviewPhase] = useState<"flash" | "recall">("flash");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWordIdx((prev) => (prev + 1) % demoWords.length);
      setPreviewPhase((prev) => (prev === "flash" ? "recall" : "flash"));
    }, 2400);
    return () => clearInterval(timer);
  }, [demoWords.length]);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
        <Navbar />
        <AuthModal />

        <main className="flex-1">
          {/* HERO SECTION */}
          <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8">
            {/* Background subtle glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--accent-primary)] mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-mint)]" />
                Next-Gen Word Flash & Recall Training
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6">
                Your brain. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-purple-300 to-[var(--color-mint)]">
                  On the clock.
                </span>
              </h1>

              <p className="text-base sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
                See the words. Beat the timer. Sharpen your memory. A fast-paced cognitive workout designed for teenagers and adults.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-14">
                <Link
                  href="/play"
                  className="w-full sm:w-auto btn-primary px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2 group"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Play Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/challenges"
                  className="w-full sm:w-auto btn-secondary px-8 py-3.5 text-base font-semibold flex items-center justify-center gap-2"
                >
                  <Flame className="w-5 h-5 text-amber-400" />
                  Daily Challenge
                </Link>
              </div>

              {/* INTERACTIVE MINI GAMEPLAY DEMO CARD */}
              <div className="max-w-xl mx-auto p-5 sm:p-7 flash-card rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
                  <span className="flex items-center gap-1.5 text-[var(--accent-primary)] font-semibold">
                    <Timer className="w-4 h-4 animate-spin text-[var(--color-mint)]" />
                    LIVE PREVIEW
                  </span>
                  <span>MODE: MEMORY RECALL</span>
                  <span className="text-amber-400 font-bold">TIMER: 3.0s</span>
                </div>

                <div className="py-6 flex flex-col items-center justify-center min-h-[140px]">
                  {previewPhase === "flash" ? (
                    <div className="animate-fadeIn">
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest block mb-2">
                        MEMORIZE THIS WORD
                      </span>
                      <div className="text-3xl sm:text-4xl font-extrabold tracking-wider text-[var(--text-primary)] px-6 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--accent-strong)]/40 shadow-lg text-center">
                        {demoWords[activeWordIdx]}
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fadeIn text-center">
                      <span className="text-xs font-semibold text-[var(--color-mint)] uppercase tracking-widest block mb-2 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> RECALL STAGE
                      </span>
                      <div className="flex gap-2">
                        {["SYNAPSE", "GRAVITY", "ECHO"].map((choice, i) => (
                          <div
                            key={i}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              choice === demoWords[activeWordIdx]
                                ? "bg-[var(--accent-strong)] text-white border-purple-400 shadow-md scale-105"
                                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-subtle)] opacity-70"
                            }`}
                          >
                            {choice}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[var(--text-muted)] pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span>Guest play ready • No registration required</span>
                  <span className="text-[var(--color-mint)] font-medium">+50 XP Per Round</span>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURED GAME MODES */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  Built for Speed and Memory Mastery
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  5 specialized game modes to challenge different aspects of rapid cognitive processing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Classic Flash */}
                <div className="flash-card p-6 rounded-2xl bg-[var(--bg-card)] hover:border-[var(--border-active)] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[var(--accent-primary)] flex items-center justify-center mb-4">
                    <Eye className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Classic Flash</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    Display words in a responsive grid for 1–30 seconds. Perfect for speed-reading practice and quick visual memory drills.
                  </p>
                  <span className="text-[11px] font-semibold text-[var(--color-mint)]">Casual & Warmup</span>
                </div>

                {/* Memory Recall */}
                <div className="flash-card p-6 rounded-2xl bg-[var(--bg-card)] border-purple-500/30 shadow-lg relative overflow-hidden">
                  <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-strong)] text-white">
                    POPULAR
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[var(--accent-primary)] flex items-center justify-center mb-4">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Memory Recall</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    Words disappear when time runs out! Test your memory by typing what you remember or picking from categorical distractors.
                  </p>
                  <span className="text-[11px] font-semibold text-[var(--accent-primary)]">Type or Multi-Choice</span>
                </div>

                {/* Speed Rush */}
                <div className="flash-card p-6 rounded-2xl bg-[var(--bg-card)] hover:border-[var(--border-active)] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Speed Rush</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    Visibility duration shrinks with each round. Push your reaction speed and peripheral vision to the limit.
                  </p>
                  <span className="text-[11px] font-semibold text-amber-400">Escalating Multipliers</span>
                </div>
              </div>

              {/* Extra row: Survival & Daily Challenge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div className="flash-card p-6 rounded-2xl bg-[var(--bg-card)] flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Survival Mode</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      You must hit the minimum accuracy target to advance. One stumble ends your streak. How many rounds can you survive?
                    </p>
                  </div>
                </div>

                <div className="flash-card p-6 rounded-2xl bg-[var(--bg-card)] flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Daily Challenge</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      One shared puzzle every day for every player worldwide. Compete on the daily leaderboard with verified scores.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HOW TO PLAY */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                How Flashword Works
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Zero clutter. Maximum focus. Real memory training.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-strong)] text-white font-extrabold flex items-center justify-center mx-auto mb-3 shadow-md">
                  1
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Pick Your Settings</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Select 1 to 20 words, duration from 1–30 seconds, and your favorite category from 18 rich vocabulary banks.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-strong)] text-white font-extrabold flex items-center justify-center mx-auto mb-3 shadow-md">
                  2
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Flash & Memorize</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Words appear on your screen in an uncluttered grid. Focus, absorb, and beat the clock before they vanish.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--color-mint)] text-[#0B1020] font-extrabold flex items-center justify-center mx-auto mb-3 shadow-md">
                  3
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Recall & Level Up</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Recall what you saw, score points, earn XP, maintain daily streaks, and unlock achievements!
                </p>
              </div>
            </div>

            {/* FINAL CTA */}
            <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-purple-900/40 via-[var(--bg-secondary)] to-[var(--bg-card)] border border-[var(--border-active)] text-center relative overflow-hidden">
              <div className="relative z-10 max-w-xl mx-auto">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-3">
                  Ready to test your memory?
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  Jump right into a round in seconds. No credit card, no ads, and no email required.
                </p>
                <Link
                  href="/play"
                  className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Playing Now
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-[var(--border-subtle)] py-8 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-[var(--text-primary)]">Flashword</span>
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
