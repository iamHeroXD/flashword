"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CATEGORIES } from "@/data/categories";
import {
  Shield,
  Users,
  Database,
  BarChart3,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Download,
} from "lucide-react";

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}

function AdminContent() {
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"stats" | "words" | "sessions">("stats");
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Words management state
  const [words, setWords] = useState<any[]>([]);
  const [wordsTotal, setWordsTotal] = useState(0);
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchWord, setSearchWord] = useState("");
  const [page, setPage] = useState(0);

  // Add word modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newDef, setNewDef] = useState("");
  const [newCat, setNewCat] = useState("english-vocab");
  const [newDiff, setNewDiff] = useState("normal");
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Fetch admin stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {} finally {
      setLoadingStats(false);
    }
  };

  // Fetch words with pagination
  const fetchWords = async () => {
    try {
      const res = await fetch(
        `/api/admin/words?categoryId=${selectedCat}&search=${encodeURIComponent(searchWord)}&limit=25&offset=${page * 25}`
      );
      if (res.ok) {
        const data = await res.json();
        setWords(data.words || []);
        setWordsTotal(data.total || 0);
      }
    } catch {}
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStats();
      fetchWords();
    }
  }, [user, selectedCat, searchWord, page]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">
            Access Restricted
          </h1>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-6">
            Administrator privileges required to view platform metrics and management tools.
          </p>
          <Link href="/" className="btn-secondary py-2 px-4 text-xs font-semibold">
            Return to Homepage
          </Link>
        </main>
      </div>
    );
  }

  const handleToggleWordStatus = async (wordId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/words/${wordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchWords();
      fetchStats();
    } catch {}
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm("Are you sure you want to permanently delete this word?")) return;
    try {
      await fetch(`/api/admin/words/${wordId}`, { method: "DELETE" });
      fetchWords();
      fetchStats();
    } catch {}
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    try {
      const res = await fetch("/api/admin/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: newWord.trim(),
          definition: newDef.trim(),
          categoryId: newCat,
          difficulty: newDiff,
        }),
      });

      if (res.ok) {
        setAddSuccess("Word added successfully!");
        setNewWord("");
        setNewDef("");
        fetchWords();
        fetchStats();
        setTimeout(() => {
          setAddSuccess(null);
          setShowAddModal(false);
        }, 1500);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />
      <AuthModal />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-1">
              <Shield className="w-4 h-4" />
              ADMIN CONTROL CENTER
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Platform Administration
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setActiveTab("stats")}
              className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "stats"
                  ? "bg-[var(--accent-strong)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab("words")}
              className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "words"
                  ? "bg-[var(--accent-strong)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              Word Management
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "sessions"
                  ? "bg-[var(--accent-strong)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              Recent Sessions
            </button>
          </div>
        </div>

        {/* 1. METRICS TAB */}
        {activeTab === "stats" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <Users className="w-5 h-5 text-[var(--accent-primary)] mx-auto mb-1.5" />
                <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
                  {stats.totalUsers}
                </span>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mt-0.5">
                  Total Accounts
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <BarChart3 className="w-5 h-5 text-[var(--color-mint)] mx-auto mb-1.5" />
                <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
                  {stats.totalSessions}
                </span>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mt-0.5">
                  Games Completed
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <Database className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
                  {stats.totalWords}
                </span>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mt-0.5">
                  Curated Words
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
                  {stats.activeWords}
                </span>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mt-0.5">
                  Active in Decks
                </span>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">
                Category Distribution & Deck Volumes
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {stats.wordsByCat.map((c: any) => (
                  <div
                    key={c.slug}
                    className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-[var(--text-primary)] truncate max-w-[130px]">
                      {c.name}
                    </span>
                    <span className="font-mono font-bold text-[var(--accent-primary)]">
                      {c.word_count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. WORDS MANAGEMENT TAB */}
        {activeTab === "words" && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedCat}
                  onChange={(e) => {
                    setSelectedCat(e.target.value);
                    setPage(0);
                  }}
                  className="py-2 px-3 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search words..."
                    value={searchWord}
                    onChange={(e) => {
                      setSearchWord(e.target.value);
                      setPage(0);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto btn-primary py-2 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Word
              </button>
            </div>

            {/* Words Table */}
            <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
              <div className="p-3 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono flex items-center justify-between">
                <span>Showing {words.length} of {wordsTotal} words</span>
                <div className="flex gap-1.5">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="px-1.5 py-0.5">Page {page + 1}</span>
                  <button
                    disabled={(page + 1) * 25 >= wordsTotal}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="divide-y divide-[var(--border-subtle)]">
                {words.map((w) => (
                  <div key={w.id} className="p-3 sm:px-4 flex items-center justify-between text-xs hover:bg-[var(--bg-card)]">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleWordStatus(w.id, w.is_active === 1)}
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          w.is_active === 1 ? "text-emerald-400" : "text-gray-500"
                        }`}
                        title={w.is_active === 1 ? "Word is active" : "Word is deactivated"}
                      >
                        {w.is_active === 1 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <div>
                        <span className="font-bold text-[var(--text-primary)] mr-2">{w.word}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">({w.category_id})</span>
                        {w.definition && (
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{w.definition}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono capitalize bg-[var(--bg-card)] text-[var(--text-secondary)]">
                        {w.difficulty}
                      </span>
                      <button
                        onClick={() => handleDeleteWord(w.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete word"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. RECENT SESSIONS TAB */}
        {activeTab === "sessions" && stats?.recentSessions && (
          <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
            <div className="p-3.5 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)]">
              Last 10 Completed Game Sessions
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {stats.recentSessions.map((s: any) => (
                <div key={s.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[var(--text-primary)] mr-2">
                      {s.username ? `@${s.username}` : "Guest Player"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {s.mode.toUpperCase()} • {s.category_id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-[var(--color-mint)] block">
                      {s.score} PTS ({s.accuracy}%)
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)]">
                      {new Date(s.completed_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD WORD MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-active)] shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Add Word to Database</h2>

              {addSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  {addSuccess}
                </div>
              )}

              <form onSubmit={handleAddWord} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Word
                  </label>
                  <input
                    type="text"
                    required
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="e.g. Mitochondria"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Definition
                  </label>
                  <textarea
                    rows={2}
                    value={newDef}
                    onChange={(e) => setNewDef(e.target.value)}
                    placeholder="Concise educational definition"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      Category
                    </label>
                    <select
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      Difficulty
                    </label>
                    <select
                      value={newDiff}
                      onChange={(e) => setNewDiff(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    >
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary flex-1 py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1 py-2 text-xs font-bold">
                    Add Word
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
