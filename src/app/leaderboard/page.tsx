"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  Trophy,
  Crown,
  Medal,
  Calendar,
  Sparkles,
  Search,
  Flame,
  Award,
} from "lucide-react";

interface LeaderboardEntry {
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

export default function LeaderboardPage() {
  return (
    <AuthProvider>
      <LeaderboardContent />
    </AuthProvider>
  );
}

function LeaderboardContent() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"all_time" | "weekly" | "monthly" | "daily">("all_time");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    fetch(`/api/leaderboard?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setEntries(data.entries || []);
          setCurrentUserRank(data.currentUserRank || null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [period]);

  const filteredEntries = entries.filter(
    (e) =>
      e.username.toLowerCase().includes(search.toLowerCase()) ||
      e.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const topThree = entries.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />
      <AuthModal />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] text-xs font-bold mb-3">
            <Trophy className="w-3.5 h-3.5" />
            Competitive Rankings
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Hall of Fame
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-md mx-auto">
            Real scores calculated and verified on the server. Compete for global brain training supremacy.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] max-w-md mx-auto mb-8 shadow-sm">
          {[
            { id: "all_time", label: "All-Time" },
            { id: "weekly", label: "This Week" },
            { id: "monthly", label: "This Month" },
            { id: "daily", label: "Daily Challenge" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                period === tab.id
                  ? "bg-[var(--accent-strong)] text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TOP 3 PODIUM */}
        {!loading && topThree.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto mb-10 items-end">
            {/* Rank 2 (Silver) */}
            {topThree[1] && (
              <div className="flex flex-col items-center p-4 rounded-2xl bg-[var(--bg-secondary)] border border-slate-400/20 text-center relative pt-7">
                <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-extrabold text-xs flex items-center justify-center shadow-md">
                  2
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center text-2xl mb-2 shadow-inner">
                  {topThree[1].avatar}
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-full">
                  {topThree[1].displayName}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  @{topThree[1].username}
                </span>
                <div className="mt-2 text-xs font-extrabold text-[var(--accent-primary)] font-mono">
                  {topThree[1].score.toLocaleString()} PTS
                </div>
              </div>
            )}

            {/* Rank 1 (Gold) */}
            {topThree[0] && (
              <div className="flex flex-col items-center p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 via-[var(--bg-secondary)] to-[var(--bg-card)] border border-amber-500/30 text-center relative pt-8 shadow-xl scale-105">
                <div className="absolute -top-4 w-9 h-9 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shadow-lg">
                  <Crown className="w-5 h-5 fill-current" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] border border-amber-500/40 flex items-center justify-center text-3xl mb-2 shadow-md">
                  {topThree[0].avatar}
                </div>
                <span className="text-sm font-extrabold text-[var(--text-primary)] truncate max-w-full">
                  {topThree[0].displayName}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  @{topThree[0].username}
                </span>
                <div className="mt-2 text-sm font-black text-amber-400 font-mono">
                  {topThree[0].score.toLocaleString()} PTS
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {topThree[2] && (
              <div className="flex flex-col items-center p-4 rounded-2xl bg-[var(--bg-secondary)] border border-amber-700/20 text-center relative pt-7">
                <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-extrabold text-xs flex items-center justify-center shadow-md">
                  3
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center text-2xl mb-2 shadow-inner">
                  {topThree[2].avatar}
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-full">
                  {topThree[2].displayName}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  @{topThree[2].username}
                </span>
                <div className="mt-2 text-xs font-extrabold text-[var(--accent-primary)] font-mono">
                  {topThree[2].score.toLocaleString()} PTS
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current User Rank Card (if applicable) */}
        {user && currentUserRank && (
          <div className="p-4 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-strong)]/40 flex items-center justify-between mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-[var(--accent-strong)] text-white">
                #{currentUserRank}
              </span>
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">Your Current Standing</span>
                <span className="text-[11px] text-[var(--text-secondary)]">Level {user.level} • {user.xp} XP</span>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--color-mint)]">Ranked</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search players by username or display name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-xs text-[var(--text-primary)]"
          />
        </div>

        {/* Rankings Table */}
        <div className="flash-card rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden shadow-lg">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              Loading leaderboard standings...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No recorded entries for this period yet. Be the first to play and claim #1!
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {filteredEntries.map((entry) => {
                const isCurrentUser = entry.userId === user?.id;
                return (
                  <div
                    key={entry.userId}
                    className={`p-4 flex items-center justify-between text-xs transition-colors ${
                      isCurrentUser ? "bg-[var(--accent-glow)]/40 font-semibold" : "hover:bg-[var(--bg-card)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center font-mono font-bold text-[var(--text-muted)]">
                        #{entry.rank}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] flex items-center justify-center text-lg shadow-sm">
                        {entry.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--text-primary)]">{entry.displayName}</span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          @{entry.username} • Level {entry.level}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-black text-[var(--text-primary)] block">
                        {entry.score.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {period === "all_time"
                          ? `${entry.totalRounds || 0} rounds`
                          : entry.accuracy !== undefined
                          ? `${entry.accuracy}% accuracy`
                          : "Score"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
