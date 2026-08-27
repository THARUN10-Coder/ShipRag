import { glob } from "glob";
import fetch from "node-fetch";
import { ShipragConfig } from "./config.js";

const SUPPORTED_GLOBS = ["**/*.md", "**/*.txt", "**/*.pdf"];

export async function findDocFiles(docsDir: string): Promise<string[]> {
  const matches = await Promise.all(
    SUPPORTED_GLOBS.map((pattern) => glob(pattern, { cwd: docsDir, absolute: true }))
  );
  return matches.flat();
}

interface IngestResult {
  project_id: string;
  files_processed: string[];
  total_chunks: number;
}

export async function callIngestApi(
  config: ShipragConfig,
  paths: string[]
): Promise<IngestResult> {
  const res = await fetch(`${config.apiUrl}/api/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: config.projectId, paths }),
  });

  if (!res.ok) {
    throw new Error(`Ingest failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as IngestResult;
}
