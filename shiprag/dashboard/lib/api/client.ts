const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RealSourceChunk {
  source: string;
  content: string;
  similarity: number;
}

export interface RealQueryResponse {
  answer: string;
  sources: RealSourceChunk[];
}

export interface RealRepository {
  id: string;
  name: string;
  fullName: string;
  fileCount: number;
  chunkCount: number;
  status: string;
  syncStatus: "synced" | "syncing" | "warning" | "error";
  lastSync: string;
  defaultBranch: string;
  embeddingDimension: number;
  embeddingModel: string;
  language: string;
  languageColor: string;
  description: string;
  files?: string[];
}

export interface RealActivity {
  id: string;
  type: string;
  message: string;
  repository_id: string;
  workspace_id?: string;
  created_at: string;
}

export const apiClient = {
  async health(): Promise<{ status: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error("Health check failed");
      return await res.json();
    } catch (_) {
      return { status: "offline" };
    }
  },

  async getRepositories(): Promise<RealRepository[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/repositories`);
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const data = await res.json();
      return data.repositories || [];
    } catch (_) {
      return [];
    }
  },

  async getActivities(limit: number = 10): Promise<RealActivity[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/activities?limit=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.activities || [];
    } catch (_) {
      return [];
    }
  },

  async getRepository(projectId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/repositories/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch repository");
      return await res.json();
    } catch (_) {
      return null;
    }
  },

  async getRepositoryGraph(projectId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/repositories/${projectId}/graph`);
      if (!res.ok) throw new Error("Failed to fetch AST code graph");
      return await res.json();
    } catch (_) {
      return null;
    }
  },

  async ingestGithubRepo(repoUrl: string, projectId?: string, branch?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/ingest/github-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo_url: repoUrl,
        project_id: projectId,
        branch: branch || "main",
      }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Ingestion failed" }));
      throw new Error(errorData.detail || "Repository ingestion failed");
    }
    return await res.json();
  },

  async query(projectId: string, question: string, topK: number = 4): Promise<RealQueryResponse> {
    const res = await fetch(`${API_BASE_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        question: question,
        top_k: topK,
      }),
    });
    if (!res.ok) {
      throw new Error("RAG Query request failed");
    }
    return await res.json();
  },

  async searchCode(query: string, projectId: string = "all", language: string = "All", method: string = "All", topK: number = 15): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          project_id: projectId,
          language,
          method,
          top_k: topK,
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch (_) {
      return [];
    }
  },

  async getGitHubStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/github/status`);
      if (!res.ok) throw new Error("Status fetch failed");
      return await res.json();
    } catch (_) {
      return { configured: false, auth_mode: "unconfigured" };
    }
  },

  async configureGitHub(payload: Record<string, string>): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/github/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Configuration failed");
    return await res.json();
  },

  async getGitHubRepositories(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/github/repositories`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.repositories || [];
    } catch (_) {
      return [];
    }
  },

  async getPullRequests(owner: string, repo: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/github/repositories/${owner}/${repo}/pulls`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.pull_requests || [];
    } catch (_) {
      return [];
    }
  },

  async getPullRequestReview(owner: string, repo: string, prNumber: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/github/repositories/${owner}/${repo}/pulls/${prNumber}`);
    if (!res.ok) {
      throw new Error("Failed to load PR Intelligence review");
    }
    return await res.json();
  },

  async getGitHubAuthUrl(): Promise<{ url: string; state: string; client_id: string }> {
    const redirectUri = "http://localhost:8000/api/auth/github/callback";
    const res = await fetch(`${API_BASE_URL}/api/auth/github/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
    if (!res.ok) throw new Error("Failed to get GitHub authorization URL");
    return await res.json();
  },

  async authenticateGoogle(userData: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null; idToken?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error("Google authentication failed");
    return await res.json();
  },

  async getCurrentUser(uid?: string): Promise<any> {
    try {
      const url = uid ? `${API_BASE_URL}/api/auth/me?uid=${encodeURIComponent(uid)}` : `${API_BASE_URL}/api/auth/me`;
      const res = await fetch(url);
      if (!res.ok) return { authenticated: false };
      return await res.json();
    } catch (_) {
      return { authenticated: false };
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST" });
    } catch (_) {}
  },
};
