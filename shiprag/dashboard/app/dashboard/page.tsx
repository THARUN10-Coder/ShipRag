"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRepository } from "@/context/repository-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient, RealActivity } from "@/lib/api/client";
import Link from "next/link";
import Image from "next/image";
import {
  FolderGit2,
  Bot,
  Search,
  Network,
  GitPullRequest,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  GitBranch,
  Clock,
  ExternalLink,
  MoreHorizontal,
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function OverviewDashboardPage() {
  const {
    repositories,
    selectedRepoId,
    setIsConnectModalOpen,
    isLoading,
    refreshRepositories,
  } = useRepository();

  const [activities, setActivities] = useState<RealActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(true);

  // Load real Firestore audit activity stream
  const loadActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const realActs = await apiClient.getActivities(6);
      setActivities(realActs);
    } catch (_) {
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Filter repositories if specific one selected
  const displayedRepos =
    selectedRepoId === "all"
      ? repositories
      : repositories.filter((r) => r.id === selectedRepoId);

  // Calculate real total statistics
  const totalFiles = repositories.reduce((acc, r) => acc + (r.fileCount || 0), 0);
  const totalChunks = repositories.reduce((acc, r) => acc + (r.chunkCount || 0), 0);

  const formatActivityTime = (isoString?: string) => {
    if (!isoString) return "Recently";
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch (_) {
      return "Recently";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 2-Column Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column (Main Content Area: Hero, Repositories, Quick Actions, CTA) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. Hero Card */}
          <div className="relative rounded-[24px] border border-[#FFE5BF] bg-gradient-to-r from-[#FFFAF3] via-[#FFF2DB] to-[#FFE5BF]/60 p-6 sm:p-8 overflow-hidden shadow-[0_4px_20px_rgba(246,36,64,0.04)]">
            <div className="relative z-10 max-w-md space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-[#FFF2DB] text-[#F62440] text-[11px] font-bold tracking-wide border border-[#FFE5BF]">
                Welcome back!
              </span>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#211c1d] leading-[1.15]">
                Build with context, <br />
                <span className="text-[#F62440]">not just code.</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#5e5356] leading-relaxed">
                SHIPRAG helps you understand, search and improve your codebase using AI-powered intelligence.
              </p>

              <div className="pt-2">
                <Button
                  onClick={() => setIsConnectModalOpen(true)}
                  size="default"
                  className="rounded-full bg-[#F62440] hover:bg-[#de1832] text-white px-6 py-2.5 text-xs font-semibold shadow-md shadow-[#F62440]/30 flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Connect GitHub →
                </Button>
              </div>
            </div>

            {/* AI Robot Developer Illustration */}
            <div className="hidden sm:block absolute right-0 bottom-0 top-0 w-1/2 overflow-hidden pointer-events-none">
              <div className="relative w-full h-full">
                <Image
                  src="/hero_ai_robot.jpg"
                  alt="AI Assistant Illustration"
                  fill
                  className="object-contain object-right"
                  priority
                />
              </div>
            </div>
          </div>

          {/* 2. Your Repositories Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#211c1d] tracking-tight">
                  Your Repositories ({displayedRepos.length})
                </h2>
                <p className="text-xs text-[#73666b]">
                  {displayedRepos.length > 0
                    ? `Managing ${totalFiles} indexed files across ${totalChunks} vector embeddings.`
                    : "No repositories connected yet."}
                </p>
              </div>

              {displayedRepos.length > 0 && (
                <Link
                  href="/dashboard/repositories"
                  className="text-xs font-semibold text-[#F62440] hover:underline flex items-center gap-1"
                >
                  View all →
                </Link>
              )}
            </div>

            {/* Repositories Grid or Clean Empty State */}
            {isLoading ? (
              <div className="p-8 rounded-[20px] border border-[#FFE5BF] bg-white text-center space-y-2">
                <RefreshCw className="w-5 h-5 text-[#F62440] animate-spin mx-auto" />
                <p className="text-xs text-[#73666b] font-mono">Loading connected repositories from database...</p>
              </div>
            ) : displayedRepos.length === 0 ? (
              <div className="p-8 rounded-[20px] border border-[#FFE5BF] bg-white text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF2DB] border border-[#FFE5BF] text-[#F62440] flex items-center justify-center mx-auto">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="font-bold text-sm text-[#211c1d]">No Repositories Connected Yet</h3>
                  <p className="text-xs text-[#73666b]">
                    Connect a public or private GitHub repository to parse AST symbols, generate embeddings, and query code.
                  </p>
                </div>
                <Button
                  onClick={() => setIsConnectModalOpen(true)}
                  size="sm"
                  className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold px-5"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Connect Repository
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {displayedRepos.slice(0, 3).map((repo) => (
                  <div
                    key={repo.id}
                    className="p-5 rounded-[20px] border border-[#FFE5BF]/80 bg-white hover:border-[#FFE5BF] hover:shadow-[0_4px_16px_rgba(246,36,64,0.05)] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#211c1d] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            <FolderGit2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-[#211c1d] truncate max-w-[130px]">
                              {repo.name}
                            </h3>
                            <span className="inline-block text-[10px] text-[#73666b] bg-[#FFF2DB]/80 px-1.5 py-0.2 rounded border border-[#FFE5BF]/50">
                              {repo.defaultBranch}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`w-2 h-2 rounded-full ${
                            repo.syncStatus === "synced" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          title={repo.syncStatus}
                        />
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-[#5e5356] line-clamp-2 leading-relaxed mb-3">
                        {repo.description}
                      </p>

                      {/* Language, branch, timestamp */}
                      <div className="flex items-center gap-2 text-[10px] text-[#73666b] mb-4">
                        <span className="flex items-center gap-1 font-semibold">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: repo.languageColor }}
                          />
                          {repo.language}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <GitBranch className="w-3 h-3 text-[#a8999e]" />
                          {repo.defaultBranch}
                        </span>
                      </div>
                    </div>

                    {/* Stats Footer Box */}
                    <div className="grid grid-cols-2 gap-1 pt-3 border-t border-[#FFE5BF]/40 text-center bg-[#FFFAF3]/60 rounded-xl p-2">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-[#8e8085] font-medium">Files</div>
                        <div className="text-xs font-bold text-[#211c1d] mt-0.5">{repo.fileCount}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-[#8e8085] font-medium">Chunks</div>
                        <div className="text-xs font-bold text-[#211c1d] mt-0.5">{repo.chunkCount}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Quick Actions Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#211c1d] tracking-tight">
                Quick Actions
              </h2>
              <p className="text-xs text-[#73666b]">
                Jump into your most common tasks
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Action 1: Ask Copilot */}
              <Link
                href="/dashboard/copilot"
                className="p-4 rounded-[20px] border border-[#FFE5BF]/80 bg-white hover:border-[#FFE5BF] hover:shadow-[0_4px_16px_rgba(246,36,64,0.05)] transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-[#FFE5BF]/60 text-[#F62440] flex items-center justify-center mb-3">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#211c1d] mb-1">Ask Copilot</h3>
                  <p className="text-[11px] text-[#5e5356] leading-relaxed">
                    Get AI-powered answers from your codebase
                  </p>
                </div>
                <div className="pt-3 flex justify-end">
                  <ArrowRight className="w-3.5 h-3.5 text-[#F62440] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              {/* Action 2: Search Code */}
              <Link
                href="/dashboard/search"
                className="p-4 rounded-[20px] border border-[#FFE5BF]/80 bg-white hover:border-[#FFE5BF] hover:shadow-[0_4px_16px_rgba(246,36,64,0.05)] transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-[#FFF2DB] text-[#211c1d] flex items-center justify-center mb-3">
                    <Search className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#211c1d] mb-1">Search Code</h3>
                  <p className="text-[11px] text-[#5e5356] leading-relaxed">
                    Find files, functions, or symbols
                  </p>
                </div>
                <div className="pt-3 flex justify-end">
                  <ArrowRight className="w-3.5 h-3.5 text-[#F62440] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              {/* Action 3: Explore Graph */}
              <Link
                href="/dashboard/graph"
                className="p-4 rounded-[20px] border border-[#FFE5BF]/80 bg-white hover:border-[#FFE5BF] hover:shadow-[0_4px_16px_rgba(246,36,64,0.05)] transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-[#FFE5BF]/50 text-[#F62440] flex items-center justify-center mb-3">
                    <Network className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#211c1d] mb-1">Explore Graph</h3>
                  <p className="text-[11px] text-[#5e5356] leading-relaxed">
                    Visualize code relationships and dependencies
                  </p>
                </div>
                <div className="pt-3 flex justify-end">
                  <ArrowRight className="w-3.5 h-3.5 text-[#F62440] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              {/* Action 4: Review PR */}
              <Link
                href="/dashboard/pull-requests"
                className="p-4 rounded-[20px] border border-[#FFE5BF]/80 bg-white hover:border-[#FFE5BF] hover:shadow-[0_4px_16px_rgba(246,36,64,0.05)] transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-[#FFF2DB] text-[#F62440] flex items-center justify-center mb-3">
                    <GitPullRequest className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#211c1d] mb-1">Review PR</h3>
                  <p className="text-[11px] text-[#5e5356] leading-relaxed">
                    Get AI-powered code review
                  </p>
                </div>
                <div className="pt-3 flex justify-end">
                  <ArrowRight className="w-3.5 h-3.5 text-[#F62440] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (Live Database Activity & Quote Card) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Real Activity Stream from Firestore */}
          <div className="p-5 rounded-[22px] border border-[#FFE5BF]/80 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#211c1d] tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F62440]" />
                Recent Audit Activity
              </h2>
              <button
                onClick={loadActivities}
                className="text-[11px] font-semibold text-[#73666b] hover:text-[#211c1d] cursor-pointer"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {loadingActivities ? (
                <div className="text-center py-4 text-xs text-[#73666b] font-mono">
                  Loading activity stream...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#73666b] font-mono bg-[#FFFAF3] rounded-xl border border-[#FFE5BF]/50">
                  No activity events recorded yet. Connect a repository or run a search to generate activity logs.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[11px] text-[#211c1d] truncate">
                        {act.message}
                      </p>
                      <p className="text-[10px] text-[#73666b] font-mono truncate">{act.repository_id}</p>
                    </div>
                    <span className="text-[10px] text-[#a8999e] shrink-0 font-mono">
                      {formatActivityTime(act.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. Quote / Inspiration Card */}
          <div className="p-5 rounded-[22px] border border-[#FFE5BF] bg-gradient-to-br from-[#FFF2DB] to-[#FFE5BF]/60 relative overflow-hidden shadow-xs">
            <div className="w-7 h-7 rounded-full bg-[#F62440] text-white flex items-center justify-center font-serif text-sm font-bold mb-3 shadow-xs">
              “
            </div>

            <p className="text-xs font-semibold text-[#211c1d] italic leading-relaxed mb-3">
              “The best developers don’t just write code — they understand it.”
            </p>

            <p className="text-[10px] font-bold text-[#F62440] uppercase tracking-wider">
              — SHIPRAG
            </p>

            {/* Subtle corner wave accent */}
            <div className="absolute right-0 bottom-0 w-24 h-12 opacity-20 pointer-events-none bg-gradient-to-t from-[#F62440] to-transparent rounded-tl-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
