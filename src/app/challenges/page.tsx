"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  Flame,
  Zap,
  Shield,
  Trophy,
  CheckCircle,
  Calendar,
  Play,
  Clock,
  Sparkles,
} from "lucide-react";

export default function ChallengesPage() {
  return (
    <AuthProvider>
      <ChallengesContent />
    </AuthProvider>
  );
}

function ChallengesContent() {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<{
    id: string;
    challengeDate: string;
    config: {
      wordCount: number;
      displayDuration: number;
      categoryId: string;
      difficulty: string;
      mode: string;
    };
  } | null>(null);

  const [userAttempt, setUserAttempt] = useState<{
    completed: boolean;
    score: number;
    accuracy: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily")
      .then((res) => res.json())
      .then((data) => {
        setDailyData(data.challenge);
        setUserAttempt(data.userAttempt);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />
      <AuthModal />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold mb-3 border border-amber-500/20">
            <Flame className="w-3.5 h-3.5" />
            Competitive Gauntlet
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Special Challenges
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-md mx-auto">
            Test your cognitive reflexes against standardized daily puzzles and endurance modes.
          </p>
        </div>

        {/* 1. DAILY CHALLENGE HERO CARD */}
        <div className="p-6 sm:p-8 rounded-2xl flash-card bg-[var(--bg-secondary)] border border-[var(--border-active)] shadow-xl mb-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 mb-1">
                <Calendar className="w-4 h-4" />
                OFFICIAL DAILY CHALLENGE • {dailyData?.challengeDate || "TODAY"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-2">
                Today&apos;s Global Word Flash
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
                One universal word list generated deterministically for all players today. Single official attempt per registered player.
              </p>

              {dailyData && (
                <div className="flex flex-wrap gap-2.5 mt-4 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                    {dailyData.config.wordCount} Words
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--color-mint)]">
                    {dailyData.config.displayDuration}s Flash
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--accent-primary)] capitalize">
                    {dailyData.config.categoryId}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full sm:w-auto shrink-0">
              {userAttempt?.completed ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs mb-1">
                    <CheckCircle className="w-4 h-4" /> Completed Today
                  </div>
                  <div className="text-2xl font-mono font-black text-[var(--text-primary)]">
                    {userAttempt.score} PTS
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {userAttempt.accuracy}% Accuracy
                  </span>
                </div>
              ) : (
                <Link
                  href="/play"
                  className="w-full sm:w-auto btn-primary py-3.5 px-8 text-base font-bold flex items-center justify-center gap-2 shadow-xl"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Daily Challenge
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 2. CHALLENGE TILES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Speed Rush */}
          <div className="p-6 rounded-2xl flash-card bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Speed Rush Gauntlet</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
                Words appear and disappear at escalating speeds. Start at 5.0 seconds and drop down to 1.5 seconds. Tests peripheral perception and instant recognition.
              </p>
            </div>

            <Link
              href="/play"
              className="btn-secondary py-2.5 text-xs font-bold text-center block"
            >
              Launch Speed Rush
            </Link>
          </div>

          {/* Survival Mode */}
          <div className="p-6 rounded-2xl flash-card bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Endurance Survival</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
                Infinite rounds. Achieve at least 80% recall accuracy on each round to stay alive. A single failure drops your streak back to zero.
              </p>
            </div>

            <Link
              href="/play"
              className="btn-secondary py-2.5 text-xs font-bold text-center block"
            >
              Launch Survival Mode
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
