"use client";

import React, { useState } from "react";
import { Copy, Check, FileCode, ExternalLink, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CodePreviewProps {
  fileName: string;
  repoName?: string;
  language?: string;
  code: string;
  startLine?: number;
  highlightedLines?: number[];
  onOpenInCopilot?: (fileName: string, code: string) => void;
  onAddToContext?: (fileName: string) => void;
}

export function CodePreview({
  fileName,
  repoName,
  language = "typescript",
  code,
  startLine = 1,
  highlightedLines = [],
  onOpenInCopilot,
  onAddToContext,
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className="rounded-xl border border-white/10 bg-[#030712] overflow-hidden font-mono text-xs shadow-md">
      {/* File Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/10 bg-[#090d16]">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          {repoName && (
            <span className="text-gray-400 font-normal">[{repoName}]</span>
          )}
          <span className="font-bold text-white">{fileName}</span>
          <Badge variant="outline" className="text-[10px] text-gray-400 ml-1">
            {language}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {onAddToContext && (
            <button
              onClick={() => onAddToContext(fileName)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono hover:underline"
            >
              <Plus className="w-3 h-3" />
              Add Context
            </button>
          )}

          {onOpenInCopilot && (
            <button
              onClick={() => onOpenInCopilot(fileName, code)}
              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Ask Copilot
            </button>
          )}

          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
            title="Copy code snippet"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code with Line Numbers */}
      <div className="p-3 overflow-x-auto text-gray-200 leading-relaxed font-mono">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = startLine + idx;
              const isHighlighted = highlightedLines.includes(lineNum);
              return (
                <tr
                  key={idx}
                  className={isHighlighted ? "bg-indigo-500/15 text-indigo-200" : ""}
                >
                  <td className="pr-4 text-right text-gray-600 select-none w-8 text-[11px]">
                    {lineNum}
                  </td>
                  <td className="whitespace-pre">{line}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
