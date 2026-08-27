"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Repository } from "@/types/repository";
import { apiClient } from "@/lib/api/client";

export type RepoFilter = "all" | string;

interface RepositoryContextType {
  repositories: Repository[];
  selectedRepoId: RepoFilter;
  setSelectedRepoId: (id: RepoFilter) => void;
  selectedRepo: Repository | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addRepository: (repo: Repository) => void;
  syncRepository: (id: string) => void;
  isConnectModalOpen: boolean;
  setIsConnectModalOpen: (open: boolean) => void;
  backendStatus: "connected" | "offline";
  isLoading: boolean;
  refreshRepositories: () => Promise<void>;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<RepoFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"connected" | "offline">("connected");
  const [isLoading, setIsLoading] = useState(true);

  const refreshRepositories = useCallback(async () => {
    setIsLoading(true);
    try {
      const realRepos = await apiClient.getRepositories();
      if (realRepos && Array.isArray(realRepos)) {
        const mappedRepos: Repository[] = realRepos.map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.fullName || `github.com/${r.name}`,
          owner: r.fullName ? r.fullName.split("/")[0] : "user",
          url: `https://github.com/${r.fullName || r.name}`,
          defaultBranch: r.defaultBranch || "main",
          status: (r.status as any) || "active",
          syncStatus: (r.syncStatus as any) || (r.chunkCount > 0 ? "synced" : "warning"),
          lastSync: r.lastSync || "Recently",
          fileCount: r.fileCount || 0,
          chunkCount: r.chunkCount || 0,
          embeddingDimension: r.embeddingDimension || 1024,
          embeddingModel: r.embeddingModel || "nvidia/nv-embedqa-e5-v5",
          language: r.language || "TypeScript",
          languageColor: r.languageColor || (r.language === "Python" ? "#3572A5" : "#3178c6"),
          description: r.description || `Vector-indexed repository containing ${r.fileCount || 0} files.`,
        }));
        setRepositories(mappedRepos);
        setBackendStatus("connected");
      } else {
        setRepositories([]);
      }
    } catch (_) {
      setRepositories([]);
      setBackendStatus("offline");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRepositories();
  }, [refreshRepositories]);

  const selectedRepo =
    selectedRepoId === "all"
      ? null
      : repositories.find((r) => r.id === selectedRepoId) || null;

  const addRepository = (newRepo: Repository) => {
    setRepositories((prev) => [newRepo, ...prev]);
    setSelectedRepoId(newRepo.id);
  };

  const syncRepository = (id: string) => {
    setRepositories((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, syncStatus: "synced", lastSync: "Just now" }
          : r
      )
    );
  };

  return (
    <RepositoryContext.Provider
      value={{
        repositories,
        selectedRepoId,
        setSelectedRepoId,
        selectedRepo,
        searchQuery,
        setSearchQuery,
        addRepository,
        syncRepository,
        isConnectModalOpen,
        setIsConnectModalOpen,
        backendStatus,
        isLoading,
        refreshRepositories,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error("useRepository must be used within a RepositoryProvider");
  }
  return context;
}
