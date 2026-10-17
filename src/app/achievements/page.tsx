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
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] text-xs font-bold mb-3">
            <Award className="w-3.5 h-3.5" />
            Milestones & Honors
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Achievements
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-md mx-auto">
            Earn bonus XP and unlock prestige badges by demonstrating speed, memory mastery, and discipline.
          </p>
        </div>

        {/* Progress Card */}
        <div className="p-6 rounded-2xl flash-card bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
                {totalUnlocked} / {totalPossible}
              </span>
              <span className="text-xs font-bold text-[var(--color-mint)]">
                ({percentComplete}% Unlocked)
              </span>
            </div>
            <div className="w-full sm:w-64 h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-strong)] to-[var(--color-mint)] transition-all"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {!user && (
            <button
              onClick={() => openAuthModal("register")}
              className="btn-primary text-xs font-bold py-2.5 px-5"
            >
              Sign up to save achievements
            </button>
          )}
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedSlugs.has(ach.slug);
            const userAch = userAchievements.find((a) => a.slug === ach.slug);
            const Icon = ICON_MAP[ach.icon] || Award;

            return (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl flash-card border transition-all ${
                  isUnlocked
                    ? "bg-[var(--bg-card)] border-[var(--border-active)] shadow-sm"
                    : "bg-[var(--bg-secondary)]/60 border-[var(--border-subtle)] opacity-70"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      isUnlocked
                        ? "bg-[var(--accent-strong)] text-white shadow-md scale-105"
                        : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {isUnlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>

                  <span className="text-[10px] font-mono font-bold text-[var(--color-mint)] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    +{ach.xpReward} XP
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                  {ach.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {ach.description}
                </p>

                {isUnlocked && userAch && (
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-[10px] text-[var(--color-mint)] font-medium">
                    Unlocked on {new Date(userAch.unlockedAt).toLocaleDateString()}
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
