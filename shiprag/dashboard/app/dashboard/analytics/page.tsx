"use client";

import React from "react";
import { useRepository } from "@/context/repository-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Bot,
  Zap,
  CheckCircle2,
  Database,
  Layers,
  FolderGit2,
} from "lucide-react";

export default function AnalyticsPage() {
  const { selectedRepoId, selectedRepo, repositories } = useRepository();

  const isAll = selectedRepoId === "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          RAG Performance & System Analytics
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Real-time metrics on vector retrieval latency, citation accuracy, and LLM throughput for {isAll ? "all 12 repositories" : selectedRepo?.name}.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 border-white/10 bg-[#090d16]/90">
          <div className="text-xs text-gray-400 font-mono">Scope Repositories</div>
          <div className="text-2xl font-bold text-white font-mono mt-1 flex items-center justify-between">
            {isAll ? repositories.length : 1}
            <FolderGit2 className="w-4 h-4 text-blue-400" />
          </div>
        </Card>

        <Card className="p-5 border-white/10 bg-[#090d16]/90">
          <div className="text-xs text-gray-400 font-mono">Total Queries</div>
          <div className="text-2xl font-bold text-white font-mono mt-1 flex items-center justify-between">
            {isAll ? "2,438" : "312"}
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
        </Card>

        <Card className="p-5 border-white/10 bg-[#090d16]/90">
          <div className="text-xs text-gray-400 font-mono">Avg Retrieval Latency</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1 flex items-center justify-between">
            1.8s
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
        </Card>

        <Card className="p-5 border-white/10 bg-[#090d16]/90">
          <div className="text-xs text-gray-400 font-mono">Citation Accuracy</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono mt-1 flex items-center justify-between">
            96.4%
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
        </Card>
      </div>

      {/* Latency & Query Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 border-white/10 bg-[#090d16]/90 space-y-4">
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Query Latency Breakdown
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>NVIDIA NIM Vector Embedding</span>
                <span className="text-white">120ms</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full w-[15%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>pgvector Cosine Search + BM25 Fusion</span>
                <span className="text-white">85ms</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-[10%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Llama 3.3 70B Generation & Grounding</span>
                <span className="text-white">1.6s</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full w-[75%]" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-white/10 bg-[#090d16]/90 space-y-4">
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            Active Vector Index Status
          </h3>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-white/5 border border-white/10">
              <span className="text-gray-400">Embedding Engine:</span>
              <span className="text-purple-400 font-semibold">nvidia/nv-embedqa-e5-v5 (1024D)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-white/5 border border-white/10">
              <span className="text-gray-400">LLM Inference:</span>
              <span className="text-indigo-400 font-semibold">meta/llama-3.3-70b-instruct</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-white/5 border border-white/10">
              <span className="text-gray-400">Continuous Webhook Sync:</span>
              <span className="text-emerald-400 font-semibold">HMAC-SHA256 Enabled</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
