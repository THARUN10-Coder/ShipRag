"use client";

import React, { useState } from "react";
import { useRepository } from "@/context/repository-context";
import { MOCK_SECURITY_FINDINGS } from "@/lib/mock-data/developer-intelligence";
import { SecurityFindingDetail } from "@/types/developer-intelligence";
import { CodePreview } from "@/components/ui/code-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  ShieldCheck,
  FolderGit2,
  FileCode,
  Sparkles,
  AlertTriangle,
  Lock,
  Key,
  KeyRound,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function SecurityPage() {
  const { selectedRepoId, selectedRepo } = useRepository();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [activeFinding, setActiveFinding] = useState<SecurityFindingDetail | null>(
    MOCK_SECURITY_FINDINGS[0] || null
  );

  const categories = [
    "All",
    "Secrets",
    "Authentication",
    "Configuration",
    "Dependencies",
    "Cryptography",
  ];

  const filteredFindings = MOCK_SECURITY_FINDINGS.filter((f) => {
    const matchRepo =
      selectedRepoId === "all" || f.repository === selectedRepoId;
    const matchCategory =
      selectedCategory === "All" || f.category === selectedCategory;
    const matchSeverity =
      selectedSeverity === "All" || f.severity.toLowerCase() === selectedSeverity.toLowerCase();
    return matchRepo && matchCategory && matchSeverity;
  });

  const handleExplainWithCopilot = (finding: SecurityFindingDetail) => {
    const prompt = `Explain security vulnerability in ${finding.repository}/${finding.file}: "${finding.title}". ${finding.recommendedAction}`;
    window.location.href = `/dashboard/copilot?q=${encodeURIComponent(prompt)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
            Security Intelligence
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Detect secrets, broken access controls, and authentication vulnerabilities across connected codebases.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-400">Context:</span>
          {selectedRepoId === "all" ? (
            <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              🌐 All 12 Repositories
            </span>
          ) : (
            <span className="text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
              📦 {selectedRepo?.name}
            </span>
          )}
        </div>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
        <Card className="p-3.5 border-white/10 bg-[#090d16]/90 text-center">
          <div className="text-gray-400">Security Score</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">87 / 100</div>
        </Card>
        <Card className="p-3.5 border-white/10 bg-[#090d16]/90 text-center">
          <div className="text-gray-400">Critical</div>
          <div className="text-xl font-bold text-red-400 mt-1">1</div>
        </Card>
        <Card className="p-3.5 border-white/10 bg-[#090d16]/90 text-center">
          <div className="text-gray-400">High</div>
          <div className="text-xl font-bold text-amber-400 mt-1">4</div>
        </Card>
        <Card className="p-3.5 border-white/10 bg-[#090d16]/90 text-center">
          <div className="text-gray-400">Medium</div>
          <div className="text-xl font-bold text-yellow-400 mt-1">12</div>
        </Card>
        <Card className="p-3.5 border-white/10 bg-[#090d16]/90 text-center">
          <div className="text-gray-400">Low / Info</div>
          <div className="text-xl font-bold text-blue-400 mt-1">28</div>
        </Card>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-gray-500 mr-1">Category:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
              selectedCategory === cat
                ? "bg-indigo-600 text-white font-semibold"
                : "text-gray-400 hover:text-white bg-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Two-Column Security Findings Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Finding Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="text-xs font-mono text-gray-400 flex items-center justify-between">
            <span>Findings ({filteredFindings.length})</span>
            <span>Sorted by Severity</span>
          </div>

          {filteredFindings.map((f) => {
            const isSelected = activeFinding?.id === f.id;
            return (
              <Card
                key={f.id}
                onClick={() => setActiveFinding(f)}
                className={`p-4 border transition-all cursor-pointer ${
                  isSelected
                    ? "border-indigo-500/60 bg-[#0d1428]"
                    : "border-white/10 bg-[#090d16]/90 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        f.severity === "Critical"
                          ? "bg-red-400"
                          : f.severity === "High"
                          ? "bg-amber-400"
                          : "bg-blue-400"
                      }`}
                    />
                    <h3 className="font-bold text-xs text-white font-mono">
                      {f.title}
                    </h3>
                  </div>
                  <Badge
                    variant={f.severity === "Critical" ? "destructive" : "brand"}
                    className="text-[10px] uppercase font-mono shrink-0 ml-2"
                  >
                    {f.severity}
                  </Badge>
                </div>

                <p className="text-[11px] text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                  {f.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-2 border-t border-white/5">
                  <span>[{f.repository}] {f.file}:{f.line}</span>
                  <span className="text-indigo-400">{f.category}</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Right Column: Finding Deep Inspector */}
        <div className="lg:col-span-6">
          {activeFinding ? (
            <Card className="p-5 border-white/10 bg-[#090d16]/90 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-sm text-white font-mono">
                    {activeFinding.title}
                  </h3>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">
                    [{activeFinding.repository}] {activeFinding.file}:{activeFinding.line}
                  </div>
                </div>
                <Badge variant="brand" className="font-mono text-xs uppercase">
                  {activeFinding.category}
                </Badge>
              </div>

              <p className="text-xs text-gray-200 leading-relaxed">
                {activeFinding.description}
              </p>

              {/* Code Evidence Snippet */}
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-gray-400 font-bold">
                  Evidence in Source Code:
                </div>
                <CodePreview
                  fileName={activeFinding.file}
                  repoName={activeFinding.repository}
                  code={activeFinding.evidenceSnippet}
                  startLine={activeFinding.line}
                />
              </div>

              {/* Remediation Action Card */}
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/15 space-y-1.5">
                <div className="font-bold text-xs text-emerald-400 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Recommended AI Fix
                </div>
                <p className="text-xs text-gray-200 leading-relaxed font-mono">
                  {activeFinding.recommendedAction}
                </p>
              </div>

              {/* Copilot Action */}
              <div className="pt-2 border-t border-white/5 flex gap-2">
                <Button
                  onClick={() => handleExplainWithCopilot(activeFinding)}
                  variant="gradient"
                  size="sm"
                  className="w-full text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Explain & Fix with Copilot
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
