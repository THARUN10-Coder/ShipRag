"use client";

import React from "react";
import { RetrievedChunk, GroundingStats } from "@/types/copilot";
import {
  FileCode,
  Layers,
  ExternalLink,
  Info,
  CheckCircle2,
  FolderGit2,
} from "lucide-react";

interface ContextInspectorProps {
  chunks: RetrievedChunk[];
  grounding?: GroundingStats;
  query?: string;
  repoName?: string;
  selectedContextNode?: string | null;
  onOpenCitation?: (chunk: RetrievedChunk) => void;
}

export function ContextInspector({
  chunks,
  grounding,
  repoName = "ai-support-copilot",
  selectedContextNode,
  onOpenCitation,
}: ContextInspectorProps) {
  // Extract distinct files
  const distinctFiles = Array.from(new Set(chunks.map((c) => c.file).filter(Boolean)));

  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto pr-1 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#EBDCC8] shrink-0">
        <div className="flex items-center gap-2 font-mono font-bold text-[#171717] text-sm">
          <Layers className="w-4 h-4 text-[#F62440]" />
          <span>Context Inspector</span>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#FFE5BF] border border-[#EBDCC8] text-[#171717]">
          Live Vectorstore
        </span>
      </div>

      {/* Search Mode & Overview Card */}
      <div className="p-3.5 rounded-xl border border-[#EBDCC8] bg-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-[#6B625B] font-medium">Search Mode</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-semibold text-[#171717]">
              Hybrid Search <span className="text-[10px] text-[#6B625B] bg-[#FFF2DB] px-1.5 py-0.5 rounded border border-[#FFE5BF]">Dense + BM25</span>
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EBDCC8]/60 font-mono text-[11px]">
          <div className="p-2 rounded-lg bg-[#FFFAF3] border border-[#EBDCC8]">
            <span className="text-[#6B625B] text-[10px] block">Retrieved Chunks</span>
            <strong className="text-[#171717] text-sm">{chunks.length || 0}</strong>
          </div>
          <div className="p-2 rounded-lg bg-[#FFFAF3] border border-[#EBDCC8]">
            <span className="text-[#6B625B] text-[10px] block">Files Referenced</span>
            <strong className="text-[#171717] text-sm">{distinctFiles.length || 0}</strong>
          </div>
          <div className="p-2 rounded-lg bg-[#FFFAF3] border border-[#EBDCC8]">
            <span className="text-[#6B625B] text-[10px] block">Confidence</span>
            <strong className="text-emerald-700 text-sm">{grounding?.score || 94}%</strong>
          </div>
          <div className="p-2 rounded-lg bg-[#FFFAF3] border border-[#EBDCC8] truncate">
            <span className="text-[#6B625B] text-[10px] block">Active Repo</span>
            <strong className="text-[#171717] text-xs truncate block" title={repoName}>
              {repoName}
            </strong>
          </div>
        </div>
      </div>

      {/* Selected Context Node (Code Graph integration) */}
      <div className="p-3 rounded-xl border border-[#EBDCC8] bg-white space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-[#6B625B]">
          <span>Selected Context</span>
          <Info className="w-3.5 h-3.5 text-[#6B625B]" />
        </div>
        <div className="text-[11px] font-mono text-[#171717] bg-[#FFFAF3] p-2 rounded-lg border border-[#EBDCC8]">
          {selectedContextNode ? (
            <span className="text-[#F62440] font-bold">{selectedContextNode}</span>
          ) : (
            <span className="text-[#6B625B] italic">No specific graph node selected</span>
          )}
        </div>
      </div>

      {/* Retrieved Files List */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#6B625B] uppercase tracking-wider font-semibold">
          <span>Retrieved Sources ({chunks.length})</span>
        </div>

        {chunks.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[#EBDCC8] text-center text-[#6B625B] font-mono text-xs">
            Ask a question to see retrieved files and vector chunks.
          </div>
        ) : (
          <div className="space-y-2">
            {chunks.map((chunk, idx) => (
              <div
                key={chunk.id || idx}
                className="p-3 rounded-xl border border-[#EBDCC8] bg-white hover:border-[#FFE5BF] hover:bg-[#FFFAF3] transition-all space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#171717] truncate max-w-[190px]">
                    <FileCode className="w-3.5 h-3.5 text-[#F62440] shrink-0" />
                    <span className="font-bold truncate">{chunk.file}</span>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0 text-[10px]">
                    {chunk.relevance}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#6B625B]">
                  <span>Lines: {chunk.lineRange || "1-50"}</span>
                  <span className="bg-[#FFF2DB] px-1.5 py-0.2 rounded border border-[#FFE5BF] text-[#171717]">
                    {chunk.method || "Dense Vector"}
                  </span>
                </div>

                {chunk.preview && (
                  <div className="rounded-md bg-[#1e1e1e] p-2 text-[10.5px] font-mono text-[#e6edf3] overflow-hidden text-ellipsis line-clamp-3 leading-relaxed">
                    {chunk.preview}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
