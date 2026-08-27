"use client";

import React, { useState } from "react";
import { FileCode, ExternalLink, Copy, Check } from "lucide-react";
import { Citation } from "@/types/copilot";

interface CitationBadgeProps {
  citation: Citation;
  onOpenContext?: (citation: Citation) => void;
}

export function CitationBadge({ citation, onOpenContext }: CitationBadgeProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(citation.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative inline-block my-1 mr-2"
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      {/* Warm SHIPRAG Citation Badge */}
      <button
        type="button"
        onClick={() => onOpenContext?.(citation)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#FFF2DB] hover:bg-[#FFE5BF] border border-[#FFE5BF] text-[#171717] hover:text-[#F62440] transition-all cursor-pointer shadow-xs group"
      >
        <FileCode className="w-3.5 h-3.5 text-[#F62440] shrink-0" />
        <span className="text-[#6B625B] font-normal">[{citation.repo}]</span>
        <span className="font-semibold text-[#171717] group-hover:text-[#F62440]">
          {citation.file}
          {citation.startLine ? `:${citation.startLine}` : ""}
        </span>
        {citation.relevance && (
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 ml-0.5">
            {citation.relevance}%
          </span>
        )}
      </button>

      {/* Popover Preview */}
      {showPopover && (
        <div className="absolute left-0 bottom-full mb-2 w-80 sm:w-96 rounded-xl border border-[#EBDCC8] bg-white p-3.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EBDCC8]/60">
            <div className="flex items-center gap-2 truncate">
              <FileCode className="w-4 h-4 text-[#F62440] shrink-0" />
              <span className="font-mono text-xs font-bold text-[#171717] truncate">
                {citation.file}
              </span>
            </div>
            {citation.startLine && (
              <span className="text-[10px] font-mono text-[#6B625B] bg-[#FFF2DB] px-1.5 py-0.5 rounded border border-[#FFE5BF] shrink-0">
                L{citation.startLine}–{citation.endLine || citation.startLine}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#6B625B] mb-2">
            <span>Repo: <strong className="text-[#171717]">{citation.repo}</strong></span>
            {citation.relevance && (
              <span className="text-emerald-700 font-bold">
                {citation.relevance}% Similarity
              </span>
            )}
          </div>

          {/* Code Surface */}
          <div className="rounded-lg bg-[#1e1e1e] border border-black/10 p-2.5 text-xs font-mono text-[#e6edf3] overflow-x-auto max-h-48">
            <pre className="leading-relaxed whitespace-pre-wrap">
              <code>{citation.codeSnippet}</code>
            </pre>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#EBDCC8]/60">
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-mono text-[#6B625B] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied code" : "Copy snippet"}
            </button>

            <button
              type="button"
              onClick={() => onOpenContext?.(citation)}
              className="text-[11px] font-mono text-[#F62440] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              Inspect Source
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
