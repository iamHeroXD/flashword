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
  CheckCircle,
  Calendar,
  Play,
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
          <div className="clay-badge text-zinc-300 mb-3 bg-zinc-900 border-white/10">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            Competitive Gauntlet
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Special Challenges
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
            Test your cognitive reflexes against standardized daily puzzles and endurance modes.
          </p>
        </div>

        {/* 1. DAILY CHALLENGE HERO CARD */}
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-white/10 mb-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 mb-1.5">
                <Calendar className="w-4 h-4" />
                OFFICIAL DAILY CHALLENGE • {dailyData?.challengeDate || "TODAY"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                Today&apos;s Global Word Flash
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                One universal word list generated deterministically for all players today. Single official attempt per registered player.
              </p>

              {dailyData && (
                <div className="flex flex-wrap gap-2.5 mt-4 text-xs font-bold">
                  <span className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white">
                    {dailyData.config.wordCount} Words
                  </span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-green-400">
                    {dailyData.config.displayDuration}s Flash
                  </span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 capitalize">
                    {dailyData.config.categoryId}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full sm:w-auto shrink-0">
              {userAttempt?.completed ? (
                <div className="p-5 rounded-xl bg-zinc-900 border border-white/15 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-green-400 font-bold text-xs mb-1">
                    <CheckCircle className="w-4 h-4" /> Completed Today
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {userAttempt.score} PTS
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {userAttempt.accuracy}% Accuracy
                  </span>
                </div>
              ) : (
                <Link
                  href="/play?mode=daily"
                  className="w-full sm:w-auto btn-primary py-3.5 px-8 text-sm font-bold flex items-center justify-center gap-2 rounded-xl"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Daily Challenge
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 2. CHALLENGE TILES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Speed Rush */}
          <div className="p-7 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 text-zinc-200 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Speed Rush Gauntlet</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Words appear and disappear at escalating speeds. Start at 5.0 seconds and drop down to 1.0 second. Tests peripheral perception and instant recognition.
              </p>
            </div>

            <Link
              href="/play?mode=speed"
              className="btn-secondary py-3 text-xs font-bold text-center block rounded-xl"
            >
              Launch Speed Rush
            </Link>
          </div>

          {/* Survival Mode */}
          <div className="p-7 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 text-red-500 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Endurance Survival</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                3 Hearts. Infinite rounds. Achieve at least 80% recall accuracy to keep your lives. How many stages can you survive?
              </p>
            </div>

            <Link
              href="/play?mode=survival"
              className="btn-secondary py-3 text-xs font-bold text-center block rounded-xl"
            >
              Launch Survival Mode
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
