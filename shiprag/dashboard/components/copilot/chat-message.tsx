"use client";

import React, { useState } from "react";
import { CopilotMessage, Citation } from "@/types/copilot";
import { CitationBadge } from "./citation-badge";
import {
  Copy,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Terminal,
  Layers,
  FileCode,
} from "lucide-react";

interface ChatMessageProps {
  message: CopilotMessage;
  userAvatar?: string;
  userName?: string;
  onOpenContext?: (citation: Citation) => void;
  onRegenerate?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function ChatMessage({
  message,
  userAvatar,
  userName = "Tharun",
  onOpenContext,
  onRegenerate,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === "user";

  // Format code blocks and bold headings cleanly
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        let language = "code";
        let codeBody = part.slice(3, -3);

        if (lines.length > 0 && lines[0].trim().length > 0 && !lines[0].includes(" ")) {
          language = lines[0].trim();
          codeBody = lines.slice(1).join("\n");
        }

        return (
          <div
            key={index}
            className="my-3 rounded-xl overflow-hidden border border-[#EBDCC8] bg-[#1e1e1e] shadow-sm text-xs font-mono"
          >
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e] text-[#b3b3b3]">
              <span className="text-[11px] font-semibold text-[#e6edf3] uppercase tracking-wider">
                {language}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(codeBody.trim());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="hover:text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-3.5 text-[#e6edf3] overflow-x-auto leading-relaxed whitespace-pre-wrap">
              <code>{codeBody.trim()}</code>
            </pre>
          </div>
        );
      }

      // Plain paragraphs and bullet points
      return (
        <div key={index} className="space-y-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-[#171717]">
          {part}
        </div>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-2.5 my-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="flex flex-col items-end max-w-xl">
          <div className="rounded-2xl rounded-tr-xs bg-[#FFE5BF] border border-[#EBDCC8] px-4 py-3 text-sm text-[#171717] font-medium shadow-xs">
            {message.content}
          </div>
          <span className="text-[10px] font-mono text-[#6B625B] mt-1 mr-1">
            {message.timestamp || "Just now"}
          </span>
        </div>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#FFE5BF] border border-[#EBDCC8] flex items-center justify-center text-[#F62440] font-bold text-xs shrink-0 shadow-xs">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 my-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* SHIPRAG Robot Avatar */}
      <div className="w-8 h-8 rounded-xl bg-[#FFF2DB] border border-[#FFE5BF] flex items-center justify-center text-[#F62440] shrink-0 shadow-xs">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <rect width="18" height="12" x="3" y="6" rx="2" />
          <line x1="12" x2="12" y1="2" y2="6" />
          <circle cx="8" cy="12" r="1.5" fill="currentColor" />
          <circle cx="16" cy="12" r="1.5" fill="currentColor" />
          <line x1="9" x2="15" y1="15" y2="15" />
        </svg>
      </div>

      {/* AI Message Card */}
      <div className="flex-1 max-w-3xl rounded-2xl border border-[#EBDCC8] bg-white p-5 space-y-4 shadow-xs">
        {/* Header with Mode & Sources info */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#EBDCC8]/60 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#171717] tracking-tight">
              SHIPRAG Code Intelligence
            </span>
            {message.contextScope && (
              <span className="text-[10px] text-[#6B625B] bg-[#FFF2DB] px-2 py-0.5 rounded-md border border-[#FFE5BF]">
                {message.contextScope}
              </span>
            )}
          </div>

          <span className="text-[10px] text-[#6B625B]">
            {message.timestamp || "Just now"}
          </span>
        </div>

        {/* Formatted Markdown Body */}
        <div className="text-[#171717] leading-relaxed">
          {renderFormattedContent(message.content)}
        </div>

        {/* Citations Section */}
        {message.citations && message.citations.length > 0 && (
          <div className="pt-3 border-t border-[#EBDCC8]/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#6B625B] uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-[#171717]">
                <Layers className="w-3.5 h-3.5 text-[#F62440]" />
                Sources & Citations ({message.citations.length})
              </span>
              <span className="text-[10px] text-[#6B625B] font-normal lowercase">
                Click to inspect code
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {message.citations.map((cit) => (
                <CitationBadge
                  key={cit.id}
                  citation={cit}
                  onOpenContext={onOpenContext}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#EBDCC8]/40 text-xs font-mono text-[#6B625B]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="hover:text-[#171717] flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="hover:text-[#171717] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFeedback("up")}
              className={`p-1 rounded hover:bg-[#FFF2DB] transition-colors cursor-pointer ${
                feedback === "up" ? "text-emerald-600" : "text-[#6B625B]"
              }`}
              title="Helpful response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setFeedback("down")}
              className={`p-1 rounded hover:bg-[#FFF2DB] transition-colors cursor-pointer ${
                feedback === "down" ? "text-[#F62440]" : "text-[#6B625B]"
              }`}
              title="Report issue"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
