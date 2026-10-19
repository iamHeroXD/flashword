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
    setSoundEnabled(sounds.isEnabled());

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
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                      active
                        ? "bg-white text-black font-bold shadow-[0_1px_8px_rgba(255,255,255,0.2)]"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-white/10"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-black" : ""}`} />
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
              className={`p-2 rounded-lg transition-all border ${
                soundEnabled
                  ? "bg-zinc-800 border-red-500/50 text-red-400"
                  : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
              }`}
              title={soundEnabled ? "Sound enabled (click to mute)" : "Sound muted (click to enable)"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light theme"
              className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
              title={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
            >
              {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Admin Shield link if role is admin */}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all ${
                  pathname === "/admin" ? "ring-1 ring-red-500" : ""
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
                className="flex items-center gap-2 pl-2 pr-3.5 py-1 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/25 transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-white/10 flex items-center justify-center text-sm select-none group-hover:scale-105 transition-transform">
                  {user.avatar || "⚡"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">
                    {user.displayName || user.username}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-semibold text-red-400">
                      LVL {user.level}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      • {user.xp} XP
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal("login")}
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Log In
                </button>
                <button
                  onClick={() => openAuthModal("register")}
                  className="btn-primary text-xs sm:text-sm py-1.5 px-3.5 font-bold"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Sleek Floating Carbon Capsule */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 z-40 rounded-xl bg-black/90 backdrop-blur-lg border border-white/10 px-2 py-1.5 flex items-center justify-around safe-bottom shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
        <Link
          href="/play"
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-all ${
            pathname === "/play"
              ? "bg-white text-black font-bold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Play className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium">Play</span>
        </Link>

        <Link
          href="/challenges"
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-all ${
            pathname === "/challenges"
              ? "bg-white text-black font-bold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium">Daily</span>
        </Link>

        <Link
          href="/leaderboard"
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-all ${
            pathname === "/leaderboard"
              ? "bg-white text-black font-bold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium">Rankings</span>
        </Link>

        {user ? (
          <Link
            href="/profile"
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-all ${
              pathname === "/profile"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <div className="w-4 h-4 mb-0.5 flex items-center justify-center text-xs">
              {user.avatar || <User className="w-3.5 h-3.5" />}
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        ) : (
          <button
            onClick={() => openAuthModal("login")}
            className="flex flex-col items-center py-1.5 px-3 rounded-lg text-zinc-400 hover:text-white"
          >
            <User className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-medium">Log In</span>
          </button>
        )}
      </nav>
    </>
  );
}
