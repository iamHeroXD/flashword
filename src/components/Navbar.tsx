"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/audio";
import {
  Play,
  Trophy,
  Flame,
  Award,
  User,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Shield,
  LogIn,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Sound init
    setSoundEnabled(sounds.isEnabled());

    // Theme init
    try {
      const stored = localStorage.getItem("flashword_theme");
      const isLight = stored === "light";
      setIsLightMode(isLight);
      document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");
    } catch {}
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    sounds.setEnabled(next);
    setSoundEnabled(next);
    if (next) sounds.start();
  };

  const toggleTheme = () => {
    const next = !isLightMode;
    setIsLightMode(next);
    try {
      localStorage.setItem("flashword_theme", next ? "light" : "dark");
      document.documentElement.setAttribute("data-theme", next ? "light" : "dark");
    } catch {}
  };

  const navLinks = [
    { href: "/play", label: "Play", icon: Play },
    { href: "/challenges", label: "Challenges", icon: Flame },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/achievements", label: "Achievements", icon: Award },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full clay-nav transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center gap-8">
            <BrandLogo size="md" href="/" />

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F19] font-extrabold shadow-[0_4px_12px_rgba(245,158,11,0.35),inset_1px_1px_2px_rgba(255,255,255,0.6),inset_-1px_-1px_2px_rgba(180,83,9,0.6)] scale-102"
                        : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)] hover:shadow-[var(--clay-pill-shadow)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Sound, Theme, Auth/Profile */}
          <div className="flex items-center gap-2.5">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute game sounds" : "Enable game sounds"}
              className={`p-2 rounded-xl transition-all border ${
                soundEnabled
                  ? "bg-gradient-to-r from-[#F59E0B]/20 to-[#D97706]/20 border-amber-500/40 text-amber-400 shadow-[var(--clay-pill-shadow)]"
                  : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-active)] shadow-[var(--clay-pill-shadow)]"
              }`}
              title={soundEnabled ? "Sound enabled (click to mute)" : "Sound muted (click to enable)"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light theme"
              className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-active)] shadow-[var(--clay-pill-shadow)] transition-all"
              title={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
            >
              {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Admin Shield link if role is admin */}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 shadow-[var(--clay-pill-shadow)] transition-all ${
                  pathname === "/admin" ? "ring-2 ring-amber-500/50" : ""
                }`}
                title="Admin Control Center"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}

            {/* User Profile / Login */}
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-2 pr-3.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--clay-pill-shadow)] hover:border-[var(--border-active)] transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center text-lg select-none group-hover:scale-105 transition-transform">
                  {user.avatar || "⚡"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                    {user.displayName || user.username}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-[var(--accent-primary)]">
                      Lvl {user.level}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      • {user.xp} XP
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal("login")}
                  className="px-3 py-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Log In
                </button>
                <button
                  onClick={() => openAuthModal("register")}
                  className="btn-primary text-xs sm:text-sm py-1.5 px-3.5"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Floating Clay Pill Dock */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 z-40 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--clay-card-shadow)] px-2 py-1.5 flex items-center justify-around safe-bottom">
        <Link
          href="/play"
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
            pathname === "/play"
              ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F19] font-black shadow-[0_4px_10px_rgba(245,158,11,0.35),inset_1px_1px_2px_rgba(255,255,255,0.6)] scale-105"
              : "text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          <Play className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Play</span>
        </Link>

        <Link
          href="/challenges"
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
            pathname === "/challenges"
              ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F19] font-black shadow-[0_4px_10px_rgba(245,158,11,0.35),inset_1px_1px_2px_rgba(255,255,255,0.6)] scale-105"
              : "text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Challenges</span>
        </Link>

        <Link
          href="/leaderboard"
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
            pathname === "/leaderboard"
              ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F19] font-black shadow-[0_4px_10px_rgba(245,158,11,0.35),inset_1px_1px_2px_rgba(255,255,255,0.6)] scale-105"
              : "text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Rankings</span>
        </Link>

        {user ? (
          <Link
            href="/profile"
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
              pathname === "/profile"
                ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F19] font-black shadow-[0_4px_10px_rgba(245,158,11,0.35),inset_1px_1px_2px_rgba(255,255,255,0.6)] scale-105"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            <div className="w-5 h-5 mb-0.5 flex items-center justify-center text-sm">
              {user.avatar || <User className="w-4 h-4" />}
            </div>
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        ) : (
          <button
            onClick={() => openAuthModal("login")}
            className="flex flex-col items-center py-1.5 px-3 rounded-xl text-[var(--text-secondary)] hover:text-white"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Log In</span>
          </button>
        )}
      </nav>
    </>
  );
}
