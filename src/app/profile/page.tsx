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
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center mb-4">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Profile & Progress
          </h1>
          <p className="text-xs text-zinc-400 mb-6">
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
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
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
        setPassMsg({ text: data.error || "Failed to update password.", error: true });
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
        logout();
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
        <div className="p-7 sm:p-9 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl">
              {user.avatar || "⚡"}
            </div>
            <div>
              <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {user.displayName || user.username}
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-black">
                  LVL {user.level}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                @{user.username} • Verified Member
              </p>

              {/* XP Progress */}
              <div className="mt-3.5">
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5 font-bold">
                  <span>Level {user.level} Progress</span>
                  <span className="font-mono text-zinc-300">{user.xp} / {levelInfo.nextLevelXP} XP</span>
                </div>
                <div className="w-48 sm:w-64 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/play" className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 rounded-xl">
              <Play className="w-4 h-4 fill-current" />
              Play Now
            </Link>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STATS TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-zinc-900 border border-white/10 text-center">
            <div className="flex items-center justify-center text-red-500 mb-1.5">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-white font-mono">
              {user.currentStreak || 0}
            </span>
            <span className="text-[10px] text-zinc-400 block uppercase font-bold mt-1">
              Daily Streak
            </span>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900 border border-white/10 text-center">
            <div className="flex items-center justify-center text-zinc-300 mb-1.5">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-white font-mono">
              {user.bestStreak || 0}
            </span>
            <span className="text-[10px] text-zinc-400 block uppercase font-bold mt-1">
              Best Streak
            </span>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900 border border-white/10 text-center">
            <div className="flex items-center justify-center text-green-400 mb-1.5">
              <Play className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-white font-mono">
              {user.totalRounds || 0}
            </span>
            <span className="text-[10px] text-zinc-400 block uppercase font-bold mt-1">
              Rounds Played
            </span>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900 border border-white/10 text-center">
            <div className="flex items-center justify-center text-zinc-200 mb-1.5">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-white font-mono">
              {user.totalCorrect || 0}
            </span>
            <span className="text-[10px] text-zinc-400 block uppercase font-bold mt-1">
              Words Recalled
            </span>
          </div>
        </div>

        {/* SETTINGS PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. EDIT PROFILE */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-300" />
              Edit Profile
            </h2>

            {profileMsg && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white font-bold focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2">
                  Select Avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAvatar(opt)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                        avatar === opt
                          ? "bg-white text-black font-bold scale-105"
                          : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Public Leaderboard Profile
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Show username and avatar on rankings
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-red-500 cursor-pointer"
                />
              </div>

              <button type="submit" className="w-full btn-primary py-2.5 text-xs font-bold rounded-xl mt-2">
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* 2. CHANGE PASSWORD */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-zinc-300" />
              Change Password
            </h2>

            {passMsg && (
              <div
                className={`mb-4 p-3 rounded-lg border text-xs font-bold ${
                  passMsg.error
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-green-500/10 border-green-500/20 text-green-400"
                }`}
              >
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white font-bold focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  New Password (min. 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white font-bold focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white font-bold focus:border-white focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full btn-secondary py-2.5 text-xs font-bold rounded-xl mt-2">
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* DANGER ZONE: ACCOUNT DELETION */}
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Permanent Account Deletion
              </h3>
              <p className="text-xs text-zinc-400 mt-1 font-medium leading-relaxed">
                Permanently delete your profile, achievements, match history, and records. This action cannot be undone.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors"
            >
              {showDeleteConfirm ? "Cancel" : "Delete Account"}
            </button>
          </div>

          {showDeleteConfirm && (
            <form onSubmit={handleDeleteAccount} className="mt-4 pt-4 border-t border-red-500/20 space-y-3">
              {deleteError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                  {deleteError}
                </div>
              )}
              <label className="block text-xs font-bold text-red-300">
                Enter your password to confirm permanent deletion:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                  className="flex-1 px-4 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white font-bold focus:border-red-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors"
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
