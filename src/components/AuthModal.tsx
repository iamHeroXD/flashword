"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "@/lib/audio";
import {
  X,
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const AVATAR_OPTIONS = ["⚡", "🧠", "🚀", "🎯", "🔥", "🏆", "💎", "🌟", "🦊", "🐉", "🪐", "⚔️"];

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, refreshUser } = useAuth();
  const [tab, setTab] = useState<"login" | "register" | "recover">(authModalTab);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("⚡");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Status states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState<string | null>(null);

  // Sync tab with context trigger
  React.useEffect(() => {
    setTab(authModalTab);
    setError(null);
    setGeneratedRecoveryCode(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid username or password.");
        sounds.incorrect();
      } else {
        sounds.start();
        await refreshUser();
        closeAuthModal();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          confirmPassword,
          displayName,
          avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        sounds.incorrect();
      } else {
        sounds.achievement();
        setGeneratedRecoveryCode(data.recoveryCode);
        await refreshUser();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          recoveryCode,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid username or recovery code.");
        sounds.incorrect();
      } else {
        sounds.correct();
        setRecoverySuccessMessage(data.message);
        setTimeout(() => {
          setTab("login");
          setRecoverySuccessMessage(null);
          setPassword("");
        }, 2000);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md flash-card bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-2xl rounded-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo size="md" href="" />
          <p className="text-xs text-[var(--text-secondary)] mt-1.5">
            Username-only authentication. No email required.
          </p>
        </div>

        {/* REGISTRATION RECOVERY CODE VIEW (Displayed once on success) */}
        {generatedRecoveryCode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-active)] text-center">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center mx-auto mb-2 border border-[var(--border-active)]">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Account Created!</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Because we do not store emails, save this recovery code safely. You will need it if you ever forget your password.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-active)] flex items-center justify-between">
              <code className="text-sm font-mono font-bold tracking-wider text-[var(--color-mint)]">
                {generatedRecoveryCode}
              </code>
              <button
                onClick={() => copyToClipboard(generatedRecoveryCode)}
                className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-1 text-xs"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={closeAuthModal}
              className="w-full btn-primary py-2.5 text-sm font-semibold mt-2"
            >
              I have saved my code — Let&apos;s Play!
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] mb-5">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tab === "login"
                    ? "bg-[var(--accent-strong)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tab === "register"
                    ? "bg-[var(--accent-strong)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {recoverySuccessMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{recoverySuccessMessage}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. speedreader"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("recover");
                        setError(null);
                      }}
                      className="text-[11px] text-[var(--accent-primary)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 text-sm font-semibold mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? "Authenticating..." : "Log In"}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Choose Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="letters, numbers, 3-20 chars"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      Avatar
                    </label>
                    <select
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      {AVATAR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  🔒 Zero email collection. An instant, secure recovery key will be generated for password resets.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 text-sm font-semibold mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>
            )}

            {/* RECOVERY FORM (Reset password via recovery code) */}
            {tab === "recover" && (
              <form onSubmit={handleRecover} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                  Enter your username and the recovery code you received during sign up to reset your password.
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your registered username"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Recovery Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="FLASH-XXXX-XXXX-XXXX"
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] uppercase transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min. 6 chars)"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-strong)] focus:outline-none text-[var(--text-primary)] transition-colors"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="btn-secondary flex-1 py-2 text-xs"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-2 text-xs font-semibold"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
