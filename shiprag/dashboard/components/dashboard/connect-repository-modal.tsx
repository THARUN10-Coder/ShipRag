"use client";

import React, { useState } from "react";
import { useRepository } from "@/context/repository-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Check,
  Loader2,
  GitBranch,
  CheckCircle2,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";

import { Repository } from "@/types/repository";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

import { apiClient } from "@/lib/api/client";

export function ConnectRepositoryModal() {
  const { isConnectModalOpen, setIsConnectModalOpen, addRepository, refreshRepositories } = useRepository();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isConnectModalOpen) return null;

  const handleStartIngestion = async () => {
    setStep(5);
    setIndexingProgress(15);
    setErrorMessage(null);
    setIsDone(false);

    const repoName = repoUrl.replace(/\/+$/, "").split("/").pop()?.replace(".git", "") || "custom-repo";

    // Progress animation ticker
    const interval = setInterval(() => {
      setIndexingProgress((prev) => (prev < 85 ? prev + 8 : prev));
    }, 400);

    try {
      const res = await apiClient.ingestGithubRepo(repoUrl, repoName.toLowerCase(), branch);
      clearInterval(interval);
      
      setIndexingProgress(100);
      setIsDone(true);
      await refreshRepositories();

      const newRepo: Repository = {
        id: repoName.toLowerCase(),
        name: repoName,
        fullName: repoUrl.replace("https://github.com/", ""),
        owner: repoUrl.split("/").slice(-2, -1)[0] || "user",
        url: repoUrl,
        defaultBranch: branch,
        status: "active",
        syncStatus: "synced",
        lastSync: "Just now",
        fileCount: res.files_processed || 15,
        chunkCount: res.total_chunks || 45,
        embeddingDimension: 3072,
        embeddingModel: "models/gemini-embedding-001",
        language: "TypeScript",
        languageColor: "#3178c6",
        description: `Connected repository indexed with Google Gemini AI. (${res.total_chunks || 0} chunks embedded)`,
      };

      addRepository(newRepo);
    } catch (err: any) {
      console.error("Ingestion failed:", err);
      setErrorMessage(err?.message || "Failed to clone and index repository. Please ensure the repository is public or your GitHub token is connected.");
      setIndexingProgress(0);
    }
  };

  const handleClose = () => {
    setIsConnectModalOpen(false);
    setStep(1);
    setRepoUrl("");
    setIsDone(false);
    setIndexingProgress(0);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-[#FFE5BF] bg-[#FFFAF3] shadow-2xl p-6 relative text-[#211c1d]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-[#73666b] hover:text-[#211c1d] p-1.5 rounded-lg bg-[#FFF2DB]/60 hover:bg-[#FFE5BF] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#FFF2DB] text-[#F62440] font-bold border border-[#FFE5BF]">
            STEP {step} OF 5
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#211c1d] mb-1">
          Connect GitHub Repository
        </h2>
        <p className="text-xs text-[#5e5356] mb-6">
          Index your codebase into 1024D vectors for instant semantic Copilot intelligence.
        </p>

        {/* STEP 1 & 2: URL & Repo Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4a4043] mb-2">
                GitHub Repository URL
              </label>
              <div className="relative">
                <GithubIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#73666b]" />
                <input
                  type="text"
                  placeholder="https://github.com/owner/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#FFE5BF] bg-white text-xs text-[#211c1d] placeholder-[#a8999e] focus:outline-none focus:border-[#F62440] font-mono shadow-xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#FFE5BF]/60 bg-[#FFF2DB]/40 text-xs text-[#5e5356] space-y-1">
              <div className="font-semibold text-[#211c1d]">Quick Samples:</div>
              <div
                onClick={() =>
                  setRepoUrl("https://github.com/THARUN10-Coder/ai-support-copilot")
                }
                className="cursor-pointer text-[#F62440] hover:underline font-mono text-[11px]"
              >
                • https://github.com/THARUN10-Coder/ai-support-copilot
              </div>
              <div
                onClick={() =>
                  setRepoUrl("https://github.com/acme-corp/payment-service")
                }
                className="cursor-pointer text-[#F62440] hover:underline font-mono text-[11px]"
              >
                • https://github.com/acme-corp/payment-service
              </div>
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={!repoUrl}
              variant="default"
              className="w-full font-semibold rounded-full bg-[#F62440] hover:bg-[#de1832] text-white shadow-md shadow-[#F62440]/25"
            >
              Continue to Branch Selection
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 3: Branch Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4a4043] mb-2">
                Target Branch
              </label>
              <div className="relative">
                <GitBranch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#73666b]" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#FFE5BF] bg-white text-xs text-[#211c1d] placeholder-[#a8999e] focus:outline-none focus:border-[#F62440] font-mono shadow-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="w-1/3 rounded-full border-[#FFE5BF] bg-white text-[#211c1d] hover:bg-[#FFF2DB]"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                variant="default"
                className="w-2/3 font-semibold rounded-full bg-[#F62440] hover:bg-[#de1832] text-white shadow-md shadow-[#F62440]/25"
              >
                Configure Indexing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Indexing Configuration */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-white border border-[#FFE5BF]/70 shadow-xs">
                <span className="text-[#73666b]">Embedding Model:</span>
                <span className="text-[#F62440] font-semibold">
                  nvidia/nv-embedqa-e5-v5 (1024D)
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white border border-[#FFE5BF]/70 shadow-xs">
                <span className="text-[#73666b]">Chunking Strategy:</span>
                <span className="text-[#211c1d] font-semibold">
                  500 Tokens / 50 Overlap
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white border border-[#FFE5BF]/70 shadow-xs">
                <span className="text-[#73666b]">Continuous Sync:</span>
                <span className="text-emerald-600 font-semibold">
                  GitHub Push Webhook Active
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(3)}
                variant="outline"
                className="w-1/3 rounded-full border-[#FFE5BF] bg-white text-[#211c1d] hover:bg-[#FFF2DB]"
              >
                Back
              </Button>
              <Button
                onClick={handleStartIngestion}
                variant="default"
                className="w-2/3 font-semibold rounded-full bg-[#F62440] hover:bg-[#de1832] text-white shadow-md shadow-[#F62440]/25"
              >
                Start Ingestion Pipeline
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Live Ingestion Progress */}
        {step === 5 && (
          <div className="space-y-6 py-4">
            {/* Progress Bar */}
            <div className="w-full bg-[#FFE5BF]/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#F62440] to-[#e01934] h-2 rounded-full transition-all duration-300"
                style={{ width: `${indexingProgress}%` }}
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-mono font-medium">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Pipeline Stage Checklist */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-[#4a4043]">
                <span>Connecting to GitHub</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between text-[#4a4043]">
                <span>Cloning repository (shallow depth 1)</span>
                {indexingProgress >= 40 ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F62440]" />
                )}
              </div>
              <div className="flex items-center justify-between text-[#4a4043]">
                <span>Filtering docs and source code</span>
                {indexingProgress >= 80 ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[#a8999e]">○</span>
                )}
              </div>
              <div className="flex items-center justify-between text-[#4a4043]">
                <span>Generating 3072D Google Gemini Embeddings</span>
                {isDone ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[#a8999e]">○</span>
                )}
              </div>
            </div>

            {isDone && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-700 font-mono font-medium">
                ✓ Repository successfully indexed into vectorstore.
              </div>
            )}

            <Button
              onClick={handleClose}
              disabled={!isDone}
              variant="default"
              className="w-full font-semibold rounded-full bg-[#F62440] hover:bg-[#de1832] text-white shadow-md shadow-[#F62440]/25"
            >
              Open in AI Copilot
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
