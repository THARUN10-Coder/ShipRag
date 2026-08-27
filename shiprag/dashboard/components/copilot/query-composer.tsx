"use client";

import React, { useState } from "react";
import { CopilotMode } from "@/types/copilot";
import {
  Send,
  Sparkles,
  Paperclip,
  Code2,
  HelpCircle,
  FileCode,
  Search,
  Bug,
  ShieldAlert,
} from "lucide-react";

interface QueryComposerProps {
  onSend: (text: string, mode: CopilotMode) => void;
  loading: boolean;
  selectedRepoName: string;
  contextScope: string;
  onOpenContextPicker?: () => void;
}

const SUGGESTION_CHIPS = [
  { label: "Explain this function", prompt: "Explain this function and its key logic." },
  { label: "Find related files", prompt: "Find all files and modules related to this flow." },
  { label: "Trace dependencies", prompt: "Trace all dependencies and imports used here." },
  { label: "Review implementation", prompt: "Review this implementation for best practices and edge cases." },
  { label: "Debug this code", prompt: "Debug this code and identify any potential bugs or security risks." },
];

export function QueryComposer({
  onSend,
  loading,
  selectedRepoName,
  contextScope,
  onOpenContextPicker,
}: QueryComposerProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || loading) return;
    onSend(text, "ask");
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (prompt: string) => {
    onSend(prompt, "explain");
  };

  return (
    <div className="border-t border-[#EBDCC8] bg-[#FFFAF3] p-4 shrink-0 space-y-3">
      {/* Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => handleChipClick(chip.prompt)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FFF2DB] hover:bg-[#FFE5BF] border border-[#FFE5BF] text-[#171717] hover:text-[#F62440] transition-all whitespace-nowrap cursor-pointer shadow-2xs shrink-0"
          >
            <Sparkles className="w-3 h-3 text-[#F62440]" />
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Modern Large Input Container */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-[20px] border border-[#EBDCC8] bg-white focus-within:border-[#F62440] focus-within:ring-2 focus-within:ring-[#F62440]/15 transition-all shadow-xs overflow-hidden">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about ${contextScope}... (Enter to send)`}
            className="w-full pl-4 pr-24 py-3.5 bg-transparent text-sm text-[#171717] placeholder-[#6B625B]/70 focus:outline-none resize-none leading-relaxed"
          />

          {/* Action Row inside Textarea */}
          <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1">
            <div className="flex items-center gap-2 text-[#6B625B]">
              <button
                type="button"
                onClick={onOpenContextPicker}
                className="p-1.5 rounded-lg hover:bg-[#FFF2DB] hover:text-[#171717] transition-colors cursor-pointer"
                title="Attach context or file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-[#FFF2DB] hover:text-[#171717] transition-colors cursor-pointer"
                title="Add code snippet"
              >
                <Code2 className="w-4 h-4" />
              </button>
            </div>

            {/* Red Send Button */}
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-9 h-9 rounded-xl bg-[#F62440] hover:bg-[#d61b34] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
