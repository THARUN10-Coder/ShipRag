export type ASTNodeType =
  | "repository"
  | "directory"
  | "file"
  | "class"
  | "function"
  | "method"
  | "interface"
  | "variable"
  | "import"
  | "type"
  | "enum"
  | "dependency"
  | "module";

export type ASTEdgeType =
  | "CONTAINS"
  | "IMPORTS"
  | "CALLS"
  | "EXTENDS"
  | "IMPLEMENTS"
  | "DEPENDS_ON"
  | "USES";

export interface ASTGraphNode {
  id: string;
  type: ASTNodeType;
  name: string;
  label?: string;
  filePath?: string;
  repositoryId?: string;
  repository?: string;
  language?: string;
  lineStart?: number;
  lineEnd?: number;
  functions?: string[];
  imports?: string[];
  dependencies?: string[];
  dependents?: string[];
  description?: string;
  metadata?: Record<string, any>;
}

export interface ASTGraphEdge {
  id: string;
  source: string;
  target: string;
  type: ASTEdgeType | string;
  repositoryId?: string;
  label?: string;
  relation?: string;
  metadata?: Record<string, any>;
}

export interface RepositoryGraphData {
  repository_id: string;
  nodes: ASTGraphNode[];
  edges: ASTGraphEdge[];
  stats?: {
    files_scanned?: number;
    files_parsed?: number;
    files_skipped?: number;
    total_nodes?: number;
    total_edges?: number;
    message?: string;
  };
}
