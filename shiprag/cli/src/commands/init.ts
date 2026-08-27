import chalk from "chalk";
import { randomUUID } from "node:crypto";
import { configExists, writeConfig } from "../lib/config.js";

export async function initCommand(): Promise<void> {
  if (configExists()) {
    console.log(chalk.yellow("shiprag.config.json already exists in this directory."));
    return;
  }

  const config = {
    projectId: randomUUID(),
    docsDir: "./docs",
    apiUrl: "http://localhost:8000", // TODO: point at your deployed backend URL
  };

  writeConfig(config);
  console.log(chalk.green("Created shiprag.config.json"));
  console.log(`  projectId: ${config.projectId}`);
  console.log(`  docsDir:   ${config.docsDir}`);
  console.log("\nAdd your docs to ./docs, then run: shiprag deploy");
}
