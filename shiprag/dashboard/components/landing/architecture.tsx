import { Badge } from "@/components/ui/badge";
import {
  Server,
  Layers,
  Cpu,
  Database,
  Search,
  Split,
  Combine,
  Bot,
  CheckCircle2,
  ArrowDown,
} from "lucide-react";

import { motion } from "framer-motion";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}


export function Architecture() {
  return (
    <section id="architecture" className="relative w-full py-20 px-4 bg-[#030712] border-t border-white/5">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <Badge variant="brand" className="mb-3 px-3 py-1 text-xs font-mono">
            SYSTEM BLUEPRINT
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            End-to-End System Architecture
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mt-2">
            Low-latency hybrid pipeline running on FastAPI, pgvector, and NVIDIA NIM inference.
          </p>
        </div>

        {/* Visual Flow Architecture Tree */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center space-y-4"
        >
          {/* Level 1: GitHub */}
          <div className="w-full max-w-md p-3.5 rounded-xl border border-white/15 bg-[#0a0f1d] flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <GithubIcon className="w-5 h-5 text-gray-300" />
              <span className="font-mono text-sm font-semibold">GitHub Repository / Push Webhook</span>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Source</span>
          </div>


          <ArrowDown className="w-4 h-4 text-gray-600 animate-bounce" />

          {/* Level 2: Ingestion Engine */}
          <div className="w-full max-w-md p-3.5 rounded-xl border border-white/15 bg-[#0a0f1d] flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-blue-400" />
              <span className="font-mono text-sm font-semibold">Ingestion Engine (Shallow Git Clone)</span>
            </div>
            <span className="text-xs font-mono text-blue-400">&lt; 3s Clone</span>
          </div>

          <ArrowDown className="w-4 h-4 text-gray-600" />

          {/* Level 3: Token Chunking */}
          <div className="w-full max-w-md p-3.5 rounded-xl border border-white/15 bg-[#0a0f1d] flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span className="font-mono text-sm font-semibold">Token Chunking (500 Token Window / 50 Overlap)</span>
            </div>
            <span className="text-xs font-mono text-gray-400">tiktoken</span>
          </div>

          <ArrowDown className="w-4 h-4 text-gray-600" />

          {/* Level 4: NVIDIA Embeddings */}
          <div className="w-full max-w-md p-3.5 rounded-xl border border-white/15 bg-[#0a0f1d] flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-purple-400" />
              <span className="font-mono text-sm font-semibold">NVIDIA Embeddings (nv-embedqa-e5-v5)</span>
            </div>
            <span className="text-xs font-mono text-purple-400">1024D</span>
          </div>

          <ArrowDown className="w-4 h-4 text-gray-600" />

          {/* Level 5: Storage */}
          <div className="w-full max-w-md p-3.5 rounded-xl border border-white/15 bg-[#0a0f1d] flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400" />
              <span className="font-mono text-sm font-semibold">Persistent Vector Store / pgvector</span>
            </div>
            <span className="text-xs font-mono text-emerald-400">Storage</span>
          </div>

          <ArrowDown className="w-4 h-4 text-gray-600" />

          {/* Level 6: Hybrid Search Split */}
          <div className="w-full max-w-lg p-4 rounded-xl border border-indigo-500/30 bg-[#0d1424] shadow-lg shadow-indigo-500/10">
            <div className="text-center font-mono text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
              <Search className="w-3.5 h-3.5" />
              Hybrid Search (Dense + BM25)
            </div>

            <div className="grid grid-cols-2 gap-3 text-center font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-blue-300">
                Dense Vector (70%)
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-indigo-300">
                BM25 Lexical (30%)
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 text-center font-mono text-xs text-gray-400 flex items-center justify-center gap-2">
              <Combine className="w-3.5 h-3.5 text-emerald-400" />
              Reciprocal Rank Fusion & Re-ranking (Top-K)
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-gray-600" />

          {/* Level 7: Context Synthesizer */}
          <div className="w-full max-w-md p-3.5 rounded-xl border border-white/15 bg-[#0a0f1d] flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-amber-400" />
              <span className="font-mono text-sm font-semibold">Context Synthesizer (Strict Prompt Rules)</span>
            </div>
            <span className="text-xs font-mono text-amber-400">Context</span>
          </div>

          <ArrowDown className="w-4 h-4 text-gray-600" />

          {/* Level 8: Llama 3.3 70B */}
          <div className="w-full max-w-md p-3.5 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 flex items-center justify-between text-white shadow-lg">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-indigo-400" />
              <span className="font-mono text-sm font-semibold">NVIDIA Llama 3.3 (70B Instruct)</span>
            </div>
            <span className="text-xs font-mono text-indigo-300">Inference</span>
          </div>

          <ArrowDown className="w-4 h-4 text-emerald-500" />

          {/* Level 9: Output Result */}
          <div className="w-full max-w-md p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-center shadow-lg shadow-emerald-500/10">
            <div className="font-mono text-sm font-bold text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Grounded AI Response + Line-Level Citations
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
