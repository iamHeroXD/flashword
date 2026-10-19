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
          <div className="clay-badge text-[var(--accent-primary)] mb-3">
            <Award className="w-3.5 h-3.5" />
            Milestones & Honors
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight drop-shadow-sm">
            Achievements
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
            Earn bonus XP and unlock prestige badges by demonstrating speed, memory mastery, and discipline.
          </p>
        </div>

        {/* Progress Card */}
        <div className="p-7 rounded-3xl clay-card bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[var(--clay-card-shadow)]">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-2.5">
              <span className="text-3xl font-black text-[var(--text-primary)] font-mono">
                {totalUnlocked} / {totalPossible}
              </span>
              <span className="text-xs font-black text-[var(--color-mint)]">
                ({percentComplete}% Unlocked)
              </span>
            </div>
            <div className="w-full sm:w-72 h-3 bg-[var(--bg-card)] rounded-full overflow-hidden shadow-[var(--clay-sunken-shadow)] border border-[var(--border-subtle)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#10B981] shadow-[0_2px_8px_rgba(245,158,11,0.5)] transition-all"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {!user && (
            <button
              onClick={() => openAuthModal("register")}
              className="clay-btn-primary text-xs font-extrabold py-3 px-6 rounded-2xl"
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
                className={`p-6 rounded-3xl clay-card transition-all ${
                  isUnlocked
                    ? "clay-card-interactive bg-[var(--bg-card)] border border-[var(--border-active)] shadow-[var(--clay-card-shadow)]"
                    : "bg-[var(--bg-secondary)]/70 border border-[var(--border-subtle)] opacity-70"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isUnlocked
                        ? "bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-[#0B0F19] shadow-[0_4px_12px_rgba(245,158,11,0.4),inset_1px_1px_2px_rgba(255,255,255,0.6)] scale-105"
                        : "bg-[var(--bg-card)] text-[var(--text-muted)] shadow-[var(--clay-pill-shadow)]"
                    }`}
                  >
                    {isUnlocked ? <Icon className="w-6 h-6 stroke-[2.5]" /> : <Lock className="w-5 h-5" />}
                  </div>

                  <span className="text-[10px] font-mono font-black text-[var(--color-mint)] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[var(--clay-pill-shadow)]">
                    +{ach.xpReward} XP
                  </span>
                </div>

                <h3 className="text-base font-black text-[var(--text-primary)] mb-1.5">
                  {ach.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {ach.description}
                </p>

                {isUnlocked && userAch && (
                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-[var(--color-mint)] font-bold">
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
