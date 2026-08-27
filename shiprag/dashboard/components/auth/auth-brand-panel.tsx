"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, Search, GitPullRequest, Code2 } from "lucide-react";

export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-16 bg-gradient-to-br from-[#FFF2DB] via-[#FFF2DB] to-[#FFE5BF] border-r border-[#EBDCC8] relative overflow-hidden select-none">
      {/* Background soft decorative gradient blurs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FFE5BF]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#F62440]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top: Official Logo */}
      <div className="relative z-10">
        <div className="relative h-14 w-60">
          <Image
            src="/shiprag_logo.png"
            alt="SHIPRAG Logo"
            fill
            className="object-contain object-left mix-blend-multiply"
            priority
          />
        </div>
      </div>

      {/* Middle: Headline + Illustration */}
      <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE5BF]/80 text-[#F62440] text-xs font-bold border border-[#EBDCC8] shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Code Intelligence
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#171717] leading-[1.12]">
            Your codebase. <br />
            Now <span className="text-[#F62440]">understood.</span>
          </h1>
          <p className="text-sm sm:text-base text-[#6B625B] leading-relaxed">
            Connect your repositories and let AI understand, index, and query your entire codebase with grounded context.
          </p>
        </div>

      </div>

      {/* Bottom: Feature Highlights */}
      <div className="relative z-10 pt-4 border-t border-[#EBDCC8]/80">
        <div className="grid grid-cols-3 gap-3 text-xs font-medium text-[#171717]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#FFE5BF] flex items-center justify-center text-[#F62440] shrink-0">
              <Code2 className="w-3 h-3" />
            </div>
            <span className="text-[11px] sm:text-xs">Understand Codebase</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#FFE5BF] flex items-center justify-center text-[#F62440] shrink-0">
              <Search className="w-3 h-3" />
            </div>
            <span className="text-[11px] sm:text-xs">Search with AI</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#FFE5BF] flex items-center justify-center text-[#F62440] shrink-0">
              <GitPullRequest className="w-3 h-3" />
            </div>
            <span className="text-[11px] sm:text-xs">Review Pull Requests</span>
          </div>
        </div>
      </div>
    </div>
  );
}
