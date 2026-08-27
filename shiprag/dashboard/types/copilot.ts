export type CopilotMode =
  | "ask"
  | "search"
  | "deep-analysis"
  | "debug"
  | "review"
  | "explain";

export interface Citation {
  id: string;
  repo: string;
  branch: string;
  file: string;
  startLine: number;
  endLine: number;
  relevance: number;
  retrievalType: "Dense + BM25" | "Dense" | "BM25";
  codeSnippet: string;
}

export interface RetrievedChunk {
  id: string;
  repo: string;
  file: string;
  lineRange: string;
  relevance: number;
  method: "Dense" | "BM25" | "Hybrid";
  preview: string;
}

export interface GroundingStats {
  score: number; // e.g. 96%
  sourcesUsed: number;
  verifiedClaims: number;
  unsupportedClaims: number;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mode?: CopilotMode;
  contextScope?: string; // e.g. "ecommerce-platform", "2 repositories", "All Repositories"
  citations?: Citation[];
  retrievedChunks?: RetrievedChunk[];
  grounding?: GroundingStats;
  pipelineStages?: {
    dense: boolean;
    bm25: boolean;
    hybridRanking: boolean;
    contextSynthesis: boolean;
    groundedResponse: boolean;
  };
}

export interface RepositoryFileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  children?: RepositoryFileNode[];
  selected?: boolean;
}
