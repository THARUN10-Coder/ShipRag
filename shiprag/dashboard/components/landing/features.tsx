"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest,
  Search,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { motion } from "framer-motion";

const FEATURES_DATA = [
  {
    icon: GitPullRequest,
    title: "AUTONOMOUS INGESTION",
    description: "Automatically ingest public or private GitHub repositories in under 3 seconds with token-optimized chunking.",
    accent: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Search,
    title: "HYBRID SEARCH",
    description: "Dense semantic retrieval with 1024D vectors blended with BM25 lexical keyword ranking for zero hallucination.",
    accent: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: ShieldCheck,
    title: "GROUNDED AI",
    description: "Generate answers strictly based on verified repository context, avoiding generic LLM boilerplate.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: FileCheck2,
    title: "LIVE CITATIONS",
    description: "Trace every sentence and architectural claim directly back to source files, line numbers, and commits.",
    accent: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: RefreshCw,
    title: "CONTINUOUS SYNC",
    description: "Keep repositories continuously updated through HMAC-SHA256 authenticated GitHub push webhooks.",
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Cpu,
    title: "CODE INTELLIGENCE",
    description: "Understand, debug, review, and explore your entire codebase with high-throughput NVIDIA Llama 3.3 70B inference.",
    accent: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
];

export function Features() {
  return (
    <section id="features" className="relative w-full py-20 px-4 bg-[#030712]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <Badge variant="brand" className="mb-3 px-3 py-1 text-xs font-mono">
            CORE CAPABILITIES
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Engineered for Modern Engineering Teams
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mt-2">
            Production-ready RAG infrastructure designed to make codebases
            interactive and immediately queryable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES_DATA.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full border-white/10 bg-[#090d16]/90 hover:border-white/20 transition-all duration-200 hover:-translate-y-1 group">
                  <CardHeader>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border mb-4 ${feat.bg}`}
                    >
                      <Icon className={`w-5 h-5 ${feat.accent}`} />
                    </div>
                    <CardTitle className="text-base font-bold font-mono tracking-wider text-gray-200 group-hover:text-white transition-colors">
                      {feat.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-400 leading-relaxed pt-2">
                      {feat.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
