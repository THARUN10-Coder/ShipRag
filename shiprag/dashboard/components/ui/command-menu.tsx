"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRepository } from "@/context/repository-context";
import {
  Search,
  Bot,
  FolderGit2,
  Bug,
  GitPullRequest,
  ShieldAlert,
  Network,
  Command,
  X,
  FileCode,
} from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { repositories, setSelectedRepoId } = useRepository();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  const NAV_COMMANDS = [
    { label: "AI Copilot", icon: Bot, href: "/dashboard/copilot" },
    { label: "Code Search", icon: Search, href: "/dashboard/search" },
    { label: "Code Graph", icon: Network, href: "/dashboard/graph" },
    { label: "AI Root-Cause Debugger", icon: Bug, href: "/dashboard/debugger" },
    { label: "Pull Request Intelligence", icon: GitPullRequest, href: "/dashboard/pull-requests" },
    { label: "Security Intelligence", icon: ShieldAlert, href: "/dashboard/security" },
    { label: "Repositories Directory", icon: FolderGit2, href: "/dashboard/repositories" },
  ];

  const filteredNav = NAV_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRepos = repositories.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleSelectRepo = (repoId: string) => {
    setSelectedRepoId(repoId);
    setOpen(false);
    router.push(`/dashboard/copilot`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-[#FFE5BF] bg-[#FFFAF3] shadow-2xl overflow-hidden text-[#211c1d]">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#FFE5BF]/70 bg-[#FFF2DB]/40">
          <Search className="w-4 h-4 text-[#a8999e] mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search commands, repositories, code, or tools... (Esc to exit)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-[#211c1d] placeholder-[#a8999e] focus:outline-none font-mono"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded text-[#73666b] hover:text-[#211c1d]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 font-mono text-xs">
          {/* Navigation Section */}
          <div>
            <div className="px-2 py-1 text-[10px] text-[#8e8085] uppercase tracking-wider font-bold">
              Navigation & Intelligence Tools
            </div>
            <div className="space-y-0.5">
              {filteredNav.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <div
                    key={cmd.href}
                    onClick={() => handleSelect(cmd.href)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FFE5BF]/70 hover:text-[#F62440] text-[#5e5356] cursor-pointer transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#F62440]" />
                    <span>{cmd.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Repositories Section */}
          <div>
            <div className="px-2 py-1 text-[10px] text-[#8e8085] uppercase tracking-wider font-bold">
              Switch Active Repository Context
            </div>
            <div className="space-y-0.5">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => handleSelectRepo(repo.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#FFE5BF]/70 hover:text-[#F62440] text-[#5e5356] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-3.5 h-3.5 text-[#F62440]" />
                    <span>{repo.name}</span>
                    <span className="text-[10px] text-[#8e8085]">
                      ({repo.defaultBranch})
                    </span>
                  </div>
                  <span className="text-[10px] text-[#F62440] font-semibold">
                    Open in Copilot →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#FFF2DB]/50 border-t border-[#FFE5BF]/70 flex items-center justify-between text-[11px] font-mono text-[#73666b]">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#FFE5BF] text-[#211c1d]">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#FFE5BF] text-[#211c1d]">
              K
            </kbd>
            <span className="ml-1">to toggle</span>
          </div>
          <span>Grounded in connected repositories</span>
        </div>
      </div>
    </div>
  );
}
