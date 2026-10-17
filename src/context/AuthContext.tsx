"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  xp: number;
  level: number;
  totalRounds?: number;
  totalWordsSeen?: number;
  totalCorrect?: number;
  currentStreak?: number;
  bestStreak?: number;
  isPublicProfile?: boolean;
  achievements?: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    xpReward: number;
    unlockedAt: string;
  }>;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (initialTab?: "login" | "register") => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "register";
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  isAuthModalOpen: false,
  authModalTab: "login",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch {}
  };

  const openAuthModal = (tab: "login" | "register" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        logout,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
