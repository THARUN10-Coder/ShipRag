"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRepository } from "@/context/repository-context";
import { useSettings } from "@/context/settings-context";
import { CodeSearchResult } from "@/types/developer-intelligence";
import { apiClient } from "@/lib/api/client";
import { CodePreview } from "@/components/ui/code-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FolderGit2,
  FileCode,
  Sparkles,
  ChevronRight,
  Database,
  Cpu,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  SlidersHorizontal,
  FileText,
  Terminal,
} from "lucide-react";

export default function CodeSearchPage() {
  const { selectedRepoId, selectedRepo, setSelectedRepoId, repositories } = useRepository();
  const { settings } = useSettings();

  // Search input & parameters
  const [query, setQuery] = useState("Where is authentication or model logic implemented?");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [selectedMethod, setSelectedMethod] = useState<"All" | "Dense" | "BM25" | "Hybrid">(
    settings.searchRag.searchStrategy === "semantic"
      ? "Dense"
      : settings.searchRag.searchStrategy === "keyword"
      ? "BM25"
      : "Hybrid"
  );
  const [sortBy, setSortBy] = useState<"hybrid" | "dense" | "bm25">("hybrid");

  // Results & UI states
  const [results, setResults] = useState<CodeSearchResult[]>([]);
  const [activeResult, setActiveResult] = useState<CodeSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Execute real backend search API
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const realResults = await apiClient.searchCode(
        searchQuery.trim(),
        selectedRepoId,
        selectedLanguage,
        selectedMethod === "All" ? "hybrid" : selectedMethod.toLowerCase(),
        settings.searchRag.topK || 10
      );

      if (realResults && Array.isArray(realResults)) {
        setResults(realResults);
        setActiveResult(realResults[0] || null);
      } else {
        setResults([]);
        setActiveResult(null);
      }
    } catch (err: any) {
      console.error("[Code Search Error]:", err);
      setErrorMessage(err?.message || "Failed to search codebase. Verify FastAPI backend is running.");
      setResults([]);
      setActiveResult(null);
    } finally {
      setLoading(false);
    }
  }, [selectedRepoId, selectedLanguage, selectedMethod]);

  // Initial trigger & trigger on filter changes
  useEffect(() => {
    performSearch(query);
  }, [selectedRepoId, selectedLanguage, selectedMethod, performSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  // Ask Copilot Flow
  const handleOpenInCopilot = (result: CodeSearchResult) => {
    const prompt = `Explain the logic and architecture of ${result.file} (${result.repository}) lines ${result.startLine}–${result.endLine}:\n\n\`\`\`${result.language.toLowerCase()}\n${result.codeSnippet}\n\`\`\``;
    window.location.href = `/dashboard/copilot?q=${encodeURIComponent(prompt)}&repo=${encodeURIComponent(result.repository)}&file=${encodeURIComponent(result.file)}&line=${result.startLine}`;
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sort results based on user selection
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "dense") return (b.denseScore || 0) - (a.denseScore || 0);
    if (sortBy === "bm25") return (b.bm25Score || 0) - (a.bm25Score || 0);
    return (b.hybridScore || 0) - (a.hybridScore || 0);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] flex items-center gap-2 font-mono">
            <Search className="w-6 h-6 text-[#F62440]" />
            Code Search
          </h1>
          <p className="text-xs text-[#6B625B] mt-1">
            Find anything across your connected codebases using real hybrid vector + BM25 lexical search.
          </p>
        </div>

        {/* Repository Context Badge / Selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#6B625B]">Context:</span>
          <select
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#EBDCC8] bg-white text-[#171717] font-bold focus:outline-none focus:border-[#F62440] cursor-pointer shadow-xs"
          >
            <option value="all">🌐 All Indexed Repositories</option>
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                📦 {r.name} ({r.defaultBranch || "main"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Search Bar & Filters Card */}
      <Card className="p-4 rounded-2xl border-[#EBDCC8] bg-white shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B625B]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, functions, classes, or ask natural language questions..."
            className="w-full pl-10 pr-28 py-3 rounded-xl border border-[#EBDCC8] bg-[#FFFAF3] text-xs sm:text-sm text-[#171717] placeholder-[#8C827A] font-mono focus:outline-none focus:border-[#F62440] shadow-xs"
          />
          <Button
            type="submit"
            disabled={loading}
            variant="gradient"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-semibold px-4 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
          </Button>
        </form>

        {/* Filter Toolbar: Language + Search Method + Sorter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EBDCC8]/80 text-xs font-mono">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[#6B625B] mr-1">Language:</span>
            {["All", "Python", "TypeScript", "JavaScript", "Go"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                  selectedLanguage === lang
                    ? "bg-[#F62440] text-white font-bold shadow-xs"
                    : "text-[#6B625B] hover:text-[#171717] bg-[#FFFAF3] border border-[#EBDCC8]"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Search Retrieval Method Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B625B] mr-1">Method:</span>
            {(["Hybrid", "Dense", "BM25"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedMethod(method)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                  selectedMethod === method
                    ? "bg-[#FFF2DB] text-[#F62440] font-bold border border-[#FFE5BF] shadow-xs"
                    : "text-[#6B625B] hover:text-[#171717] bg-[#FFFAF3] border border-[#EBDCC8]"
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-[#6B625B]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FFFAF3] border border-[#EBDCC8] rounded-lg px-2 py-0.5 text-[#171717] focus:outline-none"
            >
              <option value="hybrid">Hybrid Score</option>
              <option value="dense">Dense Semantic</option>
              <option value="bm25">BM25 Lexical</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Two-Column Search Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Results List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-mono text-[#6B625B] flex items-center justify-between">
            <span>
              Found <strong>{sortedResults.length}</strong> real codebase chunks
            </span>
            <span className="text-[11px] bg-[#FFF2DB] px-2 py-0.5 rounded text-[#F62440] font-bold border border-[#FFE5BF]">
              1024D Gemini/pgvector + BM25
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <Card className="p-4 rounded-2xl border-red-200 bg-red-50 text-red-700 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </Card>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#FFE5BF] border-t-[#F62440] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-[#6B625B]">
                Computing embeddings & ranking repository chunks...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && sortedResults.length === 0 && hasSearched && (
            <Card className="p-12 rounded-2xl border-[#EBDCC8] bg-white text-center space-y-3">
              <FileText className="w-8 h-8 text-[#8C827A] mx-auto" />
              <h3 className="font-bold text-sm text-[#171717] font-mono">
                No matching code chunks found.
              </h3>
              <p className="text-xs text-[#6B625B] max-w-md mx-auto">
                Try using broader keywords, switching to <strong>Hybrid</strong> method, or searching across <strong>All Repositories</strong>.
              </p>
            </Card>
          )}

          {/* Search Result Cards */}
          {!loading &&
            sortedResults.map((res) => {
              const isSelected = activeResult?.id === res.id;
              return (
                <Card
                  key={res.id}
                  onClick={() => setActiveResult(res)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? "border-[#F62440] bg-[#FFF2DB]/40 ring-1 ring-[#F62440] shadow-sm"
                      : "border-[#EBDCC8] bg-white hover:border-[#F62440]/60 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      <FolderGit2 className="w-3.5 h-3.5 text-[#F62440] shrink-0" />
                      <span className="font-bold text-xs text-[#171717] font-mono">
                        {res.repository}
                      </span>
                      <span className="text-[#8C827A]">/</span>
                      <span className="text-xs text-[#6B625B] font-mono truncate" title={res.file}>
                        {res.file}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 ml-2">
                      {res.relevance}% match
                    </span>
                  </div>

                  {/* Code Preview Inside Card */}
                  <div className="p-3 rounded-xl bg-[#090d16] border border-white/10 font-mono text-[11px] text-gray-200 mb-3 overflow-x-auto">
                    <pre className="line-clamp-4">
                      <code>{res.codeSnippet}</code>
                    </pre>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#6B625B] pt-2 border-t border-[#EBDCC8]/60">
                    <span>
                      Lines: {res.startLine}–{res.endLine}
                    </span>
                    <span className="text-[#F62440] bg-[#F62440]/10 px-1.5 py-0.2 rounded font-bold">
                      {res.retrievalMethod}
                    </span>
                    <span className="text-[#171717] font-bold flex items-center gap-1 hover:text-[#F62440]">
                      View Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </Card>
              );
            })}
        </div>

        {/* Right Column: Deep Inspection Details Panel */}
        <div className="lg:col-span-5">
          {activeResult ? (
            <div className="sticky top-20 space-y-4">
              <Card className="p-5 rounded-2xl border-[#EBDCC8] bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EBDCC8]/80">
                  <div className="font-bold text-sm text-[#171717] font-mono flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#F62440]" />
                    Inspection Details
                  </div>
                  <Badge variant="brand" className="font-mono text-xs">
                    {activeResult.relevance}% Score
                  </Badge>
                </div>

                {/* Score Breakdown (Dense, BM25, Hybrid) */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-xl bg-[#FFF2DB]/50 border border-[#EBDCC8]">
                    <div className="text-[#8C827A] text-[10px]">Dense Vector</div>
                    <div className="font-bold text-[#8B5CF6]">{activeResult.denseScore}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FFF2DB]/50 border border-[#EBDCC8]">
                    <div className="text-[#8C827A] text-[10px]">BM25 Lexical</div>
                    <div className="font-bold text-[#3B82F6]">{activeResult.bm25Score}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FFF2DB]/50 border border-[#EBDCC8]">
                    <div className="text-[#8C827A] text-[10px]">Hybrid Total</div>
                    <div className="font-bold text-emerald-600">{activeResult.hybridScore}</div>
                  </div>
                </div>

                {/* Citation Meta */}
                <div className="p-3 rounded-xl bg-[#FFFAF3] border border-[#EBDCC8] text-xs font-mono text-[#6B625B] space-y-1">
                  <div>
                    <strong>Repository:</strong> {activeResult.repository}
                  </div>
                  <div className="truncate">
                    <strong>File:</strong> {activeResult.file}
                  </div>
                  <div>
                    <strong>Lines:</strong> {activeResult.startLine}–{activeResult.endLine}
                  </div>
                </div>

                {/* Full Code Preview Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-[#6B625B]">
                    <span>Source Snippet ({activeResult.language})</span>
                    <button
                      onClick={() => handleCopySnippet(activeResult.codeSnippet)}
                      className="flex items-center gap-1 text-[11px] text-[#171717] hover:text-[#F62440]"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#090d16] border border-white/10 text-gray-200 font-mono text-[11px] overflow-x-auto max-h-72">
                    <pre>
                      <code>{activeResult.codeSnippet}</code>
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-[#EBDCC8]/80 space-y-2">
                  <Button
                    onClick={() => handleOpenInCopilot(activeResult)}
                    variant="gradient"
                    size="sm"
                    className="w-full text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Investigate with Copilot
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-8 rounded-2xl border-[#EBDCC8] bg-white text-center text-xs text-[#6B625B] font-mono">
              Select a search result on the left to inspect vector similarity, BM25 keyword match, and full source code.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
