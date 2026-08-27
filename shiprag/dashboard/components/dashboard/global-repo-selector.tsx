"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRepository } from "@/context/repository-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Search,
  Layers,
  GitBranch,
  Check,
  Plus,
  Circle,
  ExternalLink,
} from "lucide-react";

export function GlobalRepositorySelector() {
  const {
    repositories,
    selectedRepoId,
    setSelectedRepoId,
    selectedRepo,
    setIsConnectModalOpen,
  } = useRepository();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = repositories.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#FFE5BF] bg-white hover:bg-[#FFF2DB]/50 transition-all text-left text-xs font-mono group shadow-xs"
      >
        <div className="flex items-center gap-2">
          {selectedRepoId === "all" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[#211c1d]">All Repositories</span>
              <span className="hidden sm:inline text-[#73666b] text-[11px]">
                ({repositories.length})
              </span>
            </>
          ) : (
            <>
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedRepo?.syncStatus === "synced"
                    ? "bg-emerald-500"
                    : selectedRepo?.syncStatus === "warning"
                    ? "bg-amber-500"
                    : "bg-[#F62440]"
                }`}
              />
              <span className="font-bold text-[#211c1d] truncate max-w-[140px] sm:max-w-[200px]">
                {selectedRepo?.name}
              </span>
              <span className="hidden sm:inline text-[#73666b] text-[11px]">
                :{selectedRepo?.defaultBranch}
              </span>
            </>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#73666b] transition-transform ${
            isOpen ? "rotate-180 text-[#F62440]" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-[#FFE5BF] bg-[#FFFAF3] p-2.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100 text-[#211c1d]">
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a8999e]" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#FFE5BF] bg-white text-xs text-[#211c1d] placeholder-[#a8999e] focus:outline-none focus:border-[#F62440] font-mono shadow-xs"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {/* Option: All Repositories */}
            <button
              onClick={() => {
                setSelectedRepoId("all");
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                selectedRepoId === "all"
                  ? "bg-[#FFE5BF] text-[#F62440] font-semibold border border-[#FFE5BF]"
                  : "hover:bg-[#FFF2DB]/60 text-[#5e5356]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#FFF2DB] border border-[#FFE5BF] flex items-center justify-center text-[#F62440]">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-[#211c1d] font-mono">
                    All Repositories
                  </div>
                  <div className="text-[11px] text-[#73666b]">
                    Query and search across all connected codebases
                  </div>
                </div>
              </div>
              {selectedRepoId === "all" && (
                <Check className="w-4 h-4 text-[#F62440] shrink-0" />
              )}
            </button>

            <div className="py-1 px-2 text-[10px] font-mono text-[#8e8085] uppercase tracking-wider font-bold">
              Connected Repositories ({filtered.length})
            </div>

            {/* Repository Items */}
            {filtered.map((repo) => (
              <button
                key={repo.id}
                onClick={() => {
                  setSelectedRepoId(repo.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                  selectedRepoId === repo.id
                    ? "bg-[#FFE5BF] text-[#F62440] font-semibold border border-[#FFE5BF]"
                    : "hover:bg-[#FFF2DB]/60 text-[#5e5356]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{
                      backgroundColor:
                        repo.syncStatus === "synced"
                          ? "#10b981"
                          : repo.syncStatus === "warning"
                          ? "#f59e0b"
                          : "#F62440",
                    }}
                  />
                  <div>
                    <div className="font-bold text-[#211c1d] font-mono flex items-center gap-1.5">
                      {repo.name}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-[#FFE5BF] text-[#73666b]">
                        {repo.defaultBranch}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#73666b] truncate max-w-[190px] sm:max-w-[240px]">
                      {repo.fullName}
                    </div>
                    <div className="text-[10px] text-[#8e8085] font-mono mt-0.5">
                      {repo.fileCount} files • {repo.chunkCount} chunks • {repo.lastSync}
                    </div>
                  </div>
                </div>
                {selectedRepoId === repo.id && (
                  <Check className="w-4 h-4 text-[#F62440] shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Bottom Action: Connect New */}
          <div className="pt-2 mt-2 border-t border-[#FFE5BF]/70">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsConnectModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-[#FFE5BF] bg-[#FFF2DB]/40 hover:bg-[#FFE5BF]/40 text-xs text-[#F62440] font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Connect New Repository
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
