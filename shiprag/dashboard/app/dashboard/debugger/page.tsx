"use client";

import React, { useState } from "react";
import { useRepository } from "@/context/repository-context";
import { MOCK_DEBUG_ANALYSES } from "@/lib/mock-data/developer-intelligence";
import { DebugAnalysisResult } from "@/types/developer-intelligence";
import { CodePreview } from "@/components/ui/code-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bug,
  Sparkles,
  AlertTriangle,
  FolderGit2,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function DebuggerPage() {
  const { selectedRepoId, selectedRepo } = useRepository();
  const [errorInput, setErrorInput] = useState(
    `TypeError: Cannot read properties of undefined (reading 'amount')\n    at processPayment (src/services/payment.ts:142)\n    at checkoutHandler (src/api/checkout.ts:89)\n    at dispatchRequest (node_modules/express/router.js:45)`
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DebugAnalysisResult | null>(
    MOCK_DEBUG_ANALYSES[0] || null
  );

  const handleAnalyze = () => {
    if (!errorInput.trim()) return;
    setAnalyzing(true);

    setTimeout(() => {
      setAnalyzing(false);
      setAnalysis({
        id: `dbg-${Date.now()}`,
        query: errorInput,
        timestamp: "Just now",
        rootCause:
          "Nullable parameter `payment` is referenced directly in `processPayment()` without early return guard or schema validation.",
        likelySourceFile: "src/services/payment.ts",
        likelySourceRepo:
          selectedRepoId === "all" ? "payment-service" : selectedRepo?.name || "ai-support-copilot",
        likelyFunction: "processPayment()",
        startLine: 140,
        endLine: 155,
        confidence: 96,
        severity: "High",
        impact:
          "Triggers unhandled 500 exceptions on payment dispatch when checkout request payloads lack amount definitions.",
        suggestedFixDiff: `  export async function processPayment(payment: PaymentIntent) {
+   if (!payment || typeof payment.amount !== "number") {
+     throw new PaymentValidationError("Valid payment amount required");
+   }
    return await stripe.charges.create({ amount: payment.amount });
  }`,
        relatedFiles: [
          {
            file: "src/services/payment.ts",
            repo: "payment-service",
            relationship: "Origin of runtime TypeError",
            relevance: 98,
            lineRange: "140-155",
          },
          {
            file: "src/api/checkout.ts",
            repo: "ecommerce-platform",
            relationship: "Caller constructing incomplete payload",
            relevance: 92,
            lineRange: "84-110",
          },
        ],
      });
    }, 1000);
  };

  const handleOpenInCopilot = () => {
    if (!analysis) return;
    const prompt = `Investigate error: "${analysis.rootCause}" in ${analysis.likelySourceRepo}/${analysis.likelySourceFile}\n\nSuggested Fix:\n${analysis.suggestedFixDiff}`;
    window.location.href = `/dashboard/copilot?q=${encodeURIComponent(prompt)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bug className="w-6 h-6 text-indigo-400" />
            AI Root-Cause Debugger
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Trace error stack traces back to the exact originating repository, source file, and code fix.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-400">Context:</span>
          {selectedRepoId === "all" ? (
            <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              🌐 Cross-Repository Debugging
            </span>
          ) : (
            <span className="text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
              📦 {selectedRepo?.name}
            </span>
          )}
        </div>
      </div>

      {/* Stack Trace Input Card */}
      <Card className="p-5 border-white/10 bg-[#090d16]/90 space-y-3 shadow-lg">
        <label className="block text-xs font-mono font-bold text-gray-300">
          Paste Error Log or Stack Trace:
        </label>
        <textarea
          rows={4}
          value={errorInput}
          onChange={(e) => setErrorInput(e.target.value)}
          placeholder="Paste an error message, stack trace, or describe the bug..."
          className="w-full p-3 rounded-lg border border-white/10 bg-[#030712] font-mono text-xs text-red-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
        />

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setErrorInput("")}
            className="text-xs font-mono text-gray-500 hover:text-gray-300"
          >
            Clear Log
          </button>

          <Button
            onClick={handleAnalyze}
            disabled={analyzing || !errorInput.trim()}
            variant="gradient"
            size="sm"
            className="font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            {analyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Analyze Error Root Cause
          </Button>
        </div>
      </Card>

      {/* Analysis Pipeline & Result */}
      {analyzing ? (
        <Card className="p-6 border-white/10 bg-[#090d16] text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
          <div className="text-xs font-mono text-gray-300 font-bold">
            Tracing dependencies and analyzing AST vector chunks...
          </div>
          <div className="text-[11px] font-mono text-gray-500 space-y-1">
            <div>✓ Parsing error stack frame</div>
            <div>✓ Searching across repository vectors</div>
            <div>● Generating automated differential fix</div>
          </div>
        </Card>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Root Cause Diagnosis Card */}
          <Card className="p-6 border-indigo-500/40 bg-gradient-to-r from-[#0c1222] via-[#090d16] to-[#0c1222] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                  Root Cause Diagnosis
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="brand" className="font-mono text-xs">
                  {analysis.confidence}% Confidence
                </Badge>
                <Badge variant="destructive" className="font-mono text-xs uppercase">
                  {analysis.severity} Severity
                </Badge>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
              {analysis.rootCause}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-gray-400">Originating File & Method:</span>
                <div className="font-bold text-indigo-300 flex items-center gap-1.5 truncate">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  [{analysis.likelySourceRepo}] {analysis.likelySourceFile}:{analysis.startLine}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-gray-400">System Impact:</span>
                <div className="text-gray-300 text-[11px] leading-relaxed">
                  {analysis.impact}
                </div>
              </div>
            </div>
          </Card>

          {/* Code Diff Fix */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-gray-300 flex items-center justify-between">
              <span>Suggested Code Fix (Diff):</span>
              <span className="text-emerald-400 text-[11px]">Ready to apply</span>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-[#030712] p-4 font-mono text-xs overflow-x-auto text-gray-200">
              <pre className="leading-relaxed">
                <code>{analysis.suggestedFixDiff}</code>
              </pre>
            </div>
          </div>

          {/* Related Dependency Files List */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-gray-300">
              Related Cross-Service Files ({analysis.relatedFiles.length}):
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.relatedFiles.map((rf, idx) => (
                <Card
                  key={idx}
                  className="p-3.5 border-white/10 bg-[#090d16] flex items-center justify-between text-xs font-mono"
                >
                  <div className="space-y-1 truncate pr-2">
                    <div className="font-bold text-white flex items-center gap-1.5 truncate">
                      <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      [{rf.repo}] {rf.file}
                    </div>
                    <div className="text-gray-400 text-[11px] truncate">
                      {rf.relationship}
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold shrink-0 text-xs">
                    {rf.relevance}%
                  </span>
                </Card>
              ))}
            </div>
          </div>

          {/* Bottom Copilot Action */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleOpenInCopilot}
              variant="gradient"
              className="font-semibold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Investigate with Copilot
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
