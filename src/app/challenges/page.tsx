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
        <div className="text-center mb-10">
          <div className="clay-badge text-[var(--accent-primary)] mb-3">
            <Flame className="w-3.5 h-3.5" />
            Competitive Gauntlet
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight drop-shadow-sm">
            Special Challenges
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
            Test your cognitive reflexes against standardized daily puzzles and endurance modes.
          </p>
        </div>

        {/* 1. DAILY CHALLENGE HERO CARD */}
        <div className="p-6 sm:p-8 rounded-3xl clay-card bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-black text-amber-400 mb-1.5">
                <Calendar className="w-4 h-4" />
                OFFICIAL DAILY CHALLENGE • {dailyData?.challengeDate || "TODAY"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-2 drop-shadow-sm">
                Today&apos;s Global Word Flash
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
                One universal word list generated deterministically for all players today. Single official attempt per registered player.
              </p>

              {dailyData && (
                <div className="flex flex-wrap gap-2.5 mt-4 text-xs font-extrabold">
                  <span className="px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--clay-pill-shadow)] text-[var(--text-primary)]">
                    {dailyData.config.wordCount} Words
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--clay-pill-shadow)] text-[var(--color-mint)]">
                    {dailyData.config.displayDuration}s Flash
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--clay-pill-shadow)] text-[var(--accent-primary)] capitalize">
                    {dailyData.config.categoryId}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full sm:w-auto shrink-0">
              {userAttempt?.completed ? (
                <div className="p-5 rounded-3xl clay-card bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-black text-xs mb-1">
                    <CheckCircle className="w-4 h-4" /> Completed Today
                  </div>
                  <div className="text-2xl font-mono font-black text-[var(--text-primary)]">
                    {userAttempt.score} PTS
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">
                    {userAttempt.accuracy}% Accuracy
                  </span>
                </div>
              ) : (
                <Link
                  href="/play?mode=daily"
                  className="w-full sm:w-auto clay-btn-primary py-4 px-9 text-base font-extrabold flex items-center justify-center gap-2 rounded-2xl"
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
          <div className="p-7 rounded-3xl clay-card clay-card-interactive bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#38BDF8]/20 to-[#0284C7]/20 border border-[#38BDF8]/30 text-[#38BDF8] flex items-center justify-center mb-4 shadow-[var(--clay-pill-shadow)]">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Speed Rush Gauntlet</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
                Words appear and disappear at escalating speeds. Start at 5.0 seconds and drop down to 1.0 second. Tests peripheral perception and instant recognition.
              </p>
            </div>

            <Link
              href="/play?mode=speed"
              className="clay-btn-secondary py-3 text-xs font-extrabold text-center block rounded-2xl"
            >
              Launch Speed Rush
            </Link>
          </div>

          {/* Survival Mode */}
          <div className="p-7 rounded-3xl clay-card clay-card-interactive bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F43F5E]/20 to-[#E11D48]/20 border border-[#F43F5E]/30 text-[#F43F5E] flex items-center justify-center mb-4 shadow-[var(--clay-pill-shadow)]">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Endurance Survival</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
                3 Hearts. Infinite rounds. Achieve at least 80% recall accuracy to keep your lives. How many stages can you survive?
              </p>
            </div>

            <Link
              href="/play?mode=survival"
              className="clay-btn-secondary py-3 text-xs font-extrabold text-center block rounded-2xl"
            >
              Launch Survival Mode
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
