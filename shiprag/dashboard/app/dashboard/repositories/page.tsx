"use client";

import React, { useState } from "react";
import { useRepository } from "@/context/repository-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FolderGit2,
  Search,
  Plus,
  RefreshCw,
  GitBranch,
  ExternalLink,
  Settings,
  Bot,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function RepositoriesListPage() {
  const { repositories, syncRepository, setIsConnectModalOpen } = useRepository();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "synced" | "warning">("all");
  const [sortBy, setSortBy] = useState<"name" | "files" | "chunks">("name");

  const filtered = repositories
    .filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.language.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "all" || r.syncStatus === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "files") return b.fileCount - a.fileCount;
      if (sortBy === "chunks") return b.chunkCount - a.chunkCount;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#211c1d] flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-[#F62440]" />
            Connected Repositories
          </h1>
          <p className="text-xs sm:text-sm text-[#73666b] mt-1">
            Manage your vector-indexed GitHub codebases, branches, and synchronization status.
          </p>
        </div>

        <Button
          onClick={() => setIsConnectModalOpen(true)}
          className="rounded-full bg-[#F62440] hover:bg-[#de1832] text-white px-5 text-xs font-semibold shadow-md shadow-[#F62440]/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Connect GitHub Repository
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-[#FFE5BF]/80 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a8999e]" />
          <input
            type="text"
            placeholder="Filter by name, language, or path..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-xs text-[#211c1d] placeholder-[#a8999e] focus:outline-none focus:border-[#F62440] font-mono"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs font-mono">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#FFE5BF] bg-white text-[#211c1d] text-xs font-mono focus:outline-none focus:border-[#F62440]"
          >
            <option value="all">All Statuses</option>
            <option value="synced">● Synced</option>
            <option value="warning">● Warning / Sync Needed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#FFE5BF] bg-white text-[#211c1d] text-xs font-mono focus:outline-none focus:border-[#F62440]"
          >
            <option value="name">Sort by Name</option>
            <option value="files">Sort by Files</option>
            <option value="chunks">Sort by Chunks</option>
          </select>
        </div>
      </Card>

      {/* Repositories Table / List */}
      <div className="space-y-3">
        {filtered.map((repo) => (
          <Card
            key={repo.id}
            className="p-5 border-[#FFE5BF]/80 bg-white hover:border-[#FFE5BF] hover:shadow-[0_4px_16px_rgba(246,36,64,0.04)] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFF2DB] border border-[#FFE5BF] flex items-center justify-center text-[#F62440] font-mono font-bold shrink-0">
                <FolderGit2 className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-sm text-[#211c1d] font-mono group-hover:text-[#F62440] transition-colors">
                    {repo.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFF2DB] border border-[#FFE5BF] text-[#73666b] flex items-center gap-1">
                    <GitBranch className="w-2.5 h-2.5" />
                    {repo.defaultBranch}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                      repo.syncStatus === "synced"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}
                  >
                    ● {repo.syncStatus === "synced" ? "Synced" : "Sync Needed"}
                  </span>
                </div>

                <div className="text-xs text-[#73666b] font-mono mt-0.5">
                  {repo.fullName}
                </div>

                <div className="text-xs text-[#8e8085] mt-2 flex items-center gap-4 font-mono">
                  <span>{repo.fileCount} files</span>
                  <span>•</span>
                  <span>{repo.chunkCount.toLocaleString()} chunks</span>
                  <span>•</span>
                  <span className="text-[#F62440] font-semibold">1024D Embeddings</span>
                  <span>•</span>
                  <span>Last sync: {repo.lastSync}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#FFE5BF]/40">
              <Link href={`/dashboard/copilot`}>
                <Button
                  size="sm"
                  className="rounded-full bg-[#F62440] hover:bg-[#de1832] text-white px-4 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Open Copilot
                </Button>
              </Link>

              <Button
                onClick={() => syncRepository(repo.id)}
                variant="outline"
                size="sm"
                className="rounded-full border-[#FFE5BF] bg-white text-[#5e5356] hover:text-[#211c1d] hover:bg-[#FFF2DB] text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Sync
              </Button>

              <Link
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#73666b] hover:text-[#211c1d] hover:bg-[#FFF2DB]/60 rounded-full"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
