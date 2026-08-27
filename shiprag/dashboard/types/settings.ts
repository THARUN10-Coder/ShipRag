export interface DeveloperSettings {
  // 1. General
  general: {
    workspaceName: string;
    description: string;
    defaultRepository: string;
    defaultBranch: string;
    defaultLanguage: string;
    contextScope: "current" | "all";
  };

  // 2. AI Copilot
  aiCopilot: {
    responseStyle: "concise" | "balanced" | "detailed";
    explanationLevel: "beginner" | "developer" | "expert";
    includeCodeExamples: boolean;
    explainReasoning: boolean;
    showSourceFiles: boolean;
    showLineReferences: boolean;
    includeRelatedSymbols: boolean;
    suggestImprovements: boolean;
    contextSize: "automatic" | "4k" | "8k" | "16k" | "32k";
    suggestFollowUp: boolean;
    allowCodeGeneration: boolean;
    priority: "repository" | "general";
    groundingMode: "strict" | "balanced";
  };

  // 3. Code Intelligence & Code Graph
  codeIntelligence: {
    enableAstAnalysis: boolean;
    analyzeFunctions: boolean;
    analyzeClasses: boolean;
    analyzeImports: boolean;
    analyzeCalls: boolean;
    analyzeDependencies: boolean;
    analyzeCrossFile: boolean;
    analyzeCrossRepo: boolean;
    graphDepth: number; // e.g. 1, 2, 3, 4, 5
    defaultGraphLayout: "hierarchical" | "force-directed" | "radial";
    showFileNodes: boolean;
    showFunctionNodes: boolean;
    showClassNodes: boolean;
    showDependencyEdges: boolean;
    showImportEdges: boolean;
    showCallEdges: boolean;
  };

  // 4. Search & RAG
  searchRag: {
    searchStrategy: "hybrid" | "semantic" | "keyword";
    denseWeight: number; // 0 - 100 (e.g. 70)
    bm25Weight: number; // 0 - 100 (e.g. 30)
    topK: number; // e.g. 5, 10, 15, 20
    reRanking: boolean;
    minRelevanceScore: number; // e.g. 0.35
    contextExpansion: boolean;
    expandRelatedFiles: boolean;
    expandRelatedSymbols: boolean;
    includeDocumentation: boolean;
  };

  // 5. Grounded Responses & Citations
  citations: {
    citationMode: "always" | "relevant" | "hidden";
    showRepository: boolean;
    showFilePath: boolean;
    showLineNumbers: boolean;
    showRelevanceScore: boolean;
    showRetrievedContext: boolean;
    sourcePreviewLength: number; // in tokens, e.g. 250, 500, 1000
  };

  // 6. Pull Request Review
  prReview: {
    severities: {
      critical: boolean;
      high: boolean;
      medium: boolean;
      low: boolean;
    };
    categories: {
      security: boolean;
      bugs: boolean;
      performance: boolean;
      reliability: boolean;
      codeQuality: boolean;
      dependencies: boolean;
      architecture: boolean;
      maintainability: boolean;
      testing: boolean;
    };
    strictness: "lenient" | "balanced" | "strict";
    analyzeChangedFiles: boolean;
    analyzeAffectedDependencies: boolean;
    analyzeAstImpact: boolean;
    checkCrossFileEffects: boolean;
    checkSecurityIssues: boolean;
    generateSuggestedFixes: boolean;
    showEvidence: boolean;
    showSourceCitations: boolean;
    riskThreshold: number; // e.g. 70
    reviewOutput: "detailed" | "standard" | "summary";
    outputFields: {
      riskScore: boolean;
      findingExplanation: boolean;
      whyItMatters: boolean;
      suggestedFix: boolean;
      codeLocation: boolean;
      evidence: boolean;
      relatedFiles: boolean;
      astImpact: boolean;
    };
  };

  // 7. Repository Indexing
  repositoryIndexing: {
    automaticIndexing: boolean;
    indexOnGitPush: boolean;
    indexPullRequests: boolean;
    indexDocumentation: boolean;
    indexSourceCode: boolean;
    indexTests: boolean;
    indexConfigFiles: boolean;
    ignoredPatterns: string[];
    chunkSize: number; // e.g. 500
    chunkOverlap: number; // e.g. 50
    embeddingStrategy: "automatic" | "gemini" | "e5";
    reindexStrategy: "changed-only" | "entire-repo";
  };

  // 8. Notifications
  notifications: {
    prReviewCompleted: boolean;
    criticalVulnerability: boolean;
    indexingCompleted: boolean;
    indexingFailed: boolean;
    aiAnalysisCompleted: boolean;
    webhookSyncFailed: boolean;
    highRiskPr: boolean;
    inApp: boolean;
    email: boolean;
  };

  // 9. Appearance
  appearance: {
    theme: "light" | "dark" | "system";
    accent: "red" | "neutral";
    density: "compact" | "comfortable" | "spacious";
    codeFont: string;
    interfaceFont: string;
    animations: boolean;
  };
}

export const DEFAULT_SETTINGS: DeveloperSettings = {
  general: {
    workspaceName: "SHIPRAG Workspace",
    description: "My development workspace",
    defaultRepository: "all",
    defaultBranch: "main",
    defaultLanguage: "auto",
    contextScope: "all",
  },
  aiCopilot: {
    responseStyle: "balanced",
    explanationLevel: "developer",
    includeCodeExamples: true,
    explainReasoning: true,
    showSourceFiles: true,
    showLineReferences: true,
    includeRelatedSymbols: true,
    suggestImprovements: true,
    contextSize: "automatic",
    suggestFollowUp: true,
    allowCodeGeneration: true,
    priority: "repository",
    groundingMode: "strict",
  },
  codeIntelligence: {
    enableAstAnalysis: true,
    analyzeFunctions: true,
    analyzeClasses: true,
    analyzeImports: true,
    analyzeCalls: true,
    analyzeDependencies: true,
    analyzeCrossFile: true,
    analyzeCrossRepo: true,
    graphDepth: 3,
    defaultGraphLayout: "hierarchical",
    showFileNodes: true,
    showFunctionNodes: true,
    showClassNodes: true,
    showDependencyEdges: true,
    showImportEdges: true,
    showCallEdges: true,
  },
  searchRag: {
    searchStrategy: "hybrid",
    denseWeight: 70,
    bm25Weight: 30,
    topK: 10,
    reRanking: true,
    minRelevanceScore: 0.35,
    contextExpansion: true,
    expandRelatedFiles: true,
    expandRelatedSymbols: true,
    includeDocumentation: true,
  },
  citations: {
    citationMode: "always",
    showRepository: true,
    showFilePath: true,
    showLineNumbers: true,
    showRelevanceScore: true,
    showRetrievedContext: true,
    sourcePreviewLength: 500,
  },
  prReview: {
    severities: {
      critical: true,
      high: true,
      medium: true,
      low: true,
    },
    categories: {
      security: true,
      bugs: true,
      performance: true,
      reliability: true,
      codeQuality: true,
      dependencies: true,
      architecture: true,
      maintainability: true,
      testing: true,
    },
    strictness: "balanced",
    analyzeChangedFiles: true,
    analyzeAffectedDependencies: true,
    analyzeAstImpact: true,
    checkCrossFileEffects: true,
    checkSecurityIssues: true,
    generateSuggestedFixes: true,
    showEvidence: true,
    showSourceCitations: true,
    riskThreshold: 70,
    reviewOutput: "detailed",
    outputFields: {
      riskScore: true,
      findingExplanation: true,
      whyItMatters: true,
      suggestedFix: true,
      codeLocation: true,
      evidence: true,
      relatedFiles: true,
      astImpact: true,
    },
  },
  repositoryIndexing: {
    automaticIndexing: true,
    indexOnGitPush: true,
    indexPullRequests: true,
    indexDocumentation: true,
    indexSourceCode: true,
    indexTests: true,
    indexConfigFiles: true,
    ignoredPatterns: [
      "node_modules",
      ".git",
      ".next",
      "dist",
      "build",
      "venv",
      "__pycache__",
      "*.log",
      "*.tmp",
      "coverage/",
    ],
    chunkSize: 500,
    chunkOverlap: 50,
    embeddingStrategy: "automatic",
    reindexStrategy: "changed-only",
  },
  notifications: {
    prReviewCompleted: true,
    criticalVulnerability: true,
    indexingCompleted: true,
    indexingFailed: true,
    aiAnalysisCompleted: true,
    webhookSyncFailed: true,
    highRiskPr: true,
    inApp: true,
    email: false,
  },
  appearance: {
    theme: "light",
    accent: "red",
    density: "comfortable",
    codeFont: "JetBrains Mono",
    interfaceFont: "Inter",
    animations: true,
  },
};
