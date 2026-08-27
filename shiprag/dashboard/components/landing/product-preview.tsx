"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileCode,
  GitBranch,
  Search,
  CheckCircle2,
  Database,
  Layers,
  Sparkles,
  ExternalLink,
  Terminal,
} from "lucide-react";
import { motion } from "framer-motion";

export function ProductPreview() {
  return (
    <section id="preview" className="relative w-full py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <Badge
            variant="brand"
            className="mb-3 px-3 py-1 text-xs font-mono"
          >
            LIVE REPOSITORY INSPECTOR
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Developer-First Interactive Intelligence
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mt-2">
            Real-time vector pipeline visualization with exact line-level
            citations.
          </p>
        </div>

        {/* Realistic IDE Window Frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-2xl border border-white/15 bg-[#0b0f19] shadow-2xl shadow-indigo-500/10 overflow-hidden"
        >
          {/* Top Bar / Mac OS style dots */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#070a12]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs font-mono text-gray-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                shiprag / <span className="text-white font-medium">ai-support-copilot</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Indexed
              </span>
              <span className="hidden sm:inline text-xs text-gray-500 font-mono">
                Last Sync: Just now
              </span>
            </div>
          </div>

          {/* Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-white/5 bg-white/[0.01] divide-x divide-white/5 text-center py-3">
            <div className="p-2">
              <div className="text-xs text-gray-400 font-medium">Files Processed</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5 flex items-center justify-center gap-1">
                <FileCode className="w-4 h-4 text-blue-400" /> 50 Files
              </div>
            </div>
            <div className="p-2">
              <div className="text-xs text-gray-400 font-medium">Vector Index</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5 flex items-center justify-center gap-1">
                <Layers className="w-4 h-4 text-indigo-400" /> 136 Chunks
              </div>
            </div>
            <div className="p-2">
              <div className="text-xs text-gray-400 font-medium">Dimensions</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5 flex items-center justify-center gap-1">
                <Database className="w-4 h-4 text-purple-400" /> 1024D (NVIDIA)
              </div>
            </div>
            <div className="p-2">
              <div className="text-xs text-gray-400 font-medium">Search Strategy</div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hybrid BM25
              </div>
            </div>
          </div>

          {/* Chat Workspace Area */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* User Prompt */}
            <div className="flex items-start gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-xs font-bold text-white shrink-0">
                DEV
              </div>
              <div className="rounded-xl rounded-tl-none border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 shadow-sm font-medium">
                Explain how the authentication pipeline works.
              </div>
            </div>

            {/* AI Assistant Output with Grounded Citations */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 rounded-xl rounded-tl-none border border-indigo-500/20 bg-[#0d1322] p-4 sm:p-5 text-sm text-gray-200 shadow-inner">
                <p className="leading-relaxed mb-4 text-gray-300">
                  Authentication begins in the API middleware where the incoming token is validated before the request is passed to the service layer. Sessions are decoded with cryptographic HMAC validation and attached to the request lifecycle.
                </p>

                {/* Citation Badges */}
                <div className="pt-4 border-t border-white/10">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    Verified Citations (3)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-white/5 border border-white/10 text-blue-300 hover:bg-white/10 transition-colors cursor-pointer">
                      <FileCode className="w-3.5 h-3.5 text-blue-400" />
                      auth/middleware.py:42
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-white/5 border border-white/10 text-indigo-300 hover:bg-white/10 transition-colors cursor-pointer">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      services/auth.py:87
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-white/5 border border-white/10 text-purple-300 hover:bg-white/10 transition-colors cursor-pointer">
                      <FileCode className="w-3.5 h-3.5 text-purple-400" />
                      docs/authentication.md:18
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
