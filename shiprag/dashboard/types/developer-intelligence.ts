export interface CodeSearchResult {
  id: string;
  repository: string;
  branch: string;
  file: string;
  language: string;
  functionName?: string;
  codeSnippet: string;
  relevance: number; // 0 - 100
  denseScore: number; // 0.0 - 1.0
  bm25Score: number; // 0.0 - 1.0
  hybridScore: number; // 0.0 - 1.0
  startLine: number;
  endLine: number;
  retrievalMethod: "Dense + BM25" | "Dense" | "BM25";
}

export interface GraphNode {
  id: string;
  name: string;
  type: "repository" | "module" | "file" | "function";
  repository: string;
  file?: string;
  description: string;
  functions?: string[];
  imports?: string[];
  dependencies: string[];
  dependents: string[];
  metrics?: {
    loc?: number;
    chunkCount?: number;
    callsCount?: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: "calls" | "imports" | "api" | "depends_on";
}

export interface DebugAnalysisResult {
  id: string;
  query: string;
  timestamp: string;
  rootCause: string;
  likelySourceFile: string;
  likelySourceRepo: string;
  likelyFunction: string;
  startLine: number;
  endLine: number;
  confidence: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  impact: string;
  suggestedFixDiff: string;
  relatedFiles: Array<{
    file: string;
    repo: string;
    relationship: string;
    relevance: number;
    lineRange: string;
  }>;
}

export interface PRReviewFinding {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category?: "BUG" | "SECURITY" | "PERFORMANCE" | "BREAKING_CHANGE" | "TESTING" | "MAINTAINABILITY";
  file: string;
  repo: string;
  startLine: number;
  endLine: number;
  lineStart?: number;
  lineEnd?: number;
  explanation: string;
  whyItMatters: string;
  codeSnippet: string;
  evidence?: string;
  impact?: string;
  recommendation?: string;
  confidence?: number;
  citations?: string[];
  suggestedFix?: string;
}

export interface PRReviewDetail {
  id: string;
  number: number;
  title: string;
  repository: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  headSha?: string;
  baseSha?: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  overallRisk: "Critical" | "High" | "Medium" | "Low";
  score: number; // 0 - 100
  riskRationale?: string;
  aiReviewStatus: "Available" | "Pending" | "In Review" | "Reviewed" | "Failed";
  findings: PRReviewFinding[];
  affectedModules: number;
  affectedRepositories: number;
  dependencyImpactChain: string[];
  affectedTests?: string[];
  ragContext?: string[];
  citations?: Array<{ repository: string; file: string; lineRange: string; source: string }>;
  aiSummary?: string;
}

export interface SecurityFindingDetail {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  category:
    | "Secrets"
    | "Authentication"
    | "Authorization"
    | "Injection"
    | "Dependencies"
    | "Configuration"
    | "Cryptography"
    | "Data Exposure";
  repository: string;
  file: string;
  line: number;
  status: "Open" | "Resolved" | "Ignored";
  detectedAt: string;
  description: string;
  evidenceSnippet: string;
  recommendedAction: string;
  cve?: string;
}
