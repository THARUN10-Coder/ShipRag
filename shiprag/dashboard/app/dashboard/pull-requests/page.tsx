"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRepository } from "@/context/repository-context";
import { useSettings } from "@/context/settings-context";
import { PRReviewDetail, PRReviewFinding } from "@/types/developer-intelligence";
import { apiClient } from "@/lib/api/client";
import { CodePreview } from "@/components/ui/code-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest,
  ShieldAlert,
  FolderGit2,
  GitBranch,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  FileCode,
  ArrowRight,
  Layers,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Search,
  Check,
  Copy,
  AlertCircle,
  Clock,
  User,
  GitCommit,
  CheckSquare,
  FileDiff,
  Plus,
} from "lucide-react";

export default function PullRequestsPage() {
  const { selectedRepoId, selectedRepo, setSelectedRepoId, repositories } = useRepository();
  const { settings } = useSettings();

  const [prList, setPrList] = useState<PRReviewDetail[]>([]);
  const [selectedPR, setSelectedPR] = useState<PRReviewDetail | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>("All");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [customRepoInput, setCustomRepoInput] = useState<string>("");
  const [githubStatus, setGithubStatus] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedFixId, setCopiedFixId] = useState<string | null>(null);

  // Load GitHub integration status
  useEffect(() => {
    apiClient.getGitHubStatus().then(setGithubStatus).catch(() => {});
  }, []);

  // Fetch real pull requests from GitHub API
  const fetchLivePRs = useCallback(
    async (targetRepoFullName?: string) => {
      let repoToFetch =
        targetRepoFullName ||
        selectedRepo?.fullName ||
        selectedRepo?.name ||
        (repositories[0]?.fullName || repositories[0]?.name);

      if (!repoToFetch) {
        setPrList([]);
        setSelectedPR(null);
        return;
      }

      if (repoToFetch.startsWith("github.com/")) {
        repoToFetch = repoToFetch.replace("github.com/", "");
      }

      if (!repoToFetch.includes("/")) {
        const found = repositories.find(
          (r) => r.id === repoToFetch || r.name === repoToFetch
        );
        if (found?.fullName && found.fullName.includes("/")) {
          repoToFetch = found.fullName.replace("github.com/", "");
        } else {
          repoToFetch = `user/${repoToFetch}`;
        }
      }

      const [owner, repo] = repoToFetch.split("/");
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const realPRs = await apiClient.getPullRequests(owner, repo);
        if (realPRs && realPRs.length > 0) {
          const formattedPRs: PRReviewDetail[] = realPRs.map((p) => ({
            id: p.id || `pr-${p.number}`,
            number: p.number,
            title: p.title,
            repository: p.repository || `${owner}/${repo}`,
            author: p.author || "developer",
            sourceBranch: p.sourceBranch || "feature",
            targetBranch: p.targetBranch || "main",
            changedFiles: p.changedFiles || 1,
            additions: p.additions || 10,
            deletions: p.deletions || 2,
            overallRisk: p.overallRisk || "Pending",
            score: p.score || 95,
            aiReviewStatus: "Available",
            findings: p.findings || [],
            affectedModules: p.affectedModules || 1,
            affectedRepositories: 1,
            dependencyImpactChain: p.dependencyImpactChain || [],
          }));

          setPrList(formattedPRs);
          const firstPR = formattedPRs[0];
          setSelectedPR(firstPR);
          handleAnalyzePR(owner, repo, firstPR.number);
        } else {
          setPrList([]);
          setSelectedPR(null);
        }
      } catch (err: any) {
        console.error("[PR Fetch Error]:", err);
        setErrorMessage(err?.message || "Unable to fetch live pull requests from GitHub.");
        setPrList([]);
        setSelectedPR(null);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedRepo, repositories]
  );

  useEffect(() => {
    fetchLivePRs();
  }, [selectedRepoId, fetchLivePRs]);

  // Run live Grounded AI PR Analysis
  const handleAnalyzePR = async (owner: string, repo: string, prNumber: number) => {
    setIsAnalyzing(true);
    try {
      const reviewResult = await apiClient.getPullRequestReview(owner, repo, prNumber);
      if (reviewResult) {
        setSelectedPR((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            overallRisk: reviewResult.overall_risk || "Low",
            score: reviewResult.risk_score || 85,
            aiSummary: reviewResult.summary,
            findings: reviewResult.findings || [],
            aiReviewStatus: "Reviewed",
          };
        });

        // Update item in list
        setPrList((prev) =>
          prev.map((item) =>
            item.number === prNumber
              ? {
                  ...item,
                  overallRisk: reviewResult.overall_risk || "Low",
                  score: reviewResult.risk_score || 85,
                  aiSummary: reviewResult.summary,
                  findings: reviewResult.findings || [],
                  aiReviewStatus: "Reviewed",
                }
              : item
          )
        );
      }
    } catch (err: any) {
      console.error("[PR Analysis Error]:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomRepoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRepoInput.trim()) return;
    fetchLivePRs(customRepoInput.trim());
  };

  const handleCopyFix = (findingId: string, fixText: string) => {
    navigator.clipboard.writeText(fixText);
    setCopiedFixId(findingId);
    setTimeout(() => setCopiedFixId(null), 2000);
  };

  const filteredPRs = prList.filter((pr) => {
    if (filterRisk === "All") return true;
    return pr.overallRisk?.toLowerCase() === filterRisk.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211c1d] flex items-center gap-2 font-mono">
            <GitPullRequest className="w-6 h-6 text-[#F62440]" />
            PR Intelligence & AI Review
          </h1>
          <p className="text-xs text-[#73666b] mt-1">
            Deterministic AST impact analysis, security audit, and grounded fix recommendations for GitHub pull requests.
          </p>
        </div>

        {/* Real-time GitHub Auth / Token status indicator */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`text-xs font-mono px-3 py-1 border ${
              githubStatus?.configured
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-amber-700 bg-amber-50 border-amber-200"
            }`}
          >
            {githubStatus?.configured ? "● GitHub Connected" : "○ GitHub OAuth Ready"}
          </Badge>

          <Button
            onClick={() => fetchLivePRs()}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#FFE5BF] text-xs font-mono cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin text-[#F62440]" : ""}`} />
            Refresh PRs
          </Button>
        </div>
      </div>

      {/* GitHub Repository Target Bar */}
      <Card className="p-4 rounded-2xl border-[#FFE5BF] bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleCustomRepoSubmit} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#73666b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Inspect any GitHub repo: e.g. THARUN10-Coder/ai-support-copilot, fastapi/fastapi..."
              value={customRepoInput}
              onChange={(e) => setCustomRepoInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-xs font-mono text-[#211c1d] placeholder-[#a8999e] focus:outline-none focus:border-[#F62440]"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-mono font-semibold px-4 cursor-pointer"
          >
            Fetch Live PRs
          </Button>
        </form>

        {/* Context Selector */}
        <div className="flex items-center gap-2 text-xs font-mono w-full md:w-auto justify-end">
          <span className="text-[#73666b]">Active Repo:</span>
          <select
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] font-bold focus:outline-none focus:border-[#F62440] cursor-pointer"
          >
            <option value="all">Select Connected Repo</option>
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Main 2-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Pull Requests List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs text-[#73666b] px-1">
            <span>Pull Requests ({filteredPRs.length})</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px]">Filter:</span>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="bg-transparent font-bold text-[#211c1d] focus:outline-none cursor-pointer"
              >
                <option value="All">All Risks</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 rounded-2xl border border-[#FFE5BF] bg-white text-center space-y-3">
              <RefreshCw className="w-5 h-5 text-[#F62440] animate-spin mx-auto" />
              <p className="text-xs text-[#73666b] font-mono">Fetching open pull requests from GitHub...</p>
            </div>
          ) : filteredPRs.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[#FFE5BF] bg-white text-center space-y-3 shadow-xs">
              <GitPullRequest className="w-8 h-8 text-[#a8999e] mx-auto" />
              <h3 className="text-sm font-bold text-[#211c1d] font-mono">No Open Pull Requests Found</h3>
              <p className="text-xs text-[#73666b] max-w-xs mx-auto leading-relaxed">
                There are currently zero open pull requests in this repository. Push a feature branch or submit a PR on GitHub to trigger AI analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {filteredPRs.map((pr) => {
                const isSelected = selectedPR?.id === pr.id;
                const riskColor =
                  pr.overallRisk === "Critical"
                    ? "bg-rose-500 text-white"
                    : pr.overallRisk === "High"
                    ? "bg-[#F62440] text-white"
                    : pr.overallRisk === "Medium"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white";

                return (
                  <div
                    key={pr.id}
                    onClick={() => {
                      setSelectedPR(pr);
                      const [owner, repo] = pr.repository.split("/");
                      if (owner && repo) handleAnalyzePR(owner, repo, pr.number);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FFF2DB]/60 border-[#F62440] shadow-md"
                        : "bg-white border-[#FFE5BF] hover:border-[#FFE5BF] hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#73666b] mb-1">
                          <span className="font-bold text-[#F62440]">#{pr.number}</span>
                          <span>·</span>
                          <span className="truncate">{pr.author}</span>
                        </div>
                        <h4 className="font-bold text-xs text-[#211c1d] leading-snug line-clamp-2">
                          {pr.title}
                        </h4>
                      </div>

                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${riskColor}`}
                      >
                        {pr.overallRisk}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#73666b] mt-3 pt-2 border-t border-[#FFE5BF]/50">
                      <span className="flex items-center gap-1">
                        <FileDiff className="w-3 h-3 text-[#a8999e]" />
                        {pr.changedFiles} files
                      </span>
                      <span className="text-emerald-700">+{pr.additions}</span>
                      <span className="text-rose-700">-{pr.deletions}</span>
                      <span className="text-[#a8999e] truncate max-w-[80px]">{pr.sourceBranch}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI PR Review Deep-Dive & Findings (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedPR ? (
            <div className="space-y-4 animate-in fade-in">
              {/* Header Details Card */}
              <Card className="p-6 rounded-2xl border-[#FFE5BF] bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#FFE5BF]/70">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#73666b] mb-1">
                      <span className="text-[#F62440] font-bold text-sm">#{selectedPR.number}</span>
                      <span>·</span>
                      <span>{selectedPR.repository}</span>
                      <span>·</span>
                      <span>{selectedPR.sourceBranch} → {selectedPR.targetBranch}</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#211c1d] tracking-tight">
                      {selectedPR.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        const [owner, repo] = selectedPR.repository.split("/");
                        if (owner && repo) handleAnalyzePR(owner, repo, selectedPR.number);
                      }}
                      disabled={isAnalyzing}
                      size="sm"
                      className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                      {isAnalyzing ? "Analyzing AST & RAG..." : "Re-Run AI Review"}
                    </Button>
                  </div>
                </div>

                {/* Score & Metric Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                  <div className="p-3 rounded-xl bg-[#FFFAF3] border border-[#FFE5BF]">
                    <div className="text-[10px] text-[#73666b] uppercase">Risk Score</div>
                    <div className={`text-xl font-black mt-0.5 ${
                      selectedPR.score >= 70 ? "text-rose-600" : selectedPR.score >= 40 ? "text-amber-600" : "text-emerald-600"
                    }`}>
                      {selectedPR.score} / 100
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FFFAF3] border border-[#FFE5BF]">
                    <div className="text-[10px] text-[#73666b] uppercase">Overall Risk</div>
                    <div className="text-sm font-bold text-[#211c1d] mt-1 capitalize">
                      {selectedPR.overallRisk}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FFFAF3] border border-[#FFE5BF]">
                    <div className="text-[10px] text-[#73666b] uppercase">Changed Files</div>
                    <div className="text-sm font-bold text-[#211c1d] mt-1">
                      {selectedPR.changedFiles}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FFFAF3] border border-[#FFE5BF]">
                    <div className="text-[10px] text-[#73666b] uppercase">Findings</div>
                    <div className="text-sm font-bold text-[#F62440] mt-1">
                      {selectedPR.findings?.length || 0}
                    </div>
                  </div>
                </div>

                {/* AI Summary Text */}
                {selectedPR.aiSummary && (
                  <div className="p-4 rounded-xl bg-[#FFF2DB]/40 border border-[#FFE5BF] text-xs text-[#211c1d] leading-relaxed">
                    <span className="font-bold font-mono text-[#F62440] block mb-1">AI Executive Summary:</span>
                    {selectedPR.aiSummary}
                  </div>
                )}
              </Card>

              {/* Findings Section */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-[#211c1d] font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#F62440]" />
                  Identified Code Findings ({selectedPR.findings?.length || 0})
                </h3>

                {selectedPR.findings && selectedPR.findings.length > 0 ? (
                  selectedPR.findings.map((f, idx) => (
                    <Card key={idx} className="p-5 rounded-2xl border-[#FFE5BF] bg-white shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            f.severity?.toLowerCase() === "critical"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : f.severity?.toLowerCase() === "high"
                              ? "bg-rose-50 text-[#F62440] border-rose-200"
                              : f.severity?.toLowerCase() === "medium"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {f.severity}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#73666b] uppercase">
                            {f.category}
                          </span>
                        </div>

                        {f.file && (
                          <span className="text-[11px] font-mono text-[#73666b]">
                            {f.file}{f.startLine ? `:${f.startLine}` : f.lineStart ? `:${f.lineStart}` : ""}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-[#211c1d]">{f.title}</h4>
                        <p className="text-xs text-[#5e5356] mt-1 leading-relaxed">{f.explanation}</p>
                      </div>

                      {f.suggestedFix && (
                        <div className="space-y-1.5 pt-2 border-t border-[#FFE5BF]/50">
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#73666b]">
                            <span>Suggested Patch:</span>
                            <button
                              onClick={() => handleCopyFix(`fix-${idx}`, f.suggestedFix!)}
                              className="flex items-center gap-1 text-[#F62440] hover:underline cursor-pointer"
                            >
                              {copiedFixId === `fix-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedFixId === `fix-${idx}` ? "Copied" : "Copy Diff"}
                            </button>
                          </div>
                          <pre className="p-3 rounded-xl bg-[#211c1d] text-[#FFFAF3] text-[11px] font-mono overflow-x-auto">
                            <code>{f.suggestedFix}</code>
                          </pre>
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <Card className="p-6 rounded-2xl border-[#FFE5BF] bg-white text-center text-xs text-[#73666b] font-mono">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    Zero high-risk findings detected in this pull request diff.
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card className="p-12 rounded-2xl border-[#FFE5BF] bg-white text-center space-y-3 font-mono">
              <GitPullRequest className="w-10 h-10 text-[#a8999e] mx-auto" />
              <h3 className="text-sm font-bold text-[#211c1d]">Select a Pull Request to Review</h3>
              <p className="text-xs text-[#73666b] max-w-sm mx-auto leading-relaxed">
                Choose an open PR from the list on the left or enter any public GitHub repository to perform automated AST impact and grounded risk reviews.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
