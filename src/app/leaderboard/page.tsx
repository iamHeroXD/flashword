"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  Trophy,
  Crown,
  Search,
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
        <div className="text-center mb-10">
          <div className="clay-badge text-zinc-300 mb-3 bg-zinc-900 border-white/10">
            <Trophy className="w-3.5 h-3.5 text-red-500" />
            Competitive Rankings
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Hall of Fame
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
            Real scores calculated and verified on the server. Compete for global brain training supremacy.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex p-1 rounded-xl bg-zinc-900 border border-white/10 max-w-md mx-auto mb-10">
          {[
            { id: "all_time", label: "All-Time" },
            { id: "weekly", label: "This Week" },
            { id: "monthly", label: "This Month" },
            { id: "daily", label: "Daily Challenge" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                period === tab.id
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TOP 3 PODIUM */}
        {!loading && topThree.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto mb-12 items-end">
            {/* Rank 2 (Silver) */}
            {topThree[1] && (
              <div className="flex flex-col items-center p-5 rounded-2xl bg-zinc-900 border border-white/15 text-center relative pt-8">
                <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-zinc-300 text-black font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl mb-2">
                  {topThree[1].avatar}
                </div>
                <span className="text-xs font-bold text-white truncate max-w-full">
                  {topThree[1].displayName}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  @{topThree[1].username}
                </span>
                <div className="mt-2 text-xs font-bold text-zinc-300 font-mono">
                  {topThree[1].score.toLocaleString()} PTS
                </div>
              </div>
            )}

            {/* Rank 1 (Gold/Apex) */}
            {topThree[0] && (
              <div className="flex flex-col items-center p-6 rounded-2xl bg-zinc-950 border-2 border-white text-center relative pt-9 scale-105 shadow-[0_4px_24px_rgba(255,255,255,0.1)]">
                <div className="absolute -top-4 w-9 h-9 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center shadow-md">
                  <Crown className="w-5 h-5 text-red-500 fill-red-500" />
                </div>
                <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-white/20 flex items-center justify-center text-3xl mb-2.5">
                  {topThree[0].avatar}
                </div>
                <span className="text-sm font-bold text-white truncate max-w-full">
                  {topThree[0].displayName}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  @{topThree[0].username}
                </span>
                <div className="mt-2 text-sm font-bold text-white font-mono">
                  {topThree[0].score.toLocaleString()} PTS
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {topThree[2] && (
              <div className="flex flex-col items-center p-5 rounded-2xl bg-zinc-900 border border-white/10 text-center relative pt-8">
                <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-zinc-600 text-zinc-200 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl mb-2">
                  {topThree[2].avatar}
                </div>
                <span className="text-xs font-bold text-white truncate max-w-full">
                  {topThree[2].displayName}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  @{topThree[2].username}
                </span>
                <div className="mt-2 text-xs font-bold text-zinc-400 font-mono">
                  {topThree[2].score.toLocaleString()} PTS
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current User Rank Card (if applicable) */}
        {user && currentUserRank && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-md bg-white text-black">
                #{currentUserRank}
              </span>
              <div>
                <span className="text-xs font-bold text-white block">Your Current Standing</span>
                <span className="text-[11px] text-zinc-400">Level {user.level} • {user.xp} XP</span>
              </div>
            </div>
            <span className="text-xs font-bold text-green-400">Ranked</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search players by username or display name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white placeholder:font-normal placeholder:text-zinc-500 focus:border-white focus:outline-none"
          />
        </div>

        {/* Rankings Table */}
        <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading leaderboard standings...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500">
              No recorded entries for this period yet. Be the first to play and claim #1!
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredEntries.map((entry) => {
                const isCurrentUser = entry.userId === user?.id;
                return (
                  <div
                    key={entry.userId}
                    className={`p-4 flex items-center justify-between text-xs transition-colors ${
                      isCurrentUser ? "bg-white/5 border-l-2 border-red-500 font-semibold" : "hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center font-mono font-bold text-zinc-500">
                        #{entry.rank}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-lg">
                        {entry.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{entry.displayName}</span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          @{entry.username} • Level {entry.level}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-white block">
                        {entry.score.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-400">
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
