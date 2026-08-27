export type SyncStatus = "synced" | "syncing" | "indexing" | "warning" | "error";

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  defaultBranch: string;
  status: "active" | "archived" | "indexing";
  syncStatus: SyncStatus;
  lastSync: string;
  fileCount: number;
  chunkCount: number;
  embeddingDimension: number;
  embeddingModel: string;
  language: string;
  languageColor: string;
  stars?: number;
  description?: string;
}

export interface ActivityItem {
  id: string;
  type: "sync" | "connect" | "query" | "push" | "graph" | "warning";
  title: string;
  repositoryId: string;
  repositoryName: string;
  timestamp: string;
  user?: string;
  details?: string;
}

export interface PRItem {
  id: string;
  number: number;
  title: string;
  repositoryId: string;
  repositoryName: string;
  author: string;
  branch: string;
  status: "open" | "merged" | "closed";
  aiRisk: "Low" | "Medium" | "High";
  changedFiles: number;
  additions: number;
  deletions: number;
  createdAt: string;
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  repositoryId: string;
  repositoryName: string;
  file: string;
  cve?: string;
  status: "open" | "resolved" | "ignored";
  detectedAt: string;
}
