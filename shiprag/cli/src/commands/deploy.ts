import chalk from "chalk";
import ora from "ora";
import fetch from "node-fetch";
import { loadConfig, configExists, loadCredentials } from "../lib/config.js";
import { findDocFiles } from "../lib/ingest.js";

export async function deployCommand(): Promise<void> {
  if (!configExists()) {
    console.log(chalk.red("No shiprag.config.json found. Run `shiprag init` first."));
    process.exitCode = 1;
    return;
  }

  const creds = loadCredentials();
  if (!creds) {
    console.log(chalk.yellow("Not logged in. Run `shiprag login <email> <password>` first."));
    process.exitCode = 1;
    return;
  }

  const config = loadConfig();
  const spinner = ora("Finding docs...").start();

  const files = await findDocFiles(config.docsDir);
  if (files.length === 0) {
    spinner.fail(`No supported files found in ${config.docsDir}`);
    return;
  }
  spinner.succeed(`Found ${files.length} file(s)`);

  spinner.start("Submitting ingestion job...");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Authorization": `Bearer ${creds.token}`,
  };

  const body = new URLSearchParams({
    project_id: config.projectId,
    user_id: creds.userId,
    paths: JSON.stringify(files),
  });

  const baseUrl = config.apiUrl || "http://localhost:8080";
  const res = await fetch(`${baseUrl}/api/ingest`, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    spinner.fail(`Ingest submission failed: ${res.status} ${errText}`);
    return;
  }

  const job = (await res.json()) as { job_id: string; status: string };
  spinner.succeed(`Job queued (ID: ${job.job_id})`);

  // Poll status
  const pollSpinner = ora("Processing documents (chunking & embedding)...").start();
  let done = false;

  while (!done) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const statusRes = await fetch(`${baseUrl}/api/ingest/status/${job.job_id}`);
    if (statusRes.ok) {
      const statusData = (await statusRes.json()) as any;
      if (statusData.status === "done") {
        pollSpinner.succeed(`Indexed ${statusData.total_chunks} chunks across ${statusData.files_processed.length} file(s)`);
        done = true;
      } else if (statusData.status === "failed") {
        pollSpinner.fail(`Ingestion failed: ${statusData.error}`);
        done = true;
      }
    }
  }

  console.log(chalk.green("\nDeploy complete."));
  console.log(`Query endpoint: ${baseUrl}/api/query`);
  console.log(`Dashboard:      http://localhost:3000/chat/${config.projectId}`);
}
