"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { calculateLevelFromXP } from "@/lib/game/scoring";
import { sounds } from "@/lib/audio";
import {
  User,
  Flame,
  Award,
  Trophy,
  Play,
  KeyRound,
  ShieldAlert,
  LogOut,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

const AVATAR_OPTIONS = ["⚡", "🧠", "🚀", "🎯", "🔥", "🏆", "💎", "🌟", "🦊", "🐉", "🪐", "⚔️"];

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}

function ProfileContent() {
  const { user, logout, refreshUser, openAuthModal } = useAuth();

  // Profile edit states
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [avatar, setAvatar] = useState(user?.avatar || "⚡");
  const [isPublic, setIsPublic] = useState(user?.isPublicProfile ?? true);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Account delete states
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync initial user data
  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username);
      setAvatar(user.avatar || "⚡");
      setIsPublic(user.isPublicProfile ?? true);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
        <Navbar />
        <AuthModal />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
            Profile & Progress
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Log in or create a username-only account to track streaks, unlock achievements, and save personal records.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => openAuthModal("login")}
              className="flex-1 btn-secondary py-2.5 text-xs font-bold"
            >
              Log In
            </button>
            <button
              onClick={() => openAuthModal("register")}
              className="flex-1 btn-primary py-2.5 text-xs font-bold"
            >
              Sign Up
            </button>
          </div>
        </main>
      </div>
    );
  }

  const levelInfo = calculateLevelFromXP(user.xp);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          avatar,
          isPublicProfile: isPublic,
        }),
      });

      if (res.ok) {
        sounds.correct();
        setProfileMsg("Profile updated successfully!");
        await refreshUser();
        setTimeout(() => setProfileMsg(null), 3000);
      } else {
        setProfileMsg("Failed to update profile.");
      }
    } catch {
      setProfileMsg("Network error.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (newPassword !== confirmPassword) {
      setPassMsg({ text: "New passwords do not match.", error: true });
      return;
    }

    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        sounds.correct();
        setPassMsg({ text: "Password changed successfully!", error: false });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPassMsg(null), 3000);
      } else {
        sounds.incorrect();
        setPassMsg({ text: data.error || "Failed to change password.", error: true });
      }
    } catch {
      setPassMsg({ text: "Network error.", error: true });
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();
      if (res.ok) {
        await logout();
      } else {
        setDeleteError(data.error || "Failed to delete account.");
      }
    } catch {
      setDeleteError("Network error.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />
      <AuthModal />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* DASHBOARD HERO */}
        <div className="p-7 sm:p-9 rounded-3xl clay-card bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center sm:text-left">
            <div className="w-18 h-18 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-4xl shadow-[var(--clay-card-shadow)]">
              {user.avatar || "⚡"}
            </div>
            <div>
              <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] drop-shadow-sm">
                  {user.displayName || user.username}
                </h1>
                <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F19] shadow-[0_2px_6px_rgba(245,158,11,0.3)]">
                  LVL {user.level}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono font-bold mt-1">
                @{user.username} • Verified Member
              </p>

              {/* XP Progress */}
              <div className="mt-3.5">
                <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mb-1.5 font-bold">
                  <span>Level {user.level} Progress</span>
                  <span className="font-mono">{user.xp} / {levelInfo.nextLevelXP} XP</span>
                </div>
                <div className="w-48 sm:w-64 h-3 bg-[var(--bg-card)] rounded-full overflow-hidden shadow-[var(--clay-sunken-shadow)] border border-[var(--border-subtle)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#10B981] shadow-[0_2px_8px_rgba(245,158,11,0.5)] transition-all"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/play" className="clay-btn-primary py-3 px-7 text-xs font-extrabold flex items-center gap-2 rounded-2xl">
              <Play className="w-4 h-4 fill-current" />
              Play Now
            </Link>
            <button
              onClick={logout}
              className="p-3 rounded-2xl clay-card bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-red-400 shadow-[var(--clay-pill-shadow)] transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STATS TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl clay-card bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center shadow-[var(--clay-pill-shadow)]">
            <div className="flex items-center justify-center text-amber-400 mb-1.5">
              <Flame className="w-6 h-6" />
            </div>
            <span className="text-3xl font-black text-[var(--text-primary)] font-mono">
              {user.currentStreak || 0}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-extrabold mt-1">
              Daily Streak
            </span>
          </div>

          <div className="p-5 rounded-3xl clay-card bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center shadow-[var(--clay-pill-shadow)]">
            <div className="flex items-center justify-center text-[var(--accent-primary)] mb-1.5">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-3xl font-black text-[var(--text-primary)] font-mono">
              {user.bestStreak || 0}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-extrabold mt-1">
              Best Streak
            </span>
          </div>

          <div className="p-5 rounded-3xl clay-card bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center shadow-[var(--clay-pill-shadow)]">
            <div className="flex items-center justify-center text-[var(--color-mint)] mb-1.5">
              <Play className="w-6 h-6" />
            </div>
            <span className="text-3xl font-black text-[var(--text-primary)] font-mono">
              {user.totalRounds || 0}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-extrabold mt-1">
              Rounds Played
            </span>
          </div>

          <div className="p-5 rounded-3xl clay-card bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center shadow-[var(--clay-pill-shadow)]">
            <div className="flex items-center justify-center text-[#38BDF8] mb-1.5">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-3xl font-black text-[var(--text-primary)] font-mono">
              {user.totalCorrect || 0}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-extrabold mt-1">
              Words Recalled
            </span>
          </div>
        </div>

        {/* SETTINGS PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. EDIT PROFILE */}
          <div className="p-7 rounded-3xl clay-card bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <h2 className="text-base font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--accent-primary)]" />
              Edit Profile
            </h2>

            {profileMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-2xl clay-input text-[var(--text-primary)] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-2">
                  Select Avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAvatar(opt)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all ${
                        avatar === opt
                          ? "bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-[#0B0F19] shadow-[0_4px_10px_rgba(245,158,11,0.35),inset_1px_1px_2px_rgba(255,255,255,0.6)] scale-110"
                          : "clay-card bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-[var(--clay-pill-shadow)] hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    Public Leaderboard Profile
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">
                    Show username and avatar on rankings
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent-strong)] cursor-pointer"
                />
              </div>

              <button type="submit" className="w-full clay-btn-primary py-3 text-xs font-extrabold rounded-2xl mt-2">
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* 2. CHANGE PASSWORD */}
          <div className="p-7 rounded-3xl clay-card bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <h2 className="text-base font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[var(--accent-primary)]" />
              Change Password
            </h2>

            {passMsg && (
              <div
                className={`mb-4 p-3 rounded-2xl border text-xs font-bold ${
                  passMsg.error
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 text-xs rounded-2xl clay-input text-[var(--text-primary)] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-1">
                  New Password (min. 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 text-xs rounded-2xl clay-input text-[var(--text-primary)] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 text-xs rounded-2xl clay-input text-[var(--text-primary)] font-bold"
                />
              </div>

              <button type="submit" className="w-full clay-btn-secondary py-3 text-xs font-extrabold rounded-2xl mt-2">
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* DANGER ZONE: ACCOUNT DELETION */}
        <div className="p-7 rounded-3xl clay-card bg-red-950/20 border border-red-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Permanent Account Deletion
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-medium leading-relaxed">
                Permanently delete your profile, achievements, match history, and records. This action cannot be undone.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-black shadow-[var(--clay-pill-shadow)] transition-colors"
            >
              {showDeleteConfirm ? "Cancel" : "Delete Account"}
            </button>
          </div>

          {showDeleteConfirm && (
            <form onSubmit={handleDeleteAccount} className="mt-4 pt-4 border-t border-red-500/20 space-y-3">
              {deleteError && (
                <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                  {deleteError}
                </div>
              )}
              <label className="block text-xs font-extrabold text-red-300">
                Enter your password to confirm permanent deletion:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                  className="flex-1 px-4 py-2.5 text-xs rounded-2xl clay-input text-[var(--text-primary)] font-bold"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-[var(--clay-pill-shadow)] transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
