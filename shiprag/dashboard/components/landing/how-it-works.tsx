"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Scissors,
  Database,
  Search,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import { motion } from "framer-motion";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Connect GitHub",
    description: "Provide your public or private repository URL with instant shallow clone.",
    icon: GithubIcon,
  },

  {
    step: "02",
    title: "Ingest & Chunk",
    description: "Multi-language token parsing with 500-token windows and 50-token overlap.",
    icon: Scissors,
  },
  {
    step: "03",
    title: "Embed & Index",
    description: "1024D vector embeddings generated via NVIDIA NIM and saved to pgvector.",
    icon: Database,
  },
  {
    step: "04",
    title: "Hybrid Retrieve",
    description: "Blends dense cosine similarity with BM25 lexical keyword ranking.",
    icon: Search,
  },
  {
    step: "05",
    title: "Generate & Cite",
    description: "Llama 3.3 70B synthesizes grounded answers with strict file citations.",
    icon: CheckCircle,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative w-full py-20 px-4 border-t border-white/5 bg-[#030712]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="brand" className="mb-3 px-3 py-1 text-xs font-mono">
            WORKFLOW PIPELINE
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            How SHIPRAG Works
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mt-2">
            Five autonomous steps from raw git commit to interactive, grounded AI intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {PIPELINE_STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative flex flex-col p-5 rounded-xl border border-white/10 bg-[#090d16]/80 hover:border-indigo-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {item.step}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-indigo-600 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 font-mono">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {item.description}
                </p>

                {/* Arrow indicator for desktop */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-gray-600">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
