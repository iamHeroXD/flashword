"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import {
  Award,
  Zap,
  Target,
  Brain,
  Flame,
  Compass,
  CalendarCheck,
  Sparkles,
  Trophy,
  ShieldAlert,
  Crown,
  CheckCircle,
  Lock,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Target,
  Brain,
  Flame,
  Award,
  Compass,
  CalendarCheck,
  Sparkles,
  Trophy,
  ShieldAlert,
  Crown,
  CheckCircle,
};

export default function AchievementsPage() {
  return (
    <AuthProvider>
      <AchievementsContent />
    </AuthProvider>
  );
}

function AchievementsContent() {
  const { user, openAuthModal } = useAuth();

  const userAchievements = user?.achievements || [];
  const unlockedSlugs = new Set(userAchievements.map((a) => a.slug));
  const totalUnlocked = unlockedSlugs.size;
  const totalPossible = ACHIEVEMENTS.length;
  const percentComplete = Math.round((totalUnlocked / totalPossible) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />
      <AuthModal />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="clay-badge text-zinc-300 mb-3 bg-zinc-900 border-white/10">
            <Award className="w-3.5 h-3.5 text-red-500" />
            Milestones & Honors
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Achievements
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
            Earn bonus XP and unlock prestige badges by demonstrating speed, memory mastery, and discipline.
          </p>
        </div>

        {/* Progress Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-zinc-950 border border-white/10 mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-2.5">
              <span className="text-3xl font-black text-white font-mono">
                {totalUnlocked} / {totalPossible}
              </span>
              <span className="text-xs font-bold text-zinc-400">
                ({percentComplete}% Unlocked)
              </span>
            </div>
            <div className="w-full sm:w-72 h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] transition-all"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {!user && (
            <button
              onClick={() => openAuthModal("register")}
              className="btn-primary text-xs font-bold py-2.5 px-6 rounded-xl"
            >
              Sign up to save achievements
            </button>
          )}
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedSlugs.has(ach.slug);
            const userAch = userAchievements.find((a) => a.slug === ach.slug);
            const Icon = ICON_MAP[ach.icon] || Award;

            return (
              <div
                key={ach.id}
                className={`p-6 rounded-2xl transition-all ${
                  isUnlocked
                    ? "bg-zinc-900 border border-white/15 hover:border-white/30"
                    : "bg-zinc-950/60 border border-white/5 opacity-50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isUnlocked
                        ? "bg-white text-black shadow-md"
                        : "bg-zinc-900 border border-white/10 text-zinc-600"
                    }`}
                  >
                    {isUnlocked ? <Icon className="w-5 h-5 text-black stroke-[2.5]" /> : <Lock className="w-4 h-4" />}
                  </div>

                  <span className="text-[10px] font-mono font-bold text-zinc-300 px-2.5 py-1 rounded bg-zinc-800 border border-white/10">
                    +{ach.xpReward} XP
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5">
                  {ach.name}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {ach.description}
                </p>

                {isUnlocked && userAch && (
                  <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-green-400 font-bold">
                    ✓ Unlocked on {new Date(userAch.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
